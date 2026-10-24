import { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function SubscriptionWarningBanner({ tenant }) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (!tenant || !tenant.is_expiring_soon || isDismissed) {
        return null;
    }

    const days = tenant.days_remaining ?? 0;
    const isTrial = tenant.subscription_status === 'trial';
    const planName = tenant.plan?.name || (isTrial ? 'Free Trial' : 'Langganan');

    const handleBannerClick = (e) => {
        if (typeof window !== 'undefined' && window.location.pathname.includes('/subscription/plans')) {
            e.preventDefault();
            const el = document.getElementById('pricing-cards');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 shadow-sm transition-all animate-fade-in sticky top-0 z-40">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">hourglass_top</span>
                    </div>
                    <div>
                        <div className="font-bold text-xs sm:text-sm flex items-center space-x-2">
                            <span>
                                {days === 0
                                    ? `${isTrial ? 'Masa Percobaan' : 'Paket Langganan'} Toko Anda Berakhir Hari Ini!`
                                    : `${isTrial ? 'Masa Percobaan' : `Paket Langganan ${planName}`} Berakhir dalam ${days} Hari Lagi!`}
                            </span>
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                H-{days}
                            </span>
                        </div>
                        <p className="text-xs text-amber-800/90 mt-0.5">
                            Masa aktif toko Anda akan selesai pada <strong>{tenant.expiration_date_formatted || 'segera'}</strong>. Perpanjang sekarang agar kasir tetap bisa memproses transaksi.
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <Link
                        href={route('subscription.plans')}
                        onClick={handleBannerClick}
                        className="px-3.5 py-1.5 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                        title="Buka Halaman Paket & Billing"
                    >
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span>Perpanjang Sekarang</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsDismissed(true)}
                        className="p-1.5 text-amber-800 hover:bg-amber-200 rounded-lg transition cursor-pointer"
                        title="Tutup pemberitahuan"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

