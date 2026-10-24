import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import MerchantNavbar from '@/Components/MerchantNavbar';
import ResetCashierPasswordModal from '@/Components/ResetCashierPasswordModal';

export default function AdminsIndex({ auth, admins, outlets = [], flash, errors }) {
    const [showAdd, setShowAdd] = useState(false);
    const [selectedCashierForPassword, setSelectedCashierForPassword] = useState(null);
    
    const { data, setData, post, reset, processing } = useForm({
        name: '',
        email: '',
        password: '',
        outlet_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admins.store'), {
            onSuccess: () => {
                reset();
                setShowAdd(false);
            }
        });
    };

    const deleteAdmin = (id) => {
        if(confirm('Yakin ingin menghapus akun kasir ini secara permanen?')) {
            router.delete(route('admins.destroy', id));
        }
    };

    return (
        <div className="min-h-screen bg-surface font-body-md text-on-surface">
            <Head title="Manajemen Kasir" />

            {/* Adaptive Responsive Navbar */}
            <MerchantNavbar tenant={auth.user?.tenant} auth={auth} activePage="admins" />

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {flash?.success && (
                    <div className="bg-green-100 text-green-800 px-4 py-3 rounded-xl font-label-md shadow-sm border border-green-200 flex items-center">
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        {flash.success}
                    </div>
                )}
                {errors?.email && (
                    <div className="bg-red-100 text-red-800 px-4 py-3 rounded-xl font-label-md shadow-sm border border-red-200 flex items-center">
                        <span className="material-symbols-outlined mr-2">error</span>
                        {errors.email}
                    </div>
                )}
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

                {/* Full Staff Quota Warning Banner */}
                {auth.user?.tenant?.quota_usage?.staff?.is_full && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Batas Kuota Akun Kasir Tercapai</h4>
                                <p className="text-xs text-amber-800">
                                    Paket <strong>{auth.user?.tenant?.quota_usage?.plan_name}</strong> toko Anda telah mencapai batas kuota staf ({auth.user?.tenant?.quota_usage?.staff?.max} akun kasir). Upgrade paket untuk menambah lebih banyak kasir.
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="font-headline-md font-bold text-on-surface">Pembagian Shift (Daftar Kasir)</h2>
                            {auth.user?.tenant?.quota_usage?.staff && (
                                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                                    {auth.user.tenant.quota_usage.staff.current} / {auth.user.tenant.quota_usage.staff.is_unlimited ? '∞' : auth.user.tenant.quota_usage.staff.max} Staf ({auth.user.tenant.quota_usage.plan_name})
                                </span>
                            )}
                        </div>
                        <p className="font-body-md text-on-surface-variant">Kelola akun yang berhak login ke Terminal POS.</p>
                    </div>

                    <button 
                        onClick={() => {
                            if (auth.user?.tenant?.quota_usage?.staff?.is_full) {
                                alert(`Batas kuota akun kasir untuk paket ${auth.user?.tenant?.quota_usage?.plan_name} (${auth.user?.tenant?.quota_usage?.staff?.max} kasir) telah tercapai. Silakan upgrade paket.`);
                                return;
                            }
                            setShowAdd(!showAdd);
                        }} 
                        className={`flex items-center space-x-2 px-5 py-3 font-label-lg rounded-xl transition-all active:scale-95 shadow-sm ${
                            auth.user?.tenant?.quota_usage?.staff?.is_full
                                ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-75'
                                : 'bg-primary text-on-primary hover:bg-primary/90'
                        }`}
                    >
                        <span className="material-symbols-outlined">{showAdd ? 'close' : 'person_add'}</span>
                        <span>{showAdd ? 'Batal' : 'Tambah Akun Kasir'}</span>
                    </button>
                </div>

                {/* Form Add */}
                {showAdd && (
                    <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant transition-all">
                        <form onSubmit={submit} className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">Nama Lengkap / Shift <span className="text-error font-bold">*</span></label>
                                <input type="text" required placeholder="Ex: Rina (Shift Pagi)" className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={data.name} onChange={e => setData('name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">Email Kasir <span className="text-error font-bold">*</span></label>
                                <input type="email" required placeholder="rina@kopikarsa.com" className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={data.email} onChange={e => setData('email', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">Password Login <span className="text-error font-bold">*</span></label>
                                <input type="password" required className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md" value={data.password} onChange={e => setData('password', e.target.value)} />
                                <p className="text-xs text-on-surface-variant mt-1">Minimal 8 karakter.</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block font-label-sm font-semibold text-on-surface mb-2">Penugasan Cabang Outlet</label>
                                <select
                                    value={data.outlet_id}
                                    onChange={e => setData('outlet_id', e.target.value)}
                                    className="w-full bg-surface-container-lowest border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl p-3 font-body-md text-on-surface outline-none"
                                >
                                    <option value="">Semua Cabang / Cabang Utama</option>
                                    {outlets?.map(o => (
                                        <option key={o.id} value={o.id}>{o.name} {o.is_main ? '(Pusat)' : ''}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-on-surface-variant mt-1">Cabang tempat kasir ini beroperasi.</p>
                            </div>
                            <div className="col-span-2 pt-4 border-t border-outline-variant flex justify-end">
                                <button type="submit" disabled={processing} className="px-6 py-3 bg-secondary text-on-secondary font-label-lg rounded-xl shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50">
                                    Buat Akun Kasir
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List Table */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-body-md text-on-surface">
                            <thead className="bg-surface-container-highest font-label-md text-on-surface-variant border-b border-outline-variant">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Nama Kasir</th>
                                    <th className="px-5 py-4 font-semibold">Email</th>
                                    <th className="px-5 py-4 font-semibold">Cabang Bertugas</th>
                                    <th className="px-5 py-4 font-semibold">Hak Akses</th>
                                    <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {admins.map(admin => (
                                    <tr key={admin.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="px-5 py-4 font-bold flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{admin.name}</span>
                                        </td>
                                        <td className="px-5 py-4 text-on-surface-variant">{admin.email}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container-high text-primary">
                                                <span className="material-symbols-outlined text-[13px]">store</span>
                                                <span>{admin.outlet?.name || 'Cabang Utama'}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-primary font-semibold">Kasir (Terminal POS)</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setSelectedCashierForPassword(admin)} 
                                                    className="w-8 h-8 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface hover:text-primary rounded-lg transition-colors active:scale-95 border border-outline-variant/60" 
                                                    title="Ganti / Reset Password Kasir"
                                                >
                                                    <span className="material-symbols-outlined text-sm">key</span>
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => deleteAdmin(admin.id)} 
                                                    className="w-8 h-8 flex items-center justify-center bg-error-container text-on-error-container rounded-lg hover:bg-error hover:text-on-error transition-colors active:scale-95" 
                                                    title="Hapus Akun"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {admins.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-10 text-center text-on-surface-variant italic">
                                            Belum ada akun kasir. Silakan tambahkan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal Reset Password Kasir */}
            <ResetCashierPasswordModal
                isOpen={Boolean(selectedCashierForPassword)}
                onClose={() => setSelectedCashierForPassword(null)}
                cashier={selectedCashierForPassword}
            />
        </div>
    );
}
