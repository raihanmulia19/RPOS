import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

export default function SuperAdminTenants({ 
    tenants = [], 
    stats = {}, 
    plans = [], 
    pendingCount = 0 
}) {
    const { auth, flash } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // State for viewing Plan QRIS Lightbox
    const [viewingPlanQris, setViewingPlanQris] = useState(null);

    const filteredTenants = useMemo(() => {
        return tenants.filter(tenant => {
            const matchesSearch = 
                tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tenant.users?.some(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (filterStatus === 'all') return matchesSearch;
            if (filterStatus === 'active') return matchesSearch && tenant.is_active && tenant.subscription_status === 'active';
            if (filterStatus === 'trial') return matchesSearch && tenant.is_active && tenant.subscription_status === 'trial';
            if (filterStatus === 'rejected') return matchesSearch && tenant.subscription_status === 'rejected';
            if (filterStatus === 'suspended') return matchesSearch && !tenant.is_active;
            return matchesSearch;
        });
    }, [tenants, searchTerm, filterStatus]);

    const handleToggleStatus = (tenant) => {
        if (confirm(`Apakah Anda yakin ingin ${tenant.is_active ? 'menonaktifkan (suspend)' : 'mengaktifkan'} toko "${tenant.name}"?`)) {
            router.post(route('superadmin.tenants.toggle-status', tenant.id));
        }
    };

    const handleExtend = (tenant, days = 30) => {
        if (confirm(`Perpanjang masa aktif toko "${tenant.name}" selama ${days} hari?`)) {
            router.post(route('superadmin.tenants.extend', tenant.id), { days });
        }
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Manajemen Toko - Super Admin" />

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
                            className="font-label-md text-on-surface-variant hover:text-primary px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 hover:bg-surface-container-low"
                        >
                            <span className="material-symbols-outlined text-base">dashboard</span>
                            <span>Dashboard</span>
                        </Link>

                        <Link 
                            href={route('superadmin.tenants.index')}
                            className="font-label-md text-primary font-bold bg-surface-container-high px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-xs border border-outline-variant"
                        >
                            <span className="material-symbols-outlined text-base text-secondary">storefront</span>
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
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                    Dashboard
                </Link>
                <Link 
                    href={route('superadmin.tenants.index')}
                    className="font-label-md text-primary font-bold bg-surface-container-high px-3 py-1.5 rounded-lg whitespace-nowrap"
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
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                    Live Monitoring
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

                {/* Page Title & Operational Badges */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                            <span>SaaS Platform</span>
                            <span>/</span>
                            <span>Ekosistem Toko</span>
                        </div>
                        <h2 className="font-headline-md font-bold text-on-surface flex items-center">
                            <span className="material-symbols-outlined text-secondary mr-2">storefront</span>
                            Manajemen Toko & Merchant
                        </h2>
                        <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
                            Kelola operasional merchant, unggah barcode QRIS tagihan khusus toko, dan pantau status aktif toko.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-surface-container-lowest border border-outline-variant px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
                            <span className="text-xs text-on-surface-variant">Total Toko:</span>
                            <span className="font-bold text-primary text-sm">{stats.totalTenants || tenants.length}</span>
                        </div>
                        <div className="bg-surface-container-lowest border border-outline-variant px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
                            <span className="text-xs text-on-surface-variant">Langganan Aktif:</span>
                            <span className="font-bold text-secondary text-sm">{stats.activePaidTenants || 0}</span>
                        </div>
                        <div className="bg-surface-container-lowest border border-outline-variant px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
                            <span className="text-xs text-on-surface-variant">Masa Trial:</span>
                            <span className="font-bold text-primary text-sm">{stats.trialTenants || 0}</span>
                        </div>
                        <div className="bg-surface-container-lowest border border-outline-variant px-3.5 py-1.5 rounded-xl flex items-center space-x-2">
                            <span className="text-xs text-on-surface-variant">Suspended:</span>
                            <span className="font-bold text-error text-sm">{stats.suspendedTenants || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Banner alert if there are pending verifications waiting in Billing */}
                {pendingCount > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
                            <p className="text-xs text-amber-900 font-medium">
                                Terdapat <strong>{pendingCount} bukti pembayaran langganan</strong> yang menunggu verifikasi di halaman Billing.
                            </p>
                        </div>
                        <Link
                            href={route('superadmin.billing.index')}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
                        >
                            Buka Halaman Billing &rarr;
                        </Link>
                    </div>
                )}

                {/* Section: Tabel Manajemen Toko / Tenant */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
                    
                    {/* Filter & Search Bar */}
                    <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low">
                        <div>
                            <h3 className="font-headline-md font-bold text-on-surface flex items-center">
                                <span className="material-symbols-outlined text-secondary mr-2">storefront</span>
                                Tabel Merchant & Barcode QRIS Tagihan
                            </h3>
                            <p className="font-body-md text-on-surface-variant text-sm">
                                Kelola merchant, tetapkan QRIS statis tagihan spesifik per toko, dan perpanjang masa aktif.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Cari toko / email owner..."
                                    className="pl-10 pr-4 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl font-body-md w-64 outline-none hover:bg-surface-container-high/50 transition-colors"
                                />
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                                    search
                                </span>
                            </div>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="text-sm py-2.5 pl-4 pr-10 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl font-label-md outline-none cursor-pointer hover:bg-surface-container-high/50 transition-colors appearance-none"
                                style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23827472\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                                    backgroundPosition: 'right 0.75rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1rem'
                                }}
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Langganan Aktif</option>
                                <option value="trial">Masa Trial</option>
                                <option value="rejected">Ditolak</option>
                                <option value="suspended">Ditangguhkan (Suspend)</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Nama Toko & Slug</th>
                                    <th className="px-5 py-4 font-semibold">Paket Langganan</th>
                                    <th className="px-5 py-4 font-semibold text-center">
                                        <div>QRIS Paket SaaS</div>
                                        <div className="text-[10px] font-normal text-on-surface-variant">(Otomatis Ikuti Paket)</div>
                                    </th>
                                    <th className="px-5 py-4 font-semibold text-center">Produk</th>
                                    <th className="px-5 py-4 font-semibold text-center">Transaksi</th>
                                    <th className="px-5 py-4 font-semibold">Status & Masa Berlaku</th>
                                    <th className="px-5 py-4 font-semibold text-right">Aksi Super Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">storefront</span>
                                            Tidak ada toko yang cocok dengan kriteria pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map((tenant) => {
                                        const owner = tenant.users?.[0];
                                        const planQrisUrl = tenant.plan?.qris_image_url || tenant.subscription_qris_image_url;
                                        return (
                                            <tr key={tenant.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg shrink-0">
                                                            {tenant.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-primary">{tenant.name}</div>
                                                            <div className="font-mono text-xs text-on-surface-variant">slug: {tenant.slug}</div>
                                                            <div className="text-xs text-on-surface-variant mt-0.5">{owner?.name || '-'} ({owner?.email || '-'})</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-on-primary">
                                                        {tenant.plan?.name || 'Trial (Default)'}
                                                    </span>
                                                    <div className="text-[11px] text-on-surface-variant mt-1">
                                                        {tenant.plan ? (
                                                            `${(!tenant.plan.max_products || tenant.plan.max_products === -1) ? 'tidak ada batas produk' : tenant.plan.max_products + ' prod'} • ${(!tenant.plan.max_staff || tenant.plan.max_staff === -1) ? 'tidak ada batas staf' : tenant.plan.max_staff + ' staf'}`
                                                        ) : (
                                                            '20 prod • 1 staf'
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {planQrisUrl ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingPlanQris({
                                                                planName: tenant.plan?.name || 'Paket Toko',
                                                                tenantName: tenant.name,
                                                                qrisUrl: planQrisUrl,
                                                            })}
                                                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-800 border border-green-300 hover:bg-green-100 transition-all active:scale-95 shadow-xs"
                                                            title={`Lihat Barcode QRIS Paket ${tenant.plan?.name || ''}`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm text-green-700">qr_code_2</span>
                                                            <span>QRIS {tenant.plan?.name || 'Paket'}</span>
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={route('superadmin.billing.index')}
                                                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all"
                                                            title="Barcode QRIS paket ini belum diatur. Klik untuk atur di menu Billing"
                                                        >
                                                            <span className="material-symbols-outlined text-xs text-amber-700">add_photo_alternate</span>
                                                            <span>Atur di Paket</span>
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center font-bold text-primary">
                                                    {tenant.products_count}
                                                </td>
                                                <td className="px-5 py-4 text-center font-bold text-secondary">
                                                    {tenant.orders_count}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div>
                                                            {!tenant.is_active ? (
                                                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-error-container text-on-error-container rounded-full text-[11px] font-bold uppercase tracking-wide">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                                                    <span>Suspended</span>
                                                                </span>
                                                            ) : tenant.subscription_status === 'active' ? (
                                                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-full text-[11px] font-bold uppercase tracking-wide">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                                    <span>Active</span>
                                                                </span>
                                                            ) : tenant.subscription_status === 'rejected' ? (
                                                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-error text-on-error rounded-full text-[11px] font-bold uppercase tracking-wide shadow-xs">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                                    <span>Ditolak</span>
                                                                </span>
                                                            ) : tenant.subscription_status === 'pending' ? (
                                                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold uppercase tracking-wide border border-amber-300">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                                                    <span>Pending</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-surface-container-highest text-on-surface-variant rounded-full text-[11px] font-bold uppercase tracking-wide border border-outline-variant">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                                    <span>Trial</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-on-surface-variant font-medium">
                                                            {tenant.subscription_status === 'trial' ? (
                                                                tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'
                                                            ) : (
                                                                tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleExtend(tenant, 30)}
                                                            title="Tambah masa aktif 30 hari"
                                                            className="flex items-center space-x-1 px-3 py-1.5 bg-secondary text-on-secondary font-label-md text-xs rounded-xl hover:bg-secondary/90 transition-all active:scale-95 shadow-sm"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">more_time</span>
                                                            <span>+30 Hari</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleToggleStatus(tenant)}
                                                            title={tenant.is_active ? 'Tangguhkan Toko' : 'Aktifkan Toko'}
                                                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-label-md text-xs transition-all active:scale-95 shadow-sm ${
                                                                tenant.is_active
                                                                    ? 'bg-error text-on-error hover:bg-on-error-container hover:text-error-container'
                                                                    : 'bg-primary text-on-primary hover:bg-primary/90'
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                {tenant.is_active ? 'pause_circle' : 'play_circle'}
                                                            </span>
                                                            <span>{tenant.is_active ? 'Suspend' : 'Aktifkan'}</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal Lightbox Preview Barcode QRIS Paket */}
            {viewingPlanQris && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setViewingPlanQris(null)}
                >
                    <div 
                        className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant max-w-sm w-full overflow-hidden p-6 space-y-4 animate-scale-up text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="text-left">
                                <h3 className="font-headline-sm font-bold text-primary text-base">
                                    Barcode QRIS Paket {viewingPlanQris.planName}
                                </h3>
                                <p className="font-body-sm text-xs text-on-surface-variant">
                                    Toko: <strong className="text-on-surface">{viewingPlanQris.tenantName}</strong>
                                </p>
                            </div>
                            <button 
                                onClick={() => setViewingPlanQris(null)}
                                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Barcode Frame */}
                        <div className="bg-white p-3 rounded-2xl border-2 border-secondary shadow-inner mx-auto w-64 h-64 flex items-center justify-center">
                            <img 
                                src={viewingPlanQris.qrisUrl} 
                                alt={`QRIS ${viewingPlanQris.planName}`} 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="bg-surface-container-low p-3 rounded-xl text-xs text-on-surface-variant text-left space-y-1">
                            <div className="font-bold text-secondary flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                <span>Otomatis Mengikuti Paket {viewingPlanQris.planName}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                                Toko ini otomatis menggunakan barcode QRIS dari paket <strong>{viewingPlanQris.planName}</strong>. Untuk mengubah barcode seluruh toko pada paket ini, kelola melalui menu <strong>Billing & Langganan</strong>.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Link
                                href={route('superadmin.billing.index')}
                                className="flex-1 py-2 px-3 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:bg-secondary/90 transition text-center"
                            >
                                Buka Billing Paket
                            </Link>
                            <button
                                type="button"
                                onClick={() => setViewingPlanQris(null)}
                                className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                user={auth?.user}
            />

        </div>
    );
}
