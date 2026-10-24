<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\OutletStock;
use App\Models\Product;
use App\Models\StockTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockTransferController extends Controller
{
    /**
     * Tampilkan halaman mutasi & transfer stok antar-cabang.
     */
    public function index(Request $request): Response
    {
        $tenant = $request->user()->tenant?->load('plan');
        if (!$tenant) {
            abort(403);
        }

        $isEnterprise = ($tenant->currentPlan()?->slug === 'enterprise');
        $outlets = $tenant->outlets()->where('is_active', true)->get();

        $transfers = StockTransfer::with([
            'sourceOutlet',
            'destinationOutlet',
            'product',
            'creator',
            'receiver'
        ])
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->get();

        $products = Product::where('tenant_id', $tenant->id)
            ->where('is_stock_tracked', true)
            ->with(['outletStocks'])
            ->get()
            ->map(function ($product) use ($outlets) {
                $stocksByOutlet = [];
                foreach ($outlets as $outlet) {
                    $stock = $product->outletStocks->firstWhere('outlet_id', $outlet->id);
                    $stocksByOutlet[$outlet->id] = $stock ? $stock->stock_quantity : 0;
                }
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'cost_price' => $product->cost_price,
                    'is_stock_tracked' => $product->is_stock_tracked,
                    'stocks_by_outlet' => $stocksByOutlet,
                ];
            });

        return Inertia::render('Outlets/StockTransfers', [
            'tenant' => $tenant,
            'isEnterprise' => $isEnterprise,
            'outlets' => $outlets,
            'products' => $products,
            'transfers' => $transfers,
            'canTransfer' => $isEnterprise && $outlets->count() >= 2,
        ]);
    }

    /**
     * Buat pengiriman transfer stok baru (Status: in_transit).
     */
    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant) {
            abort(403);
        }

        if ($tenant->currentPlan()?->slug !== 'enterprise') {
            return back()->withErrors([
                'error' => 'Fitur Transfer Stok Antar-Cabang hanya tersedia untuk pengguna paket Enterprise. Silakan upgrade paket langganan Anda.',
            ]);
        }

        $validated = $request->validate([
            'source_outlet_id' => 'required|exists:outlets,id',
            'destination_outlet_id' => 'required|exists:outlets,id|different:source_outlet_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ], [
            'source_outlet_id.required' => 'Cabang pengirim wajib dipilih.',
            'destination_outlet_id.required' => 'Cabang tujuan wajib dipilih.',
            'destination_outlet_id.different' => 'Cabang tujuan tidak boleh sama dengan cabang pengirim.',
            'product_id.required' => 'Produk yang akan dipindahkan wajib dipilih.',
            'quantity.required' => 'Jumlah unit transfer wajib diisi.',
            'quantity.min' => 'Jumlah unit transfer minimal 1.',
        ]);

        // Verifikasi kepemilikan outlet oleh tenant
        $sourceOutlet = $tenant->outlets()->findOrFail($validated['source_outlet_id']);
        $destOutlet = $tenant->outlets()->findOrFail($validated['destination_outlet_id']);
        $product = Product::where('tenant_id', $tenant->id)->findOrFail($validated['product_id']);

        return DB::transaction(function () use ($tenant, $validated, $sourceOutlet, $destOutlet, $product, $request) {
            $sourceStock = OutletStock::firstOrCreate(
                ['outlet_id' => $sourceOutlet->id, 'product_id' => $product->id],
                ['stock_quantity' => 0]
            );

            if ($sourceStock->stock_quantity < $validated['quantity']) {
                return back()->withErrors([
                    'quantity' => "Stok produk '{$product->name}' di cabang '{$sourceOutlet->name}' tidak mencukupi. Sisa stok: {$sourceStock->stock_quantity} unit, diminta transfer: {$validated['quantity']} unit.",
                ]);
            }

            // Kurangi stok di cabang asal
            $sourceStock->decrement('stock_quantity', $validated['quantity']);

            // Jika cabang asal adalah cabang utama (pusat), sinkronkan stok produk global
            if ($sourceOutlet->is_main && $product->is_stock_tracked) {
                $product->decrement('stock_quantity', $validated['quantity']);
            }

            // Generate nomor mutasi transfer unik
            $transferNumber = 'TRF-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $transfer = StockTransfer::create([
                'tenant_id' => $tenant->id,
                'transfer_number' => $transferNumber,
                'source_outlet_id' => $sourceOutlet->id,
                'destination_outlet_id' => $destOutlet->id,
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'status' => 'in_transit',
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            return redirect()->route('stock-transfers.index')->with(
                'success',
                "Pengiriman stok {$transfer->transfer_number} ({$validated['quantity']} unit {$product->name}) dari {$sourceOutlet->name} ke {$destOutlet->name} berhasil dibuat! Status: Dalam Pengiriman."
            );
        });
    }

    /**
     * Konfirmasi penerimaan barang di cabang tujuan (Status: completed).
     */
    public function complete(Request $request, StockTransfer $stockTransfer)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant || $stockTransfer->tenant_id !== $tenant->id) {
            abort(403);
        }

        if ($stockTransfer->status !== 'in_transit') {
            return back()->withErrors(['error' => 'Transfer ini sudah diproses atau dibatalkan sebelumnya.']);
        }

        return DB::transaction(function () use ($stockTransfer, $request) {
            $destStock = OutletStock::firstOrCreate(
                ['outlet_id' => $stockTransfer->destination_outlet_id, 'product_id' => $stockTransfer->product_id],
                ['stock_quantity' => 0]
            );

            $destStock->increment('stock_quantity', $stockTransfer->quantity);

            // Jika cabang tujuan adalah cabang utama (pusat), sinkronkan stok produk global
            if ($stockTransfer->destinationOutlet?->is_main) {
                $product = $stockTransfer->product;
                if ($product && $product->is_stock_tracked) {
                    $product->increment('stock_quantity', $stockTransfer->quantity);
                }
            }

            $stockTransfer->update([
                'status' => 'completed',
                'received_by' => $request->user()->id,
                'received_at' => now(),
            ]);

            return redirect()->route('stock-transfers.index')->with(
                'success',
                "Penerimaan transfer stok {$stockTransfer->transfer_number} berhasil dikonfirmasi! Stok sebanyak {$stockTransfer->quantity} unit telah masuk ke {$stockTransfer->destinationOutlet->name}."
            );
        });
    }

    /**
     * Batalkan transfer stok sebelum diterima (Status: cancelled) dan kembalikan stok.
     */
    public function cancel(Request $request, StockTransfer $stockTransfer)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant || $stockTransfer->tenant_id !== $tenant->id) {
            abort(403);
        }

        if ($stockTransfer->status !== 'in_transit') {
            return back()->withErrors(['error' => 'Hanya pengiriman berstatus dalam perjalanan yang dapat dibatalkan.']);
        }

        return DB::transaction(function () use ($stockTransfer) {
            $sourceStock = OutletStock::firstOrCreate(
                ['outlet_id' => $stockTransfer->source_outlet_id, 'product_id' => $stockTransfer->product_id],
                ['stock_quantity' => 0]
            );

            $sourceStock->increment('stock_quantity', $stockTransfer->quantity);

            if ($stockTransfer->sourceOutlet?->is_main) {
                $product = $stockTransfer->product;
                if ($product && $product->is_stock_tracked) {
                    $product->increment('stock_quantity', $stockTransfer->quantity);
                }
            }

            $stockTransfer->update([
                'status' => 'cancelled',
            ]);

            return redirect()->route('stock-transfers.index')->with(
                'success',
                "Transfer stok {$stockTransfer->transfer_number} telah dibatalkan. Stok dikembalikan ke {$stockTransfer->sourceOutlet->name}."
            );
        });
    }
}
