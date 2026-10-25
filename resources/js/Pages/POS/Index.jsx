import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import SubscriptionWarningBanner from '@/Components/SubscriptionWarningBanner';
import PrinterSettingsModal from '@/Components/PrinterSettingsModal';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';
import { bluetoothPrinter } from '@/Services/bluetoothPrinter';

export default function PosIndex({ categories, products, tenant, currentOutlet = null, flash, errors, auth }) {
    const [localProducts, setLocalProducts] = useState(products);
    const pendingServerProducts = useRef(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successCountdown, setSuccessCountdown] = useState(5);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorTitle, setErrorTitle] = useState('Transaksi Gagal!');
    const [lastCompletedTx, setLastCompletedTx] = useState(null);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Search Product States
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    // Bluetooth Thermal Printer States
    const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
    const [printerState, setPrinterState] = useState(bluetoothPrinter.getState());
    const [isReprinting, setIsReprinting] = useState(false);
    const [printFeedback, setPrintFeedback] = useState(null);

    const [receiptModal, setReceiptModal] = useState({
        isOpen: false,
        url: null,
        invoiceNumber: '',
        paymentMethod: '',
        totalAmount: 0,
        receiptData: null,
    });

    // PWA & Connectivity States
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
    const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
    const [showQrisPreviewModal, setShowQrisPreviewModal] = useState(false);

    const isIosDevice = typeof window !== 'undefined' && (
        /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
                setIsInstalled(true);
            }

            const handleBeforeInstall = (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
            };

            const handleAppInstalled = () => {
                setIsInstalled(true);
                setDeferredPrompt(null);
            };

            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            window.addEventListener('beforeinstallprompt', handleBeforeInstall);
            window.addEventListener('appinstalled', handleAppInstalled);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
                window.removeEventListener('appinstalled', handleAppInstalled);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    const handleInstallPWA = async () => {
        if (!deferredPrompt) {
            setShowInstallGuideModal(true);
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setDeferredPrompt(null);
        }
    };

    useEffect(() => {
        const unsubscribe = bluetoothPrinter.subscribe(setPrinterState);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (flash?.receipt_url) {
            const receiptData = flash.receipt_data || null;
            const txInfo = {
                isOpen: true,
                url: flash.receipt_url,
                invoiceNumber: flash.invoice_number || '',
                paymentMethod: flash.payment_method || 'qris',
                totalAmount: flash.total_amount || 0,
                receiptData: receiptData,
            };

            setReceiptModal(txInfo);
            setLastCompletedTx(txInfo);

            // Cetak Langsung (Direct Printing) jika printer Bluetooth terhubung & fitur auto-print aktif
            if (bluetoothPrinter.isConnected && bluetoothPrinter.autoPrint && receiptData) {
                setPrintFeedback({ type: 'printing', message: 'Mencetak struk langsung ke Bluetooth...' });
                bluetoothPrinter.printReceipt(receiptData)
                    .then(() => {
                        setPrintFeedback({
                            type: 'success',
                            message: `Struk berhasil dicetak langsung ke ${bluetoothPrinter.deviceName}!`,
                        });
                    })
                    .catch((err) => {
                        console.error('Bluetooth auto-print error:', err);
                        setPrintFeedback({
                            type: 'error',
                            message: 'Gagal cetak otomatis: ' + (err.message || 'Periksa koneksi printer'),
                        });
                    });
            } else if (!bluetoothPrinter.isConnected) {
                setPrintFeedback({
                    type: 'info',
                    message: 'Printer Bluetooth belum terhubung',
                });
            } else {
                setPrintFeedback(null);
            }
        } else if (flash?.success) {
            setLastCompletedTx({
                isOpen: false,
                url: null,
                invoiceNumber: flash.invoice_number || '',
                paymentMethod: flash.payment_method || 'cash',
                totalAmount: flash.total_amount || 0,
                receiptData: null,
            });
            setShowSuccessModal(true);
        }

        if (errors?.error || flash?.error) {
            setErrorTitle('Transaksi Gagal!');
            setErrorMessage(errors?.error || flash?.error);
            setShowErrorModal(true);
        }
    }, [flash, errors]);

    // Sinkronisasi stok: Saat struk masih terbuka, simpan data produk server terbaru di pendingServerProducts.
    // Stok baru HANYA berkurang/diperbarui di layar kasir ketika pop-up "Transaksi Berhasil!" muncul!
    useEffect(() => {
        if (receiptModal.isOpen) {
            pendingServerProducts.current = products;
        } else if (!showSuccessModal) {
            setLocalProducts(products);
        }
    }, [products, receiptModal.isOpen, showSuccessModal]);

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
                setShowSuccessModal(false);
                setCart([]);
                setAmountTendered('');
                setIsQrisVerified(false);
                searchInputRef.current?.focus();
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (interval) clearInterval(interval);
        };
    }, [showSuccessModal]);

    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [qrisUrl, setQrisUrl] = useState(null);
    const [isLoadingQris, setIsLoadingQris] = useState(false);
    const [qrisError, setQrisError] = useState(null);

    const isStaticQris = tenant?.qris_type !== 'dynamic';
    const [isQrisVerified, setIsQrisVerified] = useState(false);

    const taxPercentage = tenant?.tax_percentage ?? 11;

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cart]);

    const tax = subtotal * (taxPercentage / 100);
    const total = subtotal + tax;

    useEffect(() => {
        setIsQrisVerified(false);
    }, [total, paymentMethod]);

    useEffect(() => {
        if (paymentMethod === 'qris' && total > 0) {
            if (!isStaticQris) {
                setIsLoadingQris(true);
                setQrisError(null);
                axios.post(route('generate-qris'), { amount: total })
                    .then(res => {
                        setQrisUrl(res.data.qr_url);
                        setIsLoadingQris(false);
                    })
                    .catch(err => {
                        setQrisError(err.response?.data?.error || 'Gagal memuat QRIS');
                        setIsLoadingQris(false);
                    });
            }
        } else {
            setQrisUrl(null);
        }
    }, [paymentMethod, total, isStaticQris]);

    // Keyboard shortcut to focus search with '/' and clear with Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                setSearchQuery('');
                searchInputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredProducts = useMemo(() => {
        let result = localProducts;

        if (selectedCategoryId !== 'all') {
            result = result.filter(p => p.category_id === selectedCategoryId);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(p => {
                const matchName = p.name?.toLowerCase().includes(query);
                const matchCategory = p.category?.name?.toLowerCase().includes(query);
                const matchPrice = p.price?.toString().includes(query);
                return matchName || matchCategory || matchPrice;
            });
        }

        return result;
    }, [localProducts, selectedCategoryId, searchQuery]);

    // Helper untuk menghitung total kuantitas produk tertentu yang sedang ada di keranjang
    const getProductCartQty = (productId) => {
        return cart
            .filter(item => item.product_id === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    const addToCart = (product) => {
        const currentProd = localProducts.find(p => p.id === product.id) || product;
        const isStockTracked = Boolean(currentProd.is_stock_tracked);
        const stock = Number(currentProd.stock_quantity ?? 0);
        const currentCartQty = getProductCartQty(currentProd.id);

        if (isStockTracked) {
            if (stock <= 0) {
                setErrorTitle('Transaksi Gagal! (Stok Habis)');
                setErrorMessage(`Produk "${currentProd.name}" sedang habis (stok: 0). Tidak dapat ditambahkan ke transaksi.`);
                setShowErrorModal(true);
                return;
            }
            if (currentCartQty >= stock) {
                setErrorTitle('Transaksi Gagal! (Stok Tidak Cukup)');
                setErrorMessage(`Stok tidak mencukupi. Seluruh stok produk "${currentProd.name}" (${stock} unit) sudah dimasukkan ke keranjang.`);
                setShowErrorModal(true);
                return;
            }
        }

        setCart(prev => {
            const hasVariant = currentProd.name.toLowerCase().includes('hot') && currentProd.name.toLowerCase().includes('ice');
            const defaultNote = hasVariant ? 'Hot' : '';
            const cartItemId = `${currentProd.id}-${defaultNote}`;

            const existing = prev.find(item => item.cartItemId === cartItemId);
            if (existing) {
                return prev.map(item => 
                    item.cartItemId === cartItemId 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
                );
            }
            return [...prev, { 
                cartItemId,
                product_id: currentProd.id, 
                name: currentProd.name, 
                price: currentProd.price, 
                quantity: 1,
                has_variant: hasVariant,
                note: defaultNote
            }];
        });
    };

    const updateVariant = (oldCartItemId, newNote) => {
        setCart(prev => {
            const itemToChange = prev.find(i => i.cartItemId === oldCartItemId);
            if (!itemToChange) return prev;
            
            const newCartItemId = `${itemToChange.product_id}-${newNote}`;
            const existingTarget = prev.find(i => i.cartItemId === newCartItemId);
            
            if (existingTarget && newCartItemId !== oldCartItemId) {
                // Merge if target variant already exists in cart
                return prev.map(i => 
                    i.cartItemId === newCartItemId 
                    ? { ...i, quantity: i.quantity + itemToChange.quantity }
                    : i
                ).filter(i => i.cartItemId !== oldCartItemId);
            } else {
                // Otherwise just update note & cartItemId
                return prev.map(i => 
                    i.cartItemId === oldCartItemId 
                    ? { ...i, note: newNote, cartItemId: newCartItemId }
                    : i
                );
            }
        });
    };

    const updateQuantity = (cartItemId, delta) => {
        setCart(prev => {
            const itemToUpdate = prev.find(i => i.cartItemId === cartItemId);
            if (!itemToUpdate) return prev;

            if (delta > 0) {
                const product = localProducts.find(p => p.id === itemToUpdate.product_id);
                if (product && Boolean(product.is_stock_tracked)) {
                    const currentTotalQty = prev
                        .filter(i => i.product_id === itemToUpdate.product_id)
                        .reduce((sum, i) => sum + i.quantity, 0);
                    const stock = Number(product.stock_quantity ?? 0);

                    if (currentTotalQty + delta > stock) {
                        setErrorTitle('Transaksi Gagal! (Stok Tidak Cukup)');
                        setErrorMessage(`Stok produk "${product.name}" tidak mencukupi. Sisa stok toko saat ini hanya ${stock} unit.`);
                        setShowErrorModal(true);
                        return prev;
                    }
                }
            }

            return prev.map(item => {
                if (item.cartItemId === cartItemId) {
                    const newQuantity = item.quantity + delta;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            });
        });
    };

    const removeFromCart = (cartItemId) => {
        setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };


    const [processing, setProcessing] = useState(false);

    const handleCheckout = () => {
        if (cart.length === 0) {
            setErrorTitle('Transaksi Gagal! (Keranjang Kosong)');
            setErrorMessage('Keranjang belanja masih kosong. Silakan pilih minimal 1 produk dari katalog sebelum melakukan checkout.');
            setShowErrorModal(true);
            return;
        }

        if (paymentMethod === 'cash') {
            const tenderedNum = Number(amountTendered || 0);
            if (tenderedNum < total) {
                const kekurangan = total - tenderedNum;
                setErrorTitle('Transaksi Gagal! (Uang Kurang)');
                setErrorMessage(`Uang tunai yang diterima (${formatRupiah(tenderedNum)}) kurang dari total tagihan (${formatRupiah(total)}). Kurang ${formatRupiah(kekurangan)}.`);
                setShowErrorModal(true);
                return;
            }
        }

        if (paymentMethod === 'qris' && isStaticQris) {
            if (!tenant?.qris_image_url) {
                setErrorTitle('Transaksi Gagal! (QRIS Belum Ada)');
                setErrorMessage('Toko belum mengunggah foto barcode QRIS. Silakan pilih metode Tunai atau unggah barcode QRIS di menu Pengaturan Toko.');
                setShowErrorModal(true);
                return;
            }
            if (!isQrisVerified) {
                setErrorTitle('Transaksi Gagal! (Verifikasi Diperlukan)');
                setErrorMessage('Mohon periksa mutasi atau bukti transfer pelanggan dan centang verifikasi dana masuk sebelum menyelesaikan transaksi.');
                setShowErrorModal(true);
                return;
            }
        }

        setProcessing(true);
        router.post(route('checkout'), {
            payment_method: paymentMethod,
            amount_tendered: amountTendered,
            items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity, note: c.note }))
        }, {
            onSuccess: () => {
                setCart([]);
                setAmountTendered('');
                setIsQrisVerified(false);
                setProcessing(false);
                setIsMobileCartOpen(false);
            },
            onError: (errs) => {
                setProcessing(false);
                const msg = errs?.error || (typeof errs === 'object' ? Object.values(errs)[0] : null) || 'Terjadi kesalahan sistem saat memproses transaksi. Silakan coba kembali.';
                setErrorTitle('Transaksi Gagal!');
                setErrorMessage(msg);
                setShowErrorModal(true);
            }
        });
    };

    const handleFinishTransaction = () => {
        setReceiptModal(prev => ({ ...prev, isOpen: false }));

        // Pengurangan stok produk di layar kasir HANYA berkurang saat pop-up transaksi berhasil muncul!
        if (pendingServerProducts.current) {
            setLocalProducts(pendingServerProducts.current);
            pendingServerProducts.current = null;
        } else {
            setLocalProducts(products);
        }

        setShowSuccessModal(true);
    };

    const handleDismissSuccessModal = () => {
        setShowSuccessModal(false);
        setCart([]);
        setAmountTendered('');
        setIsQrisVerified(false);
        searchInputRef.current?.focus();
    };

    const handleReopenReceipt = () => {
        setShowSuccessModal(false);
        setReceiptModal(prev => ({ ...prev, isOpen: true }));
    };

    const handleReprintReceipt = async () => {
        if (!receiptModal.url) return;

        // Jika printer Bluetooth terhubung, cetak langsung via ESC/POS
        if (bluetoothPrinter.isConnected) {
            try {
                setIsReprinting(true);
                setPrintFeedback({ type: 'printing', message: 'Sedang mencetak ulang struk ke printer Bluetooth...' });

                let rData = receiptModal.receiptData;
                // Jika data struk belum tersimpan di state, ambil via endpoint receipt-data
                if (!rData && flash?.order_id) {
                    const res = await axios.get(route('orders.receipt-data', flash.order_id));
                    rData = res.data;
                    setReceiptModal(prev => ({ ...prev, receiptData: rData }));
                }

                if (rData) {
                    await bluetoothPrinter.printReceipt(rData);
                    setPrintFeedback({
                        type: 'success',
                        message: `Struk berhasil dicetak ulang ke ${bluetoothPrinter.deviceName}!`,
                    });
                } else {
                    // Fallback jika data struk tidak ditemukan
                    window.open(receiptModal.url + '?print=1', '_blank', 'width=420,height=650,menubar=no,toolbar=no,location=no,status=no');
                }
            } catch (err) {
                console.error('Reprint error:', err);
                setPrintFeedback({
                    type: 'error',
                    message: 'Gagal mencetak ulang: ' + (err.message || 'Periksa kertas atau koneksi printer'),
                });
            } finally {
                setIsReprinting(false);
            }
        } else {
            // Jika bluetooth belum terhubung, gunakan print dialog browser sebagai cadangan
            window.open(receiptModal.url + '?print=1', '_blank', 'width=420,height=650,menubar=no,toolbar=no,location=no,status=no');
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Head title="Terminal POS" />
            <SubscriptionWarningBanner tenant={tenant} />
            {!isOnline && (
                <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-center space-x-2 font-medium shadow-sm z-30 shrink-0">
                    <span className="material-symbols-outlined text-sm animate-pulse">wifi_off</span>
                    <span>Mode Offline: Sambungan internet terputus. Antarmuka POS tetap aktif melalui cache offline PWA. Pastikan internet kembali terhubung untuk menyelesaikan checkout final.</span>
                </div>
            )}
            <div className="flex flex-1 bg-surface font-body-md text-on-surface overflow-hidden relative">
                
                {/* LEFT: Product Grid */}
                <div className="w-full md:w-3/5 lg:w-2/3 h-full flex flex-col bg-surface-container-low border-r border-outline-variant">
                    {/* Header */}
                    <div className="p-4 bg-surface flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center space-x-3">
                            {tenant?.logo_url ? (
                                <img 
                                    src={tenant.logo_url} 
                                    alt={tenant.name} 
                                    className="h-10 w-10 object-contain rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg shadow-sm">
                                    {tenant?.name?.charAt(0)?.toUpperCase() || 'K'}
                                </div>
                            )}
                            <div>
                                <h1 className="font-headline-sm sm:font-headline-lg font-bold text-primary leading-tight">
                                    {tenant?.name || 'KopiKarsa'} POS
                                </h1>
                                {currentOutlet && (
                                    <div className="flex items-center space-x-1 text-[11px] font-semibold text-secondary mt-0.5">
                                        <span className="material-symbols-outlined text-[13px]">storefront</span>
                                        <span>{currentOutlet.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* PWA Install Button */}
                            {!isInstalled && (
                                <button
                                    type="button"
                                    onClick={handleInstallPWA}
                                    className="flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95 shadow-sm"
                                    title="Pasang aplikasi POS di Desktop / Tablet tanpa browser URL bar"
                                >
                                    <span className="material-symbols-outlined text-base">install_mobile</span>
                                    <span className="hidden sm:inline">Pasang POS</span>
                                </button>
                            )}

                            {/* Bluetooth Printer Quick Button */}
                            <button
                                onClick={() => setIsPrinterSettingsOpen(true)}
                                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all active:scale-95 shadow-sm ${
                                    printerState.isConnected
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-container-highest'
                                }`}
                                title="Pengaturan & Status Printer Thermal Bluetooth"
                            >
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    printerState.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                                }`} />
                                <span className="material-symbols-outlined text-base">print</span>
                                <span className="hidden sm:inline">
                                    {printerState.isConnected 
                                        ? `${printerState.deviceName} (${printerState.paperWidth}mm)` 
                                        : 'Printer Bluetooth'}
                                </span>
                            </button>

                            {auth?.user?.role === 'owner' && (
                                <Link 
                                    href={route('dashboard')}
                                    className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs sm:text-sm font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-sm"
                                    title="Kembali ke Dashboard Laporan & Manajemen"
                                >
                                    <span className="material-symbols-outlined text-sm">dashboard</span>
                                    <span className="hidden xs:inline">Dashboard</span>
                                </Link>
                            )}
                            <button 
                                type="button"
                                onClick={() => setShowLogoutModal(true)}
                                className="flex items-center space-x-1 px-3.5 sm:px-4 py-2 bg-error text-on-error rounded-full text-xs sm:text-sm font-semibold hover:bg-on-error-container hover:text-error-container transition-all active:scale-95 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span>Tutup Shift</span>
                            </button>
                        </div>
                    </div>

                    {/* Product Search Bar */}
                    <div className="px-4 pt-3 pb-2 bg-surface-container-low border-b border-outline-variant/60">
                        <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant/70 text-xl pointer-events-none">
                                search
                            </span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="w-full pl-10 pr-28 py-2.5 bg-surface rounded-2xl border border-outline-variant text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs transition-all"
                            />
                            {searchQuery && (
                                <div className="absolute right-2.5 flex items-center space-x-1.5">
                                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {filteredProducts.length} produk
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="w-6 h-6 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition-colors active:scale-90"
                                        title="Hapus pencarian (Esc)"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories Tabs */}
                    <div className="p-3 px-4 flex items-center space-x-2 overflow-x-auto scrollbar-none bg-surface-container-low border-b border-outline-variant/40 shrink-0">
                        <button 
                            onClick={() => setSelectedCategoryId('all')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                                selectedCategoryId === 'all' 
                                    ? 'bg-secondary text-on-secondary ring-2 ring-secondary/20 shadow-sm' 
                                    : 'bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/60'
                            }`}
                        >
                            Semua {selectedCategoryId === 'all' && `(${localProducts.length})`}
                        </button>
                        {categories.map(cat => {
                            const countInCat = localProducts.filter(p => p.category_id === cat.id).length;
                            return (
                                <button 
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                                        selectedCategoryId === cat.id 
                                            ? 'bg-secondary text-on-secondary ring-2 ring-secondary/20 shadow-sm' 
                                            : 'bg-surface text-on-surface hover:bg-surface-container-high border border-outline-variant/60'
                                    }`}
                                >
                                    {cat.name} ({countInCat})
                                </button>
                            );
                        })}
                    </div>

                    {/* Products */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start pb-24 md:pb-4">
                        {filteredProducts.map(product => {
                            const isStockTracked = Boolean(product.is_stock_tracked);
                            const stock = Number(product.stock_quantity ?? 0);
                            const totalInCart = getProductCartQty(product.id);
                            const remainingAvailable = isStockTracked ? Math.max(0, stock - totalInCart) : null;
                            const isOutOfStock = isStockTracked && stock <= 0;
                            const isMaxInCart = isStockTracked && !isOutOfStock && remainingAvailable <= 0;
                            const isSelectDisabled = isOutOfStock || isMaxInCart;

                            return (
                            <button 
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={isSelectDisabled}
                                className={`relative bg-surface-container-lowest rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm transition-all text-center w-full ${
                                    isOutOfStock 
                                        ? 'opacity-50 cursor-not-allowed bg-surface-container-high/60' 
                                        : isMaxInCart 
                                            ? 'opacity-80 cursor-not-allowed border-2 border-amber-400 ring-2 ring-amber-300/30' 
                                            : 'hover:shadow-md active:scale-95 cursor-pointer'
                                }`}
                            >
                                {/* Overlay jika stok habis */}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-surface/65 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10 p-2">
                                        <span className="bg-error text-on-error px-3 py-1 rounded-full font-label-md font-bold transform -rotate-12 shadow-md text-xs uppercase tracking-wider">
                                            HABIS (0)
                                        </span>
                                        <span className="text-[10px] text-error font-semibold mt-2 bg-error-container/90 px-2 py-0.5 rounded-full">
                                            Stok Kosong
                                        </span>
                                    </div>
                                )}

                                {/* Overlay jika semua kuota stok sudah masuk keranjang */}
                                {isMaxInCart && (
                                    <div className="absolute inset-0 bg-amber-900/10 backdrop-blur-[0.5px] rounded-2xl flex flex-col items-center justify-center z-10 p-2 border-2 border-amber-400">
                                        <span className="bg-amber-600 text-white px-2.5 py-1 rounded-full font-label-sm font-bold shadow-md text-[10px] uppercase tracking-wider">
                                            DI KERANJANG (MAKS)
                                        </span>
                                        <span className="text-[10px] text-amber-950 font-bold mt-1.5 bg-amber-100 px-2 py-0.5 rounded-full">
                                            Semua {stock} unit dipilih
                                        </span>
                                    </div>
                                )}

                                {product.image ? (
                                    <img src={`/storage/${product.image}`} alt={product.name} className="w-24 h-24 object-cover rounded-xl mb-3 shadow-sm" />
                                ) : (
                                    <div className="w-24 h-24 bg-surface-container-highest rounded-xl mb-3 flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-4xl text-on-surface-variant">fastfood</span>
                                    </div>
                                )}
                                <div className="font-label-lg font-bold text-on-surface text-center line-clamp-2 mb-1 w-full">{product.name}</div>
                                <div className="font-body-md text-secondary font-semibold">{formatRupiah(product.price)}</div>

                                {/* Stock status pill */}
                                <div className="mt-2">
                                    {isStockTracked ? (
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                                            stock <= 0 
                                                ? 'bg-error-container text-on-error-container'
                                                : remainingAvailable <= 3 
                                                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                                                    : 'bg-green-100 text-green-800'
                                        }`}>
                                            {stock <= 0 ? 'Stok: 0' : `Sisa: ${remainingAvailable} / ${stock}`}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-on-surface-variant/80 px-2 py-0.5 rounded-full bg-surface-container-high inline-block">
                                            Stok: ∞
                                        </span>
                                    )}
                                </div>
                            </button>
                        )})}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-3xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant/70 mb-3 shadow-inner">
                                    <span className="material-symbols-outlined text-3xl">search_off</span>
                                </div>
                                <h3 className="font-bold text-base text-on-surface mb-1">
                                    Produk Tidak Ditemukan
                                </h3>
                                <p className="text-xs text-on-surface-variant max-w-xs mb-4">
                                    {searchQuery 
                                        ? `Tidak ada produk yang cocok dengan kata kunci "${searchQuery}".` 
                                        : 'Belum ada produk dalam kategori yang dipilih.'}
                                </p>
                                {(searchQuery || selectedCategoryId !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategoryId('all');
                                        }}
                                        className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center space-x-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                                        <span>Reset Pencarian & Kategori</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Cart Overlay */}
                {isMobileCartOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" 
                        onClick={() => setIsMobileCartOpen(false)}
                    />
                )}

                {/* RIGHT: Cart & Checkout */}
                <div className={`fixed inset-y-0 right-0 w-full sm:w-96 md:static md:w-2/5 lg:w-1/3 bg-surface-container-lowest shadow-2xl z-40 transform transition-transform duration-300 md:transform-none flex flex-col h-full ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    
                    {/* Top Header: Akun yang Sedang Login */}
                    <div className="px-4 py-3 bg-surface border-b border-outline-variant flex items-center justify-between shadow-xs z-10 shrink-0">
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border border-secondary/20">
                                {auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                    <span className="font-headline-sm font-bold text-primary truncate text-sm">
                                        {auth?.user?.name || 'Kasir'}
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Shift Aktif"></span>
                                </div>
                                <p className="text-[11px] text-on-surface-variant font-medium truncate capitalize">
                                    {auth?.user?.role === 'owner' ? 'Pemilik Toko (Owner)' : 'Kasir / Staf'}
                                </p>
                            </div>
                        </div>

                        {/* Mobile close cart drawer button */}
                        <button 
                            type="button"
                            className="md:hidden p-2 bg-surface-container-highest rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error active:scale-95 transition" 
                            onClick={() => setIsMobileCartOpen(false)}
                            title="Tutup Keranjang"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    {/* Subheader: Pesanan Saat Ini */}
                    <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
                        <h2 className="font-headline-sm font-bold text-primary text-sm sm:text-base">Pesanan Saat Ini</h2>
                        <span className="font-label-sm text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full font-semibold text-xs">{cart.length} item</span>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 min-h-[140px] overflow-y-auto p-3.5 space-y-2.5">
                        {cart.length === 0 ? (
                            <div className="text-center text-on-surface-variant font-body-md mt-10">
                                Keranjang masih kosong.
                            </div>
                        ) : (
                            cart.map(item => {
                                const product = localProducts.find(p => p.id === item.product_id);
                                const isStockTracked = Boolean(product?.is_stock_tracked);
                                const stock = Number(product?.stock_quantity ?? 0);
                                const currentTotalInCart = getProductCartQty(item.product_id);
                                const canIncrease = !isStockTracked || currentTotalInCart < stock;

                                return (
                                <div key={item.cartItemId} className="flex flex-col p-3 bg-surface-container-low rounded-xl relative group mt-2">
                                    <button onClick={() => removeFromCart(item.cartItemId)} className="absolute -top-2 -right-2 w-7 h-7 bg-error-container text-on-error-container rounded-full flex items-center justify-center shadow-sm hover:bg-error hover:text-on-error active:scale-95 z-10" title="Hapus Item">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-label-md font-bold text-on-surface">
                                            {item.name}
                                            {item.has_variant && (
                                                <div className="mt-1">
                                                    <select 
                                                        className="bg-surface border border-outline-variant rounded px-2 py-0.5 text-xs font-bold text-primary focus:ring-1 focus:ring-secondary"
                                                        value={item.note}
                                                        onChange={(e) => updateVariant(item.cartItemId, e.target.value)}
                                                    >
                                                        <option value="Hot">Hot</option>
                                                        <option value="Ice">Ice</option>
                                                    </select>
                                                </div>
                                            )}
                                            {isStockTracked && (
                                                <div className="mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                                                        currentTotalInCart >= stock 
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                                            : 'bg-surface-container-highest text-on-surface-variant'
                                                    }`}>
                                                        Maks: {stock} unit {currentTotalInCart >= stock ? '(Penuh)' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-label-md font-semibold text-primary">{formatRupiah(item.price * item.quantity)}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="font-body-sm text-on-surface-variant">{formatRupiah(item.price)}</div>
                                        <div className="flex items-center space-x-3 bg-surface-container-highest rounded-lg p-1">
                                            <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-8 h-8 flex items-center justify-center bg-surface-container-lowest rounded-md text-primary hover:bg-outline-variant/30 active:scale-95 transition-transform" title="Kurangi 1">
                                                <span className="material-symbols-outlined text-sm">remove</span>
                                            </button>
                                            <span className="font-label-md w-4 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.cartItemId, 1)} 
                                                disabled={!canIncrease}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-transform ${
                                                    !canIncrease 
                                                        ? 'bg-surface-container-high text-outline opacity-40 cursor-not-allowed' 
                                                        : 'bg-surface-container-lowest text-primary hover:bg-outline-variant/30 active:scale-95'
                                                }`}
                                                title={!canIncrease ? `Batas stok tercapai (Maks ${stock} unit)` : 'Tambah 1'}
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="p-3.5 sm:p-4 bg-surface-container-low border-t border-outline-variant space-y-2.5 shrink-0 overflow-y-auto max-h-[62vh]">
                        <div className="space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between text-on-surface-variant font-body-sm">
                                <span>Subtotal</span>
                                <span>{formatRupiah(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-on-surface-variant font-body-sm">
                                <span>Pajak ({taxPercentage}%)</span>
                                <span>{formatRupiah(tax)}</span>
                            </div>
                            <div className="flex justify-between font-headline-sm font-bold text-primary pt-1.5 border-t border-outline-variant text-base sm:text-lg">
                                <span>Total Tagihan</span>
                                <span>{formatRupiah(total)}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="font-label-sm font-semibold text-on-surface text-xs">Metode Pembayaran</label>
                            <div className="flex space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-label-md text-xs sm:text-sm font-bold border transition-all flex items-center justify-center space-x-1.5 ${paymentMethod === 'cash' ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs' : 'border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                                >
                                    <span className="material-symbols-outlined text-base">payments</span>
                                    <span>Tunai</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setPaymentMethod('qris')}
                                    className={`flex-1 py-2 sm:py-2.5 rounded-xl font-label-md text-xs sm:text-sm font-bold border transition-all flex items-center justify-center space-x-1.5 ${paymentMethod === 'qris' ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs' : 'border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                                >
                                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                                    <span>QRIS</span>
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="font-label-sm font-semibold text-on-surface text-xs">Uang Diterima (Tunai)</label>
                                </div>

                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant">Rp</span>
                                    <input 
                                        type="text" 
                                        value={amountTendered ? Number(amountTendered).toLocaleString('id-ID') : ''}
                                        onChange={(e) => setAmountTendered(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl py-2.5 pl-10 pr-10 font-body-md font-bold text-sm sm:text-base"
                                        placeholder="0"
                                    />
                                    {amountTendered && (
                                        <button
                                            type="button"
                                            onClick={() => setAmountTendered('')}
                                            className="absolute right-3 w-6 h-6 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-xs transition"
                                            title="Hapus nominal"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Tombol Cepat Pecahan Uang */}
                                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                                    {[20000, 50000, 100000].map((nominal) => (
                                        <button
                                            key={nominal}
                                            type="button"
                                            onClick={() => setAmountTendered(String(nominal))}
                                            className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all active:scale-95 flex items-center justify-center whitespace-nowrap ${
                                                Number(amountTendered) === nominal
                                                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                                                    : 'bg-surface-container-lowest hover:bg-surface-container-high border-outline-variant text-on-surface shadow-2xs'
                                            }`}
                                        >
                                            Rp {nominal.toLocaleString('id-ID')}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={total <= 0}
                                        onClick={() => setAmountTendered(String(Math.round(total)))}
                                        className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all active:scale-95 flex items-center justify-center whitespace-nowrap ${
                                            total > 0 && Number(amountTendered) === Math.round(total)
                                                ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                                                : 'bg-surface-container-lowest hover:bg-surface-container-high border-outline-variant text-on-surface shadow-2xs disabled:opacity-50'
                                        }`}
                                        title={total > 0 ? `Uang Pas: ${formatRupiah(total)}` : 'Keranjang masih kosong'}
                                    >
                                        Uang Pas
                                    </button>
                                </div>

                                {amountTendered && Number(amountTendered) >= total && (
                                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5 text-green-800 dark:text-green-300 font-label-md font-bold">
                                        <span className="text-xs">Kembalian:</span>
                                        <span className="text-sm">{formatRupiah(Number(amountTendered) - total)}</span>
                                    </div>
                                )}

                                {amountTendered && Number(amountTendered) < total && (
                                    <div className="flex items-center justify-between bg-error/10 border border-error/20 rounded-xl px-3 py-1 text-error font-label-sm font-semibold">
                                        <span className="text-xs">Uang Kurang:</span>
                                        <span className="text-xs">{formatRupiah(total - Number(amountTendered))}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {paymentMethod === 'qris' && (
                            <div className="flex flex-col space-y-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl p-3">
                                {isStaticQris ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-1.5 bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                                <span className="material-symbols-outlined text-xs">qr_code_2</span>
                                                <span>QRIS Toko Statis</span>
                                            </div>

                                            {tenant?.qris_image_url && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQrisPreviewModal(true)}
                                                    className="text-xs font-semibold text-secondary hover:text-primary flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-surface-container-high transition cursor-pointer"
                                                    title="Klik untuk melihat barcode QRIS lebih besar"
                                                >
                                                    <span className="material-symbols-outlined text-sm">fullscreen</span>
                                                    <span>Perbesar QR</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* QR Thumbnail */}
                                            <div 
                                                onClick={() => tenant?.qris_image_url && setShowQrisPreviewModal(true)}
                                                className={`w-24 h-24 sm:w-28 sm:h-28 bg-white p-1.5 rounded-xl border-2 border-secondary/40 flex items-center justify-center shadow-xs relative shrink-0 group ${tenant?.qris_image_url ? 'cursor-pointer hover:border-secondary transition' : ''}`}
                                                title={tenant?.qris_image_url ? "Klik untuk memperbesar QRIS" : "QRIS Belum Ada"}
                                            >
                                                {tenant?.qris_image_url ? (
                                                    <>
                                                        <img 
                                                            src={tenant.qris_image_url} 
                                                            alt="Barcode QRIS Toko" 
                                                            className="w-full h-full object-contain" 
                                                        />
                                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                            <span className="material-symbols-outlined text-white text-lg drop-shadow">zoom_in</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-1">
                                                        <span className="material-symbols-outlined text-2xl text-outline mb-0.5 block">
                                                            broken_image
                                                        </span>
                                                        <span className="text-[10px] font-bold text-on-surface block leading-tight">
                                                            Belum Ada
                                                        </span>
                                                        <span className="text-[9px] text-on-surface-variant block mt-0.5">
                                                            Atur di Pengaturan
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info & Nominal */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <span className="text-[11px] text-on-surface-variant font-medium block">
                                                    Minta scan & transfer:
                                                </span>
                                                <span className="font-headline-sm font-extrabold text-primary text-lg sm:text-xl truncate block tracking-tight">
                                                    {formatRupiah(total)}
                                                </span>
                                                <p className="text-[10.5px] text-on-surface-variant leading-tight mt-1">
                                                    Pelanggan memasukkan nominal tagihan di atas ke aplikasi e-Wallet/M-Banking.
                                                </p>
                                            </div>
                                        </div>

                                        {tenant?.qris_image_url ? (
                                            <label className="flex items-start space-x-2 w-full bg-secondary-container/20 hover:bg-secondary-container/30 p-2 rounded-lg border border-secondary-container cursor-pointer select-none transition">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isQrisVerified} 
                                                    onChange={(e) => setIsQrisVerified(e.target.checked)}
                                                    className="mt-0.5 w-4 h-4 text-secondary rounded border-outline-variant focus:ring-secondary cursor-pointer shrink-0"
                                                />
                                                <span className="font-label-sm text-on-surface text-[11px] font-semibold leading-snug">
                                                    Kasir sudah verifikasi: bukti transfer berhasil & dana masuk.
                                                </span>
                                            </label>
                                        ) : (
                                            <p className="text-[11px] text-error font-medium text-center">
                                                Barcode QRIS belum diunggah di Pengaturan Toko.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="font-label-sm font-bold text-on-surface text-xs">QRIS Dinamis</span>
                                            <span className="text-[10px] text-secondary font-bold">Otomatis Terverifikasi</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1.5 rounded-xl border-2 border-primary border-dashed flex items-center justify-center relative shrink-0">
                                                {isLoadingQris && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                                        <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                                    </div>
                                                )}
                                                {qrisError ? (
                                                    <div className="text-center font-label-sm text-error text-[10px] px-1">{qrisError}</div>
                                                ) : qrisUrl ? (
                                                    <img src={qrisUrl} alt="QRIS Barcode" className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="text-on-surface-variant text-[10px]">Memuat...</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[11px] text-on-surface-variant font-medium block">Nominal Tagihan:</span>
                                                <span className="font-headline-sm font-extrabold text-primary text-lg sm:text-xl truncate block">
                                                    {formatRupiah(total)}
                                                </span>
                                                <p className="text-[10.5px] text-on-surface-variant leading-tight mt-1">
                                                    Scan QRIS menggunakan GoPay, OVO, Dana, BCA, atau mobile banking lainnya.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={handleCheckout}
                            disabled={
                                cart.length === 0 || 
                                processing || 
                                (paymentMethod === 'cash' && Number(amountTendered) < total) ||
                                (paymentMethod === 'qris' && isStaticQris && (!tenant?.qris_image_url || !isQrisVerified))
                            }
                            className="w-full py-3 sm:py-3.5 bg-secondary hover:bg-on-secondary-container active:scale-98 text-on-secondary rounded-xl font-headline-sm font-bold shadow-md transition-all disabled:opacity-50 mt-1 cursor-pointer"
                        >
                            {processing ? 'Memproses...' : 'Proses Pembayaran'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Mobile Cart Toggle Button */}
            <div className="md:hidden fixed bottom-5 right-4 left-4 z-20 flex justify-end pointer-events-none">
                <button 
                    onClick={() => setIsMobileCartOpen(true)} 
                    className="pointer-events-auto bg-primary text-on-primary px-5 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 hover:bg-primary/90 active:scale-95 transition-all border border-outline-variant/30"
                >
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <span className="font-bold text-xs sm:text-sm">
                        {cart.length > 0 ? `${formatRupiah(total)} • Lihat Pesanan` : 'Keranjang Kosong'}
                    </span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>

            {/* Modal Struk & Transaksi Berhasil (QRIS / Tunai) */}
            {receiptModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 border border-outline-variant flex flex-col space-y-4 max-h-[94vh]">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                            <div className="flex items-center space-x-3">
                                <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-2xl">
                                        {receiptModal.paymentMethod === 'qris' ? 'qr_code_2' : 'receipt_long'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-headline-sm font-bold text-primary leading-tight">
                                        Transaksi Berhasil!
                                    </h3>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                            receiptModal.paymentMethod === 'qris'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            Metode: {receiptModal.paymentMethod?.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-on-surface-variant font-mono">
                                            {receiptModal.invoiceNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setReceiptModal(prev => ({ ...prev, isOpen: false }))}
                                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-error transition active:scale-95"
                                title="Tutup Modal"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Status Notifikasi Cetak Bluetooth */}
                        {printFeedback && (
                            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xs ${
                                printFeedback.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30'
                                    : printFeedback.type === 'printing'
                                    ? 'bg-blue-500/10 text-blue-800 border-blue-500/30 animate-pulse'
                                    : printFeedback.type === 'error'
                                    ? 'bg-error/10 text-error border-error/20'
                                    : 'bg-amber-500/10 text-amber-800 border-amber-500/30'
                            }`}>
                                <div className="flex items-center space-x-2 min-w-0">
                                    <span className="material-symbols-outlined text-base shrink-0">
                                        {printFeedback.type === 'success' 
                                            ? 'check_circle' 
                                            : printFeedback.type === 'printing' 
                                            ? 'print' 
                                            : printFeedback.type === 'error' 
                                            ? 'error' 
                                            : 'bluetooth_searching'}
                                    </span>
                                    <span className="truncate">{printFeedback.message}</span>
                                </div>
                                {!printerState.isConnected && (
                                    <button
                                        onClick={() => setIsPrinterSettingsOpen(true)}
                                        className="ml-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shrink-0 active:scale-95 transition shadow-xs"
                                    >
                                        Sambungkan
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Struk Thermal Live Preview Container */}
                        <div className="flex-1 overflow-hidden rounded-2xl bg-white border border-outline-variant shadow-md flex flex-col">
                            <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex items-center justify-between text-xs text-on-surface-variant font-medium">
                                <span className="flex items-center space-x-1.5">
                                    <span className="material-symbols-outlined text-sm text-secondary">receipt</span>
                                    <span>Pratinjau Struk Thermal {printerState.paperWidth}mm</span>
                                </span>
                                <span className="text-[11px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                    Status: LUNAS
                                </span>
                            </div>
                            
                            <div className="p-2 bg-neutral-100/60 overflow-y-auto max-h-[380px] flex justify-center">
                                <div className="w-[280px] sm:w-[320px] bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                                    <iframe 
                                        src={receiptModal.url}
                                        title="Struk Kasir"
                                        className="w-full h-[400px] border-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleReprintReceipt}
                                    disabled={isReprinting}
                                    className="flex-1 py-3.5 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md font-bold shadow-md flex items-center justify-center space-x-2 active:scale-95 transition disabled:opacity-50"
                                    title="Cetak ulang struk jika kertas habis atau ingin cetak rangkap"
                                >
                                    <span className={`material-symbols-outlined text-lg ${isReprinting ? 'animate-spin' : ''}`}>
                                        {isReprinting ? 'sync' : 'replay'}
                                    </span>
                                    <span>{isReprinting ? 'Mencetak Ulang...' : 'Cetak Ulang Struk'}</span>
                                </button>

                                <button
                                    onClick={() => window.open(receiptModal.url, '_blank')}
                                    className="p-3.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-label-md font-semibold flex items-center justify-center active:scale-95 transition border border-outline-variant"
                                    title="Buka struk di tab browser baru"
                                >
                                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                                </button>
                            </div>

                            <button
                                onClick={handleFinishTransaction}
                                className="w-full py-3.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-xl font-label-md font-bold transition shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                <span>Selesai & Transaksi Baru</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pop-up Transaksi Berhasil */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
                        {/* Status Icon */}
                        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-50"></div>
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner border-2 border-emerald-500/40">
                                <span className="material-symbols-outlined text-5xl">check_circle</span>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                            <h3 className="font-headline-md font-extrabold text-on-surface text-xl">
                                Transaksi Berhasil!
                            </h3>
                            <p className="font-body-md text-xs text-on-surface-variant font-medium">
                                {flash?.success || 'Pembayaran diterima dan transaksi telah berhasil dicatat.'}
                            </p>
                        </div>

                        {/* Summary Details Card */}
                        {(lastCompletedTx || flash?.invoice_number || receiptModal.invoiceNumber) && (
                            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/60 text-xs text-left space-y-2.5">
                                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30">
                                    <span className="text-on-surface-variant">No. Invoice</span>
                                    <span className="font-mono font-bold text-on-surface">
                                        {lastCompletedTx?.invoiceNumber || flash?.invoice_number || receiptModal.invoiceNumber || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30">
                                    <span className="text-on-surface-variant">Metode Bayar</span>
                                    <span className="font-bold uppercase px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] tracking-wide">
                                        {lastCompletedTx?.paymentMethod || flash?.payment_method || receiptModal.paymentMethod || 'TUNAI'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-on-surface-variant font-medium">Total Pembayaran</span>
                                    <span className="font-bold text-base text-primary font-headline-sm">
                                        {formatRupiah(lastCompletedTx?.totalAmount || flash?.total_amount || receiptModal.totalAmount || 0)}
                                    </span>
                                </div>
                                <div className="pt-1.5 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] space-x-1 border-t border-dashed border-outline-variant/40">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span>LUNAS &bull; STOK DIPERBARUI</span>
                                </div>
                            </div>
                        )}

                        {/* 5-second Auto-close Indicator */}
                        <div className="space-y-1.5 pt-1">
                            <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                                    style={{ width: `${(successCountdown / 5) * 100}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-on-surface-variant">
                                <span className="material-symbols-outlined text-xs text-emerald-600 animate-pulse">timer</span>
                                <span>Menutup otomatis dalam <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{successCountdown} detik</strong></span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-1">
                            <button 
                                onClick={handleDismissSuccessModal} 
                                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                                <span>Siap Transaksi Baru ({successCountdown}s)</span>
                            </button>

                            {(receiptModal.url || lastCompletedTx?.url) && (
                                <button
                                    onClick={handleReopenReceipt}
                                    className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-md font-semibold text-xs border border-outline-variant flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">receipt_long</span>
                                    <span>Lihat Struk Kembali</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pop-up Transaksi Gagal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-container-lowest border border-error/30 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
                        {/* Error Icon */}
                        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                            <div className="w-20 h-20 bg-error-container/40 text-error rounded-full flex items-center justify-center shadow-inner border-2 border-error/30">
                                <span className="material-symbols-outlined text-5xl">cancel</span>
                            </div>
                        </div>

                        {/* Header Text */}
                        <div className="space-y-1">
                            <h3 className="font-headline-md font-extrabold text-on-surface text-xl">
                                {errorTitle || 'Transaksi Gagal!'}
                            </h3>
                            <p className="font-body-md text-xs text-on-surface-variant font-medium">
                                Transaksi tidak dapat diselesaikan. Silakan periksa rincian di bawah ini.
                            </p>
                        </div>

                        {/* Reason Box */}
                        <div className="bg-error-container/20 border border-error/30 rounded-2xl p-4 text-xs text-left space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-error font-bold">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                <span>Penyebab Kendala:</span>
                            </div>
                            <p className="text-on-surface leading-relaxed font-medium">
                                {errorMessage || errors?.error || flash?.error || 'Terjadi kesalahan sistem atau data pembayaran belum lengkap.'}
                            </p>
                        </div>

                        {/* Action Button */}
                        <button 
                            onClick={() => setShowErrorModal(false)} 
                            className="w-full py-3.5 bg-error hover:bg-error/90 text-on-error rounded-xl font-label-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            <span>Periksa & Coba Lagi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Panduan Instalasi PWA (iOS & Android/Desktop) */}
            {showInstallGuideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">
                                        {isIosDevice ? 'install_mobile' : 'download_for_offline'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-headline-md font-extrabold text-on-surface text-lg">
                                        {isIosDevice ? 'Pasang di iPhone / iPad' : 'Pasang Aplikasi Kasir'}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant font-medium">
                                        Layar penuh (Fullscreen) tanpa bar browser
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInstallGuideModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Step by Step Guide */}
                        {isIosDevice ? (
                            <div className="space-y-3 bg-surface-container-low/60 rounded-2xl p-4 border border-outline-variant/40 text-xs">
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center shrink-0 text-[11px]">
                                        1
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        Tekan tombol <span className="font-bold text-secondary">Bagikan (Share)</span> berikon kotak dengan panah ke atas <strong className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/60 font-mono">[↑]</strong> di bilah bawah Safari.
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center shrink-0 text-[11px]">
                                        2
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        Gulir ke bawah dan pilih menu <span className="font-bold text-on-surface">"Tambahkan ke Layar Utama"</span> (<em>Add to Home Screen</em>).
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center shrink-0 text-[11px]">
                                        3
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        Tekan tombol <span className="font-bold text-secondary">"Tambah"</span> (<em>Add</em>) di pojok kanan atas.
                                    </p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-outline-variant/40 text-[11px] text-on-surface-variant flex items-center space-x-1.5">
                                    <span className="material-symbols-outlined text-sm text-amber-500">info</span>
                                    <span>Jika tombol bawah belum tampil, sentuh bilah URL bawah atau geser layar ke atas.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-surface-container-low/60 rounded-2xl p-4 border border-outline-variant/40 text-xs">
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center shrink-0 text-[11px]">
                                        1
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        Klik tombol menu browser Anda (<span className="font-bold">titik 3 di kanan atas</span> Chrome / Edge).
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold flex items-center justify-center shrink-0 text-[11px]">
                                        2
                                    </div>
                                    <p className="text-on-surface font-medium leading-relaxed">
                                        Pilih menu <span className="font-bold text-secondary">"Instal Aplikasi"</span> atau <span className="font-bold text-secondary">"Tambahkan ke Layar Utama"</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={() => setShowInstallGuideModal(false)}
                            className="w-full py-3 bg-secondary hover:bg-on-secondary-container text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <span className="material-symbols-outlined text-base">check</span>
                            <span>Saya Mengerti</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Pengaturan Printer Thermal Bluetooth */}
            <PrinterSettingsModal
                isOpen={isPrinterSettingsOpen}
                onClose={() => setIsPrinterSettingsOpen(false)}
                storeName={tenant?.name || 'KASIR'}
            />

            {/* Modal Validasi Logout / Tutup Shift */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Tutup Shift & Keluar?"
                message="Apakah Anda yakin ingin menutup shift kasir dan keluar? Pastikan seluruh pesanan dan transaksi pelanggan telah selesai diproses."
                confirmText="Ya, Tutup Shift"
                user={auth?.user}
                storeName={tenant?.name}
            />

            {/* Modal Pop-up QRIS Preview Layar Penuh (Ukuran Besar & Sangat Jelas untuk Pelanggan Scan) */}
            {showQrisPreviewModal && (tenant?.qris_image_url || qrisUrl) && (
                <div 
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setShowQrisPreviewModal(false)}
                >
                    <div 
                        className="bg-surface rounded-3xl max-w-lg sm:max-w-xl w-full max-h-[94vh] p-4 sm:p-6 shadow-2xl border border-outline-variant flex flex-col items-center text-center relative animate-in zoom-in-95 duration-200 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button"
                            onClick={() => setShowQrisPreviewModal(false)}
                            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition cursor-pointer shadow-xs"
                            title="Tutup Preview QRIS"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>

                        {/* Store Badge */}
                        <div className="flex items-center space-x-1.5 bg-secondary-fixed text-on-secondary-fixed px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-sm">qr_code_2</span>
                            <span>QRIS Pembayaran &bull; {tenant?.name || 'Toko'}</span>
                        </div>

                        {/* Large High-Visibility QR Container */}
                        <div className="w-full max-w-[480px] h-[55vh] sm:h-[62vh] max-h-[540px] min-h-[360px] bg-white p-3 sm:p-4 rounded-2xl border-2 border-secondary shadow-lg flex items-center justify-center my-2">
                            <img 
                                src={tenant?.qris_image_url || qrisUrl} 
                                alt="Barcode QRIS Toko" 
                                className="w-full h-full object-contain select-none" 
                            />
                        </div>

                        {/* Total Payment Amount Notice */}
                        <div className="w-full max-w-[480px] bg-surface-container-low p-3.5 sm:p-4 rounded-2xl border border-outline-variant mt-2 space-y-1 shadow-2xs">
                            <span className="text-xs sm:text-sm text-on-surface-variant font-medium block">
                                Minta pelanggan scan & transfer nominal pas:
                            </span>
                            <span className="font-headline-md font-black text-primary text-2xl sm:text-3xl md:text-4xl block tracking-tight">
                                {formatRupiah(total)}
                            </span>
                            <span className="text-[11px] text-on-surface-variant block">
                                Mendukung semua aplikasi e-Wallet (GoPay, OVO, Dana, ShopeePay) & Mobile Banking (BCA, BRI, Mandiri, dll)
                            </span>
                        </div>

                        {/* Close Action Button */}
                        <button 
                            type="button"
                            onClick={() => setShowQrisPreviewModal(false)}
                            className="w-full max-w-[480px] py-3 bg-secondary hover:bg-on-secondary-container text-on-secondary rounded-xl font-bold font-label-md text-sm sm:text-base mt-4 transition active:scale-95 cursor-pointer shadow-md"
                        >
                            Tutup Tampilan QRIS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
