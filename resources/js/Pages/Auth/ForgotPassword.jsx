import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

export default function ForgotPassword({ status, status_wa, wa_url, reset_url, user_name, phone_display }) {
    const [channel, setChannel] = useState('email'); // 'email' | 'whatsapp'
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        channel: 'email',
        email: '',
        phone: '',
    });

    const handleChannelChange = (newChannel) => {
        setChannel(newChannel);
        setData('channel', newChannel);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    const copyResetLink = () => {
        if (!reset_url) return;
        navigator.clipboard.writeText(reset_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <div className="text-center mb-5">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Icon icon="solar:lock-password-bold-duotone" className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-on-surface">Lupa Kata Sandi?</h2>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                    Pilih metode pemulihan yang Anda inginkan untuk menerima tautan pengaturan ulang kata sandi.
                </p>
            </div>

            {/* Pilihan Metode: Email vs WhatsApp */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-2xl mb-5 border border-outline-variant/60">
                <button
                    type="button"
                    onClick={() => handleChannelChange('email')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        channel === 'email'
                            ? 'bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/80'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Icon icon="solar:letter-bold-duotone" className="text-base" />
                    <span>Lewat Email</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleChannelChange('whatsapp')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        channel === 'whatsapp'
                            ? 'bg-surface-container-lowest text-emerald-600 dark:text-emerald-400 shadow-xs border border-outline-variant/80'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Icon icon="logos:whatsapp-icon" className="text-base" />
                    <span>Lewat WhatsApp</span>
                </button>
            </div>

            {/* Status Sukses Email */}
            {status && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Icon icon="solar:check-circle-bold-duotone" className="text-xl" />
                    </div>
                    <p className="leading-snug text-left flex-1">{status}</p>
                </div>
            )}

            {/* Status Sukses WhatsApp Card */}
            {status_wa && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 text-on-surface shadow-xs space-y-3">
                    <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon icon="logos:whatsapp-icon" className="text-xl" />
                        </div>
                        <div className="text-left flex-1">
                            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                Tautan Reset Siap Digunakan!
                            </h4>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                                Akun terdaftar atas nama <strong className="text-on-surface">{user_name}</strong> ({phone_display}).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-1">
                        {wa_url && (
                            <a
                                href={wa_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-label-md font-bold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                            >
                                <Icon icon="logos:whatsapp-icon" className="text-lg" />
                                <span>Kirim / Buka di WhatsApp</span>
                            </a>
                        )}

                        <div className="flex items-center space-x-2">
                            {reset_url && (
                                <Link
                                    href={reset_url}
                                    className="flex-1 h-9 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline text-secondary text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                                >
                                    <Icon icon="solar:shield-keyhole-bold-duotone" className="text-base" />
                                    <span>Reset Langsung di Sini</span>
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={copyResetLink}
                                className="h-9 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                                title="Salin Tautan Reset"
                            >
                                <Icon icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'} className={copied ? 'text-emerald-500 text-base' : 'text-base'} />
                                <span>{copied ? 'Tersalin' : 'Salin'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                {channel === 'email' ? (
                    /* FORM INPUT EMAIL */
                    <div className="text-left space-y-1.5">
                        <label htmlFor="email" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                            Alamat Email Terdaftar
                        </label>
                        <div className="relative flex items-center">
                            <Icon icon="solar:letter-bold-duotone" className="absolute left-3.5 text-outline text-lg pointer-events-none" />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-3 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                placeholder="nama@email.com"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                required={channel === 'email'}
                            />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                ) : (
                    /* FORM INPUT WHATSAPP */
                    <div className="text-left space-y-1.5">
                        <label htmlFor="phone" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                            Nomor WhatsApp Terdaftar
                        </label>
                        <div className="relative flex items-center">
                            <Icon icon="solar:phone-bold-duotone" className="absolute left-3.5 text-emerald-600 text-lg pointer-events-none" />
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={data.phone}
                                className="w-full bg-surface-container-low border border-outline-variant focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                placeholder="Contoh: 081234567890"
                                autoFocus
                                onChange={(e) => setData('phone', e.target.value)}
                                required={channel === 'whatsapp'}
                            />
                        </div>
                        <span className="text-[11px] text-on-surface-variant block">
                            Masukkan nomor WhatsApp yang Anda gunakan saat mendaftar akun toko.
                        </span>
                        <InputError message={errors.phone} className="mt-1" />
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full h-11 active:scale-98 text-white rounded-xl font-label-md font-bold shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer ${
                            channel === 'whatsapp'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-secondary hover:bg-on-secondary-container text-on-secondary'
                        }`}
                    >
                        {processing ? (
                            <>
                                <Icon icon="solar:restart-bold" className="text-lg animate-spin" />
                                <span>Menyiapkan Tautan...</span>
                            </>
                        ) : channel === 'whatsapp' ? (
                            <>
                                <Icon icon="logos:whatsapp-icon" className="text-lg" />
                                <span>Kirim Tautan ke WhatsApp</span>
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:plain-bold" className="text-lg" />
                                <span>Kirim Tautan ke Email</span>
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
                        <span>Kembali ke Halaman Masuk</span>
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
