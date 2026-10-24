import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Register({ plans = [], selectedPlan = null, supportPhone = '6285121210403' }) {
    const { flash } = usePage().props;
    const [currentPlan, setCurrentPlan] = useState(() => {
        if (selectedPlan) return selectedPlan;
        const defaultPlan = plans.find(p => p.slug === 'trial') || plans[0] || null;
        return defaultPlan;
    });

    const [isSelectingPlan, setIsSelectingPlan] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        business_name: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        plan_slug: selectedPlan?.slug || 'trial',
    });

    const handleSelectPlan = (plan) => {
        setCurrentPlan(plan);
        setData('plan_slug', plan.slug);
        setIsSelectingPlan(false);
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Daftar Toko Baru - Free Trial 14 Hari" />
            <main className="w-full min-h-screen bg-surface-container-low flex flex-col lg:flex-row font-body-md text-on-surface antialiased select-none">

                {/* LEFT SECTION (HERO & BRANDING) */}
                <div className="w-full lg:w-7/12 flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16 space-y-6 sm:space-y-8">
                    {/* Header Brand */}
                    <div className="flex items-center justify-between shrink-0">
                        <Link
                            href="/"
                            className="flex items-center space-x-3 sm:space-x-4 group cursor-pointer hover:opacity-95 transition-all"
                            title="Kembali ke Landing Page RPOS"
                        >
                            <img
                                alt="RPOS Logo"
                                className="h-11 sm:h-14 w-auto object-contain rounded-xl shadow-sm group-hover:scale-105 transition-transform"
                                src="/brand-logo.png"
                            />
                            <div className="h-8 sm:h-10 w-px bg-outline-variant opacity-60"></div>
                            <div className="flex flex-col">
                                <span className="font-headline-md font-bold text-primary tracking-tight leading-tight text-base sm:text-xl group-hover:text-secondary transition-colors">
                                    Registrasi
                                </span>
                                <span className="font-label-sm text-secondary uppercase tracking-wider font-semibold text-[10px] sm:text-xs">
                                    Platform Kasir Cloud SaaS
                                </span>
                            </div>
                        </Link>

                        <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-secondary-fixed text-on-secondary-fixed px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            <span>Free Trial 14 Hari</span>
                        </div>
                    </div>

                    {/* Hero Showcase Card */}
                    <div className="relative w-full flex-1 min-h-[240px] sm:min-h-[320px] lg:min-h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-outline-variant flex flex-col justify-end">
                        <img
                            alt="Suasana Cafe & Kasir Modern"
                            className="absolute inset-0 w-full h-full object-cover"
                            src="/images/register-hero.jpg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>

                        <div className="relative p-6 sm:p-8 text-on-primary space-y-4">
                            <div className="inline-flex items-center bg-secondary/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-secondary">
                                <span>Setup Cepat Tanpa Kartu Kredit</span>
                            </div>

                            <h2 className="font-headline-lg font-bold text-2xl sm:text-3xl text-on-primary leading-snug">
                                Mulai Kelola Toko & Kasir Anda Secara Profesional
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-primary-fixed-dim">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary-fixed text-base">point_of_sale</span>
                                    <span>Terminal POS Kasir Cepat (Tunai & QRIS)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary-fixed text-base">monitoring</span>
                                    <span>Laporan Omzet, HPP, & Laba Bersih</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary-fixed text-base">print</span>
                                    <span>Struk Kasir 58mm dengan Logo Toko Sendiri</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary-fixed text-base">shield</span>
                                    <span>Data 100% Terisolasi Aman di Cloud</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/60">
                        <div className="flex items-center space-x-1.5">
                            <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                            <span>Akses Instan 14 Hari</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <span className="material-symbols-outlined text-secondary text-base">credit_card_off</span>
                            <span>Tanpa Kartu Kredit</span>
                        </div>
                        <a
                            href={`https://wa.me/${String(supportPhone).replace(/[^0-9]/g, '')}?text=Halo%20Admin%20POS%20App,%20saya%20ingin%20bertanya%20seputar%20pendaftaran%20toko%20baru`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1.5 hover:text-primary transition-colors cursor-pointer"
                            title="Chat WhatsApp Super Admin: 0851-2121-0403"
                        >
                            <span className="material-symbols-outlined text-secondary text-base">support_agent</span>
                            <span>Bantuan WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* RIGHT SECTION (REGISTER FORM) */}
                <div className="w-full lg:w-5/12 bg-surface-container-lowest p-5 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-center shadow-2xl lg:rounded-l-[2.5rem] z-10 relative">
                    <div className="max-w-md mx-auto w-full space-y-6">

                        {/* Title Header */}
                        <div className="space-y-2 text-center lg:text-left">
                            <div className="inline-flex items-center space-x-1.5 bg-secondary/10 px-3 py-1 rounded-full text-secondary">
                                <span className="material-symbols-outlined text-sm">storefront</span>
                                <span className="font-label-sm font-bold tracking-wide">Pendaftaran Merchant Baru</span>
                            </div>
                            <h1 className="font-headline-lg font-bold text-primary text-2xl sm:text-3xl">
                                Daftar Toko Anda
                            </h1>
                            <p className="font-body-sm text-on-surface-variant text-sm">
                                {currentPlan && currentPlan.price > 0
                                    ? `Lengkapi data untuk mengaktifkan paket ${currentPlan.name}. Bayar mudah via QRIS statis!`
                                    : 'Coba gratis seluruh fitur selama 14 hari. Toko Anda langsung siap dipakai transaksi!'}
                            </p>
                        </div>

                        {/* Selected Plan Summary Card */}
                        {currentPlan && (
                            <div className="bg-surface-container-low border border-secondary/30 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold shrink-0 shadow-xs">
                                            <span className="material-symbols-outlined text-xl">
                                                {currentPlan.price > 0 ? 'payments' : 'auto_awesome'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-primary text-sm sm:text-base">
                                                    Paket {currentPlan.name}
                                                </span>
                                                {currentPlan.is_popular && (
                                                    <span className="bg-secondary text-on-secondary text-[9px] font-bold px-2 py-0.2 rounded-full uppercase">
                                                        Populer
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-secondary font-bold">
                                                {currentPlan.price > 0 ? `${formatRupiah(currentPlan.price)} / ${currentPlan.duration_days} Hari` : 'Gratis 14 Hari'}
                                            </div>
                                        </div>
                                    </div>

                                    {plans.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsSelectingPlan(!isSelectingPlan)}
                                            className="px-2.5 py-1 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-container-highest rounded-lg transition border border-secondary/20"
                                        >
                                            {isSelectingPlan ? 'Tutup' : 'Ubah Paket'}
                                        </button>
                                    )}
                                </div>

                                {currentPlan.price > 0 && (
                                    <div className="mt-2.5 pt-2.5 border-t border-outline-variant/60 flex items-center space-x-1.5 text-[11px] text-on-surface-variant">
                                        <span className="material-symbols-outlined text-secondary text-sm shrink-0">qr_code_2</span>
                                        <span>Pop-up QRIS akan langsung muncul setelah registrasi untuk konfirmasi WA.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Plan Picker Drawer / Dropdown */}
                        {isSelectingPlan && plans.length > 0 && (
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-md space-y-2 animate-fade-in">
                                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block px-1">
                                    Pilih Paket Langganan:
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                    {plans.map((p) => {
                                        const isSelected = currentPlan?.id === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPlan(p)}
                                                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                                                        ? 'border-secondary bg-secondary/5 font-bold shadow-xs'
                                                        : 'border-outline-variant/60 hover:border-secondary/40 hover:bg-surface-container-low'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-2.5">
                                                    <span className={`material-symbols-outlined text-base ${isSelected ? 'text-secondary' : 'text-outline'}`}>
                                                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                    <div>
                                                        <div className="text-xs font-bold text-on-surface">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[11px] text-on-surface-variant">
                                                            {p.price > 0 ? `${formatRupiah(p.price)} / ${p.duration_days} hari` : 'Free Trial 14 Hari'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="text-[11px] text-secondary font-bold">
                                                    {isSelected ? 'Terpilih' : 'Pilih'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Flash Error Banner */}
                        {flash?.error && (
                            <div className="p-3.5 mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-xs">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl shrink-0">error</span>
                                <p className="leading-snug text-left flex-1">{flash.error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-4">

                            {/* Nama Usaha / Toko */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="business_name">
                                    Nama Usaha / Toko <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        store
                                    </span>
                                    <input
                                        id="business_name"
                                        type="text"
                                        name="business_name"
                                        value={data.business_name}
                                        onChange={(e) => setData('business_name', e.target.value)}
                                        placeholder="Contoh: Kopi Karsa / Resto Enak"
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-4 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.business_name && (
                                    <div className="text-xs text-error mt-1">{errors.business_name}</div>
                                )}
                            </div>

                            {/* Nama Pemilik Toko */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="name">
                                    Nama Pemilik Toko (Owner) <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        badge
                                    </span>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Rian Hermawan"
                                        autoComplete="name"
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-4 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <div className="text-xs text-error mt-1">{errors.name}</div>
                                )}
                            </div>

                            {/* Email Bisnis */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="email">
                                    Email Akun Owner <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        mail
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="owner@gmail.com"
                                        autoComplete="username"
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-4 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <div className="text-xs text-error mt-1">{errors.email}</div>
                                )}
                            </div>

                            {/* Nomor WhatsApp */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="phone">
                                    Nomor WhatsApp Aktif <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        call
                                    </span>
                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={data.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                                            setData('phone', val);
                                        }}
                                        placeholder="Contoh: 081234567890"
                                        autoComplete="tel"
                                        minLength={10}
                                        maxLength={13}
                                        pattern="^08[0-9]{8,11}$"
                                        title="Nomor WhatsApp/HP harus diawali 08 dan memiliki total 10–13 digit angka"
                                        className={`w-full bg-surface-container-low border ${errors.phone ? 'border-error' : 'border-outline-variant focus:border-secondary'} focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-4 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline`}
                                        required
                                    />
                                </div>

                                {errors.phone && (
                                    <div className="text-xs text-error mt-1">{errors.phone}</div>
                                )}
                            </div>

                            {/* Kata Sandi */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="password">
                                    Kata Sandi <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        lock
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        autoComplete="new-password"
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 text-outline hover:text-on-surface focus:outline-none"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="text-xs text-error mt-1">{errors.password}</div>
                                )}
                            </div>

                            {/* Konfirmasi Kata Sandi */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-xs font-semibold text-on-surface" htmlFor="password_confirmation">
                                    Konfirmasi Kata Sandi <span className="text-error font-bold">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg">
                                        lock_clock
                                    </span>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi kata sandi"
                                        autoComplete="new-password"
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 text-on-surface font-body-md text-sm outline-none transition-all placeholder:text-outline"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 text-outline hover:text-on-surface focus:outline-none"
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <div className="text-xs text-error mt-1">{errors.password_confirmation}</div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-12 bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary rounded-xl font-label-lg font-bold shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                                >
                                    <span>
                                        {processing
                                            ? 'Mendaftarkan Toko...'
                                            : currentPlan && currentPlan.price > 0
                                                ? `Daftar & Bayar QRIS (${currentPlan.name})`
                                                : 'Daftar Toko & Mulai Free Trial 14 Hari'}
                                    </span>
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-outline-variant/60"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-surface-container-lowest px-3 text-on-surface-variant font-medium">Atau daftar instan dengan</span>
                            </div>
                        </div>

                        {/* Google Register Button */}
                        <div className="mb-4">
                            <a
                                href={route('auth.google', { plan: currentPlan?.slug || 'trial' })}
                                className="w-full h-11 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant hover:border-outline text-on-surface rounded-xl font-label-md font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2.5 transition-all active:scale-98 cursor-pointer"
                            >
                                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Daftar dengan Akun Google</span>
                            </a>
                        </div>

                        {/* Footer Login Link */}
                        <div className="pt-3 text-center border-t border-outline-variant/60">
                            <p className="text-sm text-on-surface-variant">
                                Sudah punya akun toko?{' '}
                                <Link
                                    href={route('login')}
                                    className="text-secondary font-bold hover:underline"
                                >
                                    Masuk ke Terminal Kasir
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}
