import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

export default function WaitingApproval({
    tenant,
    subscription,
    plan,
    user,
    adminContact = {},
}) {
    const { flash } = usePage().props;
    const [copiedRef, setCopiedRef] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(subscription?.payment_proof_url || null);
    const [showFullQr, setShowFullQr] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const fileInputRef = useRef(null);

    const storeName = tenant?.name || 'Toko Anda';
    const ownerName = user?.name || 'Pemilik Toko';
    const ownerEmail = user?.email || '';
    const planName = plan?.name || subscription?.plan?.name || 'Langganan RPOS';
    const amount = subscription?.amount || plan?.price || 0;
    const refCode = subscription?.payment_reference || `SUB-${subscription?.id || 'REF'}`;
    const waNumber = adminContact?.whatsapp || '6285121210403';
    const qrisUrl = plan?.qris_image_url || tenant?.subscription_qris_image_url;

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const handleCopyRef = () => {
        navigator.clipboard?.writeText(refCode);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
    };

    const handleCheckStatus = () => {
        setIsChecking(true);
        router.reload({
            onFinish: () => setIsChecking(false),
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !subscription) return;

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

    const hasProof = Boolean(uploadPreview || subscription?.payment_proof_url);
    const activeProofUrl = subscription?.payment_proof_url || uploadPreview;

    // Pre-filled WhatsApp message (clean plain text without emojis to prevent broken symbols)
    const waMessage = encodeURIComponent(
`Halo Super Admin RPOS, saya pemilik toko "${storeName}" baru saja mendaftar akun dan melakukan pembayaran paket langganan:

- Toko: ${storeName}
- Pemilik: ${ownerName} (${ownerEmail})
- Paket: ${planName}
- Nominal: ${formatRupiah(amount)}
- No. Referensi: ${refCode}

Foto struk bukti transfer telah saya unggah di sistem dan saya lampirkan juga di pesan WhatsApp ini. Mohon divalidasi dan diaktifkan akun toko kami agar bisa mulai login ke terminal kasir. Terima kasih!`
    );

    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    return (
        <div className="min-h-screen bg-surface-container-low font-body-md text-on-surface flex flex-col justify-between p-4 sm:p-6 lg:p-8">
            <Head title="Menunggu Konfirmasi & Verifikasi Super Admin - POS SaaS" />

            {/* Top Navbar */}
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6">
                <Link href="/" className="flex items-center space-x-3">
                    <img 
                        alt="RPOS Logo" 
                        className="h-10 w-auto object-contain rounded-xl shadow-xs" 
                        src="/brand-logo.png" 
                    />
                    <div className="flex flex-col">
                        <span className="font-headline-md font-bold text-primary tracking-tight leading-tight text-base sm:text-lg">
                            KopiKarsa POS
                        </span>
                        <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                            Platform Cloud Kasir
                        </span>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-error transition shadow-xs"
                >
                    <Icon icon="solar:logout-2-bold" className="text-base" />
                    <span>Keluar / Logout</span>
                </button>
            </div>

            {/* Main Center Card */}
            <div className="max-w-4xl mx-auto w-full my-auto">
                <div className="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant overflow-hidden">
                    
                    {/* Amber Notice Header */}
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0 shadow-xs">
                                <Icon icon="solar:clock-circle-bold" className="text-2xl animate-spin-slow" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-amber-950 text-sm sm:text-base">
                                        Menunggu Verifikasi & Konfirmasi Super Admin
                                    </h2>
                                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                        Pending
                                    </span>
                                </div>
                                <p className="text-xs text-amber-800/90 mt-0.5">
                                    Akun Anda belum aktif. Akses login terminal kasir & dashboard akan terbuka otomatis setelah pembayaran diverifikasi admin.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCheckStatus}
                            disabled={isChecking}
                            className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 shadow-xs active:scale-95"
                            title="Periksa apakah Super Admin sudah menyetujui akun Anda"
                        >
                            <Icon icon="solar:refresh-bold" className={`text-sm ${isChecking ? 'animate-spin' : ''}`} />
                            <span>{isChecking ? 'Memeriksa...' : 'Cek Status Aktivasi'}</span>
                        </button>
                    </div>

                    {/* Flash Success Notification */}
                    {flash?.success && (
                        <div className="m-6 mb-0 bg-green-50 text-green-900 border border-green-200 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2">
                            <Icon icon="solar:check-circle-bold" className="text-green-600 text-lg shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* Dual Column Layout: Details on Left, QRIS on Right */}
                    <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: Store Details & WA Button */}
                        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                                        Instruksi Pembayaran Langganan
                                    </span>
                                    <h3 className="font-headline-md font-bold text-primary text-xl sm:text-2xl">
                                        Selesaikan Pembayaran Paket {planName}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                                        Silakan lakukan pembayaran via QRIS statis resmi di samping, lalu kirim bukti transfer ke WhatsApp Super Admin untuk diverifikasi & diaktifkan secara instan.
                                    </p>
                                </div>

                                {/* Billing Breakdown Box */}
                                <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                                        <span className="text-xs text-on-surface-variant">Toko Terdaftar:</span>
                                        <span className="font-bold text-sm text-primary">{storeName}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                                        <span className="text-xs text-on-surface-variant">Pemilik Toko:</span>
                                        <span className="font-semibold text-xs text-on-surface">{ownerName} ({ownerEmail})</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                                        <span className="text-xs text-on-surface-variant">Paket Dipilih:</span>
                                        <span className="font-bold text-xs text-secondary">
                                            {planName} ({plan?.duration_days || 30} Hari Masa Aktif)
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
                                        <span className="text-xs text-on-surface-variant">Kode Referensi:</span>
                                        <div className="flex items-center space-x-1.5">
                                            <span className="font-mono font-bold text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface">
                                                {refCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleCopyRef}
                                                className="text-xs text-secondary font-bold hover:underline inline-flex items-center"
                                                title="Salin referensi"
                                            >
                                                <Icon icon={copiedRef ? "solar:check-circle-bold" : "solar:copy-bold"} className="text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 text-base">
                                        <span className="font-bold text-on-surface text-xs sm:text-sm">Total Nominal Transfer:</span>
                                        <span className="font-extrabold text-primary text-lg sm:text-xl">
                                            {formatRupiah(amount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Step Instructions */}
                                <div className="space-y-2 text-xs text-on-surface-variant">
                                    <div className="flex items-start space-x-2">
                                        <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                                        <span>Scan barcode QRIS statis resmi platform di samping menggunakan m-Banking atau E-Wallet apa saja.</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                                        <span>Pastikan nominal transfer sesuai tagihan tepat <strong>{formatRupiah(amount)}</strong>.</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                                        <span>Klik tombol hijau di bawah untuk konfirmasi ke WhatsApp Super Admin agar toko segera divalidasi dan diaktifkan.</span>
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Confirmation Action Button */}
                            <div className="space-y-2.5 pt-2">
                                {hasProof ? (
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 px-5 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center space-x-2.5 shadow-green-500/20 ring-2 ring-[#25D366]/40"
                                    >
                                        <Icon icon="logos:whatsapp-icon" className="text-2xl" />
                                        <span>Kirim Konfirmasi & Struk ke WA Admin</span>
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            alert('Mohon unggah foto struk bukti transfer pembayaran terlebih dahulu!');
                                        }}
                                        className="w-full py-4 px-5 bg-surface-container-high text-on-surface-variant/70 rounded-2xl font-bold text-xs sm:text-sm border-2 border-dashed border-outline-variant flex items-center justify-center space-x-2 cursor-pointer hover:bg-surface-container-highest transition-colors"
                                    >
                                        <Icon icon="solar:lock-bold" className="text-lg text-outline" />
                                        <span>Unggah Struk Dahulu untuk Buka WhatsApp</span>
                                    </button>
                                )}

                                {hasProof ? (
                                    <p className="text-[11px] text-green-700 bg-green-50 border border-green-200/60 p-2.5 rounded-xl flex items-start gap-1.5 leading-snug">
                                        <Icon icon="solar:check-circle-bold" className="text-sm shrink-0 mt-0.5 text-green-600" />
                                        <span>
                                            <strong>Struk terunggah!</strong> Bukti struk pembayaran berhasil disimpan di sistem. Silakan klik tombol di atas untuk kirim konfirmasi ke WhatsApp Super Admin.
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-error bg-error-container/20 border border-error/30 p-2.5 rounded-xl flex items-start gap-1.5 leading-snug">
                                        <Icon icon="solar:danger-triangle-bold" className="text-sm shrink-0 mt-0.5 text-error" />
                                        <span>
                                            <strong>Bukti transfer wajib diunggah.</strong> Anda harus mengunggah foto struk terlebih dahulu di kolom sebelah kanan agar tombol konfirmasi WhatsApp dapat digunakan.
                                        </span>
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 pt-1">
                                    <span>Kontak WhatsApp: <strong>{adminContact?.whatsapp_display || '0851-2121-0403'}</strong></span>
                                    <span>Respon Cepat 24/7</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: QRIS Barcode & Upload Struk */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-surface-container-low p-6 rounded-3xl border border-outline-variant space-y-4 text-center">
                            
                            <div className="space-y-1">
                                <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                                    QRIS Statis Resmi Platform
                                </span>
                                <h4 className="font-bold text-primary text-sm">
                                    Barcode Pembayaran Paket {planName}
                                </h4>
                            </div>

                            {/* Barcode Display Box */}
                            <div className="w-56 h-56 sm:w-60 sm:h-60 bg-white p-3 rounded-2xl border-2 border-secondary flex items-center justify-center shadow-md overflow-hidden relative group">
                                {qrisUrl ? (
                                    <>
                                        <img
                                            src={qrisUrl}
                                            alt={`QRIS ${planName}`}
                                            className="w-full h-full object-contain cursor-pointer"
                                            onClick={() => setShowFullQr(true)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowFullQr(true)}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-xs font-bold"
                                        >
                                            <Icon icon="solar:magnifer-zoom-in-bold" className="text-base" />
                                            <span>Perbesar Barcode</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 text-center space-y-2">
                                        <Icon icon="solar:qr-code-bold" className="text-5xl text-outline mx-auto" />
                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                            Super Admin sedang memperbarui QRIS statis paket ini.
                                        </p>
                                        <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 text-xs text-secondary font-bold hover:underline"
                                        >
                                            <span>Minta QRIS via WA &rarr;</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-on-surface-variant max-w-xs leading-relaxed">
                                Mendukung seluruh aplikasi perbankan (BCA, Mandiri, BRI, BNI, Permata) serta dompet digital (GoPay, OVO, DANA, ShopeePay).
                            </p>

                            {/* Upload Bukti Struk Transfer (WAJIB) */}
                            <div className="w-full pt-3 border-t border-outline-variant/60 space-y-2.5 text-left">
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
                                                className="w-12 h-12 object-cover rounded-xl border border-outline-variant shrink-0"
                                            />
                                            <div className="overflow-hidden">
                                                <div className="text-xs font-bold text-green-800 truncate">
                                                    Struk Pembayaran Tersimpan
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
                                                title="Lihat foto struk penuh"
                                            >
                                                <Icon icon="solar:eye-bold" className="text-base" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface"
                                                title="Ganti foto struk"
                                            >
                                                {isUploading ? '...' : 'Ganti'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-4 rounded-2xl border-2 border-dashed border-error/50 hover:border-error bg-error-container/10 hover:bg-error-container/20 cursor-pointer transition text-center space-y-1.5"
                                    >
                                        <Icon icon="solar:camera-add-bold" className="text-3xl text-error mx-auto" />
                                        <div className="text-xs font-bold text-error">
                                            {isUploading ? 'Sedang Mengunggah...' : 'Klik untuk Pilih Foto Struk Transfer (Wajib)'}
                                        </div>
                                        <p className="text-[10px] text-on-surface-variant">
                                            Ambil foto struk ATM / screenshot mutasi m-Banking Anda.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Bottom Status Help Footer */}
                    <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
                        <div className="flex items-center space-x-2">
                            <Icon icon="solar:shield-check-bold" className="text-secondary text-base shrink-0" />
                            <span>Data toko dan riwayat transaksi Anda aman terlindungi di server cloud.</span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span>Butuh bantuan?</span>
                            <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Super Admin, saya butuh bantuan seputar akun toko "${storeName}".`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-secondary hover:underline flex items-center space-x-1"
                            >
                                <Icon icon="logos:whatsapp-icon" />
                                <span>Hubungi Super Admin</span>
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Brand Tagline */}
            <div className="max-w-5xl mx-auto w-full text-center pt-6 text-xs text-on-surface-variant">
                <span>&copy; {new Date().getFullYear()} RPOS Kasir Cloud • Hak Cipta Dilindungi</span>
            </div>

            {/* QRIS Fullscreen Lightbox Modal */}
            {showFullQr && qrisUrl && (
                <div 
                    className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowFullQr(false)}
                >
                    <div className="bg-white p-5 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h4 className="font-bold text-primary text-base">QRIS Paket {planName}</h4>
                        <img src={qrisUrl} alt="QRIS Full" className="w-full aspect-square object-contain mx-auto" />
                        <div className="text-xs text-on-surface-variant">
                            Nominal: <strong className="text-primary text-sm">{formatRupiah(amount)}</strong>
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

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                user={user}
                storeName={storeName}
            />
        </div>
    );
}
