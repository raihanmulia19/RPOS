import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import SubscriptionWarningBanner from '@/Components/SubscriptionWarningBanner';
import MerchantNavbar from '@/Components/MerchantNavbar';
import SubscriptionPaymentModal from '@/Components/SubscriptionPaymentModal';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

const EXPENSE_PALETTE = ['#b45309', '#047857', '#0284c7', '#6d28d9', '#be123c', '#475569', '#ca8a04', '#0d9488'];

export default function Dashboard({ 
    auth, 
    stats = {}, 
    paymentBreakdown = { cash: { total: 0, count: 0, percentage: 0 }, qris: { total: 0, count: 0, percentage: 0 } }, 
    paymentChartData = [],
    salesTrend = [],
    topProductsChart = [],
    expenseCategories = [],
    productProfitability = [], 
    expensesList = [], 
    bestSellers = [], 
    recentOrders = [], 
    filters = {}, 
    tenant = null,
    pendingSubscription = null,
    rejectedSubscription = null,
    recentlyApprovedSubscription = null,
    adminContact = {}
}) {
    const { flash } = usePage().props;
    const [trendMetric, setTrendMetric] = useState('revenue'); // 'revenue' | 'orders'
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(() => {
        return Boolean(flash?.show_qris_modal);
    });
    const [showExcelUpgradeModal, setShowExcelUpgradeModal] = useState(false);
    const [isApprovedDismissed, setIsApprovedDismissed] = useState(() => {
        if (!recentlyApprovedSubscription?.id) return false;
        try {
            return localStorage.getItem(`dismissed_approved_sub_${recentlyApprovedSubscription.id}`) === 'true';
        } catch (e) {
            return false;
        }
    });

    const handleDismissApprovedBanner = () => {
        setIsApprovedDismissed(true);
        if (recentlyApprovedSubscription?.id) {
            try {
                localStorage.setItem(`dismissed_approved_sub_${recentlyApprovedSubscription.id}`, 'true');
            } catch (e) {}
        }
    };
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');

    const filteredOrders = useMemo(() => {
        if (!recentOrders) return [];
        if (!orderSearch.trim()) return recentOrders;
        const q = orderSearch.toLowerCase();
        return recentOrders.filter(o => 
            (o.invoice_number && o.invoice_number.toLowerCase().includes(q)) ||
            (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
            (o.payment_method && o.payment_method.toLowerCase().includes(q))
        );
    }, [recentOrders, orderSearch]);

    const displayedOrders = useMemo(() => {
        if (showAllOrders || orderSearch.trim()) {
            return filteredOrders;
        }
        return filteredOrders.slice(0, 10);
    }, [filteredOrders, showAllOrders, orderSearch]);
    
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
    };

    const formatShortRupiah = (num) => {
        if (!num || num === 0) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)} jt`;
        if (num >= 1000) return `${Math.round(num / 1000)} rb`;
        return num.toString();
    };

    const handleFilterChange = (type, value) => {
        router.get(route('dashboard'), { filter_type: type, filter_value: value }, { preserveState: true });
    };

    const CustomTrendTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                    <p className="font-bold text-on-surface border-b border-outline-variant pb-1">
                        {filters?.type === 'date' ? `Pukul ${label}` : label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={`trend-tip-${index}`} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                <span>{entry.name}:</span>
                            </span>
                            <span className="font-bold text-on-surface font-mono">
                                {entry.dataKey === 'orders_count' ? `${entry.value} order` : formatRupiah(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded-xl shadow-lg text-xs space-y-1 z-50">
                    <p className="font-bold text-primary border-b border-outline-variant pb-1">{data.full_name || data.name}</p>
                    <div className="flex justify-between gap-4 text-on-surface-variant">
                        <span>Kategori:</span>
                        <span className="font-semibold text-on-surface">{data.category || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-on-surface-variant">
                        <span>Unit Terjual:</span>
                        <span className="font-bold text-primary font-mono">{data.sold} unit</span>
                    </div>
                    <div className="flex justify-between gap-4 text-on-surface-variant">
                        <span>Total Omzet:</span>
                        <span className="font-bold text-on-surface font-mono">{formatRupiah(data.revenue)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-on-surface-variant">
                        <span>Estimasi Laba:</span>
                        <span className="font-bold text-emerald-700 font-mono">{formatRupiah(data.profit)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const activeTenant = tenant || auth.user?.tenant;
    const userPlanSlug = activeTenant?.plan?.slug || 'trial';
    const canExportExcel = ['pro', 'enterprise'].includes(userPlanSlug);
    const isProPlan = canExportExcel;

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title={`Laporan Keuangan Eksekutif - POS SaaS`} />

            {/* H-3 Warning Banner */}
            <SubscriptionWarningBanner tenant={activeTenant} />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={activeTenant} auth={auth} activePage="dashboard" />

            {/* Recently Approved Subscription Banner */}
            {recentlyApprovedSubscription && !isApprovedDismissed && (
                <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-950 px-4 py-3 sticky top-0 z-30 shadow-xs animate-fade-in">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-xl">verified</span>
                            </div>
                            <div>
                                <div className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                                    <span>Paket Langganan {recentlyApprovedSubscription.plan?.name} Berhasil Diaktifkan!</span>
                                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Aktif
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-800/90 mt-0.5">
                                    Masa aktif toko Anda telah diperpanjang hingga <strong>{activeTenant?.expiration_date_formatted || 'periode aktif'}</strong>. Terima kasih telah berlangganan RPOS!
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleDismissApprovedBanner}
                            className="p-1.5 text-emerald-800 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                            title="Tutup pemberitahuan"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Subscription QRIS Banner */}
            {pendingSubscription && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 sticky top-0 z-30 shadow-xs animate-fade-in">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-xl">qr_code_2</span>
                            </div>
                            <div>
                                <div className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                                    <span>Pendaftaran Paket {pendingSubscription.plan?.name} Menunggu Pembayaran QRIS</span>
                                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Pending
                                    </span>
                                </div>
                                <p className="text-xs text-amber-800/90 mt-0.5">
                                    Tagihan: <strong>{formatRupiah(pendingSubscription.amount)}</strong> • No. Referensi: <strong className="font-mono">{pendingSubscription.payment_reference}</strong>. Selesaikan scan QRIS dan konfirmasi via WA untuk aktivasi toko.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-4 py-2 bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 shrink-0"
                        >
                            <span className="material-symbols-outlined text-sm">payments</span>
                            <span>Buka Barcode QRIS & WA</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Rejected Subscription Banner */}
            {rejectedSubscription && !pendingSubscription && (
                <div className="bg-red-50 border-b border-red-200 text-red-950 px-4 py-3.5 sticky top-0 z-30 shadow-xs animate-fade-in">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                                <span className="material-symbols-outlined text-xl">cancel</span>
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-xs sm:text-sm font-bold text-red-950 flex items-center gap-2">
                                    <span>Pengajuan Pembayaran Paket {rejectedSubscription.plan?.name} Ditolak</span>
                                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Ditolak
                                    </span>
                                </div>
                                <p className="text-xs text-red-800/90">
                                    No. Referensi: <strong className="font-mono">{rejectedSubscription.payment_reference}</strong> • 
                                    Catatan Super Admin: <span className="font-semibold italic">"{rejectedSubscription.notes || 'Bukti transfer tidak valid atau dana belum masuk.'}"</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                            <Link
                                href={route('subscription.plans')}
                                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1"
                            >
                                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                                <span>Pilih / Ajukan Ulang</span>
                            </Link>
                            {adminContact?.whatsapp && (
                                <a
                                    href={`https://wa.me/${adminContact.whatsapp}?text=${encodeURIComponent(`Halo Admin, saya ingin menanyakan pengajuan pembayaran paket ${rejectedSubscription.plan?.name} (${rejectedSubscription.payment_reference}) yang ditolak: "${rejectedSubscription.notes || ''}". Terima kasih.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white hover:bg-red-100 text-red-950 border border-red-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                                >
                                    <span className="material-symbols-outlined text-sm text-green-600">chat</span>
                                    <span>WA Admin</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Flash Error Banner */}
                {flash?.error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-fade-in shadow-xs">
                        <div className="flex items-center space-x-2.5">
                            <span className="material-symbols-outlined text-red-600 shrink-0">error</span>
                            <span>{flash.error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setShowExcelUpgradeModal(true)} 
                            className="text-xs font-bold underline cursor-pointer hover:text-red-950 ml-4 shrink-0"
                        >
                            Upgrade Sekarang
                        </button>
                    </div>
                )}
                
                {/* Top Control Bar: Title, Filters & PDF/Excel Export */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant shadow-sm">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-primary text-xl">insights</span>
                            <h2 className="font-headline-sm sm:font-headline-md font-bold text-on-surface">
                                Laporan Keuangan & Analisis Laba Rugi
                            </h2>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                            Ringkasan performa finansial periode <strong className="text-on-surface">{stats.periodLabel || 'Bulan Ini'}</strong>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                        {/* Filter Mode Dropdown */}
                        <div className="relative w-full sm:w-auto">
                            <select 
                                value={filters?.type || 'month'} 
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    const defaultVal = newType === 'month' 
                                        ? new Date().toISOString().slice(0, 7) 
                                        : new Date().toISOString().slice(0, 10);
                                    handleFilterChange(newType, defaultVal);
                                }}
                                className="w-full sm:w-auto bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold outline-none cursor-pointer hover:bg-surface-container-lowest transition-colors appearance-none text-on-surface"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                            >
                                <option value="month">Laporan Bulanan</option>
                                <option value="date">Laporan Harian</option>
                            </select>
                        </div>
                        
                        {/* Filter Value Picker */}
                        {filters?.type === 'date' ? (
                            <input 
                                type="date"
                                value={filters?.value || new Date().toISOString().slice(0, 10)}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="w-full sm:w-auto bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2 text-xs sm:text-sm outline-none cursor-pointer font-semibold text-on-surface hover:bg-surface-container-lowest transition-colors"
                            />
                        ) : (
                            <input 
                                type="month"
                                value={filters?.value || new Date().toISOString().slice(0, 7)}
                                onChange={(e) => handleFilterChange('month', e.target.value)}
                                className="w-full sm:w-auto bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2 text-xs sm:text-sm outline-none cursor-pointer font-semibold text-on-surface hover:bg-surface-container-lowest transition-colors"
                            />
                        )}

                        {/* Export PDF Button */}
                        <a 
                            href={route('dashboard.export-pdf', { filter_type: filters?.type, filter_value: filters?.value })} 
                            target="_blank" 
                            className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-primary text-on-primary rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-primary/90 flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                            title="Unduh Laporan Keuangan Resmi dalam format PDF"
                        >
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            <span>PDF</span>
                        </a>

                        {/* Export Excel (.xlsx) Button - Pro & Enterprise */}
                        {canExportExcel ? (
                            <a 
                                href={route('dashboard.export-excel', { filter_type: filters?.type, filter_value: filters?.value })} 
                                target="_blank" 
                                className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                                title="Unduh Buku Kerja Multi-Sheet dalam format Microsoft Excel (.xlsx)"
                            >
                                <span className="material-symbols-outlined text-base">table_view</span>
                                <span>Excel (.xlsx)</span>
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowExcelUpgradeModal(true)}
                                className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer group"
                                title="Fitur Ekspor Excel (.xlsx) khusus untuk paket Pro dan Enterprise"
                            >
                                <span className="material-symbols-outlined text-base text-emerald-700 dark:text-emerald-400">table_view</span>
                                <span>Excel (.xlsx)</span>
                                <span className="inline-flex items-center bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-300/50">
                                    <span className="material-symbols-outlined text-[12px]">lock</span>
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 Primary Financial KPI Cards (Clean Uniform Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Card 1: Omzet Penjualan */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant hover:border-outline transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm font-semibold text-on-surface-variant">Total Omzet</span>
                            <span className="material-symbols-outlined text-lg text-on-surface-variant/70">trending_up</span>
                        </div>
                        <div>
                            <div className="font-headline-lg font-bold text-on-surface tracking-tight">
                                {formatRupiah(stats.revenue)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-on-surface-variant">
                                {stats.ordersCount || 0} Transaksi &bull; AOV {formatRupiah(stats.avgOrderValue)}
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Biaya Pokok Penjualan (HPP) */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant hover:border-outline transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm font-semibold text-on-surface-variant">Modal Pokok (HPP)</span>
                            <span className="material-symbols-outlined text-lg text-on-surface-variant/70">inventory_2</span>
                        </div>
                        <div>
                            <div className="font-headline-lg font-bold text-on-surface tracking-tight">
                                {formatRupiah(stats.cogs)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-on-surface-variant">
                                {stats.revenue > 0 ? Math.round((stats.cogs / stats.revenue) * 100) : 0}% dari total omzet
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Laba Kotor & Gross Margin % */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant hover:border-outline transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm font-semibold text-on-surface-variant">Laba Kotor</span>
                            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-md">
                                {stats.grossMarginPercentage || 0}% margin
                            </span>
                        </div>
                        <div>
                            <div className="font-headline-lg font-bold text-on-surface tracking-tight">
                                {formatRupiah(stats.grossProfit)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-on-surface-variant">
                                Setelah dikurangi modal bahan
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Laba Bersih Operasional & Net Margin % */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant hover:border-outline transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-label-sm font-semibold text-on-surface-variant">Laba Bersih</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                (stats.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {stats.netMarginPercentage || 0}% net
                            </span>
                        </div>
                        <div>
                            <div className={`font-headline-lg font-bold tracking-tight ${
                                (stats.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                            }`}>
                                {formatRupiah(stats.netProfit)}
                            </div>
                            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-on-surface-variant">
                                Beban operasional {formatRupiah(stats.expenses)}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Section: Visual Analytics Suite (Tersedia untuk Semua Paket) */}
                <div className="space-y-6">
                        {/* Row 1: Sales & Profit Trend (2/3) + Cash Flow Donut (1/3) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Chart 1: Tren Penjualan & Laba Bersih */}
                        <div className="lg:col-span-2 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant pb-3 mb-4">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-lg">trending_up</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline-sm font-bold text-on-surface">
                                                Grafik Tren Penjualan & Laba
                                            </h3>
                                            <p className="text-xs text-on-surface-variant">
                                                {filters?.type === 'date' 
                                                    ? 'Fluktuasi omzet dan estimasi laba per jam operasional' 
                                                    : 'Pergerakan omzet dan estimasi laba bersih harian'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metric Switcher Tab */}
                                    <div className="inline-flex p-1 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setTrendMetric('revenue')}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                trendMetric === 'revenue'
                                                    ? 'bg-primary text-on-primary shadow-xs'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                        >
                                            Omzet & Laba
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTrendMetric('orders')}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                                trendMetric === 'orders'
                                                    ? 'bg-primary text-on-primary shadow-xs'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                        >
                                            Jumlah Order
                                        </button>
                                    </div>
                                </div>

                                {/* Chart Render */}
                                <div className="h-64 sm:h-72 w-full pt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {trendMetric === 'revenue' ? (
                                            <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8d4f03" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#8d4f03" stopOpacity={0.0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.6} />
                                                <XAxis 
                                                    dataKey="short_label" 
                                                    stroke="#8d4f03" 
                                                    fontSize={11} 
                                                    tickLine={false} 
                                                    axisLine={{ stroke: '#e5e7eb' }} 
                                                />
                                                <YAxis 
                                                    stroke="#8d4f03" 
                                                    fontSize={11} 
                                                    tickFormatter={formatShortRupiah} 
                                                    tickLine={false} 
                                                    axisLine={false}
                                                    width={45} 
                                                />
                                                <Tooltip content={<CustomTrendTooltip />} />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="revenue" 
                                                    name="Omzet" 
                                                    stroke="#8d4f03" 
                                                    strokeWidth={2.5} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorRevenue)" 
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="profit" 
                                                    name="Laba Bersih" 
                                                    stroke="#059669" 
                                                    strokeWidth={2} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorProfit)" 
                                                />
                                            </AreaChart>
                                        ) : (
                                            <BarChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.6} />
                                                <XAxis 
                                                    dataKey="short_label" 
                                                    stroke="#8d4f03" 
                                                    fontSize={11} 
                                                    tickLine={false} 
                                                    axisLine={{ stroke: '#e5e7eb' }} 
                                                />
                                                <YAxis 
                                                    stroke="#8d4f03" 
                                                    fontSize={11} 
                                                    tickLine={false} 
                                                    axisLine={false}
                                                    width={35} 
                                                />
                                                <Tooltip content={<CustomTrendTooltip />} />
                                                <Bar 
                                                    dataKey="orders_count" 
                                                    name="Transaksi" 
                                                    fill="#271310" 
                                                    radius={[6, 6, 0, 0]} 
                                                />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart Mini Footer Legend & Quick Stats */}
                            <div className="pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#8d4f03]"></span>
                                        <span>Omzet Penjualan</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                                        <span>Laba Bersih</span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-on-surface-variant font-medium">
                                    Rata-rata Penjualan/Transaksi: <strong className="text-on-surface font-semibold">{formatRupiah(stats.avgOrderValue)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Chart 2: Komposisi Arus Kas Kasir (Donut Chart) */}
                        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-base">pie_chart</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline-sm font-bold text-on-surface">Arus Kas (Cash Flow)</h3>
                                            <p className="text-[11px] text-on-surface-variant">Tunai vs Digital QRIS</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold bg-surface-container-highest px-2 py-0.5 rounded-md text-on-surface-variant">
                                        PPN {formatRupiah(stats.tax)}
                                    </span>
                                </div>

                                {/* Donut Chart */}
                                <div className="h-44 w-full relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentChartData.length > 0 && (paymentBreakdown.cash?.total > 0 || paymentBreakdown.qris?.total > 0) ? paymentChartData : [
                                                    { name: 'Belum Ada Transaksi', value: 1, color: '#e5e7eb' }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {paymentChartData.map((entry, index) => (
                                                    <Cell key={`pay-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatRupiah(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Centered Donut Label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                        <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total Masuk</span>
                                        <span className="text-sm font-bold text-on-surface leading-tight font-mono">
                                            {formatShortRupiah(stats.grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* 2 Compact Cash Flow Details */}
                                <div className="space-y-2.5 pt-1">
                                    {/* Uang Tunai di Laci Kasir */}
                                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#8d4f03] shrink-0"></span>
                                            <div>
                                                <div className="font-bold text-xs text-on-surface">Uang Kas Fisik di Laci</div>
                                                <div className="text-[11px] text-on-surface-variant">
                                                    {paymentBreakdown.cash?.count || 0} Trx ({paymentBreakdown.cash?.percentage || 0}%)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right font-bold text-xs text-on-surface font-mono">
                                            {formatRupiah(paymentBreakdown.cash?.total)}
                                        </div>
                                    </div>

                                    {/* Pembayaran Digital QRIS */}
                                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#271310] shrink-0"></span>
                                            <div>
                                                <div className="font-bold text-xs text-on-surface">Digital QRIS (Bank)</div>
                                                <div className="text-[11px] text-on-surface-variant">
                                                    {paymentBreakdown.qris?.count || 0} Trx ({paymentBreakdown.qris?.percentage || 0}%)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right font-bold text-xs text-on-surface font-mono">
                                            {formatRupiah(paymentBreakdown.qris?.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Row 2: Top 5 Best Sellers (Horizontal Bar Chart) + Operational Expenses Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Chart 3: Top 5 Menu Paling Laris */}
                        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-base">bar_chart</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline-sm font-bold text-on-surface">Top 5 Menu Paling Laris</h3>
                                            <p className="text-xs text-on-surface-variant">Unit terbanyak terjual pada periode ini</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-md">
                                        Best Sellers
                                    </span>
                                </div>

                                {topProductsChart && topProductsChart.length > 0 ? (
                                    <div className="h-60 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={topProductsChart}
                                                layout="vertical"
                                                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.6} />
                                                <XAxis type="number" fontSize={11} stroke="#8d4f03" tickLine={false} />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    width={110} 
                                                    fontSize={11} 
                                                    stroke="#271310" 
                                                    tickLine={false}
                                                    axisLine={{ stroke: '#e5e7eb' }} 
                                                />
                                                <Tooltip content={<CustomBarTooltip />} />
                                                <Bar dataKey="sold" name="Unit Terjual" fill="#8d4f03" radius={[0, 6, 6, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-on-surface-variant text-xs italic">
                                        <span className="material-symbols-outlined text-3xl mb-1 opacity-40">inventory_2</span>
                                        Belum ada data penjualan pada periode ini.
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                                <span>Diurutkan berdasarkan kuantitas transaksi</span>
                                <span className="font-semibold text-primary">Unit Terjual</span>
                            </div>
                        </div>

                        {/* Chart 4: Beban Pengeluaran */}
                        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-700 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-base">donut_large</span>
                                        </div>
                                        <div>
                                            <h3 className="font-headline-sm font-bold text-on-surface">Beban Pengeluaran</h3>
                                            <p className="text-xs text-on-surface-variant">Alokasi beban pengeluaran berdasarkan kategori</p>
                                        </div>
                                    </div>
                                    <Link href={route('expenses.index')} className="text-xs text-primary font-bold hover:underline">
                                        + Catat Pengeluaran
                                    </Link>
                                </div>

                                {expenseCategories && expenseCategories.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                        <div className="h-48 w-full relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={expenseCategories}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={65}
                                                        paddingAngle={3}
                                                        dataKey="amount"
                                                    >
                                                        {expenseCategories.map((entry, index) => (
                                                            <Cell key={`exp-cell-${index}`} fill={EXPENSE_PALETTE[index % EXPENSE_PALETTE.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatRupiah(value)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total Beban</span>
                                                <span className="text-xs font-bold text-red-600 font-mono">
                                                    {formatShortRupiah(stats.expenses)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {expenseCategories.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-surface-container-low border border-outline-variant/60">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <span 
                                                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                            style={{ backgroundColor: EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length] }}
                                                        ></span>
                                                        <span className="font-semibold text-on-surface truncate">{item.name}</span>
                                                    </div>
                                                    <div className="text-right shrink-0 font-mono font-bold text-on-surface">
                                                        {formatRupiah(item.amount)} <span className="text-[10px] text-on-surface-variant font-normal">({item.percentage}%)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-on-surface-variant text-xs italic">
                                        <span className="material-symbols-outlined text-3xl mb-1 opacity-40">receipt_long</span>
                                        Belum ada catatan pengeluaran pada periode ini.
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                                <span>Total Beban Pengeluaran:</span>
                                <strong className="font-mono text-red-600 font-bold">{formatRupiah(stats.expenses)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Analisis Profitabilitas Menu (Menu Engineering) */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
                    <div className="p-5 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-amber-600">restaurant_menu</span>
                            <div>
                                <h3 className="font-headline-sm font-bold text-on-surface">
                                    Analisis Profitabilitas Menu & Kontribusi Laba (Menu Engineering)
                                </h3>
                                <p className="text-xs text-on-surface-variant">
                                    Menganalisis margin riil per porsi dan menu mana yang paling banyak menyumbang laba kotor.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-semibold">
                            Analisis Finansial
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap">No</th>
                                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Nama Menu</th>
                                    <th className="px-5 py-3.5 font-semibold text-center whitespace-nowrap">Kategori</th>
                                    <th className="px-5 py-3.5 font-semibold text-center whitespace-nowrap">Terjual</th>
                                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap">Harga Jual</th>
                                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap">Modal (HPP)</th>
                                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap">Margin / Unit</th>
                                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap">Total Laba</th>
                                    <th className="px-5 py-3.5 font-semibold text-center whitespace-nowrap min-w-[150px]">Status Analisis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {productProfitability?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-5 py-3.5 text-center font-bold text-on-surface-variant whitespace-nowrap">{idx + 1}</td>
                                        <td className="px-5 py-3.5 font-bold text-primary whitespace-nowrap">{item.product_name}</td>
                                        <td className="px-5 py-3.5 text-center text-xs text-on-surface-variant whitespace-nowrap">{item.category_name}</td>
                                        <td className="px-5 py-3.5 text-center font-bold text-on-surface whitespace-nowrap">{item.total_sold} unit</td>
                                        <td className="px-5 py-3.5 text-right text-on-surface whitespace-nowrap">{formatRupiah(item.avg_price)}</td>
                                        <td className="px-5 py-3.5 text-right text-amber-800 font-medium whitespace-nowrap">{formatRupiah(item.avg_cogs)}</td>
                                        <td className="px-5 py-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">
                                            {formatRupiah(item.margin_per_unit)} ({item.margin_percentage}%)
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                                            {formatRupiah(item.total_profit)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center justify-center text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                                                item.badge === 'Kontribusi Utama'
                                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                                    : item.badge === 'Perputaran Cepat'
                                                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                                        : item.badge === 'Margin Tinggi'
                                                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                            : 'bg-surface-container-highest text-on-surface-variant'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!productProfitability || productProfitability.length === 0) && (
                                    <tr>
                                        <td colSpan="9" className="px-5 py-8 text-center text-on-surface-variant italic">
                                            Belum ada data penjualan pada periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section: Transaksi Kasir (Default 10 Terakhir / Semua Transaksi) */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-base">history</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-sm font-bold text-on-surface">
                                        {showAllOrders || orderSearch ? 'Semua Transaksi Periode Ini' : '10 Transaksi Kasir Terakhir'}
                                    </h3>
                                    <p className="text-[11px] text-on-surface-variant">
                                        {recentOrders?.length || 0} total transaksi pada periode {stats.periodLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Controls: Live Search + Switcher 10 Terakhir vs Semua */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {recentOrders && recentOrders.length > 5 && (
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                                        <input
                                            type="text"
                                            value={orderSearch}
                                            onChange={(e) => setOrderSearch(e.target.value)}
                                            placeholder="Cari invoice / kasir..."
                                            className="pl-8 pr-7 py-1 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none w-44 sm:w-52"
                                        />
                                        {orderSearch && (
                                            <button 
                                                onClick={() => setOrderSearch('')} 
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs font-bold"
                                                title="Reset pencarian"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="inline-flex items-center bg-surface-container-highest p-1 rounded-xl text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAllOrders(false); setOrderSearch(''); }}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                            !showAllOrders && !orderSearch 
                                                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        10 Terakhir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAllOrders(true)}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                            showAllOrders || orderSearch 
                                                ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        Semua ({recentOrders?.length || 0})
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`overflow-x-auto ${showAllOrders || orderSearch ? 'max-h-[520px]' : 'max-h-80'} overflow-y-auto`}>
                            <table className="w-full text-left font-body-sm text-on-surface">
                                <thead className="bg-surface-container-highest font-label-sm text-on-surface-variant sticky top-0 z-10 shadow-xs">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Invoice</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Waktu</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Kasir</th>
                                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Metode</th>
                                        <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Total</th>
                                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Struk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {displayedOrders?.map(order => (
                                        <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{order.invoice_number}</td>
                                            <td className="px-4 py-3 text-on-surface-variant text-xs whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-xs whitespace-nowrap">{order.user?.name || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase whitespace-nowrap ${
                                                    order.payment_method === 'qris' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {order.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{formatRupiah(order.total_amount)}</td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => window.open(route('orders.receipt', order.id), '_blank', 'width=420,height=650,menubar=no,toolbar=no,location=no,status=no')}
                                                    className="px-2.5 py-1 bg-surface-container-high hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer"
                                                    title="Cetak Ulang Struk"
                                                >
                                                    Struk
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!displayedOrders || displayedOrders.length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-on-surface-variant italic text-xs">
                                                {orderSearch ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-3 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <div>
                            {(recentOrders?.length || 0) > 10 && !orderSearch && (
                                !showAllOrders ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllOrders(true)}
                                        className="text-primary font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                                    >
                                        <span>Lihat semua {recentOrders.length} transaksi periode ini</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllOrders(false)}
                                        className="text-on-surface-variant hover:text-on-surface font-semibold flex items-center space-x-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        <span>Ciutkan ke 10 transaksi terakhir</span>
                                    </button>
                                )
                            )}
                        </div>
                        <span className="text-on-surface-variant">
                            Menampilkan {displayedOrders.length} dari {recentOrders?.length || 0} transaksi pada periode <strong>{stats.periodLabel}</strong>
                        </span>
                    </div>
                </div>

            </div>

            {/* QRIS Subscription Payment Modal */}
            <SubscriptionPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                subscription={pendingSubscription}
                tenant={activeTenant}
                user={auth?.user}
                adminContact={adminContact}
            />

            {/* Upgrade Modal for Excel Export */}
            {showExcelUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-scale-in">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setShowExcelUpgradeModal(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>

                        {/* Header Icon & Badges */}
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                                <span className="material-symbols-outlined text-2xl">table_view</span>
                            </div>
                            <div>
                                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold tracking-wide uppercase">
                                    <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                    <span>Fitur Eksklusif Pro & Enterprise</span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-on-surface mt-1">
                                    Ekspor Laporan Excel (.xlsx)
                                </h3>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-on-surface-variant mb-5 leading-relaxed">
                            Unduh seluruh pembukuan keuangan toko Anda dalam format spreadsheet Microsoft Excel (.xlsx) interaktif dengan <strong>4 lembar kerja (Multi-Sheet)</strong> siap olah data akuntansi:
                        </p>

                        {/* Feature Highlights Grid */}
                        <div className="space-y-2.5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 mb-5 text-xs text-on-surface">
                            <div className="flex items-start space-x-2.5">
                                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                                <div>
                                    <strong className="text-on-surface">Sheet 1: Ringkasan Finansial:</strong> KPI Omzet, HPP, Laba Kotor, Biaya Beban, dan Laba Bersih lengkap rumus persentase dan distribusi pembayaran tunai vs QRIS.
                                </div>
                            </div>
                            <div className="flex items-start space-x-2.5">
                                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                                <div>
                                    <strong className="text-on-surface">Sheet 2: Riwayat Seluruh Transaksi:</strong> Rincian nomor invoice kasir, tanggal/jam, kasir bertugas, subtotal, pajak, dan kembalian dengan formula <code className="bg-surface-container-highest px-1 py-0.5 rounded font-mono text-[11px]">=SUM()</code> otomatis.
                                </div>
                            </div>
                            <div className="flex items-start space-x-2.5">
                                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                                <div>
                                    <strong className="text-on-surface">Sheet 3: Analisis Performa Produk:</strong> Evaluasi margin keuntungan tiap menu/produk, omzet per produk, harga modal, dan klasifikasi kontribusi laba.
                                </div>
                            </div>
                            <div className="flex items-start space-x-2.5">
                                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                                <div>
                                    <strong className="text-on-surface">Sheet 4: Rincian Beban Operasional:</strong> Buku log pengeluaran toko, tanggal pencatatan, kategori biaya operasional, dan keterangan detail.
                                </div>
                            </div>
                        </div>

                        {/* Current Plan Indicator */}
                        <div className="flex items-center justify-between text-xs p-3 bg-surface-container rounded-xl mb-6 border border-outline-variant">
                            <span className="text-on-surface-variant">Paket Anda Saat Ini:</span>
                            <span className="font-bold text-on-surface uppercase bg-surface-container-highest px-2 py-0.5 rounded">
                                {activeTenant?.plan?.name || 'Free Trial / Starter'}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={route('subscription.plans')}
                                className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl text-center shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">upgrade</span>
                                <span>Upgrade ke Paket Pro Sekarang</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowExcelUpgradeModal(false)}
                                className="py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs sm:text-sm rounded-xl text-center transition cursor-pointer"
                            >
                                Nanti Saja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
