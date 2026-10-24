import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import SubscriptionWarningBanner from '@/Components/SubscriptionWarningBanner';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function TenantSettings({ tenant }) {
    const { auth, flash } = usePage().props;
    const isPaymentGatewayAllowed = ['pro', 'enterprise'].includes(tenant?.plan?.slug);
    const [logoPreview, setLogoPreview] = useState(tenant.logo_url || null);
    const [qrisPreview, setQrisPreview] = useState(tenant.qris_image_url || null);

    const logoInputRef = useRef(null);
    const qrisInputRef = useRef(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        _method: 'patch',
        name: tenant.name || '',
        phone: tenant.phone || '',
        show_phone_on_receipt: tenant.show_phone_on_receipt !== undefined && tenant.show_phone_on_receipt !== null ? Boolean(tenant.show_phone_on_receipt) : true,
        address: tenant.address || '',
        tax_percentage: tenant.tax_percentage ?? 11,
        logo: null,
        remove_logo: false,
        qris_type: tenant.qris_type || 'static',
        qris_image: null,
        remove_qris_image: false,
        midtrans_server_key: '',
        remove_midtrans_server_key: false,
        midtrans_client_key: tenant.midtrans_client_key || '',
        midtrans_is_production: Boolean(tenant.midtrans_is_production),
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                logo: file,
                remove_logo: false,
            }));
            const reader = new FileReader();
            reader.onload = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setData((prev) => ({
            ...prev,
            logo: null,
            remove_logo: true,
        }));
        setLogoPreview(null);
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const handleQrisChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                qris_image: file,
                remove_qris_image: false,
            }));
            const reader = new FileReader();
            reader.onload = () => {
                setQrisPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveQris = () => {
        setData((prev) => ({
            ...prev,
            qris_image: null,
            remove_qris_image: true,
        }));
        setQrisPreview(null);
        if (qrisInputRef.current) {
            qrisInputRef.current.value = '';
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('tenant.settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Pengaturan Toko, Logo & QRIS" />

            {/* H-3 Warning Banner */}
            <SubscriptionWarningBanner tenant={tenant} />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={tenant} auth={auth} activePage="settings" />

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-headline-sm sm:font-headline-md font-bold text-on-surface flex items-center">
                            <span className="material-symbols-outlined text-secondary mr-2">storefront</span>
                            Identitas Toko & Konfigurasi QRIS
                        </h2>
                        <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
                            Ubah nama toko, upload logo resmi, foto barcode QRIS, dan tarif pajak toko Anda.
                        </p>
                    </div>

                    {tenant.subscription_status && (
                        <div className="flex items-center space-x-2 bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant shrink-0 w-fit">
                            <span className="text-xs font-semibold text-on-surface-variant uppercase">Langganan:</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed">
                                {tenant.subscription_status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Flash Success Notification */}
                {flash?.success && (
                    <div className="bg-surface-container-low text-secondary border border-secondary-container px-5 py-3.5 rounded-2xl font-label-md shadow-sm flex items-center space-x-2">
                        <span className="material-symbols-outlined text-secondary">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Flash Info / Onboarding Notification */}
                {flash?.info && (
                    <div className="bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 px-5 py-3.5 rounded-2xl font-label-md shadow-sm flex items-start space-x-3">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5">info</span>
                        <div>
                            <p className="font-semibold text-xs sm:text-sm">{flash.info}</p>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                                Lengkapi alamat toko dan preferensi struk Anda agar kasir siap melayani transaksi.
                            </p>
                        </div>
                    </div>
                )}

                {/* Onboarding Notice jika Alamat Toko Belum Diisi */}
                {!tenant.address && !flash?.info && (
                    <div className="bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 p-4 rounded-2xl shadow-sm flex items-start space-x-3">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl shrink-0 mt-0.5">assignment_late</span>
                        <div>
                            <h4 className="font-bold text-sm text-primary dark:text-amber-200">Lengkapi Data Identitas Toko</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                Mohon lengkapi <strong>Alamat Toko (Wajib Diisi)</strong> serta tentukan apakah nomor telepon dicetak di struk thermal sebelum kasir memulai penjualan.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    
                    {/* CARD 1: LOGO & NAMA TOKO */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant space-y-6">
                        <div className="border-b border-outline-variant pb-4">
                            <h3 className="font-headline-sm font-bold text-primary flex items-center">
                                <span className="material-symbols-outlined text-secondary mr-2">image</span>
                                Logo & Nama Toko
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Nama dan logo ini akan otomatis muncul pada navbar admin, terminal kasir POS, kepala struk thermal, dan laporan PDF.
                            </p>
                        </div>

                        {/* Upload & Preview Logo */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-2xl bg-surface-container-high border-2 border-dashed border-outline flex items-center justify-center overflow-hidden shadow-sm relative">
                                    {logoPreview ? (
                                        <img 
                                            src={logoPreview} 
                                            alt="Preview Logo Toko" 
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-outline">
                                            store
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
                                    {logoPreview ? 'Logo Aktif' : 'Belum Ada Logo'}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <label className="block font-label-sm font-semibold text-on-surface">
                                    Upload Berkas Logo (JPG, PNG, WebP, SVG - Maks. 2MB)
                                </label>
                                
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="file"
                                        ref={logoInputRef}
                                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                        onChange={handleLogoChange}
                                        className="text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                                    />

                                    {logoPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="px-3 py-1.5 text-xs text-error hover:bg-error-container hover:text-on-error-container rounded-xl font-semibold transition flex items-center space-x-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                            <span>Hapus Logo</span>
                                        </button>
                                    )}
                                </div>
                                {errors.logo && (
                                    <p className="text-xs text-error font-medium">{errors.logo}</p>
                                )}
                            </div>
                        </div>

                        {/* Input Nama Toko & Kontak */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">
                                    Nama Toko / Usaha <span className="text-error">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    value={data.name} 
                                    onChange={(e) => setData('name', e.target.value)} 
                                    placeholder="Contoh: Kopi Karsa / Resto Barokah" 
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md"
                                />
                                {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="phone_input" className="block font-label-sm font-semibold text-on-surface">
                                        Nomor Telepon Toko
                                    </label>
                                    <label 
                                        htmlFor="show_phone_on_receipt" 
                                        className={`inline-flex items-center space-x-1.5 cursor-pointer select-none px-2 py-0.5 rounded-lg border text-[11px] font-medium transition ${
                                            data.show_phone_on_receipt 
                                                ? 'bg-secondary/10 border-secondary/40 text-secondary' 
                                                : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
                                        }`}
                                        title={data.show_phone_on_receipt ? 'Nomor telepon dicetak pada struk kasir' : 'Nomor telepon tidak dicetak pada struk kasir'}
                                    >
                                        <input 
                                            id="show_phone_on_receipt" 
                                            type="checkbox" 
                                            checked={Boolean(data.show_phone_on_receipt)} 
                                            onChange={(e) => setData('show_phone_on_receipt', e.target.checked)} 
                                            className="w-3.5 h-3.5 rounded text-secondary border-outline-variant focus:ring-secondary cursor-pointer"
                                        />
                                        <span>Cetak di struk</span>
                                    </label>
                                </div>
                                <input 
                                    id="phone_input"
                                    type="text" 
                                    value={data.phone} 
                                    onChange={(e) => setData('phone', e.target.value)} 
                                    placeholder="0812-3456-7890" 
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md"
                                />
                                {errors.phone && <p className="text-xs text-error mt-1">{errors.phone}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">
                                    Alamat Toko (Dicetak pada Struk Kasir) <span className="text-error font-bold">*</span>
                                </label>
                                <textarea 
                                    rows={3} 
                                    required
                                    value={data.address} 
                                    onChange={(e) => setData('address', e.target.value)} 
                                    placeholder="Contoh: Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan" 
                                    className={`w-full bg-surface-container-lowest border rounded-xl p-3 font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary ${
                                        errors.address ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                                    }`}
                                />
                                <p className="text-[11px] text-on-surface-variant mt-1">
                                    Alamat resmi toko wajib diisi dan dicetak pada bagian kepala struk kasir thermal 58mm serta dokumen laporan keuangan.
                                </p>
                                {errors.address && <p className="text-xs text-error font-medium mt-1">{errors.address}</p>}
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: PENGATURAN PAJAK */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant space-y-4">
                        <div className="border-b border-outline-variant pb-4">
                            <h3 className="font-headline-sm font-bold text-primary flex items-center">
                                <span className="material-symbols-outlined text-secondary mr-2">receipt_long</span>
                                Tarif Pajak Transaksi (PPN / PB1)
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Persentase pajak yang dikenakan pada saat pelanggan melakukan pembayaran di kasir.
                            </p>
                        </div>

                        <div className="max-w-xs">
                            <label className="block font-label-sm font-semibold text-on-surface mb-2">
                                Persentase Pajak (%) <span className="text-error font-bold">*</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0" 
                                    max="100" 
                                    required 
                                    value={data.tax_percentage} 
                                    onChange={(e) => setData('tax_percentage', e.target.value)} 
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md pr-10"
                                />
                                <span className="absolute right-4 top-3.5 font-bold text-on-surface-variant">%</span>
                            </div>
                            <span className="text-xs text-on-surface-variant mt-1 block">
                                Isi 0 jika usaha Anda tidak mengenakan pajak penjualan.
                            </span>
                            {errors.tax_percentage && <p className="text-xs text-error mt-1">{errors.tax_percentage}</p>}
                        </div>
                    </div>

                    {/* CARD 3: METODE QRIS TOKO (STATIS MANUAL VS DINAMIS MIDTRANS) */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant space-y-6">
                        <div className="border-b border-outline-variant pb-4">
                            <h3 className="font-headline-sm font-bold text-primary flex items-center">
                                <span className="material-symbols-outlined text-secondary mr-2">qr_code_scanner</span>
                                Metode Pembayaran QRIS Toko
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Pilih metode QRIS yang digunakan toko Anda: scan foto QRIS statis Anda sendiri, atau QRIS dinamis via payment gateway.
                            </p>
                        </div>

                        {/* Pilihan Metode QRIS (Radio Button Tabs) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                onClick={() => setData('qris_type', 'static')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                                    data.qris_type === 'static'
                                        ? 'border-secondary bg-surface-container-low shadow-sm'
                                        : 'border-outline-variant hover:bg-surface-container-low/50'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="qris_type" 
                                    value="static" 
                                    checked={data.qris_type === 'static'} 
                                    onChange={() => setData('qris_type', 'static')}
                                    className="mt-1 text-secondary focus:ring-secondary cursor-pointer"
                                />
                                <div>
                                    <div className="font-bold text-primary text-sm flex items-center space-x-1.5">
                                        <span>QRIS Statis Manual</span>
                                        <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            Rekomendasi UMKM
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Upload foto barcode QRIS toko Anda (BCA, Mandiri, BRI, GoPay Merchant, Dana Bisnis). Kasir verifikasi bukti transfer secara manual.
                                    </p>
                                </div>
                            </div>

                            <div 
                                onClick={() => {
                                    if (isPaymentGatewayAllowed) {
                                        setData('qris_type', 'dynamic');
                                    }
                                }}
                                className={`p-4 rounded-xl border-2 transition-all flex items-start space-x-3 relative ${
                                    !isPaymentGatewayAllowed 
                                        ? 'border-outline-variant bg-surface-container-low/40 opacity-80 cursor-not-allowed'
                                        : data.qris_type === 'dynamic'
                                            ? 'border-secondary bg-surface-container-low shadow-sm cursor-pointer'
                                            : 'border-outline-variant hover:bg-surface-container-low/50 cursor-pointer'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="qris_type" 
                                    value="dynamic" 
                                    disabled={!isPaymentGatewayAllowed}
                                    checked={data.qris_type === 'dynamic'} 
                                    onChange={() => isPaymentGatewayAllowed && setData('qris_type', 'dynamic')}
                                    className="mt-1 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-primary text-sm">QRIS Dinamis Otomatis (Payment Gateway)</div>
                                        {!isPaymentGatewayAllowed && (
                                            <Link 
                                                href={route('subscription.plans')}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300/50 hover:bg-amber-200 transition"
                                            >
                                                <span className="material-symbols-outlined text-[11px]">lock</span>
                                                <span>PRO</span>
                                            </Link>
                                        )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Membuat barcode QRIS otomatis per transaksi dengan nominal terisi via Midtrans API Payment Gateway.
                                    </p>
                                    {!isPaymentGatewayAllowed && (
                                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-2 font-medium">
                                            Fitur ini khusus paket Pro & Enterprise. <Link href={route('subscription.plans')} className="underline font-bold">Upgrade sekarang →</Link>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {errors.qris_type && (
                            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                                <span className="material-symbols-outlined text-sm text-red-600">error</span>
                                <span>{errors.qris_type}</span>
                            </div>
                        )}

                        {/* JIKA MEMILIH QRIS STATIS: UPLOAD FOTO BARCODE QRIS */}
                        {data.qris_type === 'static' && (
                            <div className="p-5 bg-surface-container-low rounded-xl border border-outline-variant space-y-4 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 rounded-xl bg-white border-2 border-dashed border-outline flex items-center justify-center overflow-hidden shadow-sm p-2">
                                            {qrisPreview ? (
                                                <img 
                                                    src={qrisPreview} 
                                                    alt="Preview Barcode QRIS" 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="text-center p-2">
                                                    <span className="material-symbols-outlined text-4xl text-outline block">
                                                        qr_code_2
                                                    </span>
                                                    <span className="text-[10px] text-on-surface-variant block mt-1 font-medium">
                                                        Belum Ada Barcode
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <label className="block font-label-sm font-semibold text-on-surface">
                                            Upload Foto Barcode QRIS Toko Anda (JPG, PNG, WebP - Maks. 2MB)
                                        </label>
                                        <p className="text-xs text-on-surface-variant">
                                            Foto QRIS ini akan ditampilkan di terminal kasir saat pelanggan memilih metode pembayaran QRIS.
                                        </p>

                                        <div className="flex items-center space-x-3 pt-1">
                                            <input 
                                                type="file"
                                                ref={qrisInputRef}
                                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                                onChange={handleQrisChange}
                                                className="text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-on-secondary hover:file:bg-secondary/90 file:cursor-pointer cursor-pointer"
                                            />

                                            {qrisPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveQris}
                                                    className="px-3 py-1.5 text-xs text-error hover:bg-error-container hover:text-on-error-container rounded-xl font-semibold transition flex items-center space-x-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                    <span>Hapus QRIS</span>
                                                </button>
                                            )}
                                        </div>
                                        {errors.qris_image && (
                                            <p className="text-xs text-error font-medium">{errors.qris_image}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* JIKA MEMILIH QRIS DINAMIS: INPUT MIDTRANS KEYS */}
                        {data.qris_type === 'dynamic' && (
                            <div className="p-5 bg-surface-container-low rounded-xl border border-outline-variant space-y-4 animate-fade-in">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block font-label-sm font-semibold text-on-surface">
                                            Midtrans Server Key (Rahasia)
                                        </label>
                                        {tenant.has_midtrans_server_key && !data.remove_midtrans_server_key && (
                                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-xs mr-1">lock</span>
                                                Tersimpan Terenkripsi ({tenant.masked_midtrans_server_key})
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        type="password" 
                                        value={data.midtrans_server_key} 
                                        onChange={(e) => {
                                            setData(prev => ({
                                                ...prev,
                                                midtrans_server_key: e.target.value,
                                                remove_midtrans_server_key: false,
                                            }));
                                        }} 
                                        placeholder={tenant.has_midtrans_server_key && !data.remove_midtrans_server_key ? "Biarkan kosong untuk mempertahankan Key yang tersimpan" : "SB-Mid-server-xxxxxxxxxxxx / Mid-server-xxxxxxxxxxxx"} 
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md font-mono text-sm"
                                    />
                                    <div className="flex items-center justify-between mt-1 text-xs">
                                        <span className="text-on-surface-variant">
                                            {tenant.has_midtrans_server_key && !data.remove_midtrans_server_key
                                                ? 'Key Anda tersimpan aman dan tidak pernah dikirim ke browser kasir.'
                                                : 'Biarkan kosong jika ingin menggunakan API Key bawaan platform.'}
                                        </span>
                                        {tenant.has_midtrans_server_key && !data.remove_midtrans_server_key && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(prev => ({
                                                        ...prev,
                                                        midtrans_server_key: '',
                                                        remove_midtrans_server_key: true,
                                                    }));
                                                }}
                                                className="text-error hover:underline font-medium ml-2 shrink-0 cursor-pointer"
                                            >
                                                Hapus Key
                                            </button>
                                        )}
                                        {data.remove_midtrans_server_key && (
                                            <span className="text-amber-600 font-medium">
                                                Key akan dihapus saat disimpan.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">
                                        Midtrans Client Key
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.midtrans_client_key} 
                                        onChange={(e) => setData('midtrans_client_key', e.target.value)} 
                                        placeholder="SB-Mid-client-xxxxxxxxxxxx" 
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md font-mono text-sm"
                                    />
                                </div>

                                <div className="flex items-center space-x-3 pt-2">
                                    <input 
                                        id="midtrans_is_production" 
                                        type="checkbox" 
                                        checked={data.midtrans_is_production} 
                                        onChange={(e) => setData('midtrans_is_production', e.target.checked)} 
                                        className="w-4 h-4 rounded text-secondary border-outline-variant focus:ring-secondary cursor-pointer"
                                    />
                                    <label htmlFor="midtrans_is_production" className="font-body-md text-on-surface cursor-pointer select-none text-sm">
                                        Gunakan Lingkungan Production (Centang hanya jika akun Midtrans Anda sudah Live)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2 flex items-center justify-between">
                        {recentlySuccessful && (
                            <span className="text-secondary font-label-md flex items-center space-x-1">
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>Tersimpan dengan sukses!</span>
                            </span>
                        )}

                        <button 
                            type="submit" 
                            disabled={processing} 
                            className="ml-auto px-8 py-3.5 bg-secondary text-on-secondary font-label-lg rounded-xl shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50 active:scale-95 flex items-center space-x-2"
                        >
                            <span className="material-symbols-outlined text-sm">save</span>
                            <span>{processing ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
