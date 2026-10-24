<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSingleSession
{
    /**
     * Handle an incoming request and ensure only one session is active per user.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $request->hasSession()) {
            $currentSessionId = $request->session()->getId();

            // Jika belum ada ID sesi tercatat pada database (misal sesi lama sebelum fitur aktif),
            // inisialisasi sesi aktif saat ini agar tidak terlempar keluar tiba-tiba.
            if (! $user->current_session_id) {
                $user->forceFill(['current_session_id' => $currentSessionId])->saveQuietly();
                return $next($request);
            }

            // Jika session ID perangkat ini berbeda dengan yang tersimpan di database,
            // berarti akun ini telah login di perangkat/browser lain.
            if ($user->current_session_id !== $currentSessionId) {
                Auth::guard('web')->logout();

                $request->session()->invalidate();
                $request->session()->regenerateToken();

                $message = 'Sesi Anda telah berakhir karena akun ini baru saja login di perangkat lain.';

                return redirect()->route('login')
                    ->with('status', $message)
                    ->with('status_type', 'warning');
            }
        }

        return $next($request);
    }
}
