<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google OAuth consent screen.
     */
    public function redirectToGoogle(Request $request): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->back()->with('error', 'Google Sign-In belum dikonfigurasi. Harap isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.');
        }

        // Simpan preferensi paket jika user mendaftar dari halaman harga / register
        if ($request->has('plan')) {
            $request->session()->put('google_register_plan', $request->query('plan'));
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback returned by Google.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect()->route('login')->with('error', 'Proses masuk dengan akun Google dibatalkan.');
        }

        $host = $request->getSchemeAndHttpHost();
        $redirectUrl = $host . '/auth/google/callback';

        try {
            $googleUser = Socialite::driver('google')->redirectUrl($redirectUrl)->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth with dynamic redirectUrl failed: ' . $e->getMessage());
            try {
                $googleUser = Socialite::driver('google')->user();
            } catch (\Throwable $e2) {
                Log::error('Google OAuth callback failed completely: ' . $e2->getMessage());
                return redirect()->route('login')->with('error', 'Gagal mengambil data akun Google: ' . $e2->getMessage());
            }
        }

        $scopes = $googleUser->approvedScopes ?? [];
        $hasDriveScope = false;
        if (is_array($scopes)) {
            foreach ($scopes as $s) {
                if (str_contains($s, 'drive')) {
                    $hasDriveScope = true;
                    break;
                }
            }
        }

        $isDriveConnect = $request->session()->pull('google_drive_connect', false) 
            || (auth()->check() && auth()->user()->role === 'superadmin')
            || $hasDriveScope;

        if ($isDriveConnect) {
            $refreshToken = $googleUser->refreshToken;
            $accessToken = $googleUser->token;
            $userEmail = $googleUser->getEmail();

            $tokenData = [
                'account_type' => 'oauth_user',
                'client_email' => $userEmail,
                'refresh_token' => $refreshToken,
                'access_token' => $accessToken,
                'updated_at' => now()->toIso8601String(),
            ];

            file_put_contents(storage_path('app/google-oauth-token.json'), json_encode($tokenData, JSON_PRETTY_PRINT));

            if ($refreshToken) {
                app(\App\Services\GoogleDriveService::class)->setRefreshToken($refreshToken, $userEmail);
            }

            if (!auth()->check()) {
                $superadminUser = User::where('role', 'superadmin')->first();
                if ($superadminUser) {
                    Auth::login($superadminUser, true);
                }
            }

            return redirect()->route('superadmin.monitoring')->with('success', "Akun Google Drive ({$userEmail}) berhasil dihubungkan! Kuota penyimpanan menggunakan kuota 15 GB akun Google Anda.");
        }

        try {
            // Cari user berdasarkan google_id atau email
            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                // Update google_id dan avatar jika sebelumnya belum tersimpan
                if (empty($user->google_id)) {
                    $user->google_id = $googleUser->getId();
                }
                if (empty($user->avatar)) {
                    $user->avatar = $googleUser->getAvatar();
                }
                $user->save();

                // Cek status toko jika bukan superadmin
                if ($user->tenant && ! $user->tenant->is_active) {
                    return redirect()->route('login')->with('error', 'Akun toko Anda sedang dinonaktifkan sementara. Silakan hubungi admin support.');
                }

                Auth::login($user, true);
                $request->session()->regenerate();
                $user->forceFill(['current_session_id' => $request->session()->getId()])->saveQuietly();

                if ($user->isSuperAdmin()) {
                    return redirect()->intended(route('superadmin.dashboard'));
                } elseif ($user->isOwner()) {
                    return redirect()->intended(route('dashboard'));
                } else {
                    return redirect()->intended(route('pos.index'));
                }
            }

            // ==========================================
            // Registrasi Otomatis untuk Pengguna Baru
            // ==========================================
            $planSlug = $request->session()->pull('google_register_plan');
            $chosenPlan = $planSlug ? Plan::where('slug', $planSlug)->where('is_active', true)->first() : null;
            $trialPlan = Plan::where('slug', 'trial')->first();
            $targetPlan = $chosenPlan ?: $trialPlan;

            $isPaidPlan = $targetPlan && $targetPlan->price > 0;

            $userName = $googleUser->getName() ?: 'Pemilik Toko';
            $businessName = 'Toko ' . $userName;

            $baseSlug = Str::slug($businessName);
            $slug = $baseSlug ?: 'toko';
            if (Tenant::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::lower(Str::random(5));
            }

            $tenant = Tenant::create([
                'name' => $businessName,
                'slug' => $slug,
                'plan_id' => $targetPlan?->id,
                'tax_percentage' => 11.00,
                'subscription_status' => $isPaidPlan ? 'pending' : 'trial',
                'trial_ends_at' => $isPaidPlan ? null : now()->addDays(14),
                'is_active' => true,
            ]);

            // Kategori bawaan toko
            Category::create([
                'tenant_id' => $tenant->id,
                'name' => 'Makanan',
            ]);
            Category::create([
                'tenant_id' => $tenant->id,
                'name' => 'Minuman',
            ]);

            $newUser = User::create([
                'tenant_id' => $tenant->id,
                'name' => $userName,
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'role' => 'owner',
                'password' => null, // Akun OAuth
            ]);

            event(new Registered($newUser));

            Auth::login($newUser, true);
            $request->session()->regenerate();
            $newUser->forceFill(['current_session_id' => $request->session()->getId()])->saveQuietly();

            if ($isPaidPlan) {
                $refCode = 'SUB-' . date('Ymd') . '-' . strtoupper(Str::random(4));
                TenantSubscription::create([
                    'tenant_id' => $tenant->id,
                    'plan_id' => $targetPlan->id,
                    'amount' => $targetPlan->price,
                    'status' => 'pending',
                    'payment_method' => 'qris',
                    'payment_reference' => $refCode,
                    'notes' => "Pendaftaran akun baru via Google dengan paket {$targetPlan->name}",
                ]);

                return redirect()->route('subscription.waiting-approval')->with('show_qris_modal', true);
            }

            return redirect()->route('dashboard')->with('success', "Selamat datang di Sistem Kasir POS! Toko {$businessName} telah siap digunakan dengan masa uji coba gratis 14 hari.");

        } catch (\Throwable $e) {
            Log::error('Google OAuth Registration Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'Gagal memproses pendaftaran akun Google: ' . $e->getMessage());
        }
    }
}
