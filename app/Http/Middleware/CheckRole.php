<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request and check if user has allowed role.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized Access.');
        }

        $allowedRoles = [];
        foreach ($roles as $role) {
            $allowedRoles = array_merge($allowedRoles, explode(',', $role));
        }

        if (! in_array($user->role, $allowedRoles, true)) {
            if ($user->role === 'superadmin' && ! $request->is('superadmin*')) {
                return redirect()->route('superadmin.dashboard');
            }

            if ($user->role === 'admin' && ! $request->is('pos*') && ! $request->is('orders*')) {
                return redirect()->route('pos.index');
            }

            abort(403, 'Unauthorized Access.');
        }

        return $next($request);
    }
}
