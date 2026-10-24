/**
 * RPOS Service Worker - Progressive Web App (PWA)
 * Caches static assets & provides offline resilience for POS terminal
 */

const CACHE_NAME = 'rpos-pwa-v2';
const PRECACHE_ASSETS = [
    '/',
    '/pos',
    '/manifest.json',
    '/favicon-192x192.png',
    '/favicon-512x512.png',
    '/brand-logo.png',
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('Pre-caching some assets failed:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-first strategy for navigation and APIs, Cache-first for static assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extension or non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Never intercept dynamic storage files (QRIS, logos, payment proofs)
    if (url.pathname.startsWith('/storage/')) {
        return;
    }

    // Static Assets (fonts, images, build chunks): Cache-first with network fallback
    if (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/fonts/') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ico|css|js)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);
            })
        );
        return;
    }

    // Navigation and Page routes: Network-first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback to POS cache if navigating
                    if (request.mode === 'navigate') {
                        return caches.match('/pos');
                    }
                });
            })
    );
});
