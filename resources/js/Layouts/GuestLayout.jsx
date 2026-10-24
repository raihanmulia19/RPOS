import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low p-4 sm:p-6 font-body-md text-on-surface antialiased">
            <div className="mb-6 flex flex-col items-center text-center space-y-2">
                <Link href="/" className="flex items-center space-x-3">
                    <img 
                        src="/brand-logo.png" 
                        alt="RPOS Logo" 
                        className="h-14 w-auto object-contain rounded-xl shadow-sm border border-outline-variant"
                    />
                    <div className="text-left">
                        <span className="font-headline-md font-bold text-primary block leading-tight">RPOS</span>
                        <span className="text-xs text-secondary font-semibold uppercase tracking-wider block -mt-0.5">POINT OF SALE SYSTEM</span>
                    </div>
                </Link>
            </div>

            <div className="w-full max-w-md overflow-hidden bg-surface-container-lowest p-6 sm:p-8 shadow-xl rounded-3xl border border-outline-variant">
                {children}
            </div>
        </div>
    );
}
