<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TenantSettingsController extends Controller
{
    public function edit(Request $request)
    {
        $tenant = $request->user()->tenant?->load('plan');

        if (! $tenant) {
            abort(404, 'Toko tidak ditemukan.');
        }

        return Inertia::render('Tenant/Settings', [
            'tenant' => $tenant,
        ]);
    }

    public function update(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            abort(404, 'Toko tidak ditemukan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'required|string|max:500',
            'show_phone_on_receipt' => 'nullable|boolean',
            'tax_percentage' => 'required|numeric|min:0|max:100',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            'qris_type' => 'required|in:static,dynamic',
            'qris_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'midtrans_server_key' => 'nullable|string|max:255',
            'midtrans_client_key' => 'nullable|string|max:255',
            'midtrans_is_production' => 'boolean',
        ], [
            'name.required' => 'Nama toko wajib diisi.',
            'address.required' => 'Alamat toko wajib diisi untuk identitas resmi dan struk.',
            'tax_percentage.required' => 'Tarif pajak transaksi wajib diisi.',
        ]);

        $planSlug = $tenant->currentPlan()?->slug ?? 'trial';
        $isProOrEnterprise = in_array($planSlug, ['pro', 'enterprise']);

        if ($validated['qris_type'] === 'dynamic' && ! $isProOrEnterprise) {
            return back()->withErrors([
                'qris_type' => 'Fitur QRIS Dinamis Otomatis (Payment Gateway) hanya tersedia untuk paket Pro dan Enterprise. Silakan gunakan QRIS Statis Manual atau upgrade paket Anda.',
            ]);
        }

        $validated['show_phone_on_receipt'] = $request->has('show_phone_on_receipt')
            ? $request->boolean('show_phone_on_receipt')
            : true;

        // Handle Store Logo
        if ($request->hasFile('logo')) {
            if ($tenant->logo && Storage::disk('public')->exists($tenant->logo)) {
                Storage::disk('public')->delete($tenant->logo);
            }
            $validated['logo'] = $request->file('logo')->store('tenants/logos', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($tenant->logo && Storage::disk('public')->exists($tenant->logo)) {
                Storage::disk('public')->delete($tenant->logo);
            }
            $validated['logo'] = null;
        }

        // Handle Static QRIS Barcode Image
        if ($request->hasFile('qris_image')) {
            if ($tenant->qris_image && Storage::disk('public')->exists($tenant->qris_image)) {
                Storage::disk('public')->delete($tenant->qris_image);
            }
            $validated['qris_image'] = $request->file('qris_image')->store('tenants/qris', 'public');
        } elseif ($request->boolean('remove_qris_image')) {
            if ($tenant->qris_image && Storage::disk('public')->exists($tenant->qris_image)) {
                Storage::disk('public')->delete($tenant->qris_image);
            }
            $validated['qris_image'] = null;
        }

        // Handle Midtrans Server Key securely:
        if ($request->boolean('remove_midtrans_server_key')) {
            $validated['midtrans_server_key'] = null;
        } elseif ($request->filled('midtrans_server_key') && !str_starts_with($request->midtrans_server_key, '••••')) {
            $validated['midtrans_server_key'] = trim($request->midtrans_server_key);
        } else {
            // Keep existing key untouched if left blank or placeholder sent
            unset($validated['midtrans_server_key']);
        }

        $tenant->update($validated);

        return back()->with('success', 'Pengaturan toko dan QRIS berhasil diperbarui.');
    }
}
