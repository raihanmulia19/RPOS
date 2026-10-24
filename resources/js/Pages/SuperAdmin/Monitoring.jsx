import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

export default function Monitoring({
    metrics = {},
    onlineTenants = [],
    onlineUsers = [],
    trafficTrend = [],
    topPages = [],
    deviceStats = {},
    recentLogs = [],
    pendingCount = 0,
    backups = [],
    driveConfig = {},
}) {
    const { auth, flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('online'); // 'online' | 'traffic' | 'logs' | 'backup'
    const [logSearch, setLogSearch] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Backup & Google Drive States
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [uploadToDriveOnCreate, setUploadToDriveOnCreate] = useState(Boolean(driveConfig.is_configured));
    const [isTestingDrive, setIsTestingDrive] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [driveFolderId, setDriveFolderId] = useState(driveConfig.folder_id || '');
    const [serviceAccountFile, setServiceAccountFile] = useState(null);
    const [serviceAccountJson, setServiceAccountJson] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const handleCreateBackup = () => {
        setIsCreatingBackup(true);
        router.post(route('superadmin.monitoring.backup.create'), {
            upload_drive: uploadToDriveOnCreate,
        }, {
            preserveScroll: true,
            onFinish: () => setIsCreatingBackup(false),
        });
    };

    const handleUploadToDrive = (filename) => {
        router.post(route('superadmin.monitoring.backup.upload-drive', filename), {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteBackup = (filename) => {
        if (confirm(`Hapus file arsip cadangan "${filename}" dari server?`)) {
            router.delete(route('superadmin.monitoring.backup.delete', filename), {
                preserveScroll: true,
            });
        }
    };

    const handleTestDrive = () => {
        setIsTestingDrive(true);
        router.post(route('superadmin.monitoring.backup.test-drive'), {}, {
            preserveScroll: true,
            onFinish: () => setIsTestingDrive(false),
        });
    };

    const handleSaveDriveConfig = (e) => {
        e.preventDefault();
        setIsSavingConfig(true);

        const formData = new FormData();
        if (driveFolderId) formData.append('folder_id', driveFolderId);
        if (serviceAccountFile) formData.append('service_account_file', serviceAccountFile);
        if (serviceAccountJson) formData.append('service_account_json', serviceAccountJson);

        router.post(route('superadmin.monitoring.backup.save-settings'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsConfigModalOpen(false);
                setIsSavingConfig(false);
                setServiceAccountFile(null);
                setServiceAccountJson('');
            },
            onError: () => {
                setIsSavingConfig(false);
            },
            onFinish: () => {
                setIsSavingConfig(false);
            }
        });
    };

    const handlePruneLogs = () => {
        if (confirm('Bersihkan log web yang berusia lebih dari 14 hari dari database? Data ringkasan analitik tetap aman.')) {
            router.post(route('superadmin.monitoring.prune-logs'), { days: 14 }, {
                preserveScroll: true,
            });
        }
    };

    // Auto-refresh data monitoring secara otomatis setiap 15 detik di latar belakang
    useEffect(() => {
        const timer = setInterval(() => {
            // Hindari reload jika tab browser sedang tidak aktif/terlihat
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                return;
            }

            router.reload({
                only: [
                    'metrics',
                    'onlineTenants',
                    'onlineUsers',
                    'trafficTrend',
                    'topPages',
                    'deviceStats',
                    'recentLogs',
                ],
                preserveScroll: true,
                preserveState: true,
            });
        }, 15000); // 15 detik

        return () => clearInterval(timer);
    }, []);

    // Filter recent logs by search term
    const filteredLogs = useMemo(() => {
        if (!logSearch.trim()) return recentLogs;
        const q = logSearch.toLowerCase();
        return recentLogs.filter(log => 
            (log.path && log.path.toLowerCase().includes(q)) ||
            (log.ip_address && log.ip_address.toLowerCase().includes(q)) ||
            (log.tenant_name && log.tenant_name.toLowerCase().includes(q)) ||
            (log.user_name && log.user_name.toLowerCase().includes(q)) ||
            (log.method && log.method.toLowerCase().includes(q)) ||
            String(log.status_code).includes(q)
        );
    }, [recentLogs, logSearch]);

    // Max hits for chart scaling
    const maxHits = useMemo(() => {
        if (!trafficTrend.length) return 100;
        const max = Math.max(...trafficTrend.map(t => t.hits));
        return max > 0 ? max : 100;
    }, [trafficTrend]);

    // Device breakdown totals
    const totalDeviceHits = useMemo(() => {
        return Object.values(deviceStats).reduce((a, b) => a + Number(b), 0) || 1;
    }, [deviceStats]);

    const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num || 0);

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Monitoring Real-Time Toko & Trafik Web - Super Admin RPOS" />

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
                            className="font-label-md text-primary font-bold bg-surface-container-high px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-xs border border-outline-variant"
                        >
                            <span className="material-symbols-outlined text-base text-secondary">monitoring</span>
                            <span>Live Monitoring</span>
                            {metrics.onlineTenantsCount > 0 && (
                                <span className="ml-1 w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                            )}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-4">

                    <div className="hidden sm:flex flex-col text-right">
                        <span className="font-label-md font-bold text-on-surface">{auth.user.name}</span>
                        <span className="text-xs text-on-surface-variant">Platform Administrator</span>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center space-x-1 px-3.5 sm:px-4 py-2 bg-error text-on-error rounded-full font-label-md hover:bg-on-error-container hover:text-error-container transition-all active:scale-95 shadow-sm text-xs sm:text-sm font-semibold"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span className="hidden xs:inline">Keluar</span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="md:hidden bg-surface-container-low border-b border-outline-variant px-4 py-2 flex items-center space-x-2 overflow-x-auto">
                <Link 
                    href={route('superadmin.dashboard')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap text-xs"
                >
                    Dashboard
                </Link>
                <Link 
                    href={route('superadmin.tenants.index')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap text-xs"
                >
                    Manajemen Toko
                </Link>
                <Link 
                    href={route('superadmin.billing.index')}
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap text-xs flex items-center space-x-1"
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
                    className="font-label-md text-primary font-bold bg-surface-container-high px-3 py-1.5 rounded-lg whitespace-nowrap text-xs flex items-center space-x-1"
                >
                    <span>Live Monitoring</span>
                    {metrics.onlineTenantsCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    )}
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Flash Success Notification */}
                {flash?.success && (
                    <div className="bg-surface-container-low text-secondary border border-secondary/30 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs">
                        <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Page Title & Live Status Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                    <div>
                        <h2 className="font-headline-lg font-bold text-primary text-xl sm:text-2xl">
                            Monitoring Toko Online & Trafik Pengunjung Web
                        </h2>
                        <p className="text-xs sm:text-sm text-on-surface-variant">
                            Pantau secara langsung toko mana saja yang sedang mengoperasikan kasir dan jumlah akses website RPOS.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs text-on-surface-variant">Jendela Aktif: <strong>15 Menit</strong></span>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Stat 1: Toko Online Sekarang */}
                    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-secondary/50 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-on-surface-variant">Toko Online Sekarang</span>
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">storefront</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl sm:text-3xl font-bold text-secondary">
                                    {formatNumber(metrics.onlineTenantsCount)}
                                </span>
                                <span className="text-xs font-semibold text-on-surface-variant">Toko Aktif</span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant block mt-1">
                                {metrics.onlineUsersCount} user (kasir/owner) terhubung
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Stat 2: Toko Aktif Hari Ini (DAU) */}
                    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-secondary/50 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-on-surface-variant">Toko Aktif Hari Ini</span>
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">insights</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl sm:text-3xl font-bold text-primary">
                                    {formatNumber(metrics.dailyActiveTenantsCount)}
                                </span>
                                <span className="text-xs font-semibold text-on-surface-variant">
                                    / {formatNumber(metrics.totalTenantsCount)} Toko
                                </span>
                            </div>
                            <span className="text-[11px] text-secondary font-bold block mt-1">
                                {metrics.totalTenantsCount > 0 
                                    ? `${Math.round((metrics.dailyActiveTenantsCount / metrics.totalTenantsCount) * 100)}% Rasio Keaktifan Toko`
                                    : '0% Rasio'}
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Stat 3: Total Kunjungan Web Hari Ini */}
                    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-on-surface-variant">Hits Web Hari Ini</span>
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">language</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl sm:text-3xl font-bold text-primary">
                                    {formatNumber(metrics.todayPageviews)}
                                </span>
                                <span className="text-xs font-semibold text-on-surface-variant">Kunjungan</span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant block mt-1">
                                Kemarin: {formatNumber(metrics.yesterdayPageviews)} hits
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Stat 4: Pengunjung Unik Hari Ini */}
                    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-secondary/50 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-on-surface-variant">Pengunjung Unik (IP)</span>
                            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">group</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl sm:text-3xl font-bold text-primary">
                                    {formatNumber(metrics.todayUniqueVisitors)}
                                </span>
                                <span className="text-xs font-semibold text-on-surface-variant">Pengunjung</span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant block mt-1">
                                Total Sepanjang Waktu: {formatNumber(metrics.totalAllTimeHits)}
                            </span>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
                    </div>
                </div>

                {/* Tab Navigation Pill Bar */}
                <div className="flex items-center space-x-2 border-b border-outline-variant pb-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('online')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 ${
                            activeTab === 'online'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span>
                        <span>Toko & Kasir Sedang Online ({metrics.onlineTenantsCount})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('traffic')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 ${
                            activeTab === 'traffic'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        <span>Grafik Trafik & Halaman Populer</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 ${
                            activeTab === 'logs'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">history</span>
                        <span>Log Kunjungan Web Real-Time ({recentLogs.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 ${
                            activeTab === 'backup'
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">cloud_sync</span>
                        <span>Backup Database & Drive ({backups.length})</span>
                    </button>
                </div>

                {/* TAB 1: TOKO ONLINE SEKARANG */}
                {activeTab === 'online' && (
                    <div className="space-y-6">
                        {/* Toko Sedang Online Grid */}
                        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
                                <div>
                                    <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg flex items-center space-x-2">
                                        <span>Toko yang Sedang Buka / Login</span>
                                        <span className="bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-0.5 rounded-full border border-secondary/25">
                                            {onlineTenants.length} Toko
                                        </span>
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        Toko dengan aktivitas kasir atau pemilik dalam 15 menit terakhir.
                                    </p>
                                </div>
                            </div>

                            {onlineTenants.length === 0 ? (
                                <div className="text-center py-12 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-4xl text-outline mb-2 block">
                                        schedule
                                    </span>
                                    <p className="font-bold text-sm">Saat ini belum ada toko yang sedang login.</p>
                                    <p className="text-xs text-on-surface-variant/80 mt-1">
                                        Ketika kasir atau owner membuka sistem, mereka akan langsung muncul di sini secara real-time.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    {onlineTenants.map((t) => (
                                        <div 
                                            key={t.tenant_id} 
                                            className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/70 hover:border-secondary/40 transition shadow-2xs flex flex-col justify-between space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {t.logo ? (
                                                        <img src={t.logo} alt={t.name} className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-outline-variant shrink-0" />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-base shrink-0 border border-secondary/20">
                                                            {t.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-primary text-sm line-clamp-1">{t.name}</h4>
                                                        <span className="text-[11px] font-semibold text-secondary block">
                                                            Paket {t.plan_name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="inline-flex items-center space-x-1 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                                                    <span>Online</span>
                                                </span>
                                            </div>

                                            {/* Active Users in this tenant */}
                                            <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/50 space-y-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                                                    Pengguna Aktif:
                                                </span>
                                                {t.active_users.map((u, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-on-surface flex items-center space-x-1.5">
                                                            <span className="material-symbols-outlined text-sm text-secondary">
                                                                {u.role === 'Owner' ? 'badge' : 'person'}
                                                            </span>
                                                            <span>{u.name}</span>
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                                            u.role === 'Owner' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-[11px] text-on-surface-variant flex items-center justify-between pt-1 border-t border-outline-variant/40">
                                                <span>Aktivitas terakhir:</span>
                                                <span className="font-bold text-on-surface">{t.latest_activity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detail Daftar User Online */}
                        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs">
                            <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg mb-1">
                                Rincian Sesi Pengguna yang Sedang Login ({onlineUsers.length} Sesi)
                            </h3>
                            <p className="text-xs text-on-surface-variant mb-4">
                                Rincian perangkat dan alamat IP kasir / owner yang sedang aktif.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Pengguna</th>
                                            <th className="py-2.5 px-3">Toko / Tenant</th>
                                            <th className="py-2.5 px-3">Role</th>
                                            <th className="py-2.5 px-3">Perangkat</th>
                                            <th className="py-2.5 px-3">IP Address</th>
                                            <th className="py-2.5 px-3 text-right">Terakhir Aktif</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/50">
                                        {onlineUsers.map((u, idx) => (
                                            <tr key={idx} className="hover:bg-surface-container-low transition">
                                                <td className="py-3 px-3">
                                                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        u.status === 'active' 
                                                            ? 'bg-secondary/10 text-secondary border-secondary/25' 
                                                            : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-secondary animate-pulse' : 'bg-outline'}`}></span>
                                                        <span>{u.status === 'active' ? 'Aktif' : 'Idle'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-on-surface">{u.user_name}</div>
                                                    <div className="text-[11px] text-on-surface-variant">{u.user_email}</div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="font-semibold text-primary">{u.tenant_name}</span>
                                                    <span className="block text-[10px] text-on-surface-variant">{u.plan_name}</span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                                        u.user_role === 'superadmin' ? 'bg-primary text-on-primary shadow-xs' :
                                                        u.user_role === 'owner' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container-high text-primary'
                                                    }`}>
                                                        {u.user_role === 'admin' ? 'Kasir' : u.user_role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="flex items-center space-x-1 text-on-surface font-medium">
                                                        <span className="material-symbols-outlined text-sm text-outline">
                                                            {u.device === 'Mobile' ? 'smartphone' : u.device === 'Tablet' ? 'tablet' : 'computer'}
                                                        </span>
                                                        <span>{u.device}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant">
                                                    {u.ip_address}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <span className="font-bold text-on-surface">{u.last_activity_time}</span>
                                                    <span className="block text-[10px] text-on-surface-variant">{u.last_activity_human}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: GRAFIK & ANALITIK TRAFIK */}
                {activeTab === 'traffic' && (
                    <div className="space-y-6">
                        {/* 7-Day Visual Traffic Chart */}
                        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
                                <div>
                                    <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg">
                                        Tren Kunjungan Website (7 Hari Terakhir)
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        Jumlah request pageviews (hits) dan pengunjung unik setiap hari.
                                    </p>
                                </div>
                            </div>

                            {/* Bar Chart Representation */}
                            <div className="pt-6 pb-2">
                                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-56">
                                    {trafficTrend.map((day, idx) => {
                                        const hitHeight = Math.max(10, Math.round((day.hits / maxHits) * 100));
                                        const isToday = idx === trafficTrend.length - 1;
                                        return (
                                            <div key={idx} className="flex flex-col items-center h-full justify-end group">
                                                {/* Bar */}
                                                <div className="w-full max-w-[48px] flex flex-col justify-end items-center relative h-full">
                                                    {/* Tooltip on hover */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-primary text-on-primary text-[10px] rounded-lg px-2 py-1 shadow-md whitespace-nowrap pointer-events-none">
                                                        <div>{day.hits} Hits</div>
                                                        <div className="text-primary-fixed-dim">{day.uniques} Pengunjung</div>
                                                    </div>

                                                    <div 
                                                        style={{ height: `${hitHeight}%` }}
                                                        className={`w-full rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-xs ${
                                                            isToday 
                                                                ? 'bg-secondary' 
                                                                : 'bg-primary/80'
                                                        }`}
                                                    ></div>
                                                </div>

                                                {/* Labels */}
                                                <div className="text-center mt-2">
                                                    <span className={`text-[11px] font-bold block ${isToday ? 'text-secondary' : 'text-on-surface'}`}>
                                                        {day.hits}
                                                    </span>
                                                    <span className="text-[10px] text-on-surface-variant font-medium block">
                                                        {day.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-center space-x-6 pt-4 border-t border-outline-variant/50 text-xs text-on-surface-variant">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-3 h-3 rounded-md bg-primary/80"></span>
                                        <span>Hari Sebelumnya</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-3 h-3 rounded-md bg-secondary"></span>
                                        <span className="font-bold">Hari Ini</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two Columns: Top Pages & Device Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Top Pages (2 cols) */}
                            <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs">
                                <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg mb-1">
                                    Halaman Paling Sering Diakses (7 Hari Terakhir)
                                </h3>
                                <p className="text-xs text-on-surface-variant mb-4">
                                    Daftar URL halaman web yang paling banyak dibuka pengunjung & kasir.
                                </p>

                                <div className="space-y-3">
                                    {topPages.length === 0 ? (
                                        <p className="text-xs text-on-surface-variant py-4 text-center">Belum ada data kunjungan halaman.</p>
                                    ) : (
                                        topPages.map((page, idx) => {
                                            const highestCount = topPages[0]?.count || 1;
                                            const pct = Math.round((page.count / highestCount) * 100);
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-mono font-bold text-primary truncate max-w-xs sm:max-w-md">
                                                            {page.path === '/' ? '/ (Landing Page)' : page.path}
                                                        </span>
                                                        <span className="text-on-surface-variant text-[11px]">
                                                            <strong>{formatNumber(page.count)}</strong> hits &bull; {formatNumber(page.unique_ips)} IP unik
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                                                        <div 
                                                            style={{ width: `${pct}%` }} 
                                                            className="h-full bg-secondary rounded-full transition-all"
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Device Breakdown (1 col) */}
                            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                                <div>
                                    <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg mb-1">
                                        Perangkat Pengunjung
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mb-4">
                                        Distribusi perangkat pengakses web RPOS.
                                    </p>

                                    <div className="space-y-3">
                                        {/* Desktop */}
                                        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">computer</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-xs text-on-surface block">Desktop PC / Laptop</span>
                                                    <span className="text-[11px] text-on-surface-variant">Komputer kasir & admin</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-primary">
                                                {formatNumber(deviceStats.desktop || 0)}
                                            </span>
                                        </div>

                                        {/* Mobile */}
                                        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">smartphone</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-xs text-on-surface block">Smartphone / HP</span>
                                                    <span className="text-[11px] text-on-surface-variant">Android / iPhone</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-secondary">
                                                {formatNumber(deviceStats.mobile || 0)}
                                            </span>
                                        </div>

                                        {/* Tablet */}
                                        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">tablet</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-xs text-on-surface block">Tablet POS</span>
                                                    <span className="text-[11px] text-on-surface-variant">iPad / Tab Android</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-primary">
                                                {formatNumber(deviceStats.tablet || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-outline-variant/50 text-[11px] text-on-surface-variant text-center">
                                    Total request tercatat: <strong>{formatNumber(totalDeviceHits)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: LOG AKSES WEB TERAKHIR */}
                {activeTab === 'logs' && (
                    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant">
                            <div>
                                <h3 className="font-headline-md font-bold text-primary text-base sm:text-lg">
                                    Log Kunjungan Web Real-Time (60 Request Terakhir)
                                </h3>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Catatan setiap akses halaman ke sistem beserta IP, status HTTP, dan toko terkait.
                                </p>
                            </div>

                            {/* Search filter input & Prune Button */}
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-56">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        placeholder="Cari IP, URL, Toko..."
                                        className="w-full bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2 pl-9 pr-3 text-xs text-on-surface outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handlePruneLogs}
                                    className="px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest text-secondary text-xs font-bold rounded-xl transition border border-outline-variant shrink-0 flex items-center space-x-1 active:scale-95 shadow-2xs cursor-pointer"
                                    title="Bersihkan data log yang berusia lebih dari 14 hari"
                                >
                                    <span className="material-symbols-outlined text-sm">cleaning_services</span>
                                    <span className="hidden md:inline">Bersihkan Log &gt; 14 Hari</span>
                                    <span className="md:hidden">Prune</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-outline-variant text-on-surface-variant text-[11px] uppercase tracking-wider">
                                        <th className="py-2.5 px-3">Waktu</th>
                                        <th className="py-2.5 px-3">Metode & Status</th>
                                        <th className="py-2.5 px-3">Halaman / URL</th>
                                        <th className="py-2.5 px-3">Toko / Akun</th>
                                        <th className="py-2.5 px-3">Perangkat</th>
                                        <th className="py-2.5 px-3 text-right">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/50 font-mono text-[11px]">
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-on-surface-variant font-sans">
                                                Tidak ada log yang cocok dengan pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const isSuccess = log.status_code >= 200 && log.status_code < 300;
                                            const isRedirect = log.status_code >= 300 && log.status_code < 400;
                                            const isClientError = log.status_code >= 400 && log.status_code < 500;
                                            const isServerError = log.status_code >= 500;

                                            return (
                                                <tr key={log.id} className="hover:bg-surface-container-low transition font-sans">
                                                    <td className="py-2.5 px-3 text-on-surface whitespace-nowrap">
                                                        <span className="font-mono text-xs font-bold">{log.time}</span>
                                                        <span className="block text-[10px] text-on-surface-variant">{log.time_ago}</span>
                                                    </td>

                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <div className="flex items-center space-x-1.5">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                                log.method === 'POST' ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'
                                                            }`}>
                                                                {log.method}
                                                            </span>

                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                                isSuccess ? 'bg-secondary/15 text-secondary border-secondary/25' :
                                                                isRedirect ? 'bg-surface-container-high text-on-surface-variant border-outline-variant' :
                                                                isClientError ? 'bg-amber-500/10 text-amber-800 border-amber-500/25' :
                                                                'bg-error-container text-on-error-container border-error/25'
                                                            }`}>
                                                                {log.status_code}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <span className="font-mono font-semibold text-primary truncate max-w-xs block">
                                                            {log.path}
                                                        </span>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        {log.tenant_name ? (
                                                            <div>
                                                                <span className="font-bold text-on-surface block text-xs">{log.tenant_name}</span>
                                                                <span className="text-[10px] text-on-surface-variant">
                                                                    {log.user_name} ({log.user_role === 'admin' ? 'Kasir' : log.user_role})
                                                                </span>
                                                            </div>
                                                        ) : log.user_name ? (
                                                            <span className="text-xs font-semibold text-on-surface">{log.user_name}</span>
                                                        ) : (
                                                            <span className="text-[11px] text-outline italic">Pengunjung Umum</span>
                                                        )}
                                                    </td>

                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center space-x-1 text-xs text-on-surface-variant capitalize">
                                                            <span className="material-symbols-outlined text-sm">
                                                                {log.device_type === 'mobile' ? 'smartphone' : log.device_type === 'tablet' ? 'tablet' : 'computer'}
                                                            </span>
                                                            <span>{log.device_type}</span>
                                                        </span>
                                                    </td>

                                                    <td className="py-2.5 px-3 text-right font-mono text-xs text-on-surface-variant whitespace-nowrap">
                                                        {log.ip_address}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: BACKUP DATABASE & GOOGLE DRIVE */}
                {activeTab === 'backup' && (
                    <div className="space-y-6">
                        {/* Status Cards & Quick Action */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            
                            {/* Card 1: Status Google Drive */}
                            <div className="lg:col-span-2 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                driveConfig.is_configured 
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                                                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                                            }`}>
                                                <span className="material-symbols-outlined text-2xl">
                                                    {driveConfig.is_configured ? 'cloud_done' : 'cloud_off'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-headline-sm font-bold text-primary leading-tight">
                                                    Integrasi Cloud Google Drive
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        driveConfig.has_oauth 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : driveConfig.has_service_account 
                                                                ? 'bg-amber-100 text-amber-800' 
                                                                : 'bg-surface-container-high text-on-surface-variant'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            driveConfig.has_oauth ? 'bg-emerald-600' : driveConfig.has_service_account ? 'bg-amber-600' : 'bg-outline'
                                                        }`} />
                                                        <span>
                                                            {driveConfig.has_oauth 
                                                                ? 'Akun Pribadi Terhubung (15 GB)' 
                                                                : driveConfig.has_service_account 
                                                                    ? 'Perlu Otorisasi 1-Klik' 
                                                                    : 'Belum Dikonfigurasi'}
                                                        </span>
                                                    </span>
                                                    {driveConfig.has_folder_id && (
                                                        <span className="text-[11px] font-mono text-on-surface-variant">
                                                            Folder ID: {driveConfig.folder_id.substring(0, 10)}...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <a
                                                href={route('superadmin.monitoring.backup.connect-google')}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1.5 shadow-sm ${
                                                    driveConfig.has_oauth 
                                                        ? 'bg-surface-container-high text-primary hover:bg-surface-container-highest border border-outline-variant' 
                                                        : 'bg-primary text-on-primary hover:bg-primary/90 animate-pulse'
                                                }`}
                                                title="Otorisasi langsung akun Google Anda (15 GB kuota akun pribadi)"
                                            >
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                </svg>
                                                <span>{driveConfig.has_oauth ? 'Hubungkan Ulang Google' : 'Hubungkan Akun Google (1-Klik)'}</span>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setIsConfigModalOpen(true)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-primary transition-all active:scale-95 flex items-center space-x-1.5"
                                            >
                                                <span className="material-symbols-outlined text-sm">settings</span>
                                                <span>Pengaturan</span>
                                            </button>
                                        </div>
                                    </div>

                                    {!driveConfig.has_oauth && driveConfig.has_service_account && (
                                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start space-x-2.5 text-xs text-amber-900 dark:text-amber-200">
                                            <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">warning</span>
                                            <div className="space-y-1">
                                                <p className="font-bold">Langkah Penting: Otorisasi Akun Google Diperlukan!</p>
                                                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                                                    Google Drive personal (@gmail.com) memiliki aturan kuota 0 Byte untuk Service Account bot. 
                                                    Silakan klik tombol <strong>"Hubungkan Akun Google (1-Klik)"</strong> di atas agar arsip backup dapat diunggah menggunakan kuota gratis 15 GB akun Google Anda.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                                        {driveConfig.has_oauth ? (
                                            <>
                                                Tersambung ke Google Drive melalui Akun Pribadi: <strong className="font-mono text-on-surface">{driveConfig.client_email}</strong>. 
                                                Setiap arsip database cadangan diunggah otomatis ke folder cloud yang ditentukan dengan kuota 15 GB Anda.
                                            </>
                                        ) : (
                                            <>
                                                Database cadangan saat ini disimpan aman di folder lokal server (<code className="font-mono text-[11px] bg-surface-container-high px-1 py-0.5 rounded">storage/app/backups/</code>).
                                            </>
                                        )}
                                    </p>
                                </div>

                                {driveConfig.is_configured && (
                                    <div className="pt-4 mt-4 border-t border-outline-variant/60 flex items-center justify-between">
                                        <div className="text-[11px] text-on-surface-variant">
                                            Status akses folder cloud diverifikasi via API v3
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleTestDrive}
                                            disabled={isTestingDrive}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 flex items-center space-x-1 disabled:opacity-50"
                                        >
                                            <span className={`material-symbols-outlined text-sm ${isTestingDrive ? 'animate-spin' : ''}`}>
                                                {isTestingDrive ? 'progress_activity' : 'verified'}
                                            </span>
                                            <span>{isTestingDrive ? 'Menguji Akses...' : 'Uji Koneksi Drive'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Card 2: Quick Action / Manual Backup */}
                            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-outline-variant/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
                                <div>
                                    <div className="flex items-center space-x-2 text-xs font-bold text-secondary uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-base">schedule</span>
                                        <span>Jadwal Otomatis</span>
                                    </div>
                                    <h4 className="font-headline-sm font-bold text-primary mt-1">
                                        Pencadangan Instan
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                        Cadangan otomatis dijalankan setiap malam pukul <strong className="text-on-surface">03:00 WIB</strong> via Cron Scheduler. Anda juga dapat membuat cadangan manual kapan saja.
                                    </p>

                                    {/* Checkbox auto upload to drive */}
                                    <div className="mt-4 pt-3 border-t border-outline-variant/60">
                                        <label className={`flex items-center space-x-2 text-xs cursor-pointer select-none ${
                                            driveConfig.is_configured ? 'text-on-surface' : 'text-on-surface-variant opacity-60'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={uploadToDriveOnCreate}
                                                onChange={(e) => setUploadToDriveOnCreate(e.target.checked)}
                                                disabled={!driveConfig.is_configured}
                                                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span className="font-semibold">Otomatis unggah ke Google Drive</span>
                                        </label>
                                        {!driveConfig.is_configured && (
                                            <span className="text-[10px] text-amber-700 dark:text-amber-400 block ml-6 mt-0.5">
                                                (Konfigurasi Google Drive terlebih dahulu)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={handleCreateBackup}
                                        disabled={isCreatingBackup}
                                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined text-base ${isCreatingBackup ? 'animate-spin' : ''}`}>
                                            {isCreatingBackup ? 'progress_activity' : 'backup'}
                                        </span>
                                        <span>{isCreatingBackup ? 'Sedang Mencadangkan...' : 'Buat Backup Database Sekarang'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Backup Files Table */}
                        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/80 p-5 sm:p-6 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant">
                                <div>
                                    <h3 className="font-headline-sm font-bold text-on-surface flex items-center space-x-2">
                                        <span className="material-symbols-outlined text-primary">archive</span>
                                        <span>Daftar Riwayat Arsip Database ({backups.length})</span>
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        File arsip (.zip) berisi salinan database penuh, dump SQL portabel, dan metadata struktur tabel.
                                    </p>
                                </div>
                                <span className="text-[11px] font-semibold text-secondary px-3 py-1 bg-secondary/10 rounded-full shrink-0">
                                    Retensi Otomatis: 14 Arsip Terakhir
                                </span>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                                            <th className="py-3 px-3">Nama File & Engine</th>
                                            <th className="py-3 px-3">Ukuran File</th>
                                            <th className="py-3 px-3">Waktu Pembuatan</th>
                                            <th className="py-3 px-3">Statistik Data</th>
                                            <th className="py-3 px-3 text-center">Status Google Drive</th>
                                            <th className="py-3 px-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/40">
                                        {backups.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-10 text-center text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-4xl block mx-auto text-outline-variant mb-2">
                                                        folder_off
                                                    </span>
                                                    <p className="font-semibold text-sm">Belum ada file cadangan database</p>
                                                    <p className="text-xs text-on-surface-variant mt-1">
                                                        Klik tombol "Buat Backup Database Sekarang" di atas untuk membuat cadangan pertama Anda.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            backups.map((b) => (
                                                <tr key={b.filename} className="hover:bg-surface-container-low transition-colors">
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center space-x-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-base">folder_zip</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-on-surface block text-xs font-mono">{b.filename}</span>
                                                                <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold text-secondary">
                                                                    <span>Driver: {b.driver}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-3 font-semibold text-on-surface whitespace-nowrap">
                                                        {b.size_formatted}
                                                    </td>

                                                    <td className="py-3.5 px-3 text-on-surface-variant whitespace-nowrap">
                                                        {b.created_at_human}
                                                    </td>

                                                    <td className="py-3.5 px-3 text-on-surface-variant whitespace-nowrap">
                                                        {b.total_tables ? (
                                                            <span>
                                                                <strong className="text-on-surface">{b.total_tables}</strong> tabel &bull; <strong className="text-on-surface">{formatNumber(b.total_rows)}</strong> baris
                                                            </span>
                                                        ) : (
                                                            <span className="italic text-outline">-</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                        {b.drive_status === 'uploaded' ? (
                                                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                                <span className="material-symbols-outlined text-xs">cloud_done</span>
                                                                <span>Tersimpan di Drive</span>
                                                            </span>
                                                        ) : b.drive_status === 'upload_failed' ? (
                                                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error-container text-on-error-container" title={b.drive_error}>
                                                                <span className="material-symbols-outlined text-xs">error</span>
                                                                <span>Gagal Upload</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                                                                <span className="material-symbols-outlined text-xs">hard_drive</span>
                                                                <span>Lokal Saja</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end space-x-1.5">
                                                            {/* Download Direct */}
                                                            <a
                                                                href={route('superadmin.monitoring.backup.download', b.filename)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant text-primary font-bold text-xs transition-all active:scale-95 flex items-center space-x-1"
                                                                title="Unduh file arsip ke komputer Anda"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">download</span>
                                                                <span>Unduh</span>
                                                            </a>

                                                            {/* Upload to Google Drive manually if not yet or re-upload */}
                                                            {driveConfig.is_configured && b.drive_status !== 'uploaded' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUploadToDrive(b.filename)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 font-bold text-xs transition-all active:scale-95 flex items-center space-x-1"
                                                                    title="Kirim file ini ke Google Drive"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                                                    <span>Ke Drive</span>
                                                                </button>
                                                            )}

                                                            {/* Delete */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBackup(b.filename)}
                                                                className="p-1.5 rounded-lg hover:bg-error-container text-error transition-all active:scale-95"
                                                                title="Hapus file arsip ini"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: PENGATURAN GOOGLE DRIVE SERVICE ACCOUNT */}
                {isConfigModalOpen && (
                    <div 
                        onClick={() => setIsConfigModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface-container-lowest w-full max-w-xl rounded-3xl border border-outline-variant shadow-xl overflow-hidden animate-scale-up"
                        >
                            <div className="p-5 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-xl">cloud_sync</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-sm font-bold text-primary">
                                            Pengaturan Google Drive Backup
                                        </h3>
                                        <p className="text-xs text-on-surface-variant">
                                            Konfigurasi Service Account untuk upload cloud otomatis
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsConfigModalOpen(false)}
                                    className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSaveDriveConfig} className="p-5 sm:p-6 space-y-5">
                                {/* Opsi 1-Klik OAuth (Recommended untuk Akun Google Pribadi) */}
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="font-bold text-xs text-primary block flex items-center space-x-1.5">
                                            <span className="material-symbols-outlined text-base">verified_user</span>
                                            <span>Otorisasi 1-Klik (Akun Google Pribadi)</span>
                                        </span>
                                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                                            Sangat direkomendasikan untuk Google Drive pribadi (<code className="font-mono">@gmail.com</code>) agar menggunakan kuota 15 GB akun Anda.
                                        </p>
                                    </div>
                                    <a
                                        href={route('superadmin.monitoring.backup.connect-google')}
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                        </svg>
                                        <span>Hubungkan Google</span>
                                    </a>
                                </div>

                                {/* Panduan 3 Langkah Service Account */}
                                <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/60 text-xs space-y-2">
                                    <span className="font-bold text-primary block text-xs">
                                        Atau Gunakan Service Account (Google Workspace Shared Drive):
                                    </span>
                                    <ol className="list-decimal list-inside space-y-1 text-on-surface-variant text-[11px] leading-relaxed">
                                        <li>Buka Google Cloud Console &rarr; Buat Service Account &rarr; Unduh kunci format <strong>.JSON</strong>.</li>
                                        <li>Unggah file JSON tersebut atau tempel isinya pada kolom di bawah.</li>
                                        <li>Buka folder Google Drive Anda &rarr; Klik <strong>"Bagikan" (Share)</strong> &rarr; Masukkan email Service Account sebagai <strong>Editor</strong>.</li>
                                    </ol>
                                </div>

                                {/* Folder ID */}
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Google Drive Folder ID <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={driveFolderId}
                                        onChange={(e) => setDriveFolderId(e.target.value)}
                                        placeholder="Contoh: 1AbCdEfGhIjKlMnOpQrStUvWxYz..."
                                        required
                                        className="w-full text-xs font-mono rounded-xl border-outline-variant bg-surface focus:border-primary focus:ring-primary px-3 py-2.5"
                                    />
                                    <span className="text-[10px] text-on-surface-variant block mt-1">
                                        Didapat dari bagian akhir URL folder Google Drive Anda di browser (<code className="font-mono">drive.google.com/drive/folders/<strong>FOLDER_ID</strong></code>).
                                    </span>
                                </div>

                                {/* File Upload JSON */}
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Unggah File Kredensial Service Account (.json)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".json,application/json"
                                        onChange={(e) => setServiceAccountFile(e.target.files[0] || null)}
                                        className="w-full text-xs rounded-xl border border-outline-variant bg-surface px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary/90"
                                    />
                                    {driveConfig.has_service_account && (
                                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-1 font-semibold">
                                            ✓ File Service Account saat ini sudah terpasang ({driveConfig.client_email}). Unggah file baru jika ingin menggantinya.
                                        </span>
                                    )}
                                </div>

                                {/* Optional Paste JSON Text */}
                                <div>
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-secondary font-bold select-none hover:underline">
                                            Atau tempel isi teks JSON Service Account secara manual
                                        </summary>
                                        <div className="mt-2">
                                            <textarea
                                                rows="4"
                                                value={serviceAccountJson}
                                                onChange={(e) => setServiceAccountJson(e.target.value)}
                                                placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                                                className="w-full text-[11px] font-mono rounded-xl border-outline-variant bg-surface focus:border-primary focus:ring-primary px-3 py-2"
                                            ></textarea>
                                        </div>
                                    </details>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-outline-variant flex items-center justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsConfigModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingConfig}
                                        className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all active:scale-95 shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isSavingConfig ? 'animate-spin' : ''}`}>
                                            {isSavingConfig ? 'progress_activity' : 'save'}
                                        </span>
                                        <span>{isSavingConfig ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                user={auth?.user}
            />
        </div>
    );
}
