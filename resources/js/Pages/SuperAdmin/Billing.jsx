import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PlanQrisModal from '@/Components/SuperAdmin/PlanQrisModal';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

export default function SuperAdminBilling({ 
    pendingSubscriptions = [], 
    recentSubscriptions = [], 
    stats = {}, 
    pendingCount = 0,
    plans = []
}) {
    const { auth, flash } = usePage().props;
    const [selectedPlanForQris, setSelectedPlanForQris] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // State for Proof Lightbox Modal
    const [selectedProofUrl, setSelectedProofUrl] = useState(null);

    // State for Reject Modal
    const [rejectingSub, setRejectingSub] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    // State for Search / Filter in history
    const [historySearch, setHistorySearch] = useState('');

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const getWhatsAppUrl = (sub, status = 'approved') => {
        const phone = sub.tenant?.phone || sub.user?.phone || '';
        const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
        const storeName = sub.tenant?.name || 'Toko Anda';
        const planName = sub.plan?.name || 'Langganan RPOS';
        const ref = sub.payment_reference || `#SUB-${sub.id}`;

        let text = '';
        if (status === 'approved') {
            text = `Halo ${sub.user?.name || 'Owner Toko'}, pembayaran langganan paket *${planName}* (${ref}) untuk toko *${storeName}* telah BERHASIL DIVERIFIKASI dan status langganan toko kini AKTIF. Terima kasih telah menggunakan RPOS!`;
        } else {
            text = `Halo ${sub.user?.name || 'Owner Toko'}, verifikasi pembayaran paket langganan *${planName}* (${ref}) untuk toko *${storeName}* belum dapat disetujui: ${sub.notes || 'Bukti transfer belum valid'}. Mohon unggah ulang bukti transfer yang valid di sistem. Terima kasih!`;
        }

        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    };

    const handleApproveSubscription = (subscription) => {
        if (confirm(`Verifikasi pembayaran & aktifkan paket "${subscription.plan?.name}" untuk toko "${subscription.tenant?.name}"?`)) {
            router.post(route('superadmin.subscriptions.approve', subscription.id));
        }
    };

    const handleConfirmReject = (e) => {
        e.preventDefault();
        if (!rejectingSub) return;
        setIsRejecting(true);
        router.post(route('superadmin.subscriptions.reject', rejectingSub.id), {
            notes: rejectNotes || 'Bukti transfer tidak valid atau dana belum diterima.'
        }, {
            onSuccess: () => {
                setIsRejecting(false);
                setRejectingSub(null);
                setRejectNotes('');
            },
            onError: () => {
                setIsRejecting(false);
            }
        });
    };

    const filteredRecentSubscriptions = recentSubscriptions.filter(sub => {
        const query = historySearch.toLowerCase();
        return (
            sub.tenant?.name?.toLowerCase().includes(query) ||
            sub.payment_reference?.toLowerCase().includes(query) ||
            sub.plan?.name?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Billing & Verifikasi - Super Admin" />

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
                            className="font-label-md text-primary font-bold bg-surface-container-high px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-xs border border-outline-variant"
                        >
                            <span className="material-symbols-outlined text-base text-secondary">receipt_long</span>
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
                    className="font-label-md text-on-surface-variant px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                    Manajemen Toko
                </Link>
                <Link 
                    href={route('superadmin.billing.index')}
                    className="font-label-md text-primary font-bold bg-surface-container-high px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center space-x-1"
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

                {/* Section Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                            <span>SaaS Platform</span>
                            <span>/</span>
                            <span>Finansial & Verifikasi</span>
                        </div>
                        <h2 className="font-headline-md font-bold text-on-surface flex items-center">
                            <span className="material-symbols-outlined text-secondary mr-2">receipt_long</span>
                            Billing & Verifikasi Langganan SaaS
                        </h2>
                        <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
                            Validasi mutasi pembayaran QRIS langganan toko, periksa keaslian bukti transfer, dan pantau riwayat penerimaan pendapatan SaaS.
                        </p>
                    </div>
                </div>

                {/* QRIS Statis Paket Management Card */}
                {plans && plans.length > 0 && (
                    <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                                    <span className="material-symbols-outlined text-xl">qr_code_2</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-sm font-bold text-on-surface text-base">
                                        Barcode QRIS Statis Paket Langganan
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">
                                        QRIS ini langsung muncul pada pop-up layar pembayaran saat toko baru mendaftar dari landing page.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                            {[...plans]
                                .filter(p => p.price > 0)
                                .sort((a, b) => Number(a.price) - Number(b.price))
                                .map((plan) => (
                                <div
                                    key={plan.id}
                                    className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant flex flex-col justify-between space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-bold text-primary text-sm">{plan.name}</h4>
                                            <span className="text-xs text-secondary font-bold">
                                                {formatRupiah(plan.price)}
                                            </span>
                                        </div>

                                        {plan.qris_image_url ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                <span>Aktif</span>
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                                Kosong
                                            </span>
                                        )}
                                    </div>

                                    {/* Thumbnail Preview */}
                                    <div className="w-full h-28 bg-white rounded-xl border border-outline-variant/60 flex items-center justify-center overflow-hidden">
                                        {plan.qris_image_url ? (
                                            <img
                                                src={plan.qris_image_url}
                                                alt={`QRIS ${plan.name}`}
                                                className="w-full h-full object-contain p-1 cursor-pointer"
                                                onClick={() => setSelectedProofUrl(plan.qris_image_url)}
                                                title="Klik untuk perbesar"
                                            />
                                        ) : (
                                            <div className="text-center p-2 text-outline">
                                                <span className="material-symbols-outlined text-2xl block">qr_code</span>
                                                <span className="text-[10px]">Belum diatur</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlanForQris(plan)}
                                        className="w-full py-2 bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-xs rounded-xl transition border border-outline-variant flex items-center justify-center space-x-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">tune</span>
                                        <span>{plan.qris_image ? 'Ganti QRIS' : '+ Upload QRIS'}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 1: Antrean Verifikasi Pembayaran Langganan (QRIS Manual Transfer) */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
                    <div className="p-6 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">verified</span>
                                <h3 className="font-headline-md font-bold text-on-surface">
                                    Antrean Verifikasi Pembayaran Langganan
                                </h3>
                                {pendingSubscriptions.length > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 animate-pulse">
                                        {pendingSubscriptions.length} Menunggu
                                    </span>
                                )}
                            </div>
                            <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
                                Bukti transfer pembayaran QRIS dari merchant. Periksa nominal dan bukti untuk mengaktifkan paket secara instan.
                            </p>
                        </div>
                    </div>

                    {pendingSubscriptions.length === 0 ? (
                        <div className="p-12 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">task_alt</span>
                            <p className="font-body-md font-semibold text-on-surface">Semua pembayaran telah selesai diverifikasi!</p>
                            <p className="font-body-sm text-on-surface-variant">Tidak ada pengajuan langganan baru yang menunggu verifikasi saat ini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-body-md text-on-surface">
                                <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold">Toko & Referensi</th>
                                        <th className="px-5 py-3.5 font-semibold">Paket Langganan</th>
                                        <th className="px-5 py-3.5 font-semibold">Nominal</th>
                                        <th className="px-5 py-3.5 font-semibold">Tanggal Diajukan</th>
                                        <th className="px-5 py-3.5 font-semibold text-center">Bukti Transfer</th>
                                        <th className="px-5 py-3.5 font-semibold text-right">Aksi Verifikasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {pendingSubscriptions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-primary">{sub.tenant?.name || 'Toko'}</div>
                                                {sub.tenant?.users?.[0] && (
                                                    <div className="text-[11px] text-on-surface-variant">
                                                        {sub.tenant.users[0].name} ({sub.tenant.users[0].email})
                                                    </div>
                                                )}
                                                <div className="font-mono text-xs text-secondary font-semibold">{sub.payment_reference}</div>
                                                {sub.notes && (
                                                    <div className="text-xs text-on-surface-variant mt-0.5 italic">"{sub.notes}"</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-on-surface block">{sub.plan?.name || '-'}</span>
                                                <span className="text-xs text-on-surface-variant">Durasi: {sub.plan?.duration_days || 30} Hari</span>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-secondary">
                                                {formatRupiah(sub.amount)}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-on-surface-variant">
                                                {new Date(sub.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {sub.payment_proof_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedProofUrl(sub.payment_proof_url)}
                                                        className="inline-flex items-center space-x-1 px-3 py-1 bg-surface-container-highest hover:bg-surface-container-high text-primary rounded-xl text-xs font-semibold border border-outline-variant transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">image</span>
                                                        <span>Lihat Bukti TF</span>
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                                        <span className="material-symbols-outlined text-xs">chat</span>
                                                        <span>Konfirmasi via WA</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {(sub.tenant?.phone || sub.user?.phone) && (
                                                        <a
                                                            href={getWhatsAppUrl(sub, 'approved')}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-700 text-white font-label-md text-xs rounded-xl hover:bg-emerald-800 transition-all active:scale-95 shadow-sm"
                                                            title="Kirim Konfirmasi WA ke Owner Toko"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">chat</span>
                                                            <span className="hidden sm:inline">WA</span>
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveSubscription(sub)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-secondary text-on-secondary font-label-md text-xs rounded-xl hover:bg-secondary/90 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                        <span>Verifikasi & Aktifkan</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRejectingSub(sub);
                                                            setRejectNotes('');
                                                        }}
                                                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-error text-on-error font-label-md text-xs rounded-xl hover:bg-on-error-container transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                        <span>Tolak</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Section 2: Riwayat Pembayaran Langganan Selesai */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
                    <div className="p-5 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-headline-sm font-bold text-on-surface flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">history</span>
                                <span>Riwayat Transaksi Pembayaran Langganan SaaS</span>
                            </h3>
                            <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
                                Catatan transaksi toko yang telah selesai diverifikasi (pendapatan masuk) maupun ditolak.
                            </p>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                placeholder="Cari ref / toko / paket..."
                                className="pl-9 pr-4 py-2 text-xs bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl font-body-md w-56 outline-none"
                            />
                            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">
                                search
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface text-xs">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Toko & Referensi</th>
                                    <th className="px-5 py-3 font-semibold">Paket</th>
                                    <th className="px-5 py-3 font-semibold">Nominal Masuk</th>
                                    <th className="px-5 py-3 font-semibold">Tanggal Diproses</th>
                                    <th className="px-5 py-3 font-semibold">Diverifikasi Oleh</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold text-center">Bukti Transfer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {filteredRecentSubscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-10 text-center text-on-surface-variant">
                                            Tidak ada riwayat transaksi yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecentSubscriptions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-primary">{sub.tenant?.name || 'Toko'}</div>
                                                <div className="font-mono text-[11px] text-on-surface-variant">{sub.payment_reference}</div>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-on-surface">
                                                {sub.plan?.name || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-secondary">
                                                {formatRupiah(sub.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-on-surface-variant">
                                                {sub.verified_at ? new Date(sub.verified_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-on-surface-variant font-medium">
                                                {sub.verifier?.name || 'Super Admin'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {sub.status === 'active' ? (
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                        <span>Diverifikasi (Masuk)</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error-container text-on-error-container" title={sub.notes}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                                        <span>Ditolak</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center space-x-1.5">
                                                    {sub.payment_proof_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProofUrl(sub.payment_proof_url)}
                                                            className="px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant text-primary font-semibold text-[11px]"
                                                        >
                                                            Lihat Bukti
                                                        </button>
                                                    )}
                                                    {(sub.tenant?.phone || sub.user?.phone) && (
                                                        <a
                                                            href={getWhatsAppUrl(sub, sub.status === 'active' ? 'approved' : 'rejected')}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-semibold text-[11px] transition-colors"
                                                            title="Kirim pesan status via WhatsApp"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">chat</span>
                                                            <span>WA</span>
                                                        </a>
                                                    )}
                                                    {!sub.payment_proof_url && !(sub.tenant?.phone || sub.user?.phone) && (
                                                        <span className="text-on-surface-variant italic">-</span>
                                                    )}
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

            {/* Modal Lightbox Bukti Transfer */}
            {selectedProofUrl && (
                <div 
                    onClick={() => setSelectedProofUrl(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant max-w-lg w-full overflow-hidden p-6 space-y-4 animate-scale-up"
                    >
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">receipt_long</span>
                                <h3 className="font-headline-sm font-bold text-primary">Bukti Transfer Merchant</h3>
                            </div>
                            <button
                                onClick={() => setSelectedProofUrl(null)}
                                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center bg-black/5 rounded-2xl p-2 border border-outline-variant max-h-[70vh] overflow-auto">
                            <img 
                                src={selectedProofUrl} 
                                alt="Bukti Transfer Langganan" 
                                className="max-h-[60vh] object-contain rounded-xl shadow-inner"
                            />
                        </div>

                        <div className="flex items-center justify-end pt-2">
                            <a
                                href={selectedProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-xl text-xs font-semibold border border-outline-variant"
                            >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                <span>Buka di Tab Baru</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tolak Pembayaran */}
            {rejectingSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant max-w-md w-full overflow-hidden p-6 space-y-4 animate-scale-up">
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="flex items-center space-x-2 text-error">
                                <span className="material-symbols-outlined">warning</span>
                                <h3 className="font-headline-sm font-bold">Tolak Pengajuan Langganan</h3>
                            </div>
                            <button
                                onClick={() => setRejectingSub(null)}
                                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <p className="text-xs text-on-surface-variant">
                            Tolak pengajuan dari toko <strong className="text-on-surface">{rejectingSub.tenant?.name}</strong> senilai <strong>{formatRupiah(rejectingSub.amount)}</strong>.
                        </p>

                        <form onSubmit={handleConfirmReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Alasan Penolakan (Catatan):
                                </label>
                                <textarea
                                    rows="3"
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    placeholder="Contoh: Bukti transfer tidak valid, mutasi rekening tidak ditemukan, dll."
                                    className="w-full text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-error focus:ring-1 focus:ring-error outline-none font-body-md"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-outline-variant">
                                <button
                                    type="button"
                                    onClick={() => setRejectingSub(null)}
                                    disabled={isRejecting}
                                    className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRejecting}
                                    className="px-4 py-2 bg-error text-on-error text-xs font-semibold rounded-xl hover:bg-on-error-container shadow-sm"
                                >
                                    {isRejecting ? 'Memproses...' : 'Konfirmasi Tolak'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
