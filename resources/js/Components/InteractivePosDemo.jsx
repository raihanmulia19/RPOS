import { useState, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';

const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: 'Kopi Susu Gula Aren',
        category_id: 'coffee',
        price: 22000,
        stock_quantity: 24,
        is_stock_tracked: true,
        isTarget: true,
        variant: 'Ice',
        icon: 'solar:cup-hot-bold-duotone',
    },
    {
        id: 2,
        name: 'Caramel Macchiato',
        category_id: 'coffee',
        price: 28000,
        stock_quantity: 15,
        is_stock_tracked: true,
        variant: 'Hot',
        icon: 'solar:cup-paper-bold-duotone',
    },
    {
        id: 3,
        name: 'Matcha Latte Cream',
        category_id: 'non-coffee',
        price: 25000,
        stock_quantity: 18,
        is_stock_tracked: true,
        variant: 'Ice',
        icon: 'solar:tea-cup-bold-duotone',
    },
    {
        id: 4,
        name: 'Butter Croissant',
        category_id: 'snacks',
        price: 18000,
        stock_quantity: 12,
        is_stock_tracked: true,
        icon: 'solar:donut-bold-duotone',
    },
    {
        id: 5,
        name: 'Nasi Goreng Spesial',
        category_id: 'makanan-berat',
        price: 32000,
        stock_quantity: 20,
        is_stock_tracked: true,
        icon: 'solar:chef-hat-bold-duotone',
    },
    {
        id: 6,
        name: 'Kentang Goreng Crispy',
        category_id: 'snacks',
        price: 18000,
        stock_quantity: 25,
        is_stock_tracked: true,
        icon: 'solar:donut-bold-duotone',
    },
];

export default function InteractivePosDemo() {
    // Steps:
    // 1: Click target product to add to cart
    // 2: Choose payment method (QRIS / Tunai)
    // 3: Click Checkout / Bayar button
    // 4: Thermal Receipt Modal (Success)
    const [step, setStep] = useState(1);
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState(INITIAL_PRODUCTS);
    const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' | 'cash'
    const [amountTendered, setAmountTendered] = useState(50000);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successCountdown, setSuccessCountdown] = useState(5);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorTitle, setErrorTitle] = useState('Transaksi Gagal!');
    const [guidedMode, setGuidedMode] = useState(true);
    const [currentTime] = useState(() => {
        const now = new Date();
        return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
    });

    // Auto-dismiss 5 detik untuk pop-up Transaksi Berhasil!
    useEffect(() => {
        let timer = null;
        let interval = null;

        if (showSuccessModal) {
            setSuccessCountdown(5);

            interval = setInterval(() => {
                setSuccessCountdown((prev) => (prev > 1 ? prev - 1 : 1));
            }, 1000);

            timer = setTimeout(() => {
                handleResetDemo();
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [showSuccessModal]);

    const categories = [
        { id: 'all', name: 'Semua' },
        { id: 'coffee', name: 'Coffee' },
        { id: 'non-coffee', name: 'Non-Coffee' },
        { id: 'snacks', name: 'Snacks' },
        { id: 'makanan-berat', name: 'Makanan Berat' },
    ];

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    };

    const filteredProducts = useMemo(() => {
        let result = products;
        if (selectedCategoryId !== 'all') {
            result = result.filter((p) => p.category_id === selectedCategoryId);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((p) => 
                p.name.toLowerCase().includes(q) || 
                p.price.toString().includes(q)
            );
        }
        return result;
    }, [products, selectedCategoryId, searchQuery]);

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cart]);

    const taxPercentage = 11;
    const tax = Math.round(subtotal * (taxPercentage / 100));
    const total = subtotal + tax;

    const addToCart = (product) => {
        const currentProd = products.find((p) => p.id === product.id) || product;
        const currentQtyInCart = cart.find((c) => c.product_id === currentProd.id)?.quantity || 0;

        if (currentProd.is_stock_tracked) {
            if (currentProd.stock_quantity <= 0) {
                setErrorTitle('Transaksi Gagal! (Stok Habis)');
                setErrorMessage(`Produk "${currentProd.name}" sedang habis (stok: 0).`);
                setShowErrorModal(true);
                return;
            }
            if (currentQtyInCart >= currentProd.stock_quantity) {
                setErrorTitle('Transaksi Gagal! (Stok Tidak Cukup)');
                setErrorMessage(`Seluruh sisa stok produk "${currentProd.name}" (${currentProd.stock_quantity} unit) sudah dimasukkan ke troli.`);
                setShowErrorModal(true);
                return;
            }
        }

        setCart((prev) => {
            const existing = prev.find((item) => item.product_id === currentProd.id);
            if (existing) {
                return prev.map((item) =>
                    item.product_id === currentProd.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [
                ...prev,
                {
                    cartItemId: `${currentProd.id}-${currentProd.variant || 'Regular'}`,
                    product_id: currentProd.id,
                    name: currentProd.name,
                    price: currentProd.price,
                    quantity: 1,
                    note: currentProd.variant || '',
                },
            ];
        });

        if (step === 1) {
            setStep(2);
        }
    };

    const updateQuantity = (cartItemId, delta) => {
        setCart((prev) => {
            const itemToUpdate = prev.find((i) => i.cartItemId === cartItemId);
            if (!itemToUpdate) return prev;

            if (delta > 0) {
                const product = products.find((p) => p.id === itemToUpdate.product_id);
                if (product && product.is_stock_tracked) {
                    if (itemToUpdate.quantity + delta > product.stock_quantity) {
                        setErrorTitle('Transaksi Gagal! (Stok Tidak Cukup)');
                        setErrorMessage(`Stok "${product.name}" tidak mencukupi (sisa: ${product.stock_quantity} unit).`);
                        setShowErrorModal(true);
                        return prev;
                    }
                }
            }

            return prev
                .map((item) => {
                    if (item.cartItemId === cartItemId) {
                        const newQuantity = item.quantity + delta;
                        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                    }
                    return item;
                })
                .filter(Boolean);
        });
    };

    const removeFromCart = (cartItemId) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const handleSelectPaymentMethod = (method) => {
        setPaymentMethod(method);
        if (step === 2) {
            setStep(3);
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            setErrorTitle('Transaksi Gagal! (Keranjang Kosong)');
            setErrorMessage('Keranjang belanja demo masih kosong. Silakan klik minimal 1 menu sebelum checkout.');
            setShowErrorModal(true);
            return;
        }

        if (paymentMethod === 'cash' && amountTendered < total) {
            const kurang = total - amountTendered;
            setErrorTitle('Transaksi Gagal! (Uang Kurang)');
            setErrorMessage(`Uang tunai yang diterima (${formatRupiah(amountTendered)}) kurang dari total tagihan (${formatRupiah(total)}). Kurang ${formatRupiah(kurang)}.`);
            setShowErrorModal(true);
            return;
        }

        setIsReceiptModalOpen(true);
        setStep(4);
    };

    const handleFinishTransaction = () => {
        setIsReceiptModalOpen(false);

        // Pengurangan stok produk simulasi HANYA berkurang saat pop-up transaksi berhasil muncul!
        setProducts(prev => prev.map(p => {
            const itemInCart = cart.find(c => c.product_id === p.id);
            if (itemInCart) {
                return { ...p, stock_quantity: Math.max(0, p.stock_quantity - itemInCart.quantity) };
            }
            return p;
        }));

        setShowSuccessModal(true);
    };

    const handleResetDemo = () => {
        setCart([]);
        setStep(1);
        setIsReceiptModalOpen(false);
        setShowSuccessModal(false);
        setShowErrorModal(false);
        setPaymentMethod('qris');
        setSelectedCategoryId('all');
        setSearchQuery('');
        setAmountTendered(50000);
    };

    const handleRestartFullDemo = () => {
        handleResetDemo();
        setProducts(INITIAL_PRODUCTS);
    };

    return (
        <section id="demo" className="py-16 sm:py-24 bg-surface-container-low/40 border-b border-outline-variant/60 relative scroll-mt-20">
            <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
                
                {/* Header Keterangan Demo */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-12">
                    <div className="inline-flex items-center space-x-2 bg-secondary/10 px-4 py-1.5 rounded-full text-secondary border border-secondary/20 shadow-xs">
                        <Icon icon="solar:cursor-bold-duotone" className="text-base animate-bounce" />
                        <span className="font-label-sm text-xs font-bold tracking-wide">
                            Simulasi Terminal Kasir Asli
                        </span>
                    </div>
                    <h2 className="font-headline-lg font-bold text-2xl sm:text-4xl text-primary tracking-tight">
                        Coba Demo Layar Terminal Kasir RPOS
                    </h2>
                    <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                        Tampilan dan antarmuka di bawah ini disesuaikan 100% dengan sistem terminal kasir RPOS yang sebenarnya. Ikuti petunjuk lingkaran tap untuk mencoba simulasi checkout.
                    </p>

                    {/* Step indicator pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <div className="inline-flex items-center bg-surface-container-lowest p-1.5 rounded-2xl border border-outline-variant/60 shadow-xs text-xs font-semibold">
                            <span className={`px-3 py-1 rounded-xl transition-all ${step === 1 ? 'bg-secondary text-white font-bold shadow-xs' : 'text-on-surface-variant'}`}>
                                1. Tambah Menu
                            </span>
                            <Icon icon="solar:alt-arrow-right-bold" className="text-outline-variant mx-1" />
                            <span className={`px-3 py-1 rounded-xl transition-all ${step === 2 ? 'bg-secondary text-white font-bold shadow-xs' : 'text-on-surface-variant'}`}>
                                2. Metode Bayar
                            </span>
                            <Icon icon="solar:alt-arrow-right-bold" className="text-outline-variant mx-1" />
                            <span className={`px-3 py-1 rounded-xl transition-all ${step === 3 ? 'bg-secondary text-white font-bold shadow-xs' : 'text-on-surface-variant'}`}>
                                3. Selesaikan
                            </span>
                            <Icon icon="solar:alt-arrow-right-bold" className="text-outline-variant mx-1" />
                            <span className={`px-3 py-1 rounded-xl transition-all ${step === 4 ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-on-surface-variant'}`}>
                                4. Cetak Struk
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleRestartFullDemo}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/60 text-primary text-xs font-bold transition-all shadow-xs"
                            title="Reset Simulasi ke Langkah Awal"
                        >
                            <Icon icon="solar:restart-bold-duotone" className="text-base text-secondary" />
                            <span>Ulangi Demo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setGuidedMode(!guidedMode)}
                            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                                guidedMode
                                    ? 'bg-secondary/15 border-secondary/30 text-secondary'
                                    : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant'
                            }`}
                        >
                            <Icon icon={guidedMode ? 'solar:eye-bold' : 'solar:eye-closed-bold'} className="text-base" />
                            <span>Panduan Tap: {guidedMode ? 'Aktif' : 'Mati'}</span>
                        </button>
                    </div>
                </div>

                {/* TABLET / HARDWARE BEZEL FRAME */}
                <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1520px] mx-auto">
                    <div className="relative rounded-[2.5rem] bg-neutral-900 border-[8px] sm:border-[12px] border-neutral-800 shadow-2xl p-2 sm:p-3 ring-1 ring-white/20">

                        {/* SCREEN INSIDE: EXACT RPOS POS TERMINAL UI */}
                        <div className="relative rounded-[1.75rem] overflow-hidden bg-surface font-body-md text-on-surface flex flex-col md:flex-row min-h-[640px] md:h-[720px] border border-outline-variant">
                            
                            {/* LEFT SIDE: Product Grid & Categories (60% width) */}
                            <div className="w-full md:w-3/5 lg:w-2/3 h-full flex flex-col bg-surface-container-low border-r border-outline-variant overflow-hidden">
                                
                                {/* 1. POS Header Bar (Row 1 Left: Brand, Outlet, Pasang POS, Printer, Tutup Shift) */}
                                <div className="h-14 sm:h-16 px-3.5 sm:px-4 bg-surface flex items-center justify-between shadow-xs z-10 shrink-0 border-b border-outline-variant/60">
                                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs border border-amber-500/40 shrink-0">
                                            <Icon icon="solar:cup-hot-bold" className="text-xl" />
                                        </div>
                                        <div>
                                            <h1 className="font-headline-sm font-bold text-primary leading-tight text-xs sm:text-sm tracking-tight">
                                                RPOS COFFEE
                                            </h1>
                                            <div className="flex items-center space-x-1 text-[10px] font-semibold text-secondary">
                                                <Icon icon="solar:shop-bold" className="text-xs" />
                                                <span>Kopi Karsa (Pusat)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                                        {/* Pasang POS Pill */}
                                        <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30">
                                            <Icon icon="solar:smartphone-bold" className="text-xs" />
                                            <span>Pasang POS</span>
                                        </div>

                                        {/* Printer Bluetooth Pill */}
                                        <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <Icon icon="solar:printer-bold" className="text-xs" />
                                            <span>Printer 58mm</span>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={handleRestartFullDemo}
                                            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 bg-[#ba1a1a] text-white rounded-full text-[11px] font-semibold hover:bg-[#93000a] transition-all active:scale-95 shadow-xs"
                                        >
                                            <Icon icon="solar:logout-2-bold" className="text-xs" />
                                            <span>Tutup Shift</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Product Search Bar */}
                                <div className="px-3 sm:px-4 pt-2.5 pb-2 bg-surface-container-low border-b border-outline-variant/60">
                                    <div className="relative flex items-center">
                                        <Icon icon="solar:magnifer-linear" className="absolute left-3 text-on-surface-variant/70 text-base pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Cari produk..."
                                            className="w-full pl-9 pr-20 py-2 bg-surface rounded-xl border border-outline-variant text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-2xs transition-all"
                                        />
                                        {searchQuery && (
                                            <div className="absolute right-2 flex items-center space-x-1">
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                    {filteredProducts.length} produk
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchQuery('')}
                                                    className="w-5 h-5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-xs"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Categories Tabs */}
                                <div className="h-11 sm:h-12 px-3 sm:px-4 flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 bg-surface-container-low border-b border-outline-variant/30">
                                    {categories.map((cat) => {
                                        const count = cat.id === 'all' 
                                            ? products.length 
                                            : products.filter(p => p.category_id === cat.id).length;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategoryId(cat.id)}
                                                className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                                                    selectedCategoryId === cat.id
                                                        ? 'bg-secondary text-on-secondary shadow-xs font-bold'
                                                        : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-highest/80'
                                                }`}
                                            >
                                                {cat.name} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 3. Product Grid */}
                                <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
                                    {filteredProducts.map((product) => {
                                        const isHighlightTarget = guidedMode && step === 1 && product.isTarget;
                                        const totalInCart = cart.find((c) => c.product_id === product.id)?.quantity || 0;
                                        const remaining = Math.max(0, product.stock_quantity - totalInCart);
                                        const isOutOfStock = Boolean(product.is_stock_tracked) && product.stock_quantity <= 0;
                                        const isMaxInCart = Boolean(product.is_stock_tracked) && !isOutOfStock && remaining <= 0;
                                        const isSelectDisabled = isOutOfStock || isMaxInCart;

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                onClick={() => addToCart(product)}
                                                disabled={isSelectDisabled}
                                                className={`relative bg-surface-container-lowest rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-xs transition-all text-center w-full group select-none ${
                                                    isOutOfStock
                                                        ? 'opacity-50 cursor-not-allowed bg-surface-container-high/60 border border-outline-variant/40'
                                                        : isMaxInCart
                                                            ? 'opacity-80 cursor-not-allowed border-2 border-amber-400 ring-2 ring-amber-300/30'
                                                            : isHighlightTarget
                                                                ? 'border-2 border-secondary ring-4 ring-secondary/20 shadow-lg scale-[1.02]'
                                                                : 'hover:shadow-md active:scale-95 cursor-pointer border border-transparent'
                                                }`}
                                            >
                                                {/* Overlay jika stok habis */}
                                                {isOutOfStock && (
                                                    <div className="absolute inset-0 bg-surface/65 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10 p-2">
                                                        <span className="bg-error text-on-error px-2.5 py-0.5 rounded-full font-bold transform -rotate-12 shadow-md text-[10px] uppercase tracking-wider">
                                                            HABIS (0)
                                                        </span>
                                                    </div>
                                                )}

                                                {/* FIGMA PROTOTYPE TOOLTIP & TAP RIPPLE FOR STEP 1 */}
                                                {isHighlightTarget && !isOutOfStock && (
                                                    <>
                                                        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-max">
                                                            <div className="bg-neutral-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-secondary/50 flex items-center space-x-1.5 animate-bounce">
                                                                <span className="text-amber-400">👉</span>
                                                                <span>Tambahkan menu ke troli pesanan</span>
                                                            </div>
                                                            <div className="w-2.5 h-2.5 bg-neutral-900 border-r border-b border-secondary/50 rotate-45 mx-auto -mt-1.5"></div>
                                                        </div>

                                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                                                            <span className="w-16 h-16 rounded-full bg-secondary/30 animate-ping absolute"></span>
                                                            <span className="w-10 h-10 rounded-full bg-secondary/80 shadow-lg border-2 border-white flex items-center justify-center text-white text-sm">
                                                                👆
                                                            </span>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Product Image / Icon Box */}
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-container-highest rounded-xl mb-2 sm:mb-2.5 flex items-center justify-center shadow-xs text-secondary group-hover:scale-105 transition-transform">
                                                    <Icon icon={product.icon} className="text-3xl sm:text-4xl" />
                                                </div>

                                                {/* Product Name */}
                                                <div className="font-label-lg font-bold text-on-surface text-center line-clamp-1 w-full text-xs sm:text-sm">
                                                    {product.name}
                                                </div>

                                                {/* Price */}
                                                <div className="font-body-md text-secondary font-semibold text-xs sm:text-sm mt-0.5">
                                                    {formatRupiah(product.price)}
                                                </div>

                                                {/* Stock Status Pill */}
                                                <div className="mt-2">
                                                    {isOutOfStock ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-red-100 text-red-700">
                                                            Habis (0)
                                                        </span>
                                                    ) : (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${remaining === 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                            Sisa: {remaining} / {product.stock_quantity}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quantity in cart badge */}
                                                {totalInCart > 0 && (
                                                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                                        {totalInCart}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RIGHT SIDE: Cart & Checkout (40% width) */}
                            <div className="w-full md:w-2/5 lg:w-1/3 bg-surface-container-lowest shadow-2xl flex flex-col h-full border-t md:border-t-0 md:border-l border-outline-variant shrink-0">
                                
                                {/* 1. ROW 1 RIGHT: KASIR AKTIF & JAM SAAT INI */}
                                <div className="h-14 sm:h-16 p-3 sm:p-4 bg-surface flex items-center justify-between border-b border-outline-variant/60 shrink-0">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0">
                                            S
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-1 text-xs font-bold text-primary">
                                                <span>Sari Putri</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant leading-none">Kasir / Staf</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/40 shrink-0">
                                        <Icon icon="solar:clock-circle-bold" className="text-secondary text-xs" />
                                        <span>{currentTime}</span>
                                    </div>
                                </div>

                                {/* 2. ROW 2 RIGHT: PESANAN SAAT INI & 0 ITEM (Diturunkan ke bawah, Sejajar dengan Garis Kategori di Kiri) */}
                                <div className="h-13 sm:h-14 p-3 sm:p-4 border-b border-outline-variant/30 bg-surface-container-lowest flex justify-between items-center shrink-0">
                                    <h2 className="font-headline-sm font-bold text-primary text-xs sm:text-sm">
                                        Pesanan Saat Ini
                                    </h2>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-label-sm text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                                            {cart.reduce((a, b) => a + b.quantity, 0)} item
                                        </span>
                                        {cart.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setCart([])}
                                                className="text-[10px] text-error hover:underline flex items-center space-x-0.5 font-semibold"
                                            >
                                                <Icon icon="solar:trash-bin-trash-bold" />
                                                <span>Kosongkan</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cart Items List */}
                                <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-3 space-y-2.5">
                                    {cart.length === 0 ? (
                                        <div className="text-center text-on-surface-variant font-body-md py-12 text-xs">
                                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-outline mx-auto mb-2">
                                                <Icon icon="solar:bag-smile-bold-duotone" className="text-xl" />
                                            </div>
                                            Keranjang masih kosong.
                                            <p className="text-[10px] text-on-surface-variant/70 mt-1">
                                                Klik menu di sebelah kiri untuk menambah
                                            </p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div
                                                key={item.cartItemId}
                                                className="flex flex-col p-2.5 bg-surface-container-low rounded-xl relative group border border-outline-variant/40"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.cartItemId)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error-container text-on-error-container rounded-full flex items-center justify-center shadow-xs hover:bg-error hover:text-on-error active:scale-95 z-10"
                                                    title="Hapus Item"
                                                >
                                                    <span className="text-[11px] font-bold">&times;</span>
                                                </button>

                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="font-label-md font-bold text-on-surface text-xs leading-snug pr-2">
                                                        {item.name}
                                                        {item.note && (
                                                            <span className="ml-1 text-[10px] font-semibold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                                                                {item.note}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="font-label-md font-semibold text-primary text-xs shrink-0">
                                                        {formatRupiah(item.price * item.quantity)}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="font-body-sm text-on-surface-variant text-[11px]">
                                                        {formatRupiah(item.price)}
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-surface-container-highest rounded-lg p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.cartItemId, -1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-surface-container-lowest rounded-md text-primary hover:bg-outline-variant/30 active:scale-95 text-xs font-bold"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-label-md text-xs w-3 text-center font-bold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.cartItemId, 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-surface-container-lowest rounded-md text-primary hover:bg-outline-variant/30 active:scale-95 text-xs font-bold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Summary & Checkout */}
                                <div className="p-3.5 sm:p-4 bg-surface-container-low border-t border-outline-variant space-y-3 shrink-0">
                                    
                                    {/* Calculations */}
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-on-surface-variant">
                                            <span>Subtotal</span>
                                            <span>{formatRupiah(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-on-surface-variant">
                                            <span>Pajak (11%)</span>
                                            <span>{formatRupiah(tax)}</span>
                                        </div>
                                        <div className="flex justify-between font-headline-sm font-bold text-primary text-sm pt-1 border-t border-outline-variant/60">
                                            <span>Total Tagihan</span>
                                            <span>{formatRupiah(total)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Method Selector (Step 2 Guide) */}
                                    <div className="space-y-1.5 pt-1 relative">
                                        <label className="font-label-sm font-semibold text-on-surface text-[11px] block">
                                            Metode Pembayaran
                                        </label>

                                        {guidedMode && step === 2 && (
                                            <div className="absolute -top-9 right-2 z-30 pointer-events-none w-max">
                                                <div className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-secondary/50 flex items-center space-x-1 animate-bounce">
                                                    <span>👉 Pilih metode bayar (misal: QRIS)</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectPaymentMethod('cash')}
                                                className={`flex-1 py-2 rounded-xl font-label-md text-xs border transition-all ${
                                                    paymentMethod === 'cash'
                                                        ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-xs'
                                                        : 'border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                }`}
                                            >
                                                Tunai
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectPaymentMethod('qris')}
                                                className={`flex-1 py-2 rounded-xl font-label-md text-xs border transition-all relative ${
                                                    paymentMethod === 'qris'
                                                        ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-xs'
                                                        : 'border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                }`}
                                            >
                                                QRIS
                                                {guidedMode && step === 2 && paymentMethod !== 'qris' && (
                                                    <span className="w-5 h-5 rounded-full bg-secondary/40 animate-ping absolute -top-1 -right-1"></span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cash Tendered Input & Quick Presets (if Cash) */}
                                    {paymentMethod === 'cash' && (
                                        <div className="space-y-1.5 pt-1 text-xs">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold text-on-surface-variant block">
                                                    Uang Diterima (Tunai)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1.5 text-xs text-on-surface-variant font-bold">Rp</span>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={amountTendered.toLocaleString('id-ID')}
                                                        className="w-full pl-8 pr-2 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant text-xs font-bold text-on-surface"
                                                    />
                                                </div>
                                                {/* Quick Cash Presets */}
                                                <div className="grid grid-cols-4 gap-1 pt-0.5">
                                                    {[20000, 50000, 100000].map((preset) => (
                                                        <button
                                                            key={preset}
                                                            type="button"
                                                            onClick={() => setAmountTendered(preset)}
                                                            className={`py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                                                                amountTendered === preset
                                                                    ? 'bg-secondary text-white border-secondary font-bold shadow-xs'
                                                                    : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                            }`}
                                                        >
                                                            {preset >= 1000 ? `Rp ${preset / 1000}k` : preset}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => setAmountTendered(total)}
                                                        className={`py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                                                            amountTendered === total
                                                                ? 'bg-secondary text-white border-secondary font-bold shadow-xs'
                                                                : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                        }`}
                                                    >
                                                        Uang Pas
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] pt-1 text-green-700 font-bold border-t border-outline-variant/40">
                                                <span>Kembalian:</span>
                                                <span>{formatRupiah(Math.max(0, amountTendered - total))}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* QRIS Barcode Box (if QRIS) */}
                                    {paymentMethod === 'qris' && total > 0 && (
                                        <div className="p-2.5 rounded-2xl bg-surface-container-lowest border-2 border-secondary/40 flex flex-col items-center justify-center text-center space-y-1.5 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                                            <div className="flex items-center space-x-1.5 bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                <Icon icon="solar:qr-code-bold" className="text-xs" />
                                                <span>Scan QRIS untuk Bayar</span>
                                            </div>

                                            {/* Barcode Image */}
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-1 rounded-xl border border-outline-variant shadow-xs flex items-center justify-center overflow-hidden">
                                                <img 
                                                    src="/images/qris-demo.jpg" 
                                                    alt="Barcode QRIS Pembayaran Kasir" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            <div className="text-center">
                                                <span className="text-[10px] text-on-surface-variant font-medium block">
                                                    Total Tagihan: <strong className="text-primary font-bold">{formatRupiah(total)}</strong>
                                                </span>
                                                <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                                                    ✓ Otomatis terverifikasi (BCA, Mandiri, GoPay, OVO, DANA)
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Big Checkout / Pay Button (Step 3 Guide) */}
                                    <div className="relative pt-1">
                                        {guidedMode && step === 3 && (
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-max">
                                                <div className="bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-secondary/50 flex items-center space-x-1 animate-bounce">
                                                    <span>👉 Klik untuk proses transaksi</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            disabled={cart.length === 0}
                                            onClick={handleCheckout}
                                            className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all relative ${
                                                cart.length === 0
                                                    ? 'bg-surface-container-high text-outline cursor-not-allowed'
                                                    : guidedMode && step === 3
                                                    ? 'bg-secondary text-white shadow-lg ring-4 ring-secondary/30 scale-[1.02]'
                                                    : 'bg-secondary hover:bg-on-secondary-container active:scale-95 text-white shadow-md'
                                            }`}
                                        >
                                            <Icon icon="solar:wallet-money-bold-duotone" className="text-base" />
                                            <span>
                                                Proses Transaksi {total > 0 ? `(${formatRupiah(total)})` : ''}
                                            </span>

                                            {guidedMode && step === 3 && (
                                                <span className="w-8 h-8 rounded-full bg-white/40 animate-ping absolute right-3"></span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* THERMAL RECEIPT MODAL */}
                            {isReceiptModalOpen && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 z-50">
                                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-2xl p-4 sm:p-5 max-w-xs w-full space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                                        
                                        {/* Status Icon */}
                                        <div className="text-center space-y-1">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                                                <Icon icon="solar:check-circle-bold" className="text-2xl" />
                                            </div>
                                            <h3 className="font-headline-sm font-bold text-sm text-primary">
                                                Transaksi Berhasil!
                                            </h3>
                                            <p className="text-[10px] text-on-surface-variant">
                                                Struk thermal 58mm siap dicetak
                                            </p>
                                        </div>

                                        {/* Realistic Thermal Receipt Paper (58mm style) */}
                                        <div className="p-3 bg-white border border-neutral-300 rounded-xl font-mono text-[11px] space-y-2 text-neutral-800 shadow-inner">
                                            <div className="text-center border-b border-dashed border-neutral-300 pb-2">
                                                <p className="font-bold text-xs tracking-tight">RPOS COFFEE</p>
                                                <p className="font-semibold text-[10px] text-neutral-700">Kopi Karsa (Pusat)</p>
                                                <p className="text-[9px] text-neutral-500">Jl. Teuku Umar No. 18, Bandung</p>
                                                <p className="text-[9px] text-neutral-500">Telp: 0851-2121-0403</p>
                                                <p className="text-[9px] text-neutral-400 mt-0.5">#INV-20261024-0042</p>
                                                <p className="text-[8px] text-neutral-400">Kasir: Sari Putri &bull; {currentTime}</p>
                                            </div>

                                            {/* Item Rows */}
                                            <div className="space-y-1 border-b border-dashed border-neutral-300 pb-2">
                                                {cart.map((item) => (
                                                    <div key={item.cartItemId} className="flex justify-between text-[10px]">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span>{formatRupiah(item.price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Totals */}
                                            <div className="space-y-0.5 text-[10px]">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>{formatRupiah(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>PPN (11%):</span>
                                                    <span>{formatRupiah(tax)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-xs pt-1 border-t border-neutral-300">
                                                    <span>TOTAL:</span>
                                                    <span>{formatRupiah(total)}</span>
                                                </div>
                                                <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
                                                    <span>BAYAR:</span>
                                                    <span>{paymentMethod === 'qris' ? 'QRIS DINAMIS (LUNAS)' : 'TUNAI (LUNAS)'}</span>
                                                </div>
                                            </div>

                                            <div className="text-center pt-2 border-t border-dashed border-neutral-300 text-[9px] text-neutral-500">
                                                <p>Terima Kasih Atas Kunjungan Anda!</p>
                                                <p className="text-[8px] text-neutral-400 mt-0.5">Sistem POS by RPOS</p>
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="space-y-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleFinishTransaction}
                                                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-on-secondary-container active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                            >
                                                <Icon icon="solar:check-circle-bold" className="text-base" />
                                                <span>Selesai & Transaksi Baru</span>
                                            </button>

                                            <Link
                                                href={route('register')}
                                                className="w-full py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high active:scale-95 text-primary font-bold text-xs border border-outline-variant transition-all flex items-center justify-center space-x-1.5"
                                            >
                                                <span>Daftar Akun Toko Gratis (14 Hari)</span>
                                                <Icon icon="solar:arrow-right-bold" className="text-sm text-secondary" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* POP-UP TRANSAKSI BERHASIL (DEMO) */}
                            {showSuccessModal && (
                                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
                                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl p-5 max-w-xs w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                                        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-50"></div>
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border-2 border-emerald-500/40">
                                                <Icon icon="solar:check-circle-bold" className="text-3xl" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-headline-sm font-bold text-base text-on-surface">
                                                Transaksi Berhasil!
                                            </h3>
                                            <p className="text-[11px] text-on-surface-variant">
                                                Pembayaran simulasi telah diterima & transaksi tersimpan.
                                            </p>
                                        </div>

                                        <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/60 text-[11px] text-left space-y-1.5">
                                            <div className="flex justify-between items-center pb-1 border-b border-outline-variant/30">
                                                <span className="text-on-surface-variant">No. Invoice</span>
                                                <span className="font-mono font-bold text-on-surface">#INV-20261024-0042</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-1 border-b border-outline-variant/30">
                                                <span className="text-on-surface-variant">Metode Bayar</span>
                                                <span className="font-bold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px]">
                                                    {paymentMethod === 'qris' ? 'QRIS' : 'TUNAI'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-0.5">
                                                <span className="text-on-surface-variant">Total Bayar</span>
                                                <span className="font-bold text-sm text-primary font-headline-sm">
                                                    {formatRupiah(total)}
                                                </span>
                                            </div>
                                            <div className="pt-1 flex items-center justify-center text-emerald-700 font-semibold text-[10px] space-x-1 border-t border-dashed border-outline-variant/40">
                                                <Icon icon="solar:verified-check-bold" className="text-xs" />
                                                <span>LUNAS &bull; STOK DIPERBARUI</span>
                                            </div>
                                        </div>

                                        {/* 5-second Auto-close Indicator */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                                                    style={{ width: `${(successCountdown / 5) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-center space-x-1.5 text-[10px] font-semibold text-on-surface-variant">
                                                <Icon icon="solar:clock-circle-bold" className="text-xs text-emerald-600 animate-pulse" />
                                                <span>Menutup otomatis dalam <strong className="text-emerald-700">{successCountdown} detik</strong></span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleResetDemo}
                                                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                                            >
                                                <Icon icon="solar:cart-plus-bold" className="text-base" />
                                                <span>Siap Transaksi Baru ({successCountdown}s)</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowSuccessModal(false);
                                                    setIsReceiptModalOpen(true);
                                                }}
                                                className="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px] border border-outline-variant flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer"
                                            >
                                                <Icon icon="solar:bill-list-bold" className="text-sm" />
                                                <span>Lihat Struk Kembali</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* POP-UP TRANSAKSI GAGAL (DEMO) */}
                            {showErrorModal && (
                                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
                                    <div className="bg-surface-container-lowest border border-error/30 rounded-2xl shadow-2xl p-5 max-w-xs w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                                        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-error-container/40 text-error rounded-full flex items-center justify-center shadow-inner border-2 border-error/30">
                                                <Icon icon="solar:close-circle-bold" className="text-3xl" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-headline-sm font-bold text-base text-on-surface">
                                                {errorTitle || 'Transaksi Gagal!'}
                                            </h3>
                                            <p className="text-[11px] text-on-surface-variant">
                                                Transaksi simulasi tidak dapat diselesaikan.
                                            </p>
                                        </div>

                                        <div className="bg-error-container/20 border border-error/30 rounded-xl p-3 text-[11px] text-left space-y-1">
                                            <div className="flex items-center space-x-1 text-error font-bold">
                                                <Icon icon="solar:danger-triangle-bold" className="text-sm" />
                                                <span>Penyebab Kendala:</span>
                                            </div>
                                            <p className="text-on-surface leading-relaxed font-medium">
                                                {errorMessage || 'Keranjang belanja masih kosong atau nominal tunai kurang.'}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowErrorModal(false)}
                                            className="w-full py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                                        >
                                            <Icon icon="solar:refresh-bold" className="text-base" />
                                            <span>Periksa & Coba Lagi</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
