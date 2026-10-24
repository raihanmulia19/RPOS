import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function StockTransfers({ 
    tenant = null, 
    isEnterprise = false, 
    outlets = [], 
    products = [], 
    transfers = [], 
    canTransfer = false 
}) {
    const { auth, flash, errors } = usePage().props;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTransferForAction, setSelectedTransferForAction] = useState(null);
    const [actionType, setActionType] = useState(null); // 'complete' | 'cancel'

    const { data, setData, post, processing, reset, errors: formErrors } = useForm({
        source_outlet_id: outlets.length > 0 ? String(outlets[0].id) : '',
        destination_outlet_id: outlets.length > 1 ? String(outlets[1].id) : '',
        product_id: products.length > 0 ? String(products[0].id) : '',
        quantity: 1,
        notes: '',
    });

    // Helper: cari stok saat ini di cabang pengirim yang dipilih
    const selectedSourceOutletId = Number(data.source_outlet_id);
    const selectedProductId = Number(data.product_id);
    const selectedProduct = products.find(p => p.id === selectedProductId);
    const availableStockAtSource = selectedProduct?.stocks_by_outlet?.[selectedSourceOutletId] ?? 0;

    const openCreateModal = (prefillProductId = null, prefillSourceId = null) => {
        reset();
        const sourceId = prefillSourceId ? String(prefillSourceId) : (outlets.length > 0 ? String(outlets[0].id) : '');
        const otherOutlet = outlets.find(o => String(o.id) !== sourceId);
        const destId = otherOutlet ? String(otherOutlet.id) : '';
        const prodId = prefillProductId ? String(prefillProductId) : (products.length > 0 ? String(products[0].id) : '');

        setData({
            source_outlet_id: sourceId,
            destination_outlet_id: destId,
            product_id: prodId,
            quantity: 1,
            notes: '',
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route('stock-transfers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleComplete = (transfer) => {
        post(route('stock-transfers.complete', transfer.id), {
            preserveScroll: true,
        });
    };

    const handleCancel = (transfer) => {
        if (confirm(`Yakin ingin membatalkan pengiriman ${transfer.transfer_number}? Stok akan dikembalikan ke ${transfer.source_outlet?.name}.`)) {
            post(route('stock-transfers.cancel', transfer.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Transfer Stok Antar-Cabang - POS SaaS" />

            {/* Merchant Top Navigation Bar */}
            <MerchantNavbar tenant={tenant} auth={auth} activePage="outlets" />

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                
                {/* Header & Subtitle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-primary text-2xl">swap_horiz</span>
                            <h2 className="font-headline-lg font-bold text-primary text-2xl sm:text-3xl">
                                Transfer Stok Antar-Cabang
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                            Mutasi dan pengiriman inventaris antar gerai fisik secara real-time. Fitur eksklusif paket <strong>Enterprise</strong>.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            id="btn-create-transfer"
                            onClick={() => openCreateModal()}
                            disabled={!canTransfer}
                            className={`px-5 py-2.5 rounded-xl font-label-md font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer ${
                                canTransfer
                                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90 active:scale-95'
                                    : 'bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                            <span>Kirim Stok Baru</span>
                        </button>
                    </div>
                </div>

                {/* Tab Switcher: Cabang vs Transfer Stok */}
                <div className="flex border-b border-outline-variant space-x-6 text-sm font-bold">
                    <Link
                        href={route('outlets.index')}
                        className="pb-3 text-on-surface-variant hover:text-primary transition flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-base">storefront</span>
                        <span>Daftar Cabang Outlet ({outlets.length})</span>
                    </Link>
                    <Link
                        href={route('stock-transfers.index')}
                        className="pb-3 border-b-2 border-secondary text-secondary flex items-center space-x-2"
                    >
                        <span className="material-symbols-outlined text-base">swap_horiz</span>
                        <span>Transfer Stok Antar-Cabang</span>
                        {transfers.filter(t => t.status === 'in_transit').length > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                {transfers.filter(t => t.status === 'in_transit').length} Dikirim
                            </span>
                        )}
                    </Link>
                </div>

                {/* Flash Success & Error Notification */}
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

                {/* Banner Enterprise or Warning */}
                {!isEnterprise ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                            <span className="material-symbols-outlined text-amber-800 text-2xl mt-0.5">lock</span>
                            <div>
                                <h4 className="font-bold text-sm text-amber-950">Fitur Khusus Paket Enterprise</h4>
                                <p className="text-xs text-amber-800/90 mt-0.5">
                                    Paket toko Anda saat ini belum mendukung mutasi stok multi-cabang. Tingkatkan langganan ke paket Enterprise untuk membuka fitur ini.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('subscription.plans')}
                            className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-xs hover:bg-secondary/90 transition shrink-0"
                        >
                            Upgrade ke Enterprise
                        </Link>
                    </div>
                ) : outlets.length < 2 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                            <span className="material-symbols-outlined text-blue-800 text-2xl mt-0.5">info</span>
                            <div>
                                <h4 className="font-bold text-sm text-blue-950">Dibutuhkan Minimal 2 Cabang Outlet</h4>
                                <p className="text-xs text-blue-800/90 mt-0.5">
                                    Untuk dapat mentransfer stok, Anda perlu mendaftarkan cabang outlet kedua terlebih dahulu di menu Daftar Cabang.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('outlets.index')}
                            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90 transition shrink-0"
                        >
                            + Tambah Cabang Kedua
                        </Link>
                    </div>
                ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-3xl p-4 sm:p-5 flex items-center space-x-3">
                        <span className="material-symbols-outlined text-purple-700 text-3xl shrink-0">verified</span>
                        <div className="text-xs text-purple-900">
                            <span className="font-bold block text-sm">Modul Mutasi Stok Multi-Cabang Aktif</span>
                            <span>Setiap pengiriman barang akan otomatis memotong stok di cabang asal dan menambahkan stok di cabang tujuan setelah dikonfirmasi diterima.</span>
                        </div>
                    </div>
                )}

                {/* SECTION 1: MATRIKS DISTRIBUSI STOK PER CABANG */}
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary text-base sm:text-lg flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">inventory_2</span>
                                <span>Distribusi Stok Produk per Cabang</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                Pantau ketersediaan stok fisik di setiap gerai secara real-time.
                            </p>
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">
                            {products.length} Produk Dilacak Stok
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Nama Produk</th>
                                    {outlets.map(outlet => (
                                        <th key={outlet.id} className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center space-x-1">
                                                <span>{outlet.name}</span>
                                                {outlet.is_main && (
                                                    <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.2 rounded-full font-bold">Pusat</span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 font-semibold text-center">Total Gabungan</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant text-xs sm:text-sm">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={outlets.length + 3} className="text-center py-6 text-on-surface-variant text-xs">
                                            Belum ada produk dengan pelacakan stok aktif. Aktifkan pelacakan stok di menu Manajemen Produk.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(product => {
                                        const totalStock = Object.values(product.stocks_by_outlet || {}).reduce((a, b) => a + b, 0);
                                        return (
                                            <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-on-surface">
                                                    {product.name}
                                                </td>
                                                {outlets.map(outlet => {
                                                    const stockQty = product.stocks_by_outlet?.[outlet.id] ?? 0;
                                                    return (
                                                        <td key={outlet.id} className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center font-bold px-2.5 py-1 rounded-full text-xs ${
                                                                stockQty <= 0 
                                                                    ? 'bg-red-100 text-red-800' 
                                                                    : stockQty <= 5 
                                                                    ? 'bg-amber-100 text-amber-800' 
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {stockQty} pcs
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3.5 text-center font-extrabold text-primary">
                                                    {totalStock} pcs
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {canTransfer && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCreateModal(product.id)}
                                                            className="px-3 py-1 bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-primary rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto cursor-pointer"
                                                            title="Transfer produk ini ke cabang lain"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                                            <span>Transfer</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION 2: RIWAYAT MUTASI & STATUS PENGIRIMAN */}
                <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary text-base sm:text-lg flex items-center space-x-2">
                                <span className="material-symbols-outlined text-secondary">history</span>
                                <span>Riwayat Mutasi & Pengiriman Stok</span>
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                Log lengkap riwayat perpindahan barang antar-cabang beserta status pengirimannya.
                            </p>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                            Total {transfers.length} Transaksi Mutasi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">No. Mutasi</th>
                                    <th className="px-4 py-3 font-semibold">Rute Pengiriman</th>
                                    <th className="px-4 py-3 font-semibold">Produk & Jumlah</th>
                                    <th className="px-4 py-3 font-semibold">Status Pengiriman</th>
                                    <th className="px-4 py-3 font-semibold">Waktu & Catatan</th>
                                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant text-xs sm:text-sm">
                                {transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-on-surface-variant text-xs">
                                            Belum ada riwayat transfer stok antar-cabang. Klik tombol <strong>"Kirim Stok Baru"</strong> di atas untuk memulai mutasi stok.
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.map(trf => {
                                        const isInTransit = trf.status === 'in_transit';
                                        const isCompleted = trf.status === 'completed';
                                        const isCancelled = trf.status === 'cancelled';

                                        return (
                                            <tr key={trf.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="font-mono font-bold text-xs text-primary">{trf.transfer_number}</div>
                                                    <div className="text-[11px] text-on-surface-variant">
                                                        Oleh: {trf.creator?.name || 'Owner'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center space-x-1.5 text-xs font-semibold">
                                                        <span className="text-on-surface">{trf.source_outlet?.name}</span>
                                                        <span className="material-symbols-outlined text-xs text-secondary">arrow_forward</span>
                                                        <span className="text-primary font-bold">{trf.destination_outlet?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-on-surface">{trf.product?.name}</div>
                                                    <div className="text-xs text-secondary font-extrabold">{trf.quantity} pcs</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {isInTransit ? (
                                                        <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                                            <span className="material-symbols-outlined text-xs">local_shipping</span>
                                                            <span>Dalam Perjalanan</span>
                                                        </span>
                                                    ) : isCompleted ? (
                                                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-full bg-green-100 text-green-900 border border-green-300">
                                                            <span className="material-symbols-outlined text-xs">check_circle</span>
                                                            <span>Selesai Diterima</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                                                            <span className="material-symbols-outlined text-xs">cancel</span>
                                                            <span>Dibatalkan</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-on-surface-variant">
                                                    <div>{new Date(trf.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                    {trf.notes && <div className="text-[11px] italic mt-0.5">"{trf.notes}"</div>}
                                                    {isCompleted && trf.received_at && (
                                                        <div className="text-[10px] text-green-800 mt-0.5">
                                                            Diterima {new Date(trf.received_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} oleh {trf.receiver?.name || 'Kasir'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {isInTransit && (
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleComplete(trf)}
                                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                                                                title="Konfirmasi bahwa barang fisik telah tiba dan diterima di cabang tujuan"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check</span>
                                                                <span>Terima Barang</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCancel(trf)}
                                                                className="p-1.5 bg-surface-container-high hover:bg-red-100 text-error rounded-xl text-xs transition cursor-pointer"
                                                                title="Batalkan pengiriman dan kembalikan stok"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            {/* MODAL FORM KIRIM STOK BARU */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-surface rounded-3xl border border-outline-variant shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in my-auto">
                        
                        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                                </div>
                                <h3 className="font-headline-sm font-bold text-primary text-lg">
                                    Form Pengiriman Stok Antar-Cabang
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            
                            {/* Rute Cabang Asal & Tujuan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Cabang Pengirim (Asal) <span className="text-error">*</span>
                                    </label>
                                    <select
                                        value={data.source_outlet_id}
                                        onChange={e => setData('source_outlet_id', e.target.value)}
                                        className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 font-semibold text-on-surface outline-none"
                                        required
                                    >
                                        {outlets.map(o => (
                                            <option key={o.id} value={o.id}>
                                                {o.name} {o.is_main ? '(Pusat)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.source_outlet_id && (
                                        <p className="text-[11px] text-error mt-1">{formErrors.source_outlet_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Cabang Penerima (Tujuan) <span className="text-error">*</span>
                                    </label>
                                    <select
                                        value={data.destination_outlet_id}
                                        onChange={e => setData('destination_outlet_id', e.target.value)}
                                        className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 font-semibold text-on-surface outline-none"
                                        required
                                    >
                                        {outlets
                                            .filter(o => String(o.id) !== String(data.source_outlet_id))
                                            .map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name} {o.is_main ? '(Pusat)' : ''}
                                                </option>
                                            ))}
                                    </select>
                                    {formErrors.destination_outlet_id && (
                                        <p className="text-[11px] text-error mt-1">{formErrors.destination_outlet_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Pilih Produk */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Pilih Produk yang Dipindahkan <span className="text-error">*</span>
                                </label>
                                <select
                                    value={data.product_id}
                                    onChange={e => setData('product_id', e.target.value)}
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 font-semibold text-on-surface outline-none"
                                    required
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Info ketersediaan stok cabang asal */}
                                <div className="mt-1.5 flex items-center justify-between text-xs bg-surface-container-high/60 px-3 py-1.5 rounded-lg text-on-surface-variant">
                                    <span>Sisa stok fisik di cabang pengirim:</span>
                                    <strong className={availableStockAtSource > 0 ? 'text-green-700' : 'text-error'}>
                                        {availableStockAtSource} unit
                                    </strong>
                                </div>
                                {formErrors.product_id && (
                                    <p className="text-[11px] text-error mt-1">{formErrors.product_id}</p>
                                )}
                            </div>

                            {/* Jumlah Unit */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Jumlah Unit yang Ditransfer <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableStockAtSource || 9999}
                                    value={data.quantity}
                                    onChange={e => setData('quantity', Number(e.target.value))}
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 font-bold text-on-surface outline-none"
                                    required
                                />
                                {formErrors.quantity && (
                                    <p className="text-[11px] text-error mt-1">{formErrors.quantity}</p>
                                )}
                            </div>

                            {/* Catatan / Keterangan */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">
                                    Catatan / Keterangan Pengiriman (Opsional)
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Contoh: Stok tambahan untuk operasional akhir pekan"
                                    className="w-full text-xs sm:text-sm bg-surface-container-low border border-outline-variant rounded-xl p-3 text-on-surface outline-none"
                                />
                            </div>

                            {/* Tombol Simpan */}
                            <div className="pt-3 border-t border-outline-variant flex items-center justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || availableStockAtSource <= 0 || data.quantity > availableStockAtSource}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 ${
                                        processing || availableStockAtSource <= 0 || data.quantity > availableStockAtSource
                                            ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
                                            : 'bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary cursor-pointer'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                                    <span>{processing ? 'Memproses...' : 'Kirim Stok Sekarang'}</span>
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
}
