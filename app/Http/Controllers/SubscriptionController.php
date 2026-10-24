<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\Plan;
use App\Models\TenantSubscription;

class SubscriptionController extends Controller
{
    /**
     * Tampilkan halaman pilihan paket langganan SaaS untuk pemilik toko.
     */
    public function plans(Request $request): Response
    {
        $tenant = $request->user()?->tenant;
        $plans = Plan::where('is_active', true)
            ->where('slug', '!=', 'trial')
            ->orderBy('price', 'asc')
            ->get();

        $latestSubscription = $tenant 
            ? TenantSubscription::with('plan')
                ->where('tenant_id', $tenant->id)
                ->latest()
                ->first()
            : null;

        return Inertia::render('Tenant/Plans', [
            'tenant' => $tenant,
            'plans' => $plans,
            'currentPlan' => $tenant?->currentPlan(),
            'latestSubscription' => $latestSubscription,
            'adminContact' => [
                'whatsapp' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
                'whatsapp_display' => env('SUPERADMIN_WHATSAPP_DISPLAY', '0851-2121-0403'),
                'email' => env('SUPERADMIN_EMAIL', 'support@posapp.com'),
            ],
        ]);
    }

    /**
     * Ajukan langganan paket dan simpan bukti transfer (status pending).
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'notes' => 'nullable|string|max:500',
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ], [
            'payment_proof.required' => 'Bukti transfer wajib dilampirkan sebelum mengirim konfirmasi pembayaran ke admin.',
            'payment_proof.image' => 'File bukti transfer harus berupa foto atau gambar (JPG, PNG, atau WebP).',
            'payment_proof.max' => 'Ukuran file bukti transfer maksimal 3MB.',
        ]);


        $tenant = $request->user()?->tenant;
        if (! $tenant) {
            abort(403, 'Tenant tidak ditemukan.');
        }

        $plan = Plan::findOrFail($request->plan_id);

        $proofPath = null;
        if ($request->hasFile('payment_proof')) {
            $proofPath = $request->file('payment_proof')->store('subscription_proofs', 'public');
        }

        $refNumber = 'SUB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

        $subscription = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'status' => 'pending',
            'amount' => $plan->price,
            'payment_method' => 'qris_manual',
            'payment_reference' => $refNumber,
            'payment_proof' => $proofPath,
            'notes' => $request->notes,
        ]);

        return back()->with([
            'success' => "Permintaan langganan paket {$plan->name} berhasil dikirim! Silakan kirimkan bukti transfer Anda ke WhatsApp Super Admin untuk diverifikasi.",
            'pending_subscription' => $subscription,
        ]);
    }

    /**
     * Unggah bukti transfer pembayaran untuk langganan yang berstatus pending.
     */
    public function uploadProof(Request $request, TenantSubscription $subscription)
    {
        $request->validate([
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        $tenant = $request->user()?->tenant;
        if (! $tenant || $subscription->tenant_id !== $tenant->id) {
            abort(403, 'Akses ditolak.');
        }

        if ($subscription->payment_proof) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($subscription->payment_proof);
        }

        $path = $request->file('payment_proof')->store('subscription_proofs', 'public');
        $subscription->payment_proof = $path;
        $subscription->status = 'pending';
        $subscription->notes = null;
        $subscription->save();

        if ($tenant->subscription_status === 'rejected') {
            $tenant->update(['subscription_status' => 'pending']);
        }

        return back()->with('success', 'Bukti transfer baru berhasil diunggah! Status pengajuan langganan toko kembali berstatus pending untuk diverifikasi ulang oleh Super Admin.');
    }

    /**
     * Tampilkan halaman menunggu verifikasi & konfirmasi pembayaran oleh Super Admin.
     */
    public function waitingApproval(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $tenant = $user?->tenant;

        if (! $tenant) {
            return redirect()->route('login');
        }

        // Jika sudah aktif (diverifikasi oleh admin), langsung redirect ke Dashboard atau POS
        if ($tenant->isSubscriptionActive()) {
            return redirect()->to($user->role === 'admin' ? '/pos' : '/dashboard');
        }

        // Ambil riwayat langganan terbaru untuk toko ini (baik pending maupun rejected)
        $latestSubscription = TenantSubscription::with('plan')
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->first();

        // Fallback jika belum ada data subscription sama sekali
        if (! $latestSubscription) {
            $plan = $tenant->plan ?: Plan::where('slug', 'pro')->first();
            $refNumber = 'SUB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $latestSubscription = TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $plan->id,
                'status' => 'pending',
                'amount' => $plan->price,
                'payment_method' => 'qris_manual',
                'payment_reference' => $refNumber,
                'notes' => 'Pendaftaran paket ' . $plan->name,
            ]);
            $latestSubscription->load('plan');
        }

        return Inertia::render('Tenant/WaitingApproval', [
            'tenant' => $tenant,
            'subscription' => $latestSubscription,
            'plan' => $latestSubscription->plan,
            'user' => $user,
            'adminContact' => [
                'whatsapp' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
                'whatsapp_display' => env('SUPERADMIN_WHATSAPP_DISPLAY', '0851-2121-0403'),
                'email' => env('SUPERADMIN_EMAIL', 'support@posapp.com'),
            ],
        ]);
    }

    /**
     * Tampilkan halaman peringatan masa aktif / trial toko telah berakhir.
     */
    public function expired(Request $request): Response
    {
        $tenant = $request->user()?->tenant;

        $reason = 'subscription_expired';
        if ($tenant) {
            if (! $tenant->is_active) {
                $reason = 'suspended';
            } elseif ($tenant->subscription_status === 'trial') {
                $reason = 'trial_expired';
            }
        }

        return Inertia::render('Tenant/SubscriptionExpired', [
            'tenant' => $tenant,
            'reason' => $reason,
            'adminContact' => [
                'whatsapp' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
                'whatsapp_display' => env('SUPERADMIN_WHATSAPP_DISPLAY', '0851-2121-0403'),
                'email' => env('SUPERADMIN_EMAIL', 'support@posapp.com'),
            ],
        ]);
    }
}
