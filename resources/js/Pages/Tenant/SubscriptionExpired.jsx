import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

export default function SubscriptionExpired({ tenant, reason, adminContact }) {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const isSuspended = reason === 'suspended';
    const isTrial = reason === 'trial_expired';

    const storeName = tenant?.name || 'Toko Anda';
    const waNumber = adminContact?.whatsapp || '6285121210403';
    const waMessage = encodeURIComponent(
        `Halo Admin POS App, saya pemilik toko "${storeName}" ingin memperpanjang paket langganan aplikasi kasir kami.`
    );
    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    return (
        <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 sm:p-6 font-body-md text-on-surface">
            <Head title="Masa Aktif Toko Berakhir - POS SaaS" />

            <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant p-6 sm:p-8 text-center space-y-6">
                
                {/* Store Logo or App Icon */}
                <div className="flex justify-center">
                    {tenant?.logo_url ? (
                        <img 
                            src={tenant.logo_url} 
                            alt={storeName} 
                            className="w-20 h-20 object-contain rounded-full"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-2xl shadow-sm">
                            {storeName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Status Badge & Alert Icon */}
                <div className="flex flex-col items-center space-y-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                        isSuspended 
                            ? 'bg-error-container text-on-error-container' 
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                        <span className="material-symbols-outlined text-3xl">
                            {isSuspended ? 'lock' : 'hourglass_disabled'}
                        </span>
                    </div>

                    <h1 className="font-headline-md font-bold text-primary">
                        {isSuspended ? 'Akun Toko Ditangguhkan' : 'Masa Aktif Berakhir'}
                    </h1>

                    <p className="font-body-md text-on-surface-variant text-sm">
                        {isSuspended ? (
                            <span>Akses operasional toko <strong className="text-on-surface">{storeName}</strong> sedang ditangguhkan oleh Super Admin.</span>
                        ) : isTrial ? (
                            <span>Masa uji coba gratis (14 hari) untuk toko <strong className="text-on-surface">{storeName}</strong> telah selesai.</span>
                        ) : (
                            <span>Paket langganan toko <strong className="text-on-surface">{storeName}</strong> telah melewati batas waktu masa aktif.</span>
                        )}
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">Nama Toko:</span>
                        <span className="font-bold text-on-surface">{storeName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-outline-variant/60">
                        <span className="text-on-surface-variant">Status Akses:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            isSuspended 
                                ? 'bg-error text-on-error' 
                                : 'bg-amber-200 text-amber-900'
                        }`}>
                            {isSuspended ? 'Suspended' : 'Expired'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-on-surface-variant">Tanggal Berakhir:</span>
                        <span className="font-semibold text-on-surface">
                            {tenant?.expiration_date_formatted || 'Hari ini'}
                        </span>
                    </div>
                </div>

                {/* Reassurance Message */}
                <div className="flex items-start space-x-2 text-left bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/40">
                    <span className="material-symbols-outlined text-secondary text-lg mt-0.5">verified_user</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        Tenang, seluruh data katalog produk, riwayat transaksi kasir, dan laporan keuangan toko Anda tetap tersimpan dengan aman di server cloud kami.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    {!isSuspended && (
                        <Link 
                            href={route('subscription.plans')}
                            className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 active:scale-95 text-on-primary rounded-xl font-label-lg font-bold shadow-md transition-all flex items-center justify-center space-x-2 block"
                        >
                            <span className="material-symbols-outlined text-lg">qr_code_2</span>
                            <span>Pilih Paket & Bayar via QRIS</span>
                        </Link>
                    )}

                    <a 
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 bg-secondary hover:bg-secondary/90 active:scale-95 text-on-secondary rounded-xl font-label-md font-bold shadow-sm transition-all flex items-center justify-center space-x-2 block"
                    >
                        <span className="material-symbols-outlined text-lg">chat</span>
                        <span>Konfirmasi via WhatsApp Super Admin</span>
                    </a>

                    <button 
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-2.5 px-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-label-md font-semibold transition active:scale-95 flex items-center justify-center space-x-1.5 border border-outline-variant"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Keluar (Logout)</span>
                    </button>
                </div>

                <div className="text-[11px] text-on-surface-variant pt-2 space-y-1">
                    <div>
                        WhatsApp Super Admin:{' '}
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-secondary font-bold underline"
                        >
                            {adminContact?.whatsapp_display || '0851-2121-0403'}
                        </a>
                    </div>
                    <div>
                        Bantuan CS Email: <a href={`mailto:${adminContact?.email}`} className="text-secondary font-semibold underline">{adminContact?.email || 'support@posapp.com'}</a>
                    </div>
                </div>

            </div>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                storeName={storeName}
            />
        </div>
    );
}
