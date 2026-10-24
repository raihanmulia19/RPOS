import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function ChangePasswordModal({
    isOpen = false,
    onClose = () => {},
    user = null,
}) {
    const hasExistingPassword = user?.has_password !== false;

    const { data, setData, put, errors, processing, reset, recentlySuccessful, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Reset form and clear errors when modal closes or opens
    useEffect(() => {
        if (!isOpen) {
            reset();
            clearErrors();
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !processing) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, processing, onClose]);

    // Lock body scroll when modal is open
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

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setTimeout(() => {
                    onClose();
                }, 1200);
            },
        });
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget && !processing) {
                    onClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
        >
            <div 
                className="bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-outline-variant max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-95 disabled:opacity-40"
                    aria-label="Tutup modal"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Header Icon */}
                <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl">key</span>
                    </div>
                </div>

                {/* Header Title */}
                <div className="text-center space-y-1 mb-5">
                    <h3 
                        id="change-password-title" 
                        className="text-lg font-bold text-on-surface font-headline-sm"
                    >
                        Ganti Password Akun
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                        {hasExistingPassword 
                            ? 'Perbarui password untuk menjaga keamanan akun Anda.' 
                            : 'Buat password baru untuk akun yang terhubung via Google.'}
                    </p>
                </div>

                {/* Success Notification */}
                {recentlySuccessful && (
                    <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Password berhasil diperbarui!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password Field (Only if user already has a password) */}
                    {hasExistingPassword && (
                        <div>
                            <label 
                                htmlFor="current_password" 
                                className="block font-label-sm font-semibold text-xs text-on-surface mb-1.5"
                            >
                                Password Saat Ini <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="current_password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    placeholder="Masukkan password saat ini"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-2.5 pr-10 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none p-1"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showCurrentPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <InputError message={errors.current_password} className="mt-1" />
                        </div>
                    )}

                    {/* New Password Field */}
                    <div>
                        <label 
                            htmlFor="password" 
                            className="block font-label-sm font-semibold text-xs text-on-surface mb-1.5"
                        >
                            Password Baru <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                                autoComplete="new-password"
                                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-2.5 pr-10 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none p-1"
                                tabIndex={-1}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {showNewPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    {/* Confirm New Password Field */}
                    <div>
                        <label 
                            htmlFor="password_confirmation" 
                            className="block font-label-sm font-semibold text-xs text-on-surface mb-1.5"
                        >
                            Konfirmasi Password Baru <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Ulangi password baru"
                                required
                                autoComplete="new-password"
                                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-2.5 pr-10 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none p-1"
                                tabIndex={-1}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant/60">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all active:scale-95 disabled:opacity-50 border border-outline-variant/50"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-on-primary bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                            {processing ? (
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
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">lock_reset</span>
                                    <span>Simpan</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
