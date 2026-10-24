<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        \Illuminate\Auth\Notifications\ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('Permintaan Reset Kata Sandi - ' . config('app.name'))
                ->greeting('Halo, ' . ($notifiable->name ?? 'Pengguna'))
                ->line('Anda menerima email ini karena kami menerima permintaan pengaturan ulang kata sandi untuk akun kasir/toko Anda.')
                ->action('Atur Ulang Kata Sandi', $resetUrl)
                ->line('Tautan ini hanya berlaku selama 60 menit demi alasan keamanan.')
                ->line('Jika Anda tidak merasa meminta reset kata sandi, abaikan pesan ini. Kata sandi akun Anda tetap aman.')
                ->salutation('Salam hangat, Tim ' . config('app.name'));
        });
    }
}
