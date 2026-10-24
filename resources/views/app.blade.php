<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'POS SaaS') }}</title>

        <!-- Favicon -->
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}?v={{ file_exists(public_path('favicon-32x32.png')) ? filemtime(public_path('favicon-32x32.png')) : '1' }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}?v={{ file_exists(public_path('favicon-16x16.png')) ? filemtime(public_path('favicon-16x16.png')) : '1' }}">
        <link rel="shortcut icon" href="{{ asset('favicon.ico') }}?v={{ file_exists(public_path('favicon.ico')) ? filemtime(public_path('favicon.ico')) : '1' }}">
        <link rel="apple-touch-icon" href="{{ asset('favicon-192x192.png') }}">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('favicon-192x192.png') }}?v={{ file_exists(public_path('favicon-192x192.png')) ? filemtime(public_path('favicon-192x192.png')) : '1' }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />
        <!-- Iconify CDN fallback -->
        <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>

        <!-- PWA Manifest & Meta Tags -->
        <link rel="manifest" href="{{ asset('manifest.json') }}">
        <meta name="theme-color" content="#271310">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="RPOS Kasir">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="RPOS Kasir">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia

        <!-- Service Worker Registration for PWA -->
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/sw.js').then(function (reg) {
                        console.log('RPOS PWA Active. Scope:', reg.scope);
                    }).catch(function (err) {
                        console.warn('PWA Service Worker Registration Failed:', err);
                    });
                });
            }
        </script>
    </body>
</html>
