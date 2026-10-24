<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        $planSlug = $request->query('plan');
        $plans = \App\Models\Plan::where('is_active', true)->orderBy('price', 'asc')->get();
        $selectedPlan = $planSlug ? \App\Models\Plan::where('slug', $planSlug)->where('is_active', true)->first() : null;

        return Inertia::render('Auth/Register', [
            'plans' => $plans,
            'selectedPlan' => $selectedPlan,
            'supportPhone' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
        ]);
    }

    /**
     * Handle an incoming registration request (Creates Tenant + Owner).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'business_name' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => ['required', 'string', 'regex:/^08[0-9]{8,11}$/'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'plan_slug' => 'nullable|string|exists:plans,slug',
        ], [
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
            'phone.regex' => 'Nomor WhatsApp/HP harus diawali 08 dan memiliki panjang 10–13 digit.',
            'business_name.required' => 'Nama usaha/toko wajib diisi.',
            'name.required' => 'Nama pemilik toko wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan masuk menggunakan email tersebut.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $baseSlug = Str::slug($request->business_name);
        $slug = $baseSlug ?: 'toko';
        if (Tenant::where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(5));
        }

        $chosenPlan = $request->plan_slug 
            ? \App\Models\Plan::where('slug', $request->plan_slug)->first() 
            : null;
        
        $trialPlan = \App\Models\Plan::where('slug', 'trial')->first();
        $targetPlan = $chosenPlan ?: $trialPlan;

        $isPaidPlan = $targetPlan && $targetPlan->price > 0;

        $phone = trim($request->phone);

        $tenant = Tenant::create([
            'name' => $request->business_name,
            'slug' => $slug,
            'phone' => $phone,
            'plan_id' => $targetPlan?->id,
            'tax_percentage' => 11.00,
            'subscription_status' => $isPaidPlan ? 'pending' : 'trial',
            'trial_ends_at' => $isPaidPlan ? null : now()->addDays(14),
            'is_active' => true,
        ]);

        // Beri kategori awal default
        Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Makanan',
        ]);
        Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Minuman',
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $phone,
            'password' => Hash::make($request->password),
            'role' => 'owner',
        ]);

        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();
        $user->forceFill(['current_session_id' => $request->session()->getId()])->saveQuietly();

        // Jika memilih paket berbayar, otomatis buat entri TenantSubscription pending dan arahkan ke layar menunggu validasi
        if ($isPaidPlan) {
            $refNumber = 'SUB-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            $subscription = \App\Models\TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'plan_id' => $targetPlan->id,
                'status' => 'pending',
                'amount' => $targetPlan->price,
                'payment_method' => 'qris_manual',
                'payment_reference' => $refNumber,
                'notes' => 'Pendaftaran baru paket ' . $targetPlan->name,
            ]);

            return redirect()->route('subscription.waiting-approval')->with([
                'success' => "Pendaftaran toko berhasil! Silakan selesaikan pembayaran QRIS dan konfirmasi via WhatsApp untuk verifikasi akun oleh Super Admin.",
            ]);
        }

        return redirect(route('tenant.settings', absolute: false))->with('info', 'Selamat datang! Toko Anda telah berhasil didaftarkan dengan Free Trial 14 hari. Silakan lengkapi data identitas toko Anda terlebih dahulu.');
    }
}
