<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'payment_method' => 'required|in:cash,qris',
            'amount_tendered' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('tenant_id', $tenantId),
            ],
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            $orderItemsData = [];

            // Group total requested quantities by product_id to validate aggregate stock
            $productQuantities = [];
            foreach ($request->items as $item) {
                $pid = $item['product_id'];
                $productQuantities[$pid] = ($productQuantities[$pid] ?? 0) + $item['quantity'];
            }

            // Lock products, validate active status & stock, and decrement stock
            $lockedProducts = [];
            foreach ($productQuantities as $productId => $totalQtyRequired) {
                $product = Product::lockForUpdate()->findOrFail($productId);
                
                if (! $product->is_active) {
                    throw new \Exception("Produk '{$product->name}' sedang tidak aktif.");
                }

                if ($product->is_stock_tracked) {
                    if ($product->stock_quantity < $totalQtyRequired) {
                        throw new \Exception("Stok produk '{$product->name}' tidak mencukupi. Sisa stok: {$product->stock_quantity}, tetapi dipesan: {$totalQtyRequired}.");
                    }
                    $product->decrement('stock_quantity', $totalQtyRequired);
                    $product->refresh();
                }

                $lockedProducts[$productId] = $product;
            }

            foreach ($request->items as $item) {
                $product = $lockedProducts[$item['product_id']];
                $itemSubtotal = $product->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price_at_purchase' => $product->price,
                    'cost_price_at_purchase' => $product->cost_price,
                    'subtotal' => $itemSubtotal,
                    'note' => $item['note'] ?? null,
                ];
            }

            $tenant = $request->user()->tenant;
            $taxRate = ($tenant?->tax_percentage ?? 11.00) / 100;
            $taxAmount = $subtotal * $taxRate;
            $totalAmount = $subtotal + $taxAmount;

            $amountTendered = $request->payment_method === 'cash' ? $request->amount_tendered : $totalAmount;
            
            if ($request->payment_method === 'cash' && $amountTendered < $totalAmount) {
                throw new \Exception("Uang tunai kurang dari total pembayaran.");
            }

            $changeAmount = $request->payment_method === 'cash' ? ($amountTendered - $totalAmount) : 0;

            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(uniqid());

            $outletId = $request->user()->outlet_id ?? $tenant?->mainOutlet()?->id;

            $order = Order::create([
                'tenant_id' => $request->user()->tenant_id,
                'outlet_id' => $outletId,
                'user_id' => $request->user()->id,
                'invoice_number' => $invoiceNumber,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => 'success',
                'amount_tendered' => $amountTendered,
                'change_amount' => $changeAmount,
            ]);

            foreach ($orderItemsData as $orderItem) {
                $order->items()->create($orderItem);
            }

            DB::commit();

            $order->load('items.product', 'user', 'tenant', 'outlet');
            $receiptData = [
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'created_at' => $order->created_at->format('d/m/Y H:i'),
                'cashier_name' => $order->user->name,
                'tenant_name' => $order->tenant->name ?? 'KASIR',
                'outlet_name' => $order->outlet?->name,
                'tenant_address' => $order->outlet?->address ?: $order->tenant->address,
                'tenant_phone' => ($order->tenant->show_phone_on_receipt ?? true) ? ($order->outlet?->phone ?: $order->tenant->phone) : null,
                'items' => $order->items->map(fn($item) => [
                    'name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->price_at_purchase,
                    'subtotal' => (float) $item->subtotal,
                    'note' => $item->note,
                ])->values()->all(),
                'subtotal' => (float) $order->subtotal,
                'tax_percentage' => (float) ($order->tenant->tax_percentage ?? 11),
                'tax_amount' => (float) $order->tax_amount,
                'total_amount' => (float) $order->total_amount,
                'payment_method' => strtoupper($order->payment_method),
                'amount_tendered' => (float) $order->amount_tendered,
                'change_amount' => (float) $order->change_amount,
            ];

            return redirect()->route('pos.index')->with([
                'success' => 'Transaksi berhasil!',
                'receipt_url' => route('orders.receipt', $order->id),
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'payment_method' => $order->payment_method,
                'total_amount' => $order->total_amount,
                'receipt_data' => $receiptData,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function receipt(Order $order)
    {
        $order->load('items.product', 'user', 'tenant', 'outlet');
        return view('receipt', compact('order'));
    }

    public function receiptData(Order $order)
    {
        $order->load('items.product', 'user', 'tenant', 'outlet');
        return response()->json([
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'created_at' => $order->created_at->format('d/m/Y H:i'),
            'cashier_name' => $order->user->name,
            'tenant_name' => $order->tenant->name ?? 'KASIR',
            'outlet_name' => $order->outlet?->name,
            'tenant_address' => $order->outlet?->address ?: $order->tenant->address,
            'tenant_phone' => ($order->tenant->show_phone_on_receipt ?? true) ? ($order->outlet?->phone ?: $order->tenant->phone) : null,
            'items' => $order->items->map(fn($item) => [
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'price' => (float) $item->price_at_purchase,
                'subtotal' => (float) $item->subtotal,
                'note' => $item->note,
            ])->values()->all(),
            'subtotal' => (float) $order->subtotal,
            'tax_percentage' => (float) ($order->tenant->tax_percentage ?? 11),
            'tax_amount' => (float) $order->tax_amount,
            'total_amount' => (float) $order->total_amount,
            'payment_method' => strtoupper($order->payment_method),
            'amount_tendered' => (float) $order->amount_tendered,
            'change_amount' => (float) $order->change_amount,
        ]);
    }

    public function generateQris(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1'
        ]);

        $tenant = $request->user()->tenant;
        $planSlug = $tenant?->currentPlan()?->slug ?? 'trial';
        if (!in_array($planSlug, ['pro', 'enterprise'])) {
            return response()->json([
                'error' => 'Fitur Dynamic QRIS Payment Gateway hanya tersedia untuk paket Pro dan Enterprise. Silakan gunakan QRIS Statis atau upgrade paket Anda.'
            ], 403);
        }

        try {
            $serverKey = !empty($tenant?->midtrans_server_key) ? $tenant->midtrans_server_key : env('MIDTRANS_SERVER_KEY');
            $isProduction = $tenant ? $tenant->midtrans_is_production : env('MIDTRANS_IS_PRODUCTION', false);

            \Midtrans\Config::$serverKey = $serverKey;
            \Midtrans\Config::$isProduction = (bool) $isProduction;
            \Midtrans\Config::$isSanitized = true;
            \Midtrans\Config::$is3ds = true;

            $params = [
                'payment_type' => 'gopay',
                'transaction_details' => [
                    'order_id' => 'QRIS-' . date('Ymd') . '-' . rand(1000, 9999),
                    'gross_amount' => (int) $request->amount,
                ],
            ];

            $response = \Midtrans\CoreApi::charge($params);

            $qrUrl = null;
            if (isset($response->actions)) {
                foreach ($response->actions as $action) {
                    if ($action->name === 'generate-qr-code') {
                        $qrUrl = $action->url;
                        break;
                    }
                }
            }

            if ($qrUrl) {
                return response()->json(['qr_url' => $qrUrl]);
            }

            return response()->json(['error' => 'Gagal mendapatkan QR dari Midtrans. Cek API Key.'], 500);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
