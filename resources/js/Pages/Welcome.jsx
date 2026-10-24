import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import InteractivePosDemo from '@/Components/InteractivePosDemo';

export default function Welcome({ canLogin = true, canRegister = true, plans = [], supportPhone = '6285121210403' }) {
    const { auth } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            q: 'Apakah RPOS membutuhkan hardware atau perangkat khusus?',
            a: 'Tidak perlu! RPOS dapat diakses langsung dari berbagai perangkat seperti Laptop, Komputer Kasir, Tablet Android/iPad, hingga Smartphone melalui browser tanpa perlu instalasi aplikasi rumit.'
        },
        {
            q: 'Apakah mendukung printer struk thermal dan laci kasir?',
            a: 'Ya, RPOS mendukung pencetakan struk kasir thermal standar 58mm dan 80mm (USB, Bluetooth, atau Network LAN) serta tiket dapur otomatis langsung dari dialog cetak peramban.'
        },
        {
            q: 'Bagaimana sistem pembayaran QRIS bekerja?',
            a: 'Anda memiliki dua opsi fleksibel: (1) Menggunakan QRIS Statis Toko Anda sendiri (bebas biaya potongan gateway), atau (2) Menggunakan integrasi otomatis Midtrans Dynamic QRIS (GoPay/ShopeePay) yang langsung memverifikasi pembayaran kasir.'
        },
        {
            q: 'Apa yang terjadi setelah masa Free Trial 14 hari selesai?',
            a: 'Seluruh data produk, riwayat transaksi, dan laporan toko Anda tetap aman tersimpan di cloud. Anda cukup memilih paket langganan (Starter, Pro, atau Enterprise) untuk melanjutkan operasional tanpa kehilangan data.'
        },
        {
            q: 'Apakah data pembukuan toko saya aman dari merchant lain?',
            a: 'Sangat aman. RPOS dirancang dengan arsitektur Multi-Tenant kelas enterprise dengan isolasi data ketat (TenantScope). Merchant lain tidak dapat mengakses produk, kasir, maupun laporan keuangan toko Anda.'
        }
    ];

    const stats = [
        { value: '< 2 Detik', label: 'Waktu Checkout Kasir', icon: 'solar:bolt-bold-duotone' },
        { value: '100% Real-Time', label: 'Kalkulasi HPP & Stok', icon: 'solar:box-bold-duotone' },
        { value: '58mm / 80mm', label: 'Struk Thermal Siap Cetak', icon: 'solar:printer-minimalistic-bold-duotone' },
        { value: 'Zero Leak', label: 'Isolasi Data Cloud Aman', icon: 'solar:shield-check-bold-duotone' }
    ];

    const features = [
        {
            title: 'Terminal Kasir Kilat & QRIS',
            desc: 'Proses transaksi secepat kilat dengan pencarian produk cerdas, multi-pembayaran Tunai, QRIS Dinamis Midtrans, dan QRIS Statis merchant.',
            icon: 'solar:card-send-bold-duotone'
        },
        {
            title: 'Lacak Stok & Proteksi HPP',
            desc: 'Pemotongan stok otomatis saat checkout, deteksi stok menipis, kalkulasi HPP real-time, dan proteksi anti-minus di meja kasir.',
            icon: 'solar:box-bold-duotone'
        },
        {
            title: 'Laporan Finansial Standar Audit',
            desc: 'Rekapitulasi laba rugi komprehensif, gross margin, rekonsiliasi uang fisik laci kasir vs saldo QRIS, dan ekspor dokumen PDF resmi.',
            icon: 'solar:document-text-bold-duotone'
        },
        {
            title: 'Menu Engineering Matrix',
            desc: 'Analisis kontribusi margin riil per porsi menu untuk mengidentifikasi menu Bintang Laba, Volume Cepat, dan Margin Tebal.',
            icon: 'solar:chart-square-bold-duotone'
        },
        {
            title: 'Cetak Struk Thermal & Dapur',
            desc: 'Cetak nota struk kasir 58mm dengan logo toko Anda sendiri, rincian pembayaran, pesan terima kasih, dan tiket dapur tanpa driver rumit.',
            icon: 'solar:printer-minimalistic-bold-duotone'
        },
        {
            title: 'Multi-Tenant Cloud Terisolasi',
            desc: 'Keamanan data tingkat bank dengan enkripsi cloud, hak akses terpisah antara Staf Kasir dan Pemilik Toko (Owner), serta backup otomatis.',
            icon: 'solar:shield-check-bold-duotone'
        }
    ];

    return (
        <>
            <Head>
                <title>RPOS - Sistem Kasir Modern & Manajemen Bisnis Cloud SaaS</title>
                <meta name="description" content="Aplikasi kasir pintar (POS) berbasis cloud untuk ritel, coffee shop, dan restoran. Checkout kilat, QRIS otomatis, manajemen stok HPP, dan laporan keuangan eksekutif." />
            </Head>

            <div className="w-full min-h-screen bg-background text-on-surface font-body-md antialiased selection:bg-secondary selection:text-white">
                
                {/* 1. TOP NAVBAR (FULL WIDTH) */}
                <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-outline-variant/60 transition-all">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="flex items-center justify-between h-16 sm:h-20">
                            
                            {/* Brand Logo */}
                            <Link href="/" className="flex items-center space-x-3 group shrink-0">
                                <img 
                                    src="/brand-logo.png" 
                                    alt="RPOS Logo" 
                                    className="h-10 sm:h-12 w-auto object-contain rounded-xl shadow-xs transition-transform group-hover:scale-105"
                                />
                                <div className="flex flex-col justify-center">
                                    <span className="font-headline-md font-bold text-primary tracking-tight text-lg sm:text-xl leading-none">
                                        RPOS
                                    </span>
                                    <span className="text-[10px] sm:text-[11px] font-semibold text-secondary uppercase tracking-wider block -mt-0.5 sm:-mt-1">
                                        POINT OF SALE SYSTEM
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Nav Links */}
                            <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-on-surface-variant">
                                <a href="#demo" className="text-secondary font-bold hover:text-on-secondary-container transition-colors flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                                    <span>Demo Kasir</span>
                                </a>
                                <a href="#fitur" className="hover:text-secondary transition-colors">Fitur Utama</a>
                                <a href="#cara-kerja" className="hover:text-secondary transition-colors">Cara Kerja</a>
                                <a href="#harga" className="hover:text-secondary transition-colors">Pilihan Paket</a>
                                <a href="#faq" className="hover:text-secondary transition-colors">Tanya Jawab</a>
                            </nav>

                            {/* Right Action Buttons */}
                            <div className="hidden sm:flex items-center space-x-3 shrink-0">
                                {auth?.user ? (
                                    <Link
                                        href={auth.user.role === 'superadmin' ? route('superadmin.dashboard') : route('dashboard')}
                                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm hover:bg-on-secondary-container active:scale-95 transition-all"
                                    >
                                        <Icon icon="solar:widget-bold-duotone" className="text-base" />
                                        <span>Buka Dashboard</span>
                                    </Link>
                                ) : (
                                    <>
                                        {canLogin && (
                                            <Link
                                                href={route('login')}
                                                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-primary hover:text-secondary hover:bg-surface-container-high font-bold text-xs transition-all"
                                            >
                                                <Icon icon="solar:user-bold-duotone" className="text-base" />
                                                <span>Masuk Kasir</span>
                                            </Link>
                                        )}
                                        {canRegister && (
                                            <Link
                                                href={route('register')}
                                                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-md hover:bg-on-secondary-container active:scale-95 transition-all"
                                            >
                                                <span>Coba Gratis 14 Hari</span>
                                                <Icon icon="solar:arrow-right-bold" className="text-sm" />
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Mobile Hamburger Toggle */}
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high focus:outline-none"
                                aria-label="Toggle Menu"
                            >
                                <Icon icon={mobileMenuOpen ? 'solar:close-square-bold-duotone' : 'solar:hamburger-menu-bold-duotone'} className="text-2xl" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    {mobileMenuOpen && (
                        <div className="sm:hidden border-t border-outline-variant/60 bg-surface-container-lowest px-4 pt-3 pb-6 space-y-3 shadow-xl">
                            <a 
                                href="#demo" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-sm font-bold text-secondary hover:text-on-secondary-container flex items-center space-x-2"
                            >
                                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                                <span>Demo Interaktif Kasir</span>
                            </a>
                            <a 
                                href="#fitur" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-sm font-semibold text-on-surface hover:text-secondary"
                            >
                                Fitur Utama
                            </a>
                            <a 
                                href="#cara-kerja" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-sm font-semibold text-on-surface hover:text-secondary"
                            >
                                Cara Kerja
                            </a>
                            <a 
                                href="#harga" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-sm font-semibold text-on-surface hover:text-secondary"
                            >
                                Pilihan Paket
                            </a>
                            <a 
                                href="#faq" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 text-sm font-semibold text-on-surface hover:text-secondary"
                            >
                                Tanya Jawab
                            </a>
                            <div className="pt-3 border-t border-outline-variant/60 flex flex-col space-y-2">
                                {auth?.user ? (
                                    <Link
                                        href={auth.user.role === 'superadmin' ? route('superadmin.dashboard') : route('dashboard')}
                                        className="w-full text-center py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm"
                                    >
                                        Buka Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="w-full text-center py-2.5 rounded-xl border border-outline-variant text-primary font-bold text-xs"
                                        >
                                            Masuk Kasir
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="w-full text-center py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm"
                                        >
                                            Daftar Toko Gratis (14 Hari)
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* 2. HERO SECTION (FULL EXPANSIVE DESKTOP LAYOUT) */}
                <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 xl:pt-14 xl:pb-24">
                    {/* Background Decorative Blur Orbs */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
                    <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-secondary-container/10 rounded-full blur-2xl pointer-events-none -z-10"></div>
                    <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-secondary/5 rounded-full blur-2xl pointer-events-none -z-10"></div>

                    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                        {/* CENTER HERO: Main Headline, Subtitle, CTA, Trust Checkmarks */}
                        <div className="text-center space-y-6 max-w-5xl mx-auto">
                            
                            {/* Pill Badge */}
                            <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-1.5 rounded-full text-secondary border border-secondary/20 shadow-xs">
                                <Icon icon="solar:sparkles-bold-duotone" className="text-base" />
                                <span className="font-label-sm text-xs sm:text-sm font-bold tracking-wide">
                                    Platform Kasir Cloud SaaS Indonesia
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="font-headline-lg font-bold text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-primary tracking-tight leading-[1.12]">
                                Kelola Bisnis & Kasir Lebih Mudah dengan <span className="text-secondary underline decoration-secondary/30 decoration-wavy decoration-2">RPOS</span>
                            </h1>

                            {/* Subhead */}
                            <p className="font-body-lg text-base sm:text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-3xl mx-auto">
                                Sistem kasir modern yang membantu Anda mencatat pesanan kilat, pembayaran QRIS otomatis, pemotongan stok & HPP akurat, serta laporan keuangan eksekutif standar audit.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                                <Link
                                    href={route('register')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 rounded-2xl bg-secondary hover:bg-on-secondary-container active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-secondary/20 transition-all cursor-pointer"
                                >
                                    <span>Mulai Sekarang (Free Trial 14 Hari)</span>
                                    <Icon icon="solar:arrow-right-bold" className="text-base" />
                                </Link>
                                <a
                                    href="#demo"
                                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-2xl bg-surface-container-lowest border border-secondary/40 hover:border-secondary hover:bg-surface-container-low text-secondary font-bold text-sm sm:text-base shadow-xs transition-all cursor-pointer"
                                >
                                    <Icon icon="solar:cursor-bold-duotone" className="text-lg animate-bounce" />
                                    <span>Coba Demo Interaktif</span>
                                </a>
                            </div>

                            {/* Value Trust Checkmarks */}
                            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 pt-3 text-xs sm:text-sm font-semibold text-on-surface-variant">
                                <span className="inline-flex items-center space-x-2">
                                    <Icon icon="solar:check-circle-bold" className="text-secondary text-base" />
                                    <span>Tanpa Kartu Kredit</span>
                                </span>
                                <span className="inline-flex items-center space-x-2">
                                    <Icon icon="solar:check-circle-bold" className="text-secondary text-base" />
                                    <span>Setup 3 Menit Transaksi</span>
                                </span>
                                <span className="inline-flex items-center space-x-2">
                                    <Icon icon="solar:check-circle-bold" className="text-secondary text-base" />
                                    <span>Kompatibel Thermal 58/80mm</span>
                                </span>
                            </div>
                        </div>

                        {/* Hero Graphic Showcase Container (Expansive Cinematic Full Width) */}
                        <div className="mt-12 sm:mt-16 xl:mt-20 relative w-full max-w-[1520px] 2xl:max-w-[1640px] mx-auto">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-outline-variant bg-surface-container-lowest aspect-[16/9] w-full">
                                <img
                                    src="/images/rpos-hero.png"
                                    alt="Sistem POS Hardware & Antarmuka Kasir RPOS"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. KEY METRICS STAT BAR (FULL WIDTH) */}
                <section className="bg-surface-container-lowest border-y border-outline-variant/60 py-10 sm:py-12">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="flex items-center space-x-4 p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/40">
                                    <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20 shadow-xs">
                                        <Icon icon={stat.icon} className="text-2xl" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-headline-md text-xl sm:text-2xl font-bold text-primary tracking-tight truncate">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3.5 INTERACTIVE POS DEMO SECTION (FIGMA PROTOTYPE STYLE) */}
                <InteractivePosDemo />

                {/* 4. FEATURE SHOWCASE SECTION (FULL WIDTH) */}
                <section id="fitur" className="py-16 sm:py-24">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                Keunggulan Lengkap
                            </span>
                            <h2 className="font-headline-lg font-bold text-2xl sm:text-4xl text-primary tracking-tight">
                                Dirancang Khusus untuk Mempercepat Operasional Toko
                            </h2>
                            <p className="text-sm sm:text-base text-on-surface-variant">
                                Semua perkakas yang Anda butuhkan untuk melayani pelanggan, memantau persediaan barang, hingga mengaudit laba bersih.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {features.map((feat, idx) => (
                                <div 
                                    key={idx}
                                    className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs hover:shadow-md hover:border-secondary/40 transition-all group flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 group-hover:scale-105 transition-transform">
                                            <Icon icon={feat.icon} className="text-2xl" />
                                        </div>
                                        <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary group-hover:text-secondary transition-colors">
                                            {feat.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. WORKFLOW / CARA KERJA SECTION (FULL WIDTH) */}
                <section id="cara-kerja" className="py-16 sm:py-20 bg-surface-container-low/60 border-y border-outline-variant/60">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                Alur Cepat & Sederhana
                            </span>
                            <h2 className="font-headline-lg font-bold text-2xl sm:text-4xl text-primary tracking-tight">
                                3 Langkah Mudah Menjalankan RPOS di Toko Anda
                            </h2>
                            <p className="text-sm text-on-surface-variant">
                                Tidak perlu instalasi rumit ataupun teknisi IT khusus.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                            {/* Step 1 */}
                            <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs space-y-4 relative group hover:border-secondary/40 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 group-hover:scale-105 transition-transform">
                                        <Icon icon="solar:document-add-bold-duotone" className="text-2xl" />
                                    </div>
                                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                        01
                                    </span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-lg text-primary group-hover:text-secondary transition-colors">
                                    Daftar & Input Menu
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                    Registrasi akun toko dalam hitungan detik. Input daftar produk, kategori, harga jual, dan modal HPP Anda.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs space-y-4 relative group hover:border-secondary/40 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 group-hover:scale-105 transition-transform">
                                        <Icon icon="solar:cart-bold-duotone" className="text-2xl" />
                                    </div>
                                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                        02
                                    </span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-lg text-primary group-hover:text-secondary transition-colors">
                                    Buka Terminal Kasir
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                    Akses layar kasir di tablet, laptop, atau HP. Mulai transaksi dengan checkout Tunai atau scan QRIS otomatis.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs space-y-4 relative group hover:border-secondary/40 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 group-hover:scale-105 transition-transform">
                                        <Icon icon="solar:chart-bold-duotone" className="text-2xl" />
                                    </div>
                                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                        03
                                    </span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-lg text-primary group-hover:text-secondary transition-colors">
                                    Pantau Laba Bersih
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                    Pantau omzet harian, sisa kas laci, dan unduh laporan keuangan PDF eksekutif kapan pun langsung dari perangkat Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. PRICING SECTION (FULL WIDTH) */}
                <section id="harga" className="py-16 sm:py-24">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                Transparan & Terjangkau
                            </span>
                            <h2 className="font-headline-lg font-bold text-2xl sm:text-4xl text-primary tracking-tight">
                                Pilihan Paket Langganan RPOS
                            </h2>
                            <p className="text-sm sm:text-base text-on-surface-variant">
                                Pilih paket yang sesuai dengan skala bisnis Anda. Seluruh paket mencakup jaminan keamanan cloud & dukungan resmi.
                            </p>
                        </div>

                        {/* Pricing Cards Grid (Expansive Full Width - 4 Plans) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 xl:gap-7 w-full">
                            {plans.map((plan) => {
                                const isPro = plan.slug === 'pro' || plan.is_popular;
                                const isTrial = plan.slug === 'trial';
                                return (
                                    <div
                                        key={plan.id}
                                        className={`rounded-3xl p-6 sm:p-7 lg:p-6 xl:p-8 flex flex-col justify-between transition-all relative ${
                                            isPro
                                                ? 'bg-surface-container-lowest border-2 border-secondary shadow-xl scale-102 lg:-translate-y-2'
                                                : isTrial
                                                ? 'bg-surface-container-lowest border border-secondary/30 shadow-xs hover:border-secondary/60'
                                                : 'bg-surface-container-lowest border border-outline-variant/60 shadow-xs hover:border-secondary/40'
                                        }`}
                                    >
                                        {/* Most Popular Badge */}
                                        {isPro && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                                                Paling Populer
                                            </div>
                                        )}

                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="font-headline-sm text-xl lg:text-2xl font-bold text-primary">{plan.name}</h3>
                                                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 min-h-[40px]">{plan.description}</p>
                                            </div>

                                            <div className="pt-2 pb-4 border-b border-outline-variant/60">
                                                <div className="flex items-baseline space-x-1">
                                                    <span className="font-headline-lg text-2xl sm:text-3xl xl:text-4xl font-bold text-primary">
                                                        {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                                                    </span>
                                                    <span className="text-xs text-on-surface-variant font-medium">
                                                        / {plan.duration_days} hari
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Feature Checklist */}
                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Fitur Termasuk:</p>
                                                <ul className="space-y-2.5">
                                                    <li className="flex items-center space-x-2.5 text-xs sm:text-sm text-on-surface">
                                                        <Icon icon="solar:check-circle-bold" className="text-secondary text-base shrink-0" />
                                                        <span>Produk: <strong>{plan.max_products === -1 ? 'Tanpa Batas (Unlimited)' : (plan.slug === 'pro' ? 'Maks. 100' : `Maks. ${plan.max_products} Produk`)}</strong></span>
                                                    </li>
                                                    <li className="flex items-center space-x-2.5 text-xs sm:text-sm text-on-surface">
                                                        <Icon icon="solar:check-circle-bold" className="text-secondary text-base shrink-0" />
                                                        <span>Kasir: <strong>{plan.max_staff === -1 ? 'Tanpa Batas (Unlimited)' : (plan.slug === 'pro' ? 'Maks. 3' : `Maks. ${plan.max_staff} Akun Kasir`)}</strong></span>
                                                    </li>
                                                    {plan.features && plan.features.map((feat, fIdx) => (
                                                        <li key={fIdx} className="flex items-center space-x-2.5 text-xs sm:text-sm text-on-surface">
                                                            <Icon icon="solar:check-circle-bold" className="text-secondary text-base shrink-0" />
                                                            <span>{feat}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="pt-8">
                                            <Link
                                                href={route('register', { plan: plan.slug })}
                                                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all ${
                                                    isPro
                                                        ? 'bg-secondary hover:bg-on-secondary-container text-white shadow-md active:scale-95'
                                                        : isTrial
                                                        ? 'bg-secondary/10 hover:bg-secondary hover:text-white text-secondary border border-secondary/30 active:scale-95 shadow-xs'
                                                        : 'bg-surface-container-low hover:bg-secondary/10 hover:text-secondary text-primary border border-outline-variant/80'
                                                }`}
                                            >
                                                <span>{isTrial ? 'Coba Gratis 14 Hari' : `Pilih Paket ${plan.name}`}</span>
                                                <Icon icon="solar:arrow-right-bold" className="text-sm" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 7. FAQ ACCORDION SECTION */}
                <section id="faq" className="py-16 sm:py-20 bg-surface-container-low/60 border-t border-outline-variant/60">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16 max-w-5xl mx-auto">
                        <div className="text-center space-y-3 mb-12 sm:mb-16">
                            <span className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                Tanya Jawab
                            </span>
                            <h2 className="font-headline-lg font-bold text-2xl sm:text-4xl text-primary tracking-tight">
                                Pertanyaan yang Sering Diajukan
                            </h2>
                            <p className="text-sm text-on-surface-variant">
                                Pelajari selengkapnya mengenai penggunaan dan keuntungan sistem kasir RPOS.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div 
                                        key={idx}
                                        className="rounded-2xl bg-surface-container-lowest border border-outline-variant/60 overflow-hidden transition-all"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(idx)}
                                            className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-surface-container-low/40 transition-colors"
                                        >
                                            <span className="font-headline-sm text-sm sm:text-base font-bold text-primary">
                                                {faq.q}
                                            </span>
                                            <Icon 
                                                icon="solar:alt-arrow-down-bold" 
                                                className={`text-lg text-secondary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/40 pt-3">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 8. CALL TO ACTION & WHATSAPP SUPPORT BANNER (FULL WIDTH) */}
                <section className="py-16 sm:py-20">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 bg-primary text-on-primary overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Decorative ambient gradient */}
                            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="space-y-4 max-w-2xl text-center lg:text-left z-10">
                                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-secondary/30 border border-secondary/40 text-secondary-container text-xs font-bold">
                                    <span>Siap Beralih ke Kasir Modern?</span>
                                </span>
                                <h2 className="font-headline-lg text-2xl sm:text-4xl font-bold leading-tight">
                                    Tingkatkan Efisiensi & Keuntungan Bisnis Anda Bersama RPOS
                                </h2>
                                <p className="text-xs sm:text-sm text-on-primary-container leading-relaxed">
                                    Coba gratis selama 14 hari penuh. Toko Anda langsung siap menerima transaksi kasir hari ini juga.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full sm:w-auto shrink-0">
                                <Link
                                    href={route('register')}
                                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-secondary hover:bg-on-secondary-container active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all text-center"
                                >
                                    Daftar Toko Gratis (14 Hari)
                                </Link>
                                <a
                                    href={`https://wa.me/${String(supportPhone).replace(/[^0-9]/g, '')}?text=Halo%20Admin%20RPOS,%20saya%20ingin%20berkonsultasi%20seputar%20sistem%20kasir%20RPOS`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
                                >
                                    <Icon icon="ri:whatsapp-fill" className="text-base text-emerald-400" />
                                    <span>Konsultasi WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. FOOTER (FULL WIDTH) */}
                <footer className="bg-surface-container-lowest border-t border-outline-variant/60 py-10 sm:py-12">
                    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                            <div className="flex items-center space-x-3">
                                <img 
                                    src="/brand-logo.png" 
                                    alt="RPOS Logo" 
                                    className="h-10 w-auto object-contain rounded-xl shadow-xs" 
                                />
                                <div>
                                    <p className="font-headline-sm font-bold text-primary text-base">RPOS Point of Sale</p>
                                    <p className="text-xs text-on-surface-variant">Sistem Kasir Pintar untuk Bisnis yang Lebih Besar</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-on-surface-variant">
                                <a href="#demo" className="text-secondary font-bold hover:underline transition-colors">Demo Kasir</a>
                                <a href="#fitur" className="hover:text-secondary transition-colors">Fitur</a>
                                <a href="#cara-kerja" className="hover:text-secondary transition-colors">Cara Kerja</a>
                                <a href="#harga" className="hover:text-secondary transition-colors">Harga Paket</a>
                                <a href="#faq" className="hover:text-secondary transition-colors">FAQ</a>
                                <Link href={route('login')} className="hover:text-secondary transition-colors">Masuk Kasir</Link>
                                <Link href={route('register')} className="hover:text-secondary transition-colors">Daftar Toko</Link>
                            </div>

                            <div className="text-xs text-on-surface-variant">
                                &copy; {new Date().getFullYear()} RPOS Cloud Platform. Hak Cipta Dilindungi.
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
