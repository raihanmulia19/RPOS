import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef, useMemo } from 'react';
import SubscriptionWarningBanner from '@/Components/SubscriptionWarningBanner';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function Plans({ tenant, plans, currentPlan, latestSubscription, adminContact }) {
    const { auth, flash, errors } = usePage().props;
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [checkoutType, setCheckoutType] = useState('renew'); // 'renew' | 'switch'
    const [proofPreview, setProofPreview] = useState(null);
    const proofInputRef = useRef(null);

    const sortedPlans = useMemo(() => {
        return [...(plans || [])]
            .filter((p) => p.slug !== 'trial' && Number(p.price) > 0)
            .sort((a, b) => Number(a.price) - Number(b.price));
    }, [plans]);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const { data, setData, post, processing, reset } = useForm({
        plan_id: '',
        notes: '',
        payment_proof: null,
    });

    const openCheckoutModal = (plan, type = null) => {
        const isCurrent = tenant?.plan_id === plan.id;
        const resolvedType = type || (isCurrent ? 'renew' : 'switch');
        setCheckoutType(resolvedType);
        setSelectedPlan(plan);
        setData('plan_id', plan.id);
        setData('notes', resolvedType === 'renew' ? `Perpanjang masa aktif paket ${plan.name}` : `Ganti paket ke ${plan.name}`);
        setData('payment_proof', null);
        setProofPreview(null);
    };

    const handleProofChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('payment_proof', file);
            const reader = new FileReader();
            reader.onload = () => setProofPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const submitPayment = (e) => {
        e.preventDefault();
        post(route('subscription.checkout'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Open WhatsApp
                const storeName = tenant?.name || 'Toko Kami';
                const waNumber = adminContact?.whatsapp || '6285121210403';
                const actionLabel = checkoutType === 'renew' ? 'PERPANJANGAN PAKET' : 'GANTI KE PAKET';
                const message = encodeURIComponent(
                    `Halo Admin POS App, saya pemilik toko "${storeName}" ingin konfirmasi pembayaran ${actionLabel} "${selectedPlan?.name}" sebesar ${formatRupiah(selectedPlan?.price)} via QRIS. Mohon segera diverifikasi. Terima kasih!`
                );
                window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
                setSelectedPlan(null);
                reset();
            },
        });
    };


    const isPending = latestSubscription && latestSubscription.status === 'pending';

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Pilihan Paket Langganan SaaS" />

            {/* H-3 Warning Banner */}
            <SubscriptionWarningBanner tenant={tenant} />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={tenant} auth={auth} activePage="plans" />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

                {/* Header Description */}
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <span className="bg-secondary-fixed text-on-secondary-fixed text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Paket & Harga POS SaaS
                    </span>
                    <h2 className="font-headline-lg font-bold text-primary text-2xl sm:text-3xl lg:text-4xl">
                        Tingkatkan Performa Usaha Anda
                    </h2>
                    <p className="font-body-md text-on-surface-variant text-sm sm:text-base">
                        Pilih paket langganan yang sesuai dengan skala bisnis toko Anda. Pembayaran mudah menggunakan QRIS statis toko dan konfirmasi instan via WhatsApp.
                    </p>
                </div>

                {/* Flash Success Notification */}
                {flash?.success && (
                    <div className="bg-surface-container-low text-secondary border border-secondary-container px-5 py-4 rounded-2xl font-label-md shadow-sm flex items-start space-x-3">
                        <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
                        <div>
                            <div className="font-bold">Berhasil!</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{flash.success}</div>
                        </div>
                    </div>
                )}

                {/* Pending Verification Notice */}
                {isPending && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3">
                            <span className="material-symbols-outlined text-amber-800 text-2xl mt-0.5">pending_actions</span>
                            <div>
                                <h4 className="font-bold text-sm">Pengajuan Langganan Sedang Menunggu Verifikasi</h4>
                                <p className="text-xs text-amber-800/90 mt-0.5">
                                    Ref: <span className="font-mono font-bold">{latestSubscription.payment_reference}</span> • Paket: <strong>{latestSubscription.plan?.name}</strong> ({formatRupiah(latestSubscription.amount)}).
                                </p>
                            </div>
                        </div>

                        <a
                            href={`https://wa.me/${adminContact?.whatsapp || '6285121210403'}?text=${encodeURIComponent(`Halo Admin, mohon verifikasi pembayaran langganan toko "${tenant?.name}" untuk referensi ${latestSubscription.payment_reference}. Terima kasih.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold shadow-sm hover:bg-secondary/90 transition flex items-center space-x-1 shrink-0"
                        >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span>Hubungi Admin WhatsApp</span>
                        </a>
                    </div>
                )}

                {/* Current Active Plan Status Bar */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                        </div>
                        <div>
                            <div className="text-xs text-on-surface-variant font-medium">Status Langganan Toko Saat Ini:</div>
                            <div className="text-lg font-bold text-primary flex items-center space-x-2">
                                <span>{currentPlan?.name || 'Free Trial'}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tenant?.subscription_status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {tenant?.subscription_status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-on-surface-variant">
                        <div>
                            <span className="block text-on-surface-variant/70">Masa Aktif Sampai:</span>
                            <span className="font-bold text-on-surface text-sm">
                                {tenant?.expiration_date_formatted || 'Hari ini'}
                            </span>
                        </div>
                        <div>
                            <span className="block text-on-surface-variant/70">Sisa Hari:</span>
                            <span className="font-bold text-primary text-sm">
                                {tenant?.days_remaining ?? 0} Hari
                            </span>
                        </div>
                    </div>
                </div>

                {/* PRICING CARDS GRID */}
                <div id="pricing-cards" className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 items-stretch pt-6 pb-2 scroll-mt-24">
                    {sortedPlans.map((plan) => {
                        const isCurrent = tenant?.plan_id === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`bg-surface-container-lowest rounded-3xl p-5 sm:p-6 lg:p-8 border-2 transition-all flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                                    isCurrent
                                        ? 'border-secondary ring-2 ring-secondary/20 shadow-lg'
                                        : plan.is_popular
                                        ? 'border-secondary/80 ring-2 ring-secondary/20 shadow-md md:-translate-y-2'
                                        : 'border-outline-variant hover:border-secondary/40'
                                }`}
                            >
                                {isCurrent ? (
                                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-secondary text-on-secondary text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center space-x-1 whitespace-nowrap z-10">
                                        <span className="material-symbols-outlined text-xs">check</span>
                                        <span>Paket Anda Saat Ini</span>
                                    </div>
                                ) : plan.is_popular ? (
                                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap z-10">
                                        Paling Populer
                                    </div>
                                ) : null}

                                <div className="flex-1 flex flex-col">
                                    <div className="min-h-[58px] sm:min-h-[66px]">
                                        <h3 className="font-headline-md font-bold text-primary text-xl lg:text-2xl">
                                            {plan.name}
                                        </h3>
                                        <p className="text-xs lg:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 pb-4 border-b border-outline-variant">
                                        <div className="flex items-baseline flex-wrap gap-x-1.5">
                                            <span className="font-headline-lg font-bold text-2xl sm:text-3xl lg:text-3xl text-primary tracking-tight">
                                                {formatRupiah(plan.price)}
                                            </span>
                                            <span className="text-xs text-on-surface-variant font-medium">/ 30 hari</span>
                                        </div>
                                    </div>

                                    {/* Features Checklist */}
                                    <ul className="space-y-3 pt-3 flex-1 text-xs lg:text-sm text-on-surface">
                                        <li className="flex items-start space-x-2">
                                            <span className="material-symbols-outlined text-green-600 text-lg shrink-0 mt-0.5">check_circle</span>
                                            <span>
                                                Produk: <strong>{plan.max_products === -1 ? 'Tanpa Batas (Unlimited)' : (plan.slug === 'pro' ? 'Maks. 100' : `Maks. ${plan.max_products} Produk`)}</strong>
                                            </span>
                                        </li>
                                        <li className="flex items-start space-x-2">
                                            <span className="material-symbols-outlined text-green-600 text-lg shrink-0 mt-0.5">check_circle</span>
                                            <span>
                                                Kasir: <strong>{plan.max_staff === -1 ? 'Tanpa Batas (Unlimited)' : (plan.slug === 'pro' ? 'Maks. 3' : `Maks. ${plan.max_staff} Akun Kasir`)}</strong>
                                            </span>
                                        </li>
                                        {plan.features?.map((feat, idx) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                                <span className="material-symbols-outlined text-green-600 text-lg shrink-0 mt-0.5">check_circle</span>
                                                <span className="text-on-surface-variant font-medium">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-6 mt-6 border-t border-outline-variant/60">
                                    {isCurrent ? (
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => openCheckoutModal(plan, 'renew')}
                                                className="w-full py-3.5 px-4 rounded-xl font-label-md font-bold transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 bg-secondary text-on-secondary hover:bg-secondary/90 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-sm">autorenew</span>
                                                <span>Perpanjang Paket Ini</span>
                                            </button>
                                            <div className="text-center">
                                                <span className="inline-flex items-center text-[11px] font-semibold text-secondary space-x-1">
                                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    <span>Paket Toko Anda Saat Ini (Aktif)</span>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => openCheckoutModal(plan, 'switch')}
                                            className={`w-full py-3.5 px-4 rounded-xl font-label-md font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-2 cursor-pointer ${
                                                plan.is_popular
                                                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90 shadow-md'
                                                    : 'bg-primary text-on-primary hover:bg-primary/90'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            <span>Ganti ke Paket Ini</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* MODAL CHECKOUT & QRIS PEMBAYARAN */}
                {selectedPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-surface rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-outline-variant flex flex-col space-y-5 max-h-[95vh]">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                                <div>
                                    <div className="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-secondary mb-0.5">
                                        <span className="material-symbols-outlined text-xs">
                                            {checkoutType === 'renew' ? 'autorenew' : 'swap_horiz'}
                                        </span>
                                        <span>
                                            {checkoutType === 'renew' ? 'Perpanjangan Paket Langganan' : 'Beralih / Ganti Paket Baru'}
                                        </span>
                                    </div>
                                    <h3 className="font-headline-sm font-bold text-primary text-xl">
                                        {checkoutType === 'renew' ? `Perpanjang Paket ${selectedPlan.name}` : `Ganti ke Paket ${selectedPlan.name}`}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">
                                        {checkoutType === 'renew' 
                                            ? `Perpanjang masa aktif paket ${selectedPlan.name} (+${selectedPlan.duration_days} hari)`
                                            : `Beralih dari paket saat ini (${currentPlan?.name || 'Trial'}) ke ${selectedPlan.name}`}
                                        {' • '}Nominal: <strong className="text-secondary">{formatRupiah(selectedPlan.price)}</strong>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan(null)}
                                    className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-error transition cursor-pointer"
                                    title="Tutup dialog"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>


                            {/* QRIS BARCODE SECTION */}
                            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center space-y-3">
                                <span className="bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider inline-block">
                                    QRIS Pembayaran Resmi Platform
                                </span>

                                <div className="w-56 h-56 bg-white p-3 rounded-2xl border-2 border-secondary mx-auto flex items-center justify-center shadow-sm overflow-hidden">
                                    {selectedPlan?.qris_image_url || tenant?.subscription_qris_image_url ? (
                                        <img
                                            src={selectedPlan?.qris_image_url || tenant?.subscription_qris_image_url}
                                            alt={`Barcode QRIS Pembayaran Paket ${selectedPlan?.name}`}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="p-4 text-center space-y-2">
                                            <span className="material-symbols-outlined text-4xl text-outline block">
                                                qr_code_2
                                            </span>
                                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                                Super Admin belum mengunggah QRIS statis untuk paket ini. Silakan hubungi admin via WhatsApp untuk konfirmasi rekening/QRIS tujuan.
                                            </p>
                                            <a
                                                href={`https://wa.me/${adminContact?.whatsapp || '6285121210403'}?text=${encodeURIComponent(`Halo Admin, mohon bantuan barcode QRIS atau nomor rekening pembayaran langganan untuk toko "${tenant?.name}".`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 text-xs text-secondary font-bold hover:underline mt-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">chat</span>
                                                <span>Chat WA ({adminContact?.whatsapp_display || '0851-2121-0403'})</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs text-on-surface-variant block">Total Nominal Transfer:</span>
                                    <span className="font-headline-md font-bold text-primary text-2xl block">
                                        {formatRupiah(selectedPlan.price)}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant block">
                                        (Scan menggunakan BCA, Mandiri, BRI, GoPay, OVO, atau DANA)
                                    </span>
                                </div>
                            </div>

                            {/* UPLOAD BUKTI TRANSFER & FORM */}
                            <form onSubmit={submitPayment} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-on-surface">
                                            Lampirkan Bukti Transfer <span className="text-error font-bold">* (Wajib Diisi)</span>
                                        </label>
                                        {data.payment_proof && (
                                            <span className="text-[11px] text-green-700 font-bold flex items-center">
                                                <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                                                Siap Dikirim
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                        <input
                                            type="file"
                                            ref={proofInputRef}
                                            required
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handleProofChange}
                                            className="text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-outline-variant/60 file:cursor-pointer cursor-pointer border border-outline-variant rounded-xl p-1.5 bg-surface-container-lowest focus:border-secondary"
                                        />

                                        {proofPreview && (
                                            <div className="p-2 bg-surface-container-low border border-outline-variant rounded-xl flex items-center space-x-3">
                                                <img
                                                    src={proofPreview}
                                                    alt="Preview Bukti Transfer"
                                                    className="w-12 h-12 object-cover rounded-lg border border-outline-variant shadow-xs shrink-0"
                                                />
                                                <div className="text-xs flex-1 min-w-0">
                                                    <span className="font-bold text-green-700 flex items-center">
                                                        <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                                                        Bukti Transfer Terpilih
                                                    </span>
                                                    <span className="text-on-surface-variant text-[11px] truncate block">
                                                        {data.payment_proof?.name || 'Gambar bukti transfer'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('payment_proof', null);
                                                        setProofPreview(null);
                                                        if (proofInputRef.current) proofInputRef.current.value = '';
                                                    }}
                                                    className="p-1.5 hover:bg-error-container hover:text-on-error-container text-on-surface-variant rounded-lg transition"
                                                    title="Hapus foto bukti"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {errors.payment_proof && (
                                        <p className="text-xs text-error mt-1 flex items-center space-x-1">
                                            <span className="material-symbols-outlined text-xs">error</span>
                                            <span>{errors.payment_proof}</span>
                                        </p>
                                    )}

                                    {!data.payment_proof && (
                                        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 mt-2">
                                            <span className="material-symbols-outlined text-sm text-amber-700 shrink-0">info</span>
                                            <span>Silakan unggah foto/screenshot bukti transfer di atas agar tombol kirim aktif.</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface mb-1">
                                        Catatan / Pesan untuk Admin (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Contoh: Transfer atas nama Budi Santoso"
                                        className="w-full text-xs bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                    />
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="pt-2 flex flex-col space-y-2">
                                    <button
                                        type="submit"
                                        disabled={!data.payment_proof || processing}
                                        className={`w-full py-3.5 rounded-xl font-label-md font-bold transition-all flex items-center justify-center space-x-2 ${
                                            !data.payment_proof || processing
                                                ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/60 shadow-none'
                                                : 'bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary shadow-md cursor-pointer'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-base">chat</span>
                                        <span>
                                            {processing ? 'Menyimpan...' : 'Kirim Bukti Transfer ke WhatsApp Admin'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlan(null)}
                                        className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>


                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
