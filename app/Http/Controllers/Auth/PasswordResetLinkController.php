<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'status_wa' => session('status_wa'),
            'wa_url' => session('wa_url'),
            'reset_url' => session('reset_url'),
            'user_name' => session('user_name'),
            'phone_display' => session('phone_display'),
        ]);
    }

    /**
     * Handle an incoming password reset link request (supports Email or WhatsApp).
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $channel = $request->input('channel', 'email');

        if ($channel === 'whatsapp') {
            $request->validate([
                'phone' => 'required|string',
            ]);

            $rawPhone = trim($request->phone);
            $digits = preg_replace('/[^0-9]/', '', $rawPhone);

            if (empty($digits) || strlen($digits) < 8) {
                throw ValidationException::withMessages([
                    'phone' => 'Format nomor WhatsApp tidak valid. Masukkan nomor yang benar.',
                ]);
            }

            // Normalisasi beberapa kemungkinan format (08xxx vs 628xxx)
            $variants = array_unique([
                $rawPhone,
                $digits,
                str_starts_with($digits, '0') ? '62' . substr($digits, 1) : $digits,
                str_starts_with($digits, '62') ? '0' . substr($digits, 2) : $digits,
            ]);

            $user = User::whereIn('phone', $variants)->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'phone' => 'Nomor WhatsApp ini belum terdaftar di sistem. Pastikan menggunakan nomor yang didaftarkan saat registrasi.',
                ]);
            }

            // Generate secure password reset token
            $token = Password::createToken($user);
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $user->email,
            ], false));

            $appName = config('app.name', 'POS SaaS');
            $cleanWaNumber = str_starts_with($digits, '0') ? '62' . substr($digits, 1) : $digits;

            $message = "Halo *{$user->name}*,\n\nBerikut tautan aman untuk mengatur ulang kata sandi akun kasir/toko Anda di *{$appName}*:\n\n{$resetUrl}\n\n_Catatan: Tautan berlaku selama 60 menit. Jangan bagikan tautan ini ke siapapun demi keamanan._";

            // Opsional: Kirim otomatis jika API gateway Fonnte disetel di .env
            $fonnteToken = env('FONNTE_TOKEN');
            if (! empty($fonnteToken)) {
                try {
                    Http::withHeaders([
                        'Authorization' => $fonnteToken,
                    ])->post('https://api.fonnte.com/send', [
                        'target' => $cleanWaNumber,
                        'message' => $message,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Fonnte WhatsApp API Error: ' . $e->getMessage());
                }
            }

            $waUrl = "https://wa.me/{$cleanWaNumber}?text=" . urlencode($message);

            return back()->with([
                'status_wa' => "Tautan reset kata sandi berhasil disiapkan untuk nomor WhatsApp {$rawPhone}.",
                'wa_url' => $waUrl,
                'reset_url' => $resetUrl,
                'user_name' => $user->name,
                'phone_display' => $user->phone ?: $rawPhone,
            ]);
        }

        // Jalur Email
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', 'Tautan reset kata sandi telah berhasil dikirim ke alamat email Anda.');
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
