<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'supportPhone' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        $sessionId = $request->session()->getId();

        // Single Session: Simpan session_id aktif dan hapus sesi lama pengguna ini
        $user->forceFill([
            'current_session_id' => $sessionId,
        ])->saveQuietly();

        if (config('session.driver') === 'database') {
            \Illuminate\Support\Facades\DB::table('sessions')
                ->where('user_id', $user->id)
                ->where('id', '!=', $sessionId)
                ->delete();
        }

        if ($user->role === 'superadmin') {
            $request->session()->forget('url.intended');
            return redirect()->route('superadmin.dashboard');
        }

        if ($user->tenant && $user->tenant->subscription_status === 'pending') {
            return redirect()->route('subscription.waiting-approval');
        }

        if ($user->role === 'admin') {
            $request->session()->forget('url.intended');
            return redirect()->route('pos.index');
        }

        if ($user->role === 'owner') {
            $tenant = $user->tenant;
            if ($tenant && empty(trim($tenant->address ?? ''))) {
                return redirect()->route('tenant.settings')->with('info', 'Selamat datang! Silakan lengkapi data identitas toko Anda terlebih dahulu (alamat toko wajib diisi).');
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user) {
            $user->forceFill(['current_session_id' => null])->saveQuietly();
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
