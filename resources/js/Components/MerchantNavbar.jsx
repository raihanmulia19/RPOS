import React, { useState, useRef, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';
import ChangePasswordModal from '@/Components/ChangePasswordModal';

export default function MerchantNavbar({ tenant, auth, activePage = 'dashboard' }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const userDropdownRef = useRef(null);

    // Close profile dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setUserDropdownOpen(false);
            }
        };
        if (userDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userDropdownOpen]);

    const activeTenant = tenant || auth?.user?.tenant;
    const user = auth?.user;

    const rawPlanName = activeTenant?.plan?.name || activeTenant?.quota_usage?.plan_name || 'Free Trial';
    const cleanPlanName = rawPlanName.replace(/\s*\([^)]*\)/g, '').trim();
    const planSlug = activeTenant?.plan?.slug || activeTenant?.quota_usage?.plan_slug || 'trial';

    const badgeColor = planSlug === 'enterprise' 
        ? 'bg-purple-100 text-purple-900 border-purple-300'
        : planSlug === 'pro'
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : planSlug === 'starter'
        ? 'bg-blue-100 text-blue-900 border-blue-300'
        : 'bg-surface-container-highest text-on-surface-variant border-outline-variant';

    const iconColor = planSlug === 'enterprise'
        ? 'text-purple-600'
        : planSlug === 'pro'
        ? 'text-amber-600'
        : planSlug === 'starter'
        ? 'text-blue-600'
        : 'text-on-surface-variant';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
        { id: 'products', label: 'Manajemen Produk', icon: 'inventory_2', route: 'products.index' },
        { id: 'admins', label: 'Manajemen Kasir', icon: 'badge', route: 'admins.index' },
        { id: 'outlets', label: 'Cabang Toko', icon: 'storefront', route: 'outlets.index' },
        { id: 'expenses', label: 'Pengeluaran', icon: 'receipt_long', route: 'expenses.index' },
        { id: 'settings', label: 'Pengaturan Toko', icon: 'settings', route: 'tenant.settings' },
    ];

    if (user?.role === 'owner') {
        navItems.push({ id: 'plans', label: 'Paket & Billing', icon: 'stars', route: 'subscription.plans', highlight: true });
    }

    return (
        <header className="bg-surface-container-lowest shadow-sm sticky top-0 z-50 border-b border-outline-variant">
            {/* Top Bar */}
            <div className="px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
                {/* Brand / Store Logo & Name */}
                <div className="flex items-center space-x-3 shrink-0">
                    <Link href={route('dashboard')} className="shrink-0 flex items-center">
                        {activeTenant?.logo_url ? (
                            <img 
                                src={activeTenant.logo_url} 
                                alt={activeTenant.name} 
                                className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-full shadow-xs"
                            />
                        ) : (
                            <div className="w-9 h-9 sm:h-10 sm:w-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm sm:text-base shadow-xs">
                                {activeTenant?.name?.charAt(0)?.toUpperCase() || 'K'}
                            </div>
                        )}
                    </Link>

                    <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                            <h1 className="font-headline-sm sm:font-headline-md font-bold text-primary leading-tight whitespace-nowrap">
                                {activeTenant?.name || 'KopiKarsa'}
                            </h1>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 border shrink-0 ${badgeColor}`}>
                                <span className={`material-symbols-outlined text-[12px] ${iconColor}`}>stars</span>
                                <span className="hidden xs:inline">PAKET</span>
                                <span>{cleanPlanName.toUpperCase().replace(/^PAKET\s+/i, '')}</span>
                            </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant font-medium truncate hidden 2xl:block">
                            Laporan Keuangan & Kinerja Bisnis
                        </p>
                    </div>
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden xl:flex items-center space-x-1">
                    {navItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={route(item.route)}
                                className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                                    isActive
                                        ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                                        : item.highlight
                                        ? 'text-secondary hover:bg-secondary/10'
                                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions: User info & Logout */}
                <div className="flex items-center space-x-2 shrink-0">
                    {/* Desktop User Profile Dropdown with Arrow */}
                    <div className="relative hidden lg:block" ref={userDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className={`h-9 px-3 rounded-full flex items-center space-x-2 transition-all active:scale-95 text-left focus:outline-none ${
                                userDropdownOpen
                                    ? 'bg-surface-container-high ring-2 ring-primary/20 shadow-xs'
                                    : 'bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 shadow-xs'
                            }`}
                            aria-expanded={userDropdownOpen}
                            title="Menu Profil Pengguna"
                        >
                            {/* Avatar */}
                            <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>

                            {/* User details */}
                            <div className="flex flex-col min-w-0 pr-0.5 text-left">
                                <span className="text-xs font-bold text-on-surface leading-tight whitespace-nowrap">
                                    {user?.name?.replace(/\s*\([^)]*\)/g, '').trim() || user?.name}
                                </span>
                                <span className="text-[9px] text-on-surface-variant capitalize leading-tight">
                                    {user?.role === 'owner' ? 'Pemilik Toko' : 'Kasir'}
                                </span>
                            </div>

                            {/* Chevron Panah */}
                            <span className={`material-symbols-outlined text-base text-on-surface-variant transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                                expand_more
                            </span>
                        </button>

                        {/* Dropdown Menu */}
                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                {/* Header Card */}
                                <div className="px-4 py-2.5 border-b border-outline-variant/60">
                                    <p className="text-xs font-bold text-on-surface truncate">{user?.name}</p>
                                    <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container capitalize">
                                            {user?.role === 'owner' ? 'Pemilik Toko' : 'Kasir'}
                                        </span>
                                        <span className="text-[10px] text-on-surface-variant truncate font-medium">
                                            {activeTenant?.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-1.5 space-y-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            setShowPasswordModal(true);
                                        }}
                                        className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container-high flex items-center space-x-2.5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base text-primary">key</span>
                                        <span>Ganti Password Akun</span>
                                    </button>

                                    {user?.role === 'owner' && (
                                        <Link
                                            href={route('tenant.settings')}
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-on-surface hover:text-primary hover:bg-surface-container-high flex items-center space-x-2.5 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base text-secondary">settings</span>
                                            <span>Pengaturan Toko</span>
                                        </Link>
                                    )}

                                    <div className="my-1 border-t border-outline-variant/60"></div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            setShowLogoutModal(true);
                                        }}
                                        className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold text-error hover:bg-error/10 flex items-center space-x-2.5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">logout</span>
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Logout Button */}
                    <button 
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="hidden lg:flex items-center space-x-1.5 h-9 px-3.5 bg-error text-on-error rounded-full text-xs font-semibold hover:bg-error/90 active:scale-95 transition-all shadow-xs"
                        title="Keluar dari akun"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Keluar</span>
                    </button>

                    {/* Mobile Hamburger Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="xl:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-high active:scale-95 transition-all focus:outline-none"
                        aria-label="Buka Menu"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {mobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile / Tablet Horizontal Swipeable Nav Bar (For quick 1-thumb tab switching) */}
            <div className="xl:hidden border-t border-outline-variant/60 bg-surface-container-lowest px-2 py-1.5 overflow-x-auto scrollbar-none flex items-center space-x-1.5">
                {navItems.map((item) => {
                    const isActive = activePage === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={route(item.route)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 whitespace-nowrap shrink-0 transition-all ${
                                isActive
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-primary bg-surface-container-low hover:bg-surface-container-high'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Mobile Expanded Menu Drawer / Dropdown */}
            {mobileMenuOpen && (
                <div className="xl:hidden border-t border-outline-variant bg-surface-container-lowest px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
                    {/* User Info Card */}
                    <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between border border-outline-variant">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-on-surface">{user?.name}</p>
                                <p className="text-[11px] text-on-surface-variant capitalize">{user?.role === 'owner' ? 'Pemilik Toko (Owner)' : 'Kasir'}</p>
                            </div>
                        </div>
                        <Link
                            href={route('pos.index')}
                            className="px-3 py-1.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">point_of_sale</span>
                            <span>POS</span>
                        </Link>
                    </div>

                    {/* Mobile Ganti Password Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            setShowPasswordModal(true);
                        }}
                        className="w-full py-2 px-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border border-outline-variant active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm text-primary">key</span>
                        <span>Ganti Password Akun</span>
                    </button>

                    {/* Vertical Links List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {navItems.map((item) => {
                            const isActive = activePage === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={route(item.route)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-3 transition-all ${
                                        isActive
                                            ? 'bg-primary text-on-primary font-bold shadow-sm'
                                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Bottom Logout */}
                    <div className="pt-2 border-t border-outline-variant flex justify-between items-center">
                        <span className="text-xs text-on-surface-variant font-medium">
                            {activeTenant?.name} &bull; Paket {cleanPlanName}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                setShowLogoutModal(true);
                            }}
                            className="px-4 py-2 bg-error text-on-error rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                user={user}
                storeName={activeTenant?.name}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                user={user}
            />
        </header>
    );
}
