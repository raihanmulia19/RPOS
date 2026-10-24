import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SubscriptionWarningBanner from '@/Components/SubscriptionWarningBanner';
import MerchantNavbar from '@/Components/MerchantNavbar';
import SubscriptionPaymentModal from '@/Components/SubscriptionPaymentModal';

export default function Dashboard({ 
    auth, 
    stats = {}, 
    paymentBreakdown = { cash: { total: 0, count: 0, percentage: 0 }, qris: { total: 0, count: 0, percentage: 0 } }, 
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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(() => {
        return Boolean(flash?.show_qris_modal);
    });
    const [showExcelUpgradeModal, setShowExcelUpgradeModal] = useState(false);
    const [isApprovedDismissed, setIsApprovedDismissed] = useState(false);
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
    };

    const handleFilterChange = (type, value) => {
        router.get(route('dashboard'), { filter_type: type, filter_value: value }, { preserveState: true });
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
                            onClick={() => setIsApprovedDismissed(true)}
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

                {/* Section: Rekapitulasi Arus Kas Kasir (Clean Unified Cards) */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
                            <h3 className="font-headline-sm font-bold text-on-surface">
                                Rekapitulasi Arus Kas (Cash Flow)
                            </h3>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                            Total Penerimaan: <strong className="text-on-surface font-semibold">{formatRupiah(stats.grandTotal)}</strong> (termasuk PPN {formatRupiah(stats.tax)})
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Uang Tunai di Laci Kasir */}
                        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-lg text-primary">point_of_sale</span>
                                    <span className="font-label-md font-bold text-on-surface">Uang Kas Fisik di Laci</span>
                                </div>
                                <div className="text-2xl font-bold text-on-surface pt-1">
                                    {formatRupiah(paymentBreakdown.cash?.total)}
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                    {paymentBreakdown.cash?.count || 0} Transaksi Tunai ({paymentBreakdown.cash?.percentage || 0}% porsi uang masuk)
                                </p>
                            </div>
                            <span className="text-[11px] font-medium bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-md">
                                Kas Tunai
                            </span>
                        </div>

                        {/* Pembayaran Digital QRIS */}
                        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-lg text-primary">qr_code_scanner</span>
                                    <span className="font-label-md font-bold text-on-surface">Pembayaran Digital QRIS</span>
                                </div>
                                <div className="text-2xl font-bold text-on-surface pt-1">
                                    {formatRupiah(paymentBreakdown.qris?.total)}
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                    {paymentBreakdown.qris?.count || 0} Transaksi Digital ({paymentBreakdown.qris?.percentage || 0}% porsi uang masuk)
                                </p>
                            </div>
                            <span className="text-[11px] font-medium bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-md">
                                Saldo Bank
                            </span>
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

                {/* Section: Pengeluaran Toko & 10 Transaksi Terakhir (2 Kolom) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Kolom Kiri: Rincian Pengeluaran Toko (OPEX) */}
                    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant space-y-4">
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="flex items-center space-x-2">
                                <span className="material-symbols-outlined text-error">receipt</span>
                                <h3 className="font-headline-sm font-bold text-on-surface">Beban Pengeluaran</h3>
                            </div>
                            <Link href={route('expenses.index')} className="text-xs text-primary font-bold hover:underline">
                                + Kelola
                            </Link>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {expensesList?.map((exp) => (
                                <div key={exp.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-sm text-on-surface">{exp.category}</div>
                                        <div className="text-xs text-on-surface-variant">{exp.description || 'Tanpa catatan'} &bull; {exp.expense_date}</div>
                                    </div>
                                    <div className="font-bold text-sm text-error">
                                        -{formatRupiah(exp.amount)}
                                    </div>
                                </div>
                            ))}
                            {(!expensesList || expensesList.length === 0) && (
                                <div className="text-center py-6 text-on-surface-variant text-xs italic">
                                    Tidak ada pengeluaran di periode ini.
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-outline-variant flex justify-between items-center font-bold text-sm">
                            <span>Total Pengeluaran:</span>
                            <span className="text-error">{formatRupiah(stats.expenses)}</span>
                        </div>
                    </div>

                    {/* Kolom Kanan: 10 Transaksi Terakhir (2 Kolom Lebar) */}
                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    <h3 className="font-headline-sm font-bold text-on-surface">10 Transaksi Kasir Terakhir</h3>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="w-full text-left font-body-sm text-on-surface">
                                    <thead className="bg-surface-container-highest font-label-sm text-on-surface-variant sticky top-0">
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
                                        {recentOrders?.map(order => (
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
                                                        className="px-2.5 py-1 bg-surface-container-high hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition active:scale-95"
                                                        title="Cetak Ulang Struk"
                                                    >
                                                        Struk
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!recentOrders || recentOrders.length === 0) && (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-8 text-center text-on-surface-variant italic text-xs">
                                                    Belum ada transaksi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low border-t border-outline-variant text-right">
                            <span className="text-xs text-on-surface-variant">
                                Menampilkan transaksi pada periode <strong>{stats.periodLabel}</strong>
                            </span>
                        </div>
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
