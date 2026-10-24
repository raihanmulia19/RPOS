import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@iconify/react';

export default function PlanQrisModal({
    isOpen = false,
    onClose = () => {},
    plan = null,
}) {
    if (!isOpen || !plan) return null;

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(plan.qris_image_url || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number || 0);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveQris = (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsSubmitting(true);
        router.post(
            route('superadmin.plans.qris', plan.id),
            { qris_image: selectedFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => setIsSubmitting(false),
            }
        );
    };

    const handleRemoveQris = () => {
        if (!confirm(`Hapus barcode QRIS statis untuk paket ${plan.name}?`)) return;

        setIsSubmitting(true);
        router.post(
            route('superadmin.plans.qris', plan.id),
            { remove_qris: 1 },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    onClose();
                },
                onError: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant max-w-md w-full overflow-hidden flex flex-col my-auto">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                            <Icon icon="solar:qr-code-bold" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary text-base sm:text-lg">
                                Barcode QRIS: Paket {plan.name}
                            </h3>
                            <p className="text-xs text-on-surface-variant">
                                Tarif: <strong className="text-secondary">{formatRupiah(plan.price)}</strong> / {plan.duration_days} Hari
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-error transition"
                    >
                        <Icon icon="solar:close-circle-bold" className="text-xl" />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSaveQris} className="p-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface block">
                            Preview Barcode QRIS Statis
                        </label>
                        <p className="text-[11px] text-on-surface-variant">
                            QRIS ini akan otomatis muncul pada pop-up layar pembayaran saat pelanggan mendaftar paket {plan.name}.
                        </p>
                    </div>

                    {/* Preview Box */}
                    <div className="w-56 h-56 bg-white p-3 rounded-2xl border-2 border-dashed border-secondary/40 mx-auto flex items-center justify-center shadow-xs overflow-hidden relative group">
                        {previewUrl ? (
                            <>
                                <img
                                    src={previewUrl}
                                    alt={`QRIS ${plan.name}`}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-white text-on-surface rounded-lg text-xs font-bold shadow-md hover:bg-surface-container-low transition"
                                    >
                                        Ganti Foto
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 text-center space-y-2 cursor-pointer hover:opacity-80 transition"
                            >
                                <Icon icon="solar:cloud-upload-bold" className="text-4xl text-secondary mx-auto" />
                                <span className="text-xs font-bold text-primary block">
                                    Pilih Gambar QRIS
                                </span>
                                <span className="text-[10px] text-on-surface-variant block">
                                    Format PNG, JPG, atau WEBP (Maks 2MB)
                                </span>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-2.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-semibold transition border border-outline-variant flex items-center justify-center space-x-1.5"
                            >
                                <Icon icon="solar:gallery-bold" className="text-sm" />
                                <span>{previewUrl ? 'Ganti File Gambar' : 'Pilih File QRIS'}</span>
                            </button>

                            {plan.qris_image && (
                                <button
                                    type="button"
                                    onClick={handleRemoveQris}
                                    disabled={isSubmitting}
                                    className="py-2.5 px-3 text-error hover:bg-error-container/40 rounded-xl text-xs font-semibold transition border border-error/30"
                                    title="Hapus QRIS saat ini"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedFile || isSubmitting}
                            className="w-full py-3 bg-secondary hover:bg-secondary/90 active:scale-95 disabled:opacity-40 text-on-secondary rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
                        >
                            <Icon icon="solar:diskette-bold" className="text-base" />
                            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Barcode QRIS Paket'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
