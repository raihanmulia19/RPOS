<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    /**
     * Tampilkan daftar cabang outlet toko milik tenant.
     */
    public function index(Request $request): Response
    {
        $tenant = $request->user()->tenant?->load('plan');
        $outlets = $tenant ? $tenant->outlets()
            ->withCount(['users', 'orders'])
            ->orderBy('is_main', 'desc')
            ->orderBy('created_at', 'asc')
            ->get() : collect();

        $isEnterprise = ($tenant?->currentPlan()?->slug === 'enterprise');
        $maxOutlets = $isEnterprise ? ($tenant ? $tenant->maxOutlets() : 5) : 0;
        $usedOutlets = $outlets->count();

        $quota = [
            'used' => $usedOutlets,
            'max' => $maxOutlets,
            'can_add' => $isEnterprise && ($tenant ? $tenant->canAddOutlet() : false),
            'is_enterprise' => $isEnterprise,
            'plan_name' => $tenant?->currentPlanName() ?? 'Free Trial',
            'plan_slug' => $tenant?->currentPlan()?->slug ?? 'trial',
        ];

        return Inertia::render('Outlets/Index', [
            'outlets' => $outlets,
            'quota' => $quota,
            'tenant' => $tenant,
        ]);
    }

    /**
     * Tambahkan cabang outlet baru.
     */
    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant) {
            abort(403, 'Akses tidak diizinkan.');
        }

        // Fitur khusus paket Enterprise
        if ($tenant->currentPlan()?->slug !== 'enterprise') {
            return back()->withErrors([
                'name' => 'Fitur Manajemen Cabang Outlet eksklusif untuk paket Enterprise. Silakan upgrade paket langganan Anda.',
            ]);
        }

        // Validasi kuota cabang sesuai paket langganan
        if (!$tenant->canAddOutlet()) {
            $max = $tenant->maxOutlets();
            $planName = $tenant->currentPlanName();
            return back()->withErrors([
                'name' => "Batas maksimal cabang untuk paket {$planName} adalah {$max} outlet.",
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:300',
            'is_main' => 'boolean',
        ], [
            'name.required' => 'Nama cabang outlet wajib diisi.',
            'name.max' => 'Nama cabang outlet maksimal 100 karakter.',
        ]);

        $isFirst = $tenant->outlets()->count() === 0;
        $shouldBeMain = $isFirst || !empty($validated['is_main']);

        if ($shouldBeMain) {
            $tenant->outlets()->update(['is_main' => false]);
        }

        $outlet = $tenant->outlets()->create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'is_main' => $shouldBeMain,
            'is_active' => true,
        ]);

        return redirect()->route('outlets.index')->with('success', "Cabang '{$outlet->name}' berhasil ditambahkan!");
    }

    /**
     * Perbarui data cabang outlet.
     */
    public function update(Request $request, Outlet $outlet)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant || $outlet->tenant_id !== $tenant->id) {
            abort(403, 'Anda tidak memiliki hak akses untuk cabang ini.');
        }

        if ($tenant->currentPlan()?->slug !== 'enterprise') {
            return back()->withErrors([
                'error' => 'Fitur Manajemen Cabang Outlet eksklusif untuk paket Enterprise.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:300',
            'is_main' => 'boolean',
            'is_active' => 'boolean',
        ], [
            'name.required' => 'Nama cabang outlet wajib diisi.',
        ]);

        if (!empty($validated['is_main']) && !$outlet->is_main) {
            $tenant->outlets()->where('id', '!=', $outlet->id)->update(['is_main' => false]);
            $outlet->is_main = true;
        }

        $outlet->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'is_active' => $request->has('is_active') ? (bool)$validated['is_active'] : $outlet->is_active,
        ]);

        return redirect()->route('outlets.index')->with('success', "Data cabang '{$outlet->name}' berhasil diperbarui!");
    }

    /**
     * Jadikan cabang sebagai cabang utama (Pusat).
     */
    public function setMain(Request $request, Outlet $outlet)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant || $outlet->tenant_id !== $tenant->id) {
            abort(403, 'Akses ditolak.');
        }

        if ($tenant->currentPlan()?->slug !== 'enterprise') {
            return back()->withErrors([
                'error' => 'Fitur Manajemen Cabang Outlet eksklusif untuk paket Enterprise.',
            ]);
        }

        $tenant->outlets()->update(['is_main' => false]);
        $outlet->update(['is_main' => true, 'is_active' => true]);

        return redirect()->route('outlets.index')->with('success', "Cabang '{$outlet->name}' sekarang menjadi Cabang Utama (Pusat).");
    }

    /**
     * Hapus cabang outlet.
     */
    public function destroy(Request $request, Outlet $outlet)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant || $outlet->tenant_id !== $tenant->id) {
            abort(403, 'Akses ditolak.');
        }

        if ($tenant->currentPlan()?->slug !== 'enterprise') {
            return back()->withErrors([
                'error' => 'Fitur Manajemen Cabang Outlet eksklusif untuk paket Enterprise.',
            ]);
        }

        if ($tenant->outlets()->count() <= 1) {
            return back()->withErrors([
                'error' => 'Toko harus memiliki minimal satu cabang outlet utama.',
            ]);
        }

        if ($outlet->is_main) {
            return back()->withErrors([
                'error' => 'Cabang utama tidak dapat dihapus. Silakan tetapkan cabang lain sebagai cabang utama terlebih dahulu.',
            ]);
        }

        $name = $outlet->name;
        $outlet->delete();

        return redirect()->route('outlets.index')->with('success', "Cabang '{$name}' berhasil dihapus.");
    }
}
