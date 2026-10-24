import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import PlanQrisModal from '@/Components/SuperAdmin/PlanQrisModal';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

const MONTHS = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function SuperAdminDashboard({ 
    stats = {}, 
    plans = [], 
    recentTenants = [], 
    recentSubscriptions = [], 
    pendingCount = 0,
    filters = {},
    availableYears = []
}) {
    const { auth, flash } = usePage().props;
    const [selectedPlanForQris, setSelectedPlanForQris] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const selectedMonth = filters?.month || '10';
    const selectedYear = filters?.year || 2026;

    const selectedPeriodLabel = useMemo(() => {
        if (selectedMonth === 'all') {
            return `Tahun ${selectedYear}`;
        }
        const found = MONTHS.find(m => m.value === String(selectedMonth));
        return `${found ? found.label : `Bulan ${selectedMonth}`} ${selectedYear}`;
    }, [selectedMonth, selectedYear]);

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        router.get(route('superadmin.dashboard'), {
            month: newMonth,
            year: selectedYear,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleYearChange = (e) => {
        const newYear = e.target.value;
        router.get(route('superadmin.dashboard'), {
            month: selectedMonth,
            year: newYear,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Super Admin Dashboard - Konsol Platform SaaS" />

            {/* Header / Navbar */}
            <div className="p-3.5 sm:p-4 bg-surface-container-lowest flex items-center justify-between shadow-sm sticky top-0 z-40 border-b border-outline-variant">
                <div className="flex items-center space-x-3 sm:space-x-6">
                    <Link href={route('superadmin.dashboard')} className="flex items-center space-x-2.5 group">
                        <img 
                            src="/brand-logo.png" 
                            alt="RPOS Logo" 
                            className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform" 
                        />
                        <div>
                            <h1 className="font-headline-lg font-bold text-primary leading-tight text-sm sm:text-lg group-hover:text-secondary transition-colors">POS SaaS Console</h1>
                            <span className="font-label-sm text-secondary uppercase tracking-wider block -mt-0.5 text-[9px] sm:text-xs font-semibold">
                                Platform Super Admin
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="hidden md:flex items-center space-x-2 pl-4 border-l border-outline-variant">
                        <Link 
                            href={route('superadmin.dashboard')}
                            className="font-label-md text-primary font-bold bg-surface-container-high px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-xs border border-outline-variant"
                        >
                            <span className="material-symbols-outlined text-base text-secondary">dashboard</span>
                            <span>Dashboard</span>
                        </Link>

                        <Link 
                            href={route('superadmin.tenants.index')}
                            className="font-label-md text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-base">storefront</span>
                            <span>Manajemen Toko</span>
                        </Link>

                        <Link 
                            href={route('superadmin.billing.index')}
                            className="font-label-md text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                            <span>Billing & Verifikasi</span>
                            {pendingCount > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>

                        <Link 
                            href={route('superadmin.monitoring')}
                            className="font-label-md text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-base text-secondary">monitoring</span>
                            <span>Live Monitoring</span>
                            {stats.onlineTenantsCount > 0 && (
                                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            )}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="font-label-md font-bold text-on-surface">{auth.user.name}</span>
                        <span className="text-xs text-on-surface-variant">Platform Administrator</span>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center space-x-1 px-4 py-2 bg-error text-on-error rounded-full font-label-md hover:bg-on-error-container hover:text-error-container transition-all active:scale-95 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Keluar</span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="md:hidden bg-surface-container-low border-b border-outline-variant px-4 py-2 flex items-center space-x-2 overflow-x-auto">
                <Link 
                    href={route('superadmin.dashboard')}
                    className="font-label-md text-primary font-bold bg-surface-container-high px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                    Dashboard
                </Link>
                <Link 
                    href={route('superadmin.tenants.index')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                    Manajemen Toko
                </Link>
                <Link 
                    href={route('superadmin.billing.index')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center space-x-1"
                >
                    <span>Billing & Verifikasi</span>
                    {pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                            {pendingCount}
                        </span>
                    )}
                </Link>
                <Link 
                    href={route('superadmin.monitoring')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center space-x-1"
                >
                    <span>Live Monitoring</span>
                    {stats.onlineTenantsCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    )}
                </Link>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                
                {/* Flash Success Notification */}
                {flash?.success && (
                    <div className="bg-surface-container-low text-secondary border border-secondary-container px-5 py-3.5 rounded-2xl font-label-md shadow-sm flex items-center space-x-2">
                        <span className="material-symbols-outlined text-secondary">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-headline-md font-bold text-on-surface flex items-center">
                            <span className="material-symbols-outlined text-secondary mr-2">analytics</span>
                            Ringkasan Pendapatan & Eksekutif Platform
                        </h2>
                        <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
                            Ikhtisar performa bisnis SaaS, penerimaan langganan toko, dan pertumbuhan ekosistem merchant.
                        </p>
                    </div>

                    {/* Filter Bulan / Tahun */}
                    <div className="flex flex-wrap items-center gap-2 bg-surface-container-low p-1.5 px-3 rounded-2xl border border-outline-variant shadow-xs">
                        <div className="flex items-center space-x-1.5 text-xs text-secondary font-semibold">
                            <span className="material-symbols-outlined text-base">calendar_month</span>
                            <span className="hidden sm:inline">Periode Filter:</span>
                        </div>

                        {/* Dropdown Bulan */}
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="text-xs py-1.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl font-label-md outline-none cursor-pointer hover:bg-surface-container-high/50 transition-colors appearance-none font-semibold text-primary"
                                style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23827472\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '0.85rem'
                                }}
                            >
                                {MONTHS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown Tahun */}
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={handleYearChange}
                                className="text-xs py-1.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl font-label-md outline-none cursor-pointer hover:bg-surface-container-high/50 transition-colors appearance-none font-semibold text-primary"
                                style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23827472\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '0.85rem'
                                }}
                            >
                                {(availableYears && availableYears.length > 0 ? availableYears : [2024, 2025, 2026, 2027]).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Alert Notification if pending subscriptions exist */}
                {pendingCount > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm font-bold text-amber-950">
                                    {pendingCount} Pembayaran Langganan Menunggu Verifikasi!
                                </h3>
                                <p className="font-body-sm text-amber-800 text-xs mt-0.5">
                                    Merchant telah mengunggah bukti transfer via QRIS statis. Segera verifikasi mutasi agar status langganan toko langsung aktif.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={route('superadmin.billing.index')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-label-md text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center space-x-1"
                        >
                            <span>Buka Halaman Billing</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* 5 Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Stat Card 1: Pendapatan Periode Ini */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-secondary/30 ring-1 ring-secondary/20 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-label-sm uppercase tracking-wider text-secondary font-bold block">
                                    Pendapatan Periode Ini
                                </span>
                                <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                                    {selectedPeriodLabel}
                                </span>
                            </div>
                            <span className="font-headline-lg font-bold text-primary block text-lg lg:text-xl truncate" title={formatRupiah(stats.periodSubscriptionRevenue)}>
                                {formatRupiah(stats.periodSubscriptionRevenue || 0)}
                            </span>
                        </div>
                        <span className="font-body-sm text-secondary mt-3 text-xs leading-relaxed">
                            Pendapatan periode terpilih
                        </span>
                    </div>

                    {/* Stat Card 2: Total Pendapatan All-Time */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                        <div>
                            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
                                Total Pendapatan
                            </span>
                            <span className="font-headline-lg font-bold text-primary block text-lg lg:text-xl truncate" title={formatRupiah(stats.totalSubscriptionRevenue)}>
                                {formatRupiah(stats.totalSubscriptionRevenue || 0)}
                            </span>
                        </div>
                        <span className="font-body-sm text-secondary mt-3 text-xs leading-relaxed">
                            Total pendapatan dari toko yang langganan
                        </span>
                    </div>

                    {/* Stat Card 3: Toko Terdaftar Periode Ini */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                        <div>
                            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                                Toko Baru ({selectedPeriodLabel})
                            </span>
                            <span className="font-headline-lg font-bold text-primary block">
                                {stats.periodNewTenants || 0} Toko
                            </span>
                        </div>
                        <span className="font-body-sm text-on-surface-variant mt-3 text-xs">
                            Dari total {stats.totalTenants || 0} toko terdaftar
                        </span>
                    </div>

                    {/* Stat Card 4: Toko Langganan Aktif */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                        <div>
                            <span className="font-label-sm uppercase tracking-wider text-secondary font-bold block mb-1">
                                Toko Langganan Aktif
                            </span>
                            <span className="font-headline-lg font-bold text-secondary block">
                                {stats.activePaidTenants || 0}
                            </span>
                        </div>
                        <span className="font-body-sm text-on-surface-variant mt-3 text-xs">
                            Merchant paket berbayar
                        </span>
                    </div>

                    {/* Stat Card 5: Sedang Uji Coba */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between">
                        <div>
                            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                                Sedang Uji Coba
                            </span>
                            <span className="font-headline-lg font-bold text-primary block">
                                {stats.trialTenants || 0}
                            </span>
                        </div>
                        <span className="font-body-sm text-secondary mt-3 text-xs">
                            Masa trial 14 hari
                        </span>
                    </div>
                </div>


                {/* Section: Distribusi Paket Langganan SaaS */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-headline-sm font-bold text-on-surface flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">card_membership</span>
                                <span>Distribusi Paket Langganan Platform</span>
                            </h3>
                            <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
                                Paket langganan yang tersedia dan jumlah merchant aktif pada masing-masing paket.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[...plans]
                            .filter(p => p.slug !== 'trial' && p.price > 0)
                            .sort((a, b) => Number(a.price) - Number(b.price))
                            .map((plan) => (
                            <div 
                                key={plan.id}
                                className={`p-6 rounded-3xl border transition-all relative overflow-hidden bg-surface-container-lowest ${
                                    plan.is_popular 
                                        ? 'border-secondary shadow-md ring-1 ring-secondary/20' 
                                        : 'border-outline-variant shadow-sm'
                                }`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute top-4 right-4 bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                                            <span className="material-symbols-outlined text-lg">local_cafe</span>
                                        </div>
                                        <div>
                                            <h4 className="font-headline-sm font-bold text-primary">{plan.name}</h4>
                                            <span className="text-[11px] text-on-surface-variant">Siklus {plan.duration_days} Hari</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="text-2xl font-bold text-primary">
                                            {formatRupiah(plan.price)}
                                            <span className="text-xs font-normal text-on-surface-variant"> /bulan</span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-outline-variant space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between text-on-surface">
                                            <span className="text-on-surface-variant">Batas Produk:</span>
                                            <span className="font-semibold">
                                                {(!plan.max_products || plan.max_products === -1) ? 'tidak ada batas Produk' : `${plan.max_products} Produk`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-on-surface">
                                            <span className="text-on-surface-variant">Akun Kasir/Staf:</span>
                                            <span className="font-semibold">
                                                {(!plan.max_staff || plan.max_staff === -1) ? 'tidak ada batas Staf' : `${plan.max_staff} Staf`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* QRIS Statis Section */}
                                    <div className="pt-3 border-t border-outline-variant space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-on-surface-variant font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-secondary">qr_code_2</span>
                                                <span>QRIS Paket:</span>
                                            </span>
                                            {plan.qris_image_url ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                    <span>QRIS Aktif</span>
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                    Belum Diatur
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setSelectedPlanForQris(plan)}
                                            className="w-full py-2 px-3 bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-xl text-xs font-bold transition border border-outline-variant flex items-center justify-center space-x-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">tune</span>
                                            <span>{plan.qris_image ? 'Ganti Barcode QRIS' : '+ Upload QRIS Statis'}</span>
                                        </button>
                                    </div>

                                    <div className="pt-3 border-t border-outline-variant flex items-center justify-between bg-surface-container-low -mx-6 -mb-6 p-4">
                                        <span className="text-xs text-on-surface-variant">Toko Aktif:</span>
                                        <span className="font-bold text-secondary text-sm">
                                            {plan.tenants_count || 0} Toko
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Dual Tables Grid (Recent Stores & Recent Subscription Activities) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Table 1: Pendaftaran Toko Terbaru */}
                    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary">domain</span>
                                    <h3 className="font-headline-sm font-bold text-on-surface">
                                        Merchant Terdaftar ({selectedPeriodLabel})
                                    </h3>
                                </div>
                                <Link 
                                    href={route('superadmin.tenants.index')}
                                    className="text-xs text-secondary hover:text-primary font-semibold flex items-center space-x-0.5"
                                >
                                    <span>Lihat Semua</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </Link>
                            </div>

                            <div className="divide-y divide-outline-variant">
                                {recentTenants.length === 0 ? (
                                    <div className="p-8 text-center text-on-surface-variant text-xs">
                                        Belum ada toko yang terdaftar pada periode ini.
                                    </div>
                                ) : (
                                    recentTenants.map((tenant) => {
                                        const owner = tenant.users?.[0];
                                        return (
                                            <div key={tenant.id} className="p-4 hover:bg-surface-container-low transition-colors flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0">
                                                        {tenant.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-primary text-sm">{tenant.name}</div>
                                                        <div className="text-xs text-on-surface-variant">{owner?.name || '-'} • {owner?.email || '-'}</div>
                                                        <div className="text-[11px] text-secondary mt-0.5">
                                                            {tenant.products_count || 0} Produk • {tenant.orders_count || 0} Transaksi
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right space-y-1">
                                                    <div>
                                                        {tenant.subscription_status === 'active' ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant">
                                                                Trial
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-on-surface-variant">
                                                        {tenant.plan?.name || 'Trial'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center">
                            <Link 
                                href={route('superadmin.tenants.index')}
                                className="text-xs font-semibold text-secondary hover:text-primary"
                            >
                                Buka Halaman Manajemen Toko & Barcode QRIS &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Table 2: Aktivitas Pembayaran Langganan Terbaru */}
                    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-secondary">payments</span>
                                    <h3 className="font-headline-sm font-bold text-on-surface">
                                        Mutasi Tagihan ({selectedPeriodLabel})
                                    </h3>
                                </div>
                                <Link 
                                    href={route('superadmin.billing.index')}
                                    className="text-xs text-secondary hover:text-primary font-semibold flex items-center space-x-0.5"
                                >
                                    <span>Lihat Semua</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </Link>
                            </div>

                            <div className="divide-y divide-outline-variant">
                                {recentSubscriptions.length === 0 ? (
                                    <div className="p-8 text-center text-on-surface-variant text-xs">
                                        Belum ada mutasi tagihan langganan pada periode ini.
                                    </div>
                                ) : (
                                    recentSubscriptions.map((sub) => (
                                        <div key={sub.id} className="p-4 hover:bg-surface-container-low transition-colors flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-primary text-sm">{sub.tenant?.name || 'Toko'}</div>
                                                <div className="font-mono text-[11px] text-on-surface-variant">{sub.payment_reference}</div>
                                                <div className="text-[11px] text-on-surface-variant mt-0.5">
                                                    Paket {sub.plan?.name || '-'} • {new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>

                                            <div className="text-right space-y-1">
                                                <div className="font-bold text-secondary text-sm">
                                                    {formatRupiah(sub.amount)}
                                                </div>
                                                <div>
                                                    {sub.status === 'active' ? (
                                                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                            <span>Lunas</span>
                                                        </span>
                                                    ) : sub.status === 'pending' ? (
                                                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                            <span>Menunggu</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container text-on-error-container">
                                                            <span>Ditolak</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center">
                            <Link 
                                href={route('superadmin.billing.index')}
                                className="text-xs font-semibold text-secondary hover:text-primary"
                            >
                                Kelola Verifikasi Pembayaran & Riwayat Lengkap &rarr;
                            </Link>
                        </div>
                    </div>

                </div>

            </div>

            {/* Plan Static QRIS Setting Modal */}
            <PlanQrisModal
                isOpen={Boolean(selectedPlanForQris)}
                onClose={() => setSelectedPlanForQris(null)}
                plan={selectedPlanForQris}
            />

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                user={auth?.user}
            />
        </div>
    );
}
