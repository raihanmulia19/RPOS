import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function Login({ status, canResetPassword, supportPhone = '6285121210403' }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Carousel Slide State & Data
    const bannerSlides = [
        {
            id: 1,
            image: '/images/rpos-hero.png',
            title: 'Sistem Hardware Kasir Modern RPOS',
        },
        {
            id: 2,
            image: '/images/rpos-pricing.jpg?v=2',
            title: 'Pilihan Paket RPOS untuk Bisnis Anda',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused || bannerSlides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
        }, 5000); // Bergerak otomatis setiap 5 detik

        return () => clearInterval(timer);
    }, [isPaused, bannerSlides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    };

    useEffect(() => {
        // Init time
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setCurrentTime(`${hours}:${minutes} WIB`);

            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentDate(now.toLocaleDateString('id-ID', options));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };


    return (
        <>
            <Head title="Log in" />
            <main className="w-full min-h-screen lg:h-screen bg-surface-container-low flex flex-col lg:flex-row font-body-md text-on-surface antialiased select-none overflow-y-auto lg:overflow-hidden">
                {/* LEFT SECTION */}
                <div className="w-full lg:w-7/12 min-h-0 flex flex-col justify-between p-4 sm:p-6 lg:p-6 xl:p-8 space-y-3 sm:space-y-3.5 overflow-y-auto">
                    <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <Link
                            href="/"
                            className="flex items-center space-x-3 sm:space-x-4 group cursor-pointer hover:opacity-95 transition-all"
                            title="Kembali ke Landing Page RPOS"
                        >
                            <img alt="RPOS Logo" className="h-10 sm:h-12 w-auto object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform" src="/brand-logo.png" />
                            <div className="h-8 sm:h-10 w-px bg-outline-variant opacity-50"></div>
                            <div className="flex flex-col">
                                <span className="font-headline-sm sm:font-headline-md text-primary tracking-tight leading-tight group-hover:text-secondary transition-colors">Terminal Kasir</span>
                                <span className="font-body-sm text-[11px] sm:text-xs text-on-surface-variant font-medium">Sistem Utama</span>
                            </div>
                        </Link>
                        <div className="flex items-center space-x-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/60 shadow-sm text-xs font-semibold text-on-surface-variant">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            <span>{currentTime} &bull; {currentDate}</span>
                        </div>
                    </div>

                    {/* Hero Banner Auto-Slide Carousel (Rasio Asli 16:9 - 1024x576) */}
                    <div
                        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-md border border-outline-variant bg-surface-container-high shrink-0 group select-none"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Slides Container */}
                        <div className="relative w-full h-full">
                            {bannerSlides.map((slide, index) => {
                                const isActive = index === currentSlide;
                                return (
                                    <div
                                        key={slide.id}
                                        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${isActive
                                                ? 'opacity-100 scale-100 z-10'
                                                : 'opacity-0 scale-105 pointer-events-none z-0'
                                            }`}
                                    >
                                        <img
                                            alt={slide.title}
                                            className="w-full h-full object-cover"
                                            src={slide.image}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Prev & Next Arrows (Appear smoothly on hover) */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-md backdrop-blur-sm"
                            aria-label="Slide Sebelumnya"
                        >
                            <Icon icon="solar:alt-arrow-left-bold" className="text-xl" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-md backdrop-blur-sm"
                            aria-label="Slide Selanjutnya"
                        >
                            <Icon icon="solar:alt-arrow-right-bold" className="text-xl" />
                        </button>

                        {/* Indicator Dots / Pills */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md">
                            {bannerSlides.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
                                    className={`transition-all duration-300 rounded-full ${idx === currentSlide
                                            ? 'w-6 h-1.5 bg-white shadow-sm'
                                            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                                        }`}
                                    aria-label={`Ke slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Slide Counter Badge */}
                        <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white tracking-wider">
                            {currentSlide + 1} / {bannerSlides.length}
                        </div>
                    </div>

                    {/* 4 Kartu Mini Keunggulan Fitur RPOS (Setema Brand RPOS dengan Iconify) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
                        {/* Card 1: Transaksi Cepat */}
                        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-start space-x-3 shadow-xs hover:border-secondary/50 hover:bg-surface-container-low/50 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                                <Icon icon="solar:bolt-bold-duotone" className="text-xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-on-surface truncate">Transaksi Super Cepat</h4>
                                <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">Checkout kasir instan dengan Tunai & QRIS otomatis.</p>
                            </div>
                        </div>

                        {/* Card 2: Lacak Stok & HPP */}
                        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-start space-x-3 shadow-xs hover:border-secondary/50 hover:bg-surface-container-low/50 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                                <Icon icon="solar:box-bold-duotone" className="text-xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-on-surface truncate">Stok & HPP Real-Time</h4>
                                <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">Pemotongan stok otomatis & proteksi anti-minus.</p>
                            </div>
                        </div>

                        {/* Card 3: Struk Thermal 58mm */}
                        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-start space-x-3 shadow-xs hover:border-secondary/50 hover:bg-surface-container-low/50 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                                <Icon icon="solar:printer-minimalistic-bold-duotone" className="text-xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-on-surface truncate">Struk Thermal 58mm</h4>
                                <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">Cetak nota kasir & tiket dapur tanpa driver rumit.</p>
                            </div>
                        </div>

                        {/* Card 4: Multi-Tenant Aman */}
                        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex items-start space-x-3 shadow-xs hover:border-secondary/50 hover:bg-surface-container-low/50 transition-all">
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                                <Icon icon="solar:shield-check-bold-duotone" className="text-xl" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-on-surface truncate">Data Toko Aman</h4>
                                <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">Isolasi data pembukuan terenkripsi dan terpisah.</p>
                            </div>
                        </div>
                    </div>

                    {/* Bantuan WhatsApp & Layanan Support Pelanggan (Setema Brand RPOS dengan Iconify) */}
                    <div className="shrink-0 p-3 sm:p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-secondary/40 transition-all">
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                                <Icon icon="solar:headphones-round-sound-bold-duotone" className="text-2xl" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-on-surface truncate">Kendala Akun atau Butuh Bantuan?</p>
                                <p className="text-[11px] text-on-surface-variant truncate">Layanan bantuan resmi WhatsApp siap membantu operasional kasir Anda</p>
                            </div>
                        </div>
                        <a
                            href={`https://wa.me/${String(supportPhone).replace(/[^0-9]/g, '')}?text=Halo%20Admin%20RPOS,%20saya%20butuh%20bantuan%20terkait%20akun%20toko/kasir`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-on-secondary-container text-on-secondary text-xs font-bold shadow-sm active:scale-95 transition-all w-full sm:w-auto justify-center"
                        >
                            <Icon icon="ri:whatsapp-fill" className="text-base" />
                            <span>WhatsApp Bantuan</span>
                        </a>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="w-full lg:w-5/12 min-h-0 bg-surface-container-lowest p-6 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-center shadow-2xl lg:rounded-l-[2.5rem] z-10 relative overflow-y-auto">
                    <div className="space-y-2 text-center">
                        <div className="inline-flex items-center bg-secondary/10 px-3 py-1 rounded-full text-secondary">
                            <span className="font-label-sm text-label-sm font-bold tracking-wide">Autentikasi Pengguna</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Masuk ke Terminal POS</h1>
                        <p className="font-body-sm text-body-sm text-outline max-w-xs mx-auto">
                            Masukkan email dan kata sandi Anda untuk mulai transaksi atau mengelola toko.
                        </p>
                    </div>

                    {flash?.error && (
                        <div className="my-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-xs">
                            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <Icon icon="solar:danger-triangle-bold-duotone" className="text-xl" />
                            </div>
                            <p className="leading-snug text-left flex-1">{flash.error}</p>
                        </div>
                    )}

                    {status && (
                        <div className="my-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-xs">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Icon icon="solar:shield-warning-bold-duotone" className="text-xl" />
                            </div>
                            <p className="leading-snug text-left flex-1">{status}</p>
                        </div>
                    )}

                    <form className="my-4 space-y-4 max-w-sm mx-auto w-full" onSubmit={submit}>
                        <div className="space-y-1.5 text-left">
                            <label className="font-label-sm text-label-sm font-semibold text-on-surface-variant flex items-center justify-between" htmlFor="email">
                                <span>Email / Username</span>
                            </label>
                            <div className="relative flex items-center">
                                <Icon icon="solar:user-bold-duotone" className="absolute left-3.5 text-outline text-lg" />
                                <input
                                    id="email"
                                    type="text"
                                    name="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-4 text-on-surface font-body-md text-sm outline-none transition-all"
                                    placeholder="Contoh: kasir@kopikarsa.com"
                                    required
                                />
                            </div>
                            {errors.email && <div className="text-sm text-error mt-1">{errors.email}</div>}
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="font-label-sm text-label-sm font-semibold text-on-surface-variant block" htmlFor="password">
                                Kata Sandi
                            </label>
                            <div className="relative flex items-center">
                                <Icon icon="solar:lock-keyhole-bold-duotone" className="absolute left-3.5 text-outline text-lg" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 text-on-surface font-body-md text-sm outline-none transition-all"
                                    placeholder="Masukkan kata sandi kasir"
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
                            {errors.password && <div className="text-sm text-error mt-1">{errors.password}</div>}
                        </div>

                        {canResetPassword && (
                            <div className="flex justify-end pt-1">
                                <Link
                                    href={route('password.request')}
                                    className="font-label-sm text-label-sm text-secondary hover:underline focus:outline-none"
                                >
                                    Lupa sandi?
                                </Link>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 bg-secondary hover:bg-on-secondary-container active:scale-98 text-on-secondary rounded-xl font-label-lg text-label-lg font-bold shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                            >
                                <span>Masuk ke Sistem POS</span>
                                <Icon icon="solar:arrow-right-bold" className="text-lg" />
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-2 max-w-sm mx-auto w-full">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-outline-variant/60"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface-container-lowest px-3 text-on-surface-variant font-medium">Atau lanjutkan dengan</span>
                        </div>
                    </div>

                    {/* Google Sign-in Button */}
                    <div className="max-w-sm mx-auto w-full my-2">
                        <a
                            href={route('auth.google')}
                            className="w-full h-11 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant hover:border-outline text-on-surface rounded-xl font-label-md font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center space-x-2.5 transition-all active:scale-98 cursor-pointer"
                        >
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>Masuk dengan Akun Google</span>
                        </a>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto w-full text-center mt-4 pt-3 border-t border-outline-variant/60">
                        <p className="text-sm text-on-surface-variant">
                            Punya usaha baru?{' '}
                            <Link href={route('register')} className="text-secondary font-bold hover:underline">
                                Daftar Toko Gratis (14 Hari)
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
