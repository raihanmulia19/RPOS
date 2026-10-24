<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsSubscribed
{
    /**
     * Handle an incoming request.
     * Ensure the tenant's subscription or trial is currently active.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If no user is logged in, let auth middleware handle it
        if (! $user) {
            return $next($request);
        }

        // Super Admin has unrestricted access to the entire platform
        if ($user->role === 'superadmin' || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin())) {
            return $next($request);
        }

        $tenant = $user->tenant;

        // If user has no tenant associated
        if (! $tenant) {
            return $next($request);
        }

        // Check if tenant's subscription/trial is active and not suspended
        if (! $tenant->isSubscriptionActive()) {
            // Jika akun toko masih pending verifikasi pembayaran oleh Super Admin
            if ($tenant->subscription_status === 'pending') {
                if ($request->routeIs('subscription.waiting-approval') || $request->routeIs('subscription.upload-proof') || $request->routeIs('logout')) {
                    return $next($request);
                }

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Akun toko Anda sedang menunggu verifikasi pembayaran oleh Super Admin.',
                        'subscription_status' => 'pending',
                        'is_active' => $tenant->is_active,
                    ], 403);
                }

                return redirect()->route('subscription.waiting-approval');
            }

            // Allow access to subscription pages and logout
            if ($request->routeIs('subscription.*') || $request->routeIs('logout')) {
                return $next($request);
            }

            // If JSON/API request, return 403 Forbidden with payload
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Masa aktif toko Anda telah berakhir. Silakan perpanjang langganan.',
                    'subscription_status' => $tenant->subscription_status,
                    'is_active' => $tenant->is_active,
                ], 403);
            }

            return redirect()->route('subscription.expired');
        }

        // If tenant is active, but attempts to visit the expired or waiting page, redirect to their home
        if ($request->routeIs('subscription.expired') || $request->routeIs('subscription.waiting-approval')) {
            return redirect()->to($user->role === 'admin' ? '/pos' : '/dashboard');
        }

        return $next($request);
    }
}
