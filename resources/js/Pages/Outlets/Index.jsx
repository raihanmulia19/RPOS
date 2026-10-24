import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function OutletsIndex({ outlets = [], quota = {}, tenant = null }) {
    const { auth, flash, errors } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState(null);
    const [deletingOutlet, setDeletingOutlet] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, reset, errors: formErrors } = useForm({
        name: '',
        phone: '',
        address: '',
        is_main: false,
    });

    const openAddModal = () => {
        if (!quota.can_add) {
            setShowUpgradeModal(true);
            return;
        }
        setEditingOutlet(null);
        reset();
        setData({
            name: '',
            phone: '',
            address: '',
            is_main: outlets.length === 0,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (outlet) => {
        setEditingOutlet(outlet);
        setData({
            name: outlet.name || '',
            phone: outlet.phone || '',
            address: outlet.address || '',
            is_main: Boolean(outlet.is_main),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingOutlet) {
            put(route('outlets.update', editingOutlet.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post(route('outlets.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleSetMain = (outlet) => {
        post(route('outlets.set-main', outlet.id), {
            preserveScroll: true,
        });
    };

    const confirmDelete = (outlet) => {
        setDeletingOutlet(outlet);
    };

    const executeDelete = () => {
        if (!deletingOutlet) return;
        destroy(route('outlets.destroy', deletingOutlet.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingOutlet(null),
        });
    };

    const percentUsed = quota.max > 0 ? Math.min(100, Math.round((quota.used / quota.max) * 100)) : 0;

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Manajemen Cabang Toko - POS SaaS" />

            {/* Merchant Top Navigation Bar */}
            <MerchantNavbar tenant={tenant} auth={auth} activePage="outlets" />

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                
                {/* Header & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
                            <h2 className="font-headline-lg font-bold text-primary text-2xl sm:text-3xl">
                                Manajemen Cabang Outlet
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                            Kelola cabang fisik dan titik kasir toko Anda. Paket <strong>Enterprise</strong> mendukung hingga <strong>5 cabang</strong> outlet.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={openAddModal}
                            id="btn-add-outlet"
                            className={`px-5 py-2.5 rounded-xl font-label-md font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer ${
                                quota.can_add
                                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90 active:scale-95'
                                    : 'bg-surface-container-high text-on-surface-variant hover:border-secondary border border-outline-variant'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {quota.can_add ? 'add_business' : 'lock'}
                            </span>
                            <span>Tambah Cabang Baru</span>
                        </button>
                    </div>
                </div>

                {/* Tab Switcher: Cabang vs Transfer Stok */}
                <div className="flex border-b border-outline-variant space-x-6 text-sm font-bold">
                    <Link
                        href={route('outlets.index')}
                        className="pb-3 border-b-2 border-secondary text-secondary flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-base">storefront</span>
                        <span>Daftar Cabang Outlet ({outlets.length})</span>
                    </Link>
                    <Link
                        href={route('stock-transfers.index')}
                        className="pb-3 text-on-surface-variant hover:text-primary transition flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-base">swap_horiz</span>
                        <span>Transfer Stok Antar-Cabang</span>
                        {quota.is_enterprise && (
                            <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                Enterprise
                            </span>
                        )}
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-xs">
                        <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}
                {errors?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-900 px-5 py-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-xs">
                        <span className="material-symbols-outlined text-red-600 text-xl">error</span>
                        <span>{errors.error}</span>
                    </div>
                )}

                {/* Quota & Subscription Status Card */}
                <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-sm ${
                    quota.is_enterprise
                        ? 'bg-surface-container-lowest border-secondary/40 ring-1 ring-secondary/20'
                        : 'bg-surface-container-lowest border-outline-variant'
                }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        
                        {/* Quota Info */}
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                                    quota.is_enterprise 
                                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                    {quota.plan_name}
                                </span>
                                <span className="text-xs text-on-surface-variant font-medium">
                                    {quota.is_enterprise ? 'Multi-Cabang Hingga 5 Outlet' : 'Single Outlet (Maks. 1 Cabang)'}
                                </span>
                            </div>

                            <div className="flex items-baseline space-x-2">
                                <h3 className="font-headline-md font-bold text-primary text-xl sm:text-2xl">
                                    {quota.used} / {quota.max} Cabang Aktif
                                </h3>
                                <span className="text-xs text-on-surface-variant">
                                    ({quota.max - quota.used} slot cabang tersisa)
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 rounded-full ${
                                        percentUsed >= 100 
                                            ? 'bg-amber-500' 
                                            : quota.is_enterprise 
                                            ? 'bg-secondary' 
                                            : 'bg-primary'
                                    }`}
                                    style={{ width: `${percentUsed}%` }}
                                />
                            </div>
                        </div>

                        {/* Upgrade Notice for non-Enterprise or Promotion */}
                        {!quota.is_enterprise ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:max-w-md">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs sm:text-sm">
                                        <span className="material-symbols-outlined text-base text-amber-800">stars</span>
                                        <span>Buka Cabang Baru?</span>
                                    </div>
                                    <p className="text-xs text-amber-800/90 leading-relaxed">
                                        Paket {quota.plan_name} dibatasi 1 outlet. Beralih ke <strong>Enterprise</strong> untuk membuka hingga 5 cabang!
                                    </p>
                                </div>
                                <Link
                                    href={route('subscription.plans')}
                                    className="px-4 py-2 bg-secondary text-on-secondary hover:bg-secondary/90 active:scale-95 text-xs font-bold rounded-xl transition shadow-xs shrink-0 whitespace-nowrap"
                                >
                                    Upgrade ke Enterprise
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 sm:p-5 flex items-center space-x-3 lg:max-w-md">
                                <span className="material-symbols-outlined text-purple-700 text-3xl shrink-0">verified</span>
                                <div className="text-xs text-purple-900">
                                    <span className="font-bold block text-sm">Fitur Enterprise Aktif</span>
                                    <span>Toko Anda memiliki hak membuat hingga 5 cabang outlet dan transfer stok antar-cabang.</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Outlets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {outlets.map((outlet, index) => (
                        <div
                            key={outlet.id}
                            className={`bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border-2 transition-all flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                                outlet.is_main
                                    ? 'border-secondary ring-2 ring-secondary/20 shadow-md'
                                    : 'border-outline-variant hover:border-secondary/40'
                            }`}
                        >
                            {/* Main Branch Badge */}
                            {outlet.is_main && (
                                <div className="absolute -top-3.5 left-6 bg-secondary text-on-secondary text-[11px] font-bold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-xs flex items-center space-x-1">
                                    <span className="material-symbols-outlined text-xs">hotel_class</span>
                                    <span>Cabang Utama (Pusat)</span>
                                </div>
                            )}

                            <div>
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2 mt-1">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                                            outlet.is_main 
                                                ? 'bg-secondary/15 text-secondary' 
                                                : 'bg-surface-container-high text-on-surface'
                                        }`}>
                                            <span className="material-symbols-outlined text-2xl">store</span>
                                        </div>
                                        <div>
                                            <h4 className="font-headline-sm font-bold text-primary text-base sm:text-lg leading-tight">
                                                {outlet.name}
                                            </h4>
                                            <span className="text-[11px] text-on-surface-variant">
                                                Cabang #{index + 1}
                                            </span>
                                        </div>
                                    </div>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        outlet.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-surface-container-highest text-on-surface-variant'
                                    }`}>
                                        {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="mt-4 pt-4 border-t border-outline-variant space-y-2.5 text-xs text-on-surface-variant">
                                    <div className="flex items-start space-x-2">
                                        <span className="material-symbols-outlined text-base text-on-surface-variant/70 shrink-0 mt-0.5">location_on</span>
                                        <span className="leading-relaxed line-clamp-2">
                                            {outlet.address || 'Alamat cabang belum diatur.'}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="material-symbols-outlined text-base text-on-surface-variant/70 shrink-0">call</span>
                                        <span>{outlet.phone || 'No. telepon belum diatur'}</span>
                                    </div>
                                </div>

                                {/* Stats Badges */}
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/60">
                                    <div className="bg-surface-container-low rounded-xl p-2 text-center">
                                        <span className="block text-[10px] text-on-surface-variant/80 font-medium">Kasir Bertugas</span>
                                        <span className="font-bold text-sm text-primary">{outlet.users_count || 0} Akun</span>
                                    </div>
                                    <div className="bg-surface-container-low rounded-xl p-2 text-center">
                                        <span className="block text-[10px] text-on-surface-variant/80 font-medium">Total Pesanan</span>
                                        <span className="font-bold text-sm text-primary">{outlet.orders_count || 0} Transaksi</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Actions Footer */}
                            <div className="mt-5 pt-4 border-t border-outline-variant flex items-center justify-between gap-2">
                                {!outlet.is_main ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSetMain(outlet)}
                                        className="text-xs font-bold text-secondary hover:underline cursor-pointer flex items-center space-x-1"
                                        title="Jadikan cabang ini sebagai pusat operasional"
                                    >
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        <span>Jadikan Pusat</span>
                                    </button>
                                ) : (
                                    <span className="text-[11px] font-semibold text-secondary flex items-center space-x-1">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        <span>Cabang Utama</span>
                                    </span>
                                )}

                                <div className="flex items-center space-x-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(outlet)}
                                        className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition cursor-pointer"
                                        title="Ubah data cabang"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                    </button>

                                    {!outlet.is_main && outlets.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => confirmDelete(outlet)}
                                            className="p-2 rounded-xl bg-surface-container-high hover:bg-red-100 text-error text-xs font-semibold transition cursor-pointer"
                                            title="Hapus cabang ini"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </main>

            {/* MODAL FORM TAMBAH / EDIT CABANG */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-surface rounded-3xl border border-outline-variant shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in my-auto">
                        
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                                    <span className="material-symbols-outlined text-lg">storefront</span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-primary text-lg">
                                    {editingOutlet ? 'Ubah Data Cabang Outlet' : 'Tambah Cabang Outlet Baru'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Nama Cabang / Gerai <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Kopi Karsa - Tebet Raya"
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-[11px] text-error mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    No. Telepon / WhatsApp Cabang
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="Contoh: 0812-3456-7890"
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                                />
                                {formErrors.phone && (
                                    <p className="text-[11px] text-error mt-1">{formErrors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Alamat Lengkap Cabang
                                </label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    placeholder="Contoh: Jl. Tebet Timur Dalam No. 12, Jakarta Selatan"
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-on-surface"
                                />
                                {formErrors.address && (
                                    <p className="text-[11px] text-error mt-1">{formErrors.address}</p>
                                )}
                            </div>

                            <div className="pt-1">
                                <label className="flex items-center space-x-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_main}
                                        onChange={(e) => setData('is_main', e.target.checked)}
                                        className="w-4 h-4 rounded text-secondary focus:ring-secondary border-outline-variant"
                                    />
                                    <span className="text-xs text-on-surface font-semibold">
                                        Jadikan sebagai Cabang Utama (Pusat)
                                    </span>
                                </label>
                            </div>

                            <div className="pt-3 border-t border-outline-variant flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    <span>{processing ? 'Menyimpan...' : (editingOutlet ? 'Simpan Perubahan' : 'Tambah Cabang')}</span>
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* MODAL UPGRADE PROMO JIKA KUOTA HABIS */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-surface rounded-3xl border border-outline-variant shadow-2xl max-w-md w-full p-6 space-y-4 text-center animate-fade-in my-auto">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-3xl">store</span>
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="font-headline-sm font-bold text-primary text-xl">
                                Batas Cabang Tercapai
                            </h3>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                Toko Anda saat ini menggunakan paket <strong>{quota.plan_name}</strong> yang memiliki batas maksimal <strong>{quota.max} cabang</strong>.
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-left space-y-2">
                            <div className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                                <span className="material-symbols-outlined text-sm text-purple-700">stars</span>
                                <span>Keuntungan Paket Enterprise:</span>
                            </div>
                            <ul className="text-xs text-purple-900/90 space-y-1 list-disc list-inside">
                                <li>Membuka hingga <strong>5 Cabang Outlet</strong></li>
                                <li>Transfer Stok Antar-Cabang</li>
                                <li>Unlimited Produk & Akun Kasir</li>
                                <li>Ekspor Laporan Keuangan Excel & PDF</li>
                            </ul>
                        </div>

                        <div className="pt-2 flex flex-col space-y-2">
                            <Link
                                href={route('subscription.plans')}
                                className="w-full py-3 bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1"
                            >
                                <span className="material-symbols-outlined text-sm">stars</span>
                                <span>Upgrade ke Paket Enterprise</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowUpgradeModal(false)}
                                className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold transition"
                            >
                                Nanti Saja
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingOutlet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-surface rounded-3xl border border-outline-variant shadow-2xl max-w-sm w-full p-6 space-y-4 text-center animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary text-lg">
                                Hapus Cabang Ini?
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                Apakah Anda yakin ingin menghapus cabang <strong>"{deletingOutlet.name}"</strong>? Transaksi lama tetap tersimpan.
                            </p>
                        </div>
                        <div className="flex items-center justify-center space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingOutlet(null)}
                                className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                className="px-4 py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error text-xs font-bold transition shadow-xs"
                            >
                                Ya, Hapus Cabang
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
