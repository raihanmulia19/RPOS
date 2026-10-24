import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@iconify/react';

export default function SubscriptionPaymentModal({
    isOpen = false,
    onClose = () => {},
    subscription = null,
    tenant = null,
    user = null,
    adminContact = {},
}) {
    if (!isOpen || !subscription) return null;

    const [isUploading, setIsUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(subscription.payment_proof_url || null);
    const [copiedRef, setCopiedRef] = useState(false);
    const [showFullQr, setShowFullQr] = useState(false);
    const fileInputRef = useRef(null);

    const plan = subscription.plan;
    const amount = subscription.amount || plan?.price || 0;
    const refCode = subscription.payment_reference || `SUB-${subscription.id}`;

    const waNumber = adminContact?.whatsapp || '6285121210403';
    const storeName = tenant?.name || 'Toko Kami';
    const ownerName = user?.name || 'Pemilik Toko';
    const ownerEmail = user?.email || '';

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleCopyRef = () => {
        navigator.clipboard?.writeText(refCode);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
    };

    const hasProof = Boolean(uploadPreview || subscription?.payment_proof_url);
    const activeProofUrl = subscription?.payment_proof_url || uploadPreview;

    // Construct WhatsApp prefilled message (clean plain text without emojis)
    const waMessage = encodeURIComponent(
`Halo Super Admin RPOS, saya pemilik toko "${storeName}" baru saja melakukan pembayaran paket langganan:

- Toko: ${storeName}
- Pemilik: ${ownerName} (${ownerEmail})
- Paket: ${plan?.name || 'Langganan RPOS'}
- Nominal: ${formatRupiah(amount)}
- No. Referensi: ${refCode}

Foto struk bukti transfer telah saya unggah di sistem dan saya lampirkan juga di pesan WhatsApp ini. Mohon bantu verifikasi dan aktifkan akun kami. Terima kasih!`
    );

    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setUploadPreview(reader.result);
        reader.readAsDataURL(file);

        setIsUploading(true);
        router.post(
            route('subscription.upload-proof', subscription.id),
            { payment_proof: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setIsUploading(false),
            }
        );
    };

    const qrisUrl = plan?.qris_image_url || tenant?.subscription_qris_image_url;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant max-w-lg w-full overflow-hidden flex flex-col my-auto max-h-[95vh]">
                
                {/* Header */}
                <div className="bg-surface-container-low px-5 py-4 border-b border-outline-variant flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                            <Icon icon="solar:qr-code-bold" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary text-base sm:text-lg">
                                Pembayaran Paket {plan?.name || 'Langganan'}
                            </h3>
                            <span className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Menunggu Validasi Super Admin</span>
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-error transition"
                        title="Tutup pop-up"
                    >
                        <Icon icon="solar:close-circle-bold" className="text-xl" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                    
                    {/* Amount & Reference Code Box */}
                    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-center space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                            Total Tagihan Pembayaran
                        </span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                            {formatRupiah(amount)}
                        </div>
                        
                        <div className="pt-2 flex items-center justify-center gap-2">
                            <span className="text-xs text-on-surface-variant">Kode Referensi:</span>
                            <span className="font-mono font-bold text-xs bg-surface-container-high px-2.5 py-1 rounded-md text-on-surface border border-outline-variant/60">
                                {refCode}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyRef}
                                className="inline-flex items-center space-x-1 text-xs text-secondary font-bold hover:underline"
                                title="Salin Kode Referensi"
                            >
                                <Icon icon={copiedRef ? "solar:check-circle-bold" : "solar:copy-bold"} className="text-sm" />
                                <span>{copiedRef ? 'Tersalin' : 'Salin'}</span>
                            </button>
                        </div>
                    </div>

                    {/* QRIS BARCODE SECTION */}
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant text-center space-y-3">
                        <div className="inline-flex items-center space-x-1.5 bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            <Icon icon="solar:shield-check-bold" className="text-sm" />
                            <span>QRIS Statis Resmi Platform</span>
                        </div>

                        {/* Barcode Frame */}
                        <div className="w-60 h-60 bg-white p-3 rounded-2xl border-2 border-secondary mx-auto flex items-center justify-center shadow-md overflow-hidden relative group">
                            {qrisUrl ? (
                                <>
                                    <img
                                        src={qrisUrl}
                                        alt={`QRIS Pembayaran Paket ${plan?.name}`}
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => setShowFullQr(true)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowFullQr(true)}
                                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-xs font-bold"
                                    >
                                        <Icon icon="solar:magnifer-zoom-in-bold" className="text-base" />
                                        <span>Perbesar QRIS</span>
                                    </button>
                                </>
                            ) : (
                                <div className="p-4 text-center space-y-2">
                                    <Icon icon="solar:qr-code-bold" className="text-5xl text-outline mx-auto" />
                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                        Super Admin belum mengunggah gambar barcode QRIS statis untuk paket ini.
                                    </p>
                                    <p className="text-[11px] text-secondary font-semibold">
                                        Silakan langsung klik tombol WhatsApp di bawah untuk meminta kode QR / no. rekening.
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-xs mx-auto">
                            Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay) lalu scan barcode QRIS di atas.
                        </p>
                    </div>

                    {/* Store Info Mini List */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3 text-xs space-y-1.5 text-on-surface">
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Nama Usaha/Toko:</span>
                            <span className="font-bold">{storeName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Pemilik:</span>
                            <span className="font-medium">{ownerName} ({ownerEmail})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Durasi Paket:</span>
                            <span className="font-medium">{plan?.duration_days || 30} Hari Masa Aktif</span>
                        </div>
                    </div>

                    {/* Upload Payment Proof (WAJIB) */}
                    <div className="border border-dashed border-outline-variant rounded-2xl p-4 bg-surface-container-low/40 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-on-surface flex items-center gap-1">
                                <span className="text-error font-extrabold text-sm">*</span>
                                <span>Unggah Bukti Transfer:</span>
                            </span>
                            {hasProof ? (
                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                    <Icon icon="solar:check-circle-bold" />
                                    <span>Struk Terunggah</span>
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-error bg-error-container px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                    Wajib Diisi
                                </span>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Upload Card Preview / Trigger */}
                        {hasProof && activeProofUrl ? (
                            <div className="bg-surface-container-lowest p-2.5 rounded-2xl border border-green-300 flex items-center justify-between gap-2 shadow-xs">
                                <div className="flex items-center space-x-2.5 overflow-hidden">
                                    <img
                                        src={activeProofUrl}
                                        alt="Struk Transfer"
                                        className="w-11 h-11 object-cover rounded-xl border border-outline-variant shrink-0"
                                    />
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-green-800 truncate">
                                            Struk Tersimpan
                                        </div>
                                        <div className="text-[11px] text-on-surface-variant truncate">
                                            Siap divalidasi Super Admin
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => window.open(activeProofUrl, '_blank')}
                                        className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary"
                                        title="Lihat foto struk"
                                    >
                                        <Icon icon="solar:eye-bold" className="text-base" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface"
                                    >
                                        {isUploading ? '...' : 'Ganti'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3.5 rounded-2xl border-2 border-dashed border-error/50 hover:border-error bg-error-container/10 hover:bg-error-container/20 cursor-pointer transition text-center space-y-1"
                            >
                                <Icon icon="solar:camera-add-bold" className="text-2xl text-error mx-auto" />
                                <div className="text-xs font-bold text-error">
                                    {isUploading ? 'Sedang Mengunggah...' : 'Klik untuk Unggah Struk TF (Wajib)'}
                                </div>
                                <p className="text-[10px] text-on-surface-variant">
                                    Ambil foto struk ATM / screenshot mutasi m-Banking Anda.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="space-y-2.5 pt-1">
                        {/* WhatsApp Validation Button: Enabled ONLY if proof is uploaded */}
                        {hasProof ? (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 shadow-green-500/20 ring-2 ring-[#25D366]/40"
                            >
                                <Icon icon="logos:whatsapp-icon" className="text-xl" />
                                <span>Konfirmasi & Kirim Struk ke WA Admin</span>
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    alert('Mohon unggah foto struk bukti transfer pembayaran terlebih dahulu!');
                                }}
                                className="w-full py-3.5 px-4 bg-surface-container-high text-on-surface-variant/70 rounded-2xl font-bold text-xs sm:text-sm border-2 border-dashed border-outline-variant flex items-center justify-center space-x-2 cursor-pointer hover:bg-surface-container-highest transition-colors"
                            >
                                <Icon icon="solar:lock-bold" className="text-base text-outline" />
                                <span>Unggah Struk Dahulu untuk Buka WhatsApp</span>
                            </button>
                        )}

                        {hasProof ? (
                            <p className="text-[10px] text-green-700 bg-green-50 border border-green-200/60 p-2 rounded-xl flex items-start gap-1.5 leading-snug">
                                <Icon icon="solar:check-circle-bold" className="text-xs shrink-0 mt-0.5 text-green-600" />
                                <span>
                                    <strong>Struk terunggah!</strong> Bukti struk berhasil disimpan di sistem. Silakan klik tombol di atas untuk konfirmasi ke WhatsApp Super Admin.
                                </span>
                            </p>
                        ) : (
                            <p className="text-[10px] text-error bg-error-container/20 border border-error/30 p-2 rounded-xl flex items-start gap-1.5 leading-snug">
                                <Icon icon="solar:danger-triangle-bold" className="text-xs shrink-0 mt-0.5 text-error" />
                                <span>
                                    <strong>Bukti transfer wajib diisi</strong> agar Super Admin dapat memverifikasi pembayaran Anda.
                                </span>
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox for QRIS Barcode */}
            {showFullQr && qrisUrl && (
                <div 
                    className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowFullQr(false)}
                >
                    <div className="bg-white p-4 rounded-3xl max-w-sm w-full text-center space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-primary text-base">QRIS Paket {plan?.name}</h4>
                        <img src={qrisUrl} alt="QRIS Full" className="w-full aspect-square object-contain mx-auto" />
                        <div className="text-xs text-on-surface-variant">
                            Nominal: <strong className="text-primary">{formatRupiah(amount)}</strong>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFullQr(false)}
                            className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
