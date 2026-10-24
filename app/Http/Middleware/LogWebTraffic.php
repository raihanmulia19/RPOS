<?php

namespace App\Http\Middleware;

use App\Models\WebTrafficLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogWebTraffic
{
    /**
     * Handle an incoming request and record web traffic log.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Abaikan asset statis, healthcheck, dan hot-module reload agar database efisien
        if ($this->shouldIgnore($request)) {
            return $response;
        }

        try {
            $userAgent = (string) $request->userAgent();
            $deviceType = $this->resolveDeviceType($userAgent);

            $user = $request->user();
            $path = '/' . ltrim($request->path(), '/');

            WebTrafficLog::create([
                'ip_address' => $request->ip(),
                'method' => strtoupper($request->method()),
                'path' => substr($path, 0, 255),
                'full_url' => substr($request->fullUrl(), 0, 500),
                'user_id' => $user?->id,
                'tenant_id' => $user?->tenant_id,
                'device_type' => $deviceType,
                'user_agent' => substr($userAgent, 0, 1000),
                'status_code' => $response->getStatusCode(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Jangan pernah biarkan logging menggagalkan request user
            report($e);
        }

        return $response;
    }

    /**
     * Tentukan apakah request merupakan file statis atau internal yang harus diabaikan.
     */
    protected function shouldIgnore(Request $request): bool
    {
        if ($request->is('build/*', 'images/*', 'storage/*', '@vite/*', '@react-refresh', 'up', 'favicon.ico', 'robots.txt')) {
            return true;
        }

        $extension = strtolower(pathinfo($request->path(), PATHINFO_EXTENSION));
        if (in_array($extension, ['js', 'css', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'map', 'json'])) {
            return true;
        }

        return false;
    }

    /**
     * Deteksi tipe perangkat dari User Agent.
     */
    protected function resolveDeviceType(string $userAgent): string
    {
        $ua = strtolower($userAgent);

        if (preg_match('/(bot|crawl|spider|slurp|facebookexternalhit|whatsapp)/i', $ua)) {
            return 'bot';
        }

        if (preg_match('/(ipad|tablet|(android(?!.*mobile)))/i', $ua)) {
            return 'tablet';
        }

        if (preg_match('/(mobile|android|iphone|ipod|blackberry|iemobile|opera mini)/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }
}
