import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Atur Ulang Kata Sandi" />

            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Icon icon="solar:shield-keyhole-bold-duotone" className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-on-surface">Buat Kata Sandi Baru</h2>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                    Masukkan kata sandi baru yang aman untuk akun kasir / toko Anda.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="text-left space-y-1.5">
                    <label htmlFor="email" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                        Email Akun
                    </label>
                    <div className="relative flex items-center">
                        <Icon icon="solar:letter-bold-duotone" className="absolute left-3.5 text-outline text-lg pointer-events-none" />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 pl-10 pr-3 text-on-surface font-body-md text-sm outline-none transition-all opacity-80"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div className="text-left space-y-1.5">
                    <label htmlFor="password" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                        Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                        <Icon icon="solar:lock-keyhole-bold-duotone" className="absolute left-3.5 text-outline text-lg pointer-events-none" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-outline hover:text-on-surface focus:outline-none"
                        >
                            <Icon icon={showPassword ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'} className="text-lg" />
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="text-left space-y-1.5">
                    <label htmlFor="password_confirmation" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                        Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                        <Icon icon="solar:lock-check-bold-duotone" className="absolute left-3.5 text-outline text-lg pointer-events-none" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                            autoComplete="new-password"
                            placeholder="Ulangi kata sandi baru"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 text-outline hover:text-on-surface focus:outline-none"
                        >
                            <Icon icon={showConfirmPassword ? 'solar:eye-closed-bold-duotone' : 'solar:eye-bold-duotone'} className="text-lg" />
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-11 bg-secondary hover:bg-on-secondary-container active:scale-98 text-on-secondary rounded-xl font-label-md font-bold shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <Icon icon="solar:restart-bold" className="text-lg animate-spin" />
                                <span>Menyimpan Sandi...</span>
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:check-read-bold" className="text-lg" />
                                <span>Simpan Kata Sandi Baru</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="pt-3 text-center border-t border-outline-variant/60">
                    <Link
                        href={route('login')}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors"
                    >
                        <Icon icon="solar:arrow-left-bold" className="text-sm" />
                        <span>Batal & Kembali ke Login</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
