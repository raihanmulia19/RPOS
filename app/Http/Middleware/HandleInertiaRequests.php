<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? $request->user()->load(['tenant.plan']) : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'receipt_url' => fn () => $request->session()->get('receipt_url'),
                'order_id' => fn () => $request->session()->get('order_id'),
                'invoice_number' => fn () => $request->session()->get('invoice_number'),
                'payment_method' => fn () => $request->session()->get('payment_method'),
                'total_amount' => fn () => $request->session()->get('total_amount'),
                'receipt_data' => fn () => $request->session()->get('receipt_data'),
                'show_qris_modal' => fn () => $request->session()->get('show_qris_modal'),
                'pending_subscription_id' => fn () => $request->session()->get('pending_subscription_id'),
            ],
        ];
    }
}
