import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function LogoutConfirmModal({
    isOpen = false,
    onClose = () => {},
    onConfirm = null,
    title = 'Konfirmasi Keluar',
    message = 'Apakah Anda yakin ingin keluar dari akun? Sesi aktif Anda akan diakhiri.',
    confirmText = 'Ya, Keluar',
    cancelText = 'Batal',
    user = null,
    storeName = null,
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isProcessing) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isProcessing, onClose]);

    // Prevent body scroll when modal is visible
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirmLogout = () => {
        if (isProcessing) return;

        if (onConfirm) {
            onConfirm();
            return;
        }

        setIsProcessing(true);
        router.post(route('logout'), {}, {
            onFinish: () => {
                setIsProcessing(false);
                onClose();
            },
        });
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isProcessing) {
                    onClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
        >
            <div 
                className="bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-outline-variant max-w-sm w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-40"
                    aria-label="Tutup modal"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Warning Icon Badge */}
                <div className="flex justify-center mb-4 mt-1">
                    <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center ring-8 ring-error/5 shadow-inner">
                        <span className="material-symbols-outlined text-3xl">logout</span>
                    </div>
                </div>

                {/* Title & Message */}
                <div className="text-center space-y-2 mb-5">
                    <h3 
                        id="logout-modal-title" 
                        className="text-lg font-bold text-on-surface font-headline-sm"
                    >
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* User/Store Info Card (if provided) */}
                {(user || storeName) && (
                    <div className="bg-surface-container-low rounded-2xl p-3 mb-5 border border-outline-variant/60 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-error/10 text-error font-bold flex items-center justify-center text-sm shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-on-surface truncate">
                                {user?.name || 'Pengguna'}
                            </p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                                {storeName ? `${storeName} • ` : ''}
                                {user?.role === 'owner' ? 'Pemilik Toko' : user?.role === 'cashier' ? 'Kasir' : user?.email || 'Aktif'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all active:scale-95 disabled:opacity-50 border border-outline-variant/50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirmLogout}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-on-error bg-error hover:bg-error/90 transition-all active:scale-95 shadow-md shadow-error/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <svg 
                                    className="animate-spin h-4 w-4 text-white shrink-0" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                >
                                    <circle 
                                        className="opacity-25" 
                                        cx="12" 
                                        cy="12" 
                                        r="10" 
                                        stroke="currentColor" 
                                        strokeWidth="4"
                                    />
                                    <path 
                                        className="opacity-75" 
                                        fill="currentColor" 
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    />
                                </svg>
                                <span>Proses...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span>{confirmText}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
