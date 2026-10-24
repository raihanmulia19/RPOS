import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function ProductIndex({ auth, products, categories, flash, errors = {} }) {
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [editProduct, setEditProduct] = useState(null);

    const displayedProducts = filterCategory === 'all' 
        ? products 
        : products.filter(p => p.category_id.toString() === filterCategory.toString());
    
    // Form for Category
    const { data: catData, setData: setCatData, post: postCat, reset: resetCat, processing: processingCat } = useForm({
        name: ''
    });

    const submitCategory = (e) => {
        e.preventDefault();
        postCat(route('categories.store'), {
            onSuccess: () => {
                resetCat();
                setShowAddCategory(false);
            }
        });
    };

    // Form for Product
    const { data: prodData, setData: setProdData, post: postProd, reset: resetProd, processing: processingProd } = useForm({
        category_id: categories.length > 0 ? categories[0].id : '',
        name: '',
        price: '',
        cost_price: '',
        is_stock_tracked: false,
        stock_quantity: 0,
        is_active: true,
        image: null
    });

    const submitProduct = (e) => {
        e.preventDefault();
        postProd(route('products.store'), {
            onSuccess: () => {
                resetProd();
                setShowAddProduct(false);
            }
        });
    };

    // Form for Edit Product
    const { data: editData, setData: setEditData, post: postEdit, processing: processingEdit } = useForm({
        _method: 'put',
        category_id: '',
        name: '',
        price: '',
        cost_price: '',
        is_stock_tracked: false,
        stock_quantity: 0,
        image: null
    });

    const formatNumberWithDots = (val) => {
        if (val === null || val === undefined || val === '') return '';
        let clean = val;
        if (typeof clean === 'number') {
            clean = Math.round(clean).toString();
        } else if (typeof clean === 'string' && /^\d+\.\d{2}$/.test(clean)) {
            clean = Math.round(parseFloat(clean)).toString();
        }
        const digits = String(clean).replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('id-ID');
    };

    const openEditModal = (product) => {
        setEditData({
            _method: 'put',
            category_id: product.category_id,
            name: product.name,
            price: product.price ? Math.round(Number(product.price)).toString() : '',
            cost_price: product.cost_price ? Math.round(Number(product.cost_price)).toString() : '0',
            is_stock_tracked: !!product.is_stock_tracked,
            stock_quantity: product.stock_quantity || 0,
            image: null // reset image so we don't send anything if they don't pick a new one
        });
        setEditProduct(product);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        postEdit(route('products.update', editProduct.id), {
            onSuccess: () => {
                setEditProduct(null);
            }
        });
    };

    const deleteProduct = (id) => {
        if(confirm('Hapus produk ini secara permanen?')) {
            router.delete(route('products.destroy', id));
        }
    };

    const deleteCategory = (id) => {
        if(confirm('Hapus kategori ini? SEMUA PRODUK di dalamnya akan ikut terhapus!')) {
            router.delete(route('categories.destroy', id));
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Manajemen Produk" />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={auth.user?.tenant} auth={auth} activePage="products" />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {flash?.success && (
                    <div className="bg-green-100 text-green-800 px-4 py-3 rounded-xl font-label-md shadow-sm border border-green-200 flex items-center">
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        {flash.success}
                    </div>
                )}

                {/* Quota Error from Backend */}
                {errors?.quota && (
                    <div className="bg-red-100 text-red-800 px-4 py-3.5 rounded-xl font-label-md shadow-sm border border-red-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined">error</span>
                            <span>{errors.quota}</span>
                        </div>
                        <Link
                            href={route('subscription.plans')}
                            className="px-3 py-1 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800"
                        >
                            Upgrade Paket
                        </Link>
                    </div>
                )}

                {/* Full Quota Warning Banner */}
                {auth.user?.tenant?.quota_usage?.products?.is_full && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Batas Kuota Produk Tercapai</h4>
                                <p className="text-xs text-amber-800">
                                    Paket <strong>{auth.user?.tenant?.quota_usage?.plan_name}</strong> toko Anda telah mencapai batas maksimal ({auth.user?.tenant?.quota_usage?.products?.max} produk). Upgrade paket untuk menambah lebih banyak produk.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('subscription.plans')}
                            className="shrink-0 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center space-x-1"
                        >
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            <span>Upgrade Paket Sekarang</span>
                        </Link>
                    </div>
                )}

                {/* Actions & Quota Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => setShowAddCategory(!showAddCategory)} className="flex items-center justify-center space-x-2 px-5 py-3 bg-surface-container-highest text-on-surface font-label-lg rounded-xl hover:bg-outline-variant/30 transition-all active:scale-95 shadow-sm">
                            <span className="material-symbols-outlined">{showAddCategory ? 'close' : 'category'}</span>
                            <span>{showAddCategory ? 'Batal Tambah Kategori' : 'Tambah Kategori'}</span>
                        </button>
                        <button 
                            onClick={() => {
                                if (auth.user?.tenant?.quota_usage?.products?.is_full) {
                                    alert(`Batas kuota produk untuk paket ${auth.user?.tenant?.quota_usage?.plan_name} (${auth.user?.tenant?.quota_usage?.products?.max} produk) telah tercapai. Silakan upgrade paket.`);
                                    return;
                                }
                                setShowAddProduct(!showAddProduct);
                            }} 
                            className={`flex items-center justify-center space-x-2 px-5 py-3 font-label-lg rounded-xl transition-all active:scale-95 shadow-sm ${
                                auth.user?.tenant?.quota_usage?.products?.is_full
                                    ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-75'
                                    : 'bg-primary text-on-primary hover:bg-primary/90'
                            }`}
                        >
                            <span className="material-symbols-outlined">{showAddProduct ? 'close' : 'add_box'}</span>
                            <span>{showAddProduct ? 'Batal Tambah Produk' : 'Tambah Produk Baru'}</span>
                        </button>
                    </div>

                    {/* Quota Usage Pill */}
                    {auth.user?.tenant?.quota_usage?.products && (
                        <div className="flex items-center space-x-3 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant shadow-sm text-xs">
                            <div className="flex items-center space-x-1.5 text-on-surface">
                                <span className="material-symbols-outlined text-secondary text-base">inventory_2</span>
                                <span>Kuota Produk:</span>
                                <strong className="text-primary font-bold">
                                    {auth.user.tenant.quota_usage.products.current} / {auth.user.tenant.quota_usage.products.is_unlimited ? '∞' : auth.user.tenant.quota_usage.products.max}
                                </strong>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
                                {auth.user.tenant.quota_usage.plan_name}
                            </span>
                            {auth.user?.role === 'owner' && (
                                <Link
                                    href={route('subscription.plans')}
                                    className="text-secondary hover:text-primary font-bold underline text-xs"
                                >
                                    Upgrade
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Form Add Category */}
                {showAddCategory && (
                    <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant transition-all">
                        <h3 className="font-headline-sm font-bold text-primary mb-4 flex items-center">
                            <span className="material-symbols-outlined mr-2">add_circle</span> Tambah Kategori Baru
                        </h3>
                        <form onSubmit={submitCategory} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                            <div className="flex-1">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">Nama Kategori <span className="text-error font-bold">*</span></label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                    placeholder="Contoh: Makanan Berat"
                                    value={catData.name}
                                    onChange={e => setCatData('name', e.target.value)}
                                />
                            </div>
                            <button type="submit" disabled={processingCat} className="px-6 py-3 bg-secondary text-on-secondary font-label-lg rounded-xl shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50 flex items-center justify-center">
                                Simpan Kategori
                            </button>
                        </form>
                    </div>
                )}

                {/* Form Add Product */}
                {showAddProduct && (
                    <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant transition-all">
                        <h3 className="font-headline-sm font-bold text-primary mb-4 flex items-center">
                            <span className="material-symbols-outlined mr-2">inventory_2</span> Tambah Produk Baru
                        </h3>
                        {categories.length === 0 ? (
                            <div className="p-4 bg-error-container text-on-error-container rounded-xl font-body-md flex items-center">
                                <span className="material-symbols-outlined mr-2">warning</span>
                                Silakan tambah kategori terlebih dahulu!
                            </div>
                        ) : (
                            <form onSubmit={submitProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Nama Produk <span className="text-error font-bold">*</span></label>
                                    <input type="text" required placeholder="Contoh: Nasi Goreng Spesial" className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={prodData.name} onChange={e => setProdData('name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Kategori <span className="text-error font-bold">*</span></label>
                                    <select required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={prodData.category_id} onChange={e => setProdData('category_id', e.target.value)}>
                                        <option value="">Pilih Kategori...</option>
                                        {categories.map(cat => (
                                             <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Harga Jual (Rp) <span className="text-error font-bold">*</span></label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        required 
                                        placeholder="Contoh: 25.000" 
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                        value={formatNumberWithDots(prodData.price)} 
                                        onChange={e => setProdData('price', e.target.value.replace(/\D/g, ''))} 
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="font-label-sm font-semibold text-on-surface">Harga Modal / HPP (Rp)</label>
                                        <span className="text-[11px] text-on-surface-variant font-medium">(Opsional)</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        inputMode="numeric" 
                                        placeholder="0 (atau kosongkan)" 
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                        value={formatNumberWithDots(prodData.cost_price)} 
                                        onChange={e => setProdData('cost_price', e.target.value.replace(/\D/g, ''))} 
                                    />
                                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">Boleh dikosongkan jika produk olahan dapur (modal bahan baku dicatat di menu Pengeluaran).</p>
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Gambar Produk (Opsional)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-2 font-body-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary-container/80 cursor-pointer" 
                                        onChange={e => setProdData('image', e.target.files[0])} 
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center space-x-3 p-3 bg-surface-container-highest rounded-xl border border-outline-variant">
                                        <input type="checkbox" id="isTracked" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-2" checked={prodData.is_stock_tracked} onChange={e => setProdData('is_stock_tracked', e.target.checked)} />
                                        <div>
                                            <label htmlFor="isTracked" className="font-label-md font-bold text-on-surface cursor-pointer">Lacak Stok?</label>
                                            <p className="font-body-sm text-on-surface-variant text-xs">Centang jika ini barang fisik terbatas.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {prodData.is_stock_tracked && (
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block font-label-sm font-semibold text-on-surface mb-2">Jumlah Stok Awal</label>
                                        <input type="number" min="0" required className="w-full sm:w-1/2 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={prodData.stock_quantity} onChange={e => setProdData('stock_quantity', e.target.value)} />
                                    </div>
                                )}
                                
                                <div className="col-span-1 sm:col-span-2 pt-4 border-t border-outline-variant flex justify-end">
                                    <button type="submit" disabled={processingProd} className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-on-primary font-label-lg rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 w-full sm:w-auto">
                                        <span className="material-symbols-outlined">save</span>
                                        <span>Simpan Produk</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Product Table */}
                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className="material-symbols-outlined text-primary">fastfood</span>
                                <h2 className="font-headline-sm font-bold text-on-surface">Daftar Produk Aktif</h2>
                            </div>
                            <div>
                                <select 
                                    className="bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-1 font-body-sm"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="all">Semua Kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-body-md text-on-surface">
                                <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold w-12 text-center">No.</th>
                                        <th className="px-5 py-4 font-semibold">Nama Produk</th>
                                        <th className="px-5 py-4 font-semibold">Kategori</th>
                                        <th className="px-5 py-4 font-semibold">Harga</th>
                                        <th className="px-5 py-4 font-semibold">Stok</th>
                                        <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {displayedProducts.map((product, index) => (
                                        <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="px-5 py-4 text-center text-on-surface-variant font-bold">{index + 1}</td>
                                            <td className="px-5 py-4 font-bold">{product.name}</td>
                                            <td className="px-5 py-4 text-on-surface-variant">{product.category?.name}</td>
                                            <td className="px-5 py-4 text-primary font-semibold">{formatRupiah(product.price)}</td>
                                            <td className="px-5 py-4">
                                                {product.is_stock_tracked ? (
                                                    <span className={`px-3 py-1 inline-flex font-label-sm font-bold rounded-full ${
                                                        product.stock_quantity <= 0 
                                                            ? 'bg-error-container text-on-error-container' 
                                                            : product.stock_quantity <= 5 
                                                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                                                : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {product.stock_quantity <= 0 ? 'Habis (0)' : `Sisa: ${product.stock_quantity} unit`}
                                                    </span>
                                                ) : (
                                                    <span className="text-on-surface-variant italic font-body-sm">Tak Terbatas</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right flex items-center justify-end space-x-2">
                                                <button onClick={() => openEditModal(product)} className="w-8 h-8 flex items-center justify-center bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary hover:text-on-secondary transition-colors active:scale-95" title="Edit Produk">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 flex items-center justify-center bg-error-container text-on-error-container rounded-lg hover:bg-error hover:text-on-error transition-colors active:scale-95" title="Hapus Produk">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-10 text-center text-on-surface-variant italic">
                                                Belum ada produk tersimpan di kategori ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Categories */}
                    <div className="lg:col-span-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col h-fit">
                        <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center space-x-2">
                            <span className="material-symbols-outlined text-primary">category</span>
                            <h2 className="font-headline-sm font-bold text-on-surface">Daftar Kategori</h2>
                        </div>
                        <div className="p-5 flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center space-x-2 bg-surface-container-highest px-3 py-2 rounded-xl border border-outline-variant">
                                    <span className="font-label-md font-bold text-on-surface">{cat.name}</span>
                                    <button onClick={() => deleteCategory(cat.id)} className="text-on-surface-variant hover:text-error transition-colors flex items-center" title="Hapus Kategori">
                                        <span className="material-symbols-outlined text-sm">cancel</span>
                                    </button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <div className="text-on-surface-variant font-body-sm italic w-full text-center py-4">
                                    Belum ada kategori.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Edit Product */}
                {editProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-surface p-6 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="font-headline-sm font-bold text-primary mb-6 flex items-center">
                                <span className="material-symbols-outlined mr-2">edit</span> Edit Produk: {editProduct.name}
                            </h3>
                            <form onSubmit={submitEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Nama Produk <span className="text-error font-bold">*</span></label>
                                    <input type="text" required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={editData.name} onChange={e => setEditData('name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Kategori <span className="text-error font-bold">*</span></label>
                                    <select required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={editData.category_id} onChange={e => setEditData('category_id', e.target.value)}>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Harga Jual (Rp) <span className="text-error font-bold">*</span></label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        required 
                                        placeholder="Contoh: 25.000"
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                        value={formatNumberWithDots(editData.price)} 
                                        onChange={e => setEditData('price', e.target.value.replace(/\D/g, ''))} 
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="font-label-sm font-semibold text-on-surface">Harga Modal / HPP (Rp)</label>
                                        <span className="text-[11px] text-on-surface-variant font-medium">(Opsional)</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        placeholder="0 (atau kosongkan)"
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                        value={formatNumberWithDots(editData.cost_price)} 
                                        onChange={e => setEditData('cost_price', e.target.value.replace(/\D/g, ''))} 
                                    />
                                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">Boleh dikosongkan jika produk olahan dapur (modal bahan baku dicatat di menu Pengeluaran).</p>
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Gambar Baru (Kosongkan jika tak diubah)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-2 font-body-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary-container/80 cursor-pointer" 
                                        onChange={e => setEditData('image', e.target.files[0])} 
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center space-x-3 p-3 bg-surface-container-highest rounded-xl border border-outline-variant">
                                        <input type="checkbox" id="editIsTracked" className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-2" checked={editData.is_stock_tracked} onChange={e => setEditData('is_stock_tracked', e.target.checked)} />
                                        <div>
                                            <label htmlFor="editIsTracked" className="font-label-md font-bold text-on-surface cursor-pointer">Lacak Stok?</label>
                                        </div>
                                    </div>
                                </div>
                                {editData.is_stock_tracked && (
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block font-label-sm font-semibold text-on-surface mb-2">Ubah Sisa Stok</label>
                                        <input type="number" min="0" required className="w-full sm:w-1/2 bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={editData.stock_quantity} onChange={e => setEditData('stock_quantity', e.target.value)} />
                                    </div>
                                )}
                                <div className="col-span-1 sm:col-span-2 pt-6 border-t border-outline-variant flex justify-end space-x-3">
                                    <button type="button" onClick={() => setEditProduct(null)} className="px-6 py-3 bg-surface-container-highest text-on-surface font-label-lg rounded-xl hover:bg-outline-variant/30 transition-all active:scale-95">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={processingEdit} className="px-6 py-3 bg-primary text-on-primary font-label-lg rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
