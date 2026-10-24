import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import MerchantNavbar from '@/Components/MerchantNavbar';

export default function ExpenseIndex({ auth, expenses, currentMonth, flash }) {
    const [showAddModal, setShowAddModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Bahan Baku',
        amount: '',
        description: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('expenses.store'), {
            onSuccess: () => {
                reset();
                setShowAddModal(false);
            }
        });
    };

    const deleteExpense = (id) => {
        if (confirm('Hapus catatan pengeluaran ini?')) {
            router.delete(route('expenses.destroy', id));
        }
    };

    const handleMonthChange = (e) => {
        router.get(route('expenses.index'), { month: e.target.value }, { preserveState: true });
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    const formatNumberWithDots = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const digits = String(val).replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('id-ID');
    };

    const categories = ['Bahan Baku', 'Gaji & Bonus', 'Sewa', 'Utilitas/Listrik/Air', 'Lain-lain'];

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Manajemen Pengeluaran" />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={auth.user?.tenant} auth={auth} activePage="expenses" />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {flash?.success && (
                    <div className="bg-green-100 text-green-800 px-4 py-3 rounded-xl font-label-md shadow-sm border border-green-200 flex items-center">
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-headline-sm sm:font-headline-md font-bold text-on-surface flex items-center">
                        <span className="material-symbols-outlined text-primary mr-2">payments</span>
                        Catatan Pengeluaran Operasional
                    </h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <input 
                            type="month" 
                            value={currentMonth} 
                            onChange={handleMonthChange}
                            className="w-full sm:w-auto bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-on-surface outline-none cursor-pointer hover:bg-surface-container-lowest transition-colors shadow-xs"
                            title="Pilih Bulan Pengeluaran"
                        />
                        <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm text-xs sm:text-sm font-semibold">
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Catat Pengeluaran Baru</span>
                        </button>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Tanggal</th>
                                    <th className="px-5 py-4 font-semibold">Kategori</th>
                                    <th className="px-5 py-4 font-semibold">Nominal (Rp)</th>
                                    <th className="px-5 py-4 font-semibold">Deskripsi / Catatan</th>
                                    <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">{new Date(expense.expense_date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-5 py-4">
                                            <span className="px-2 py-1 rounded-md font-label-sm font-bold bg-surface-container-highest text-on-surface-variant">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-error font-semibold whitespace-nowrap">
                                            {formatRupiah(expense.amount)}
                                        </td>
                                        <td className="px-5 py-4 text-on-surface-variant text-sm">
                                            {expense.description || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button onClick={() => deleteExpense(expense.id)} className="w-8 h-8 inline-flex items-center justify-center bg-error-container text-on-error-container rounded-lg hover:bg-error hover:text-on-error transition-colors active:scale-95" title="Hapus Data">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-10 text-center text-on-surface-variant italic">
                                            Tidak ada catatan pengeluaran di bulan {currentMonth}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Expense Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-surface p-6 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                            <h3 className="font-headline-sm font-bold text-primary mb-6 flex items-center">
                                <span className="material-symbols-outlined mr-2">receipt_long</span> Catat Pengeluaran Baru
                            </h3>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-label-sm font-semibold text-on-surface mb-2">Tanggal <span className="text-error font-bold">*</span></label>
                                        <input type="date" required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={data.expense_date} onChange={e => setData('expense_date', e.target.value)} />
                                        {errors.expense_date && <p className="text-error text-sm mt-1">{errors.expense_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block font-label-sm font-semibold text-on-surface mb-2">Kategori <span className="text-error font-bold">*</span></label>
                                        <select required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={data.category} onChange={e => setData('category', e.target.value)}>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="text-error text-sm mt-1">{errors.category}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Nominal Pengeluaran (Rp) <span className="text-error font-bold">*</span></label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        required 
                                        placeholder="Contoh: 350.000" 
                                        className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" 
                                        value={formatNumberWithDots(data.amount)} 
                                        onChange={e => setData('amount', e.target.value.replace(/\D/g, ''))} 
                                    />
                                    {errors.amount && <p className="text-error text-sm mt-1">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block font-label-sm font-semibold text-on-surface mb-2">Deskripsi / Keterangan Tambahan</label>
                                    <textarea rows="3" placeholder="Contoh: Bayar tagihan Wi-Fi Indihome bulan ini" className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md resize-none" value={data.description} onChange={e => setData('description', e.target.value)}></textarea>
                                    {errors.description && <p className="text-error text-sm mt-1">{errors.description}</p>}
                                </div>
                                
                                <div className="pt-4 border-t border-outline-variant flex justify-end space-x-3">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-surface-container-highest text-on-surface font-label-lg rounded-xl hover:bg-outline-variant/30 transition-all active:scale-95">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={processing} className="px-6 py-3 bg-primary text-on-primary font-label-lg rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2">
                                        <span className="material-symbols-outlined text-sm">save</span>
                                        <span>Simpan Catatan</span>
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
