import { useState, useEffect } from 'react';
import { bluetoothPrinter } from '@/Services/bluetoothPrinter';

export default function PrinterSettingsModal({ isOpen, onClose, storeName = 'KASIR' }) {
    const [printerState, setPrinterState] = useState(bluetoothPrinter.getState());
    const [isTesting, setIsTesting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    useEffect(() => {
        const unsubscribe = bluetoothPrinter.subscribe(setPrinterState);
        return () => unsubscribe();
    }, []);

    if (!isOpen) return null;

    const handleConnect = async () => {
        setStatusMessage(null);
        try {
            const res = await bluetoothPrinter.connect();
            setStatusMessage({ type: 'success', text: `Berhasil terhubung ke "${res.deviceName}"` });
        } catch (err) {
            console.error(err);
            if (err.name !== 'NotFoundError') {
                setStatusMessage({ type: 'error', text: err.message || 'Gagal menghubungkan printer bluetooth.' });
            }
        }
    };

    const handleDisconnect = async () => {
        setStatusMessage(null);
        await bluetoothPrinter.disconnect();
        setStatusMessage({ type: 'info', text: 'Koneksi printer telah diputus.' });
    };

    const handleTestPrint = async () => {
        if (!printerState.isConnected) {
            setStatusMessage({ type: 'error', text: 'Printer belum terhubung! Silakan sambungkan printer terlebih dahulu.' });
            return;
        }

        try {
            setIsTesting(true);
            setStatusMessage(null);
            await bluetoothPrinter.testPrint(storeName);
            setStatusMessage({ type: 'success', text: 'Perintah uji cetak berhasil dikirim ke printer!' });
        } catch (err) {
            console.error(err);
            setStatusMessage({ type: 'error', text: 'Gagal mencetak: ' + (err.message || 'Error pada printer') });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 border border-outline-variant flex flex-col space-y-4 max-h-[92vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                    <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-2xl">print</span>
                        </div>
                        <div>
                            <h3 className="font-headline-sm font-bold text-primary leading-tight">
                                Printer Thermal Bluetooth
                            </h3>
                            <p className="text-xs text-on-surface-variant">
                                Cetak struk kasir langsung tanpa dialog browser
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-error transition active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Status Alert */}
                {statusMessage && (
                    <div className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                        statusMessage.type === 'success' 
                            ? 'bg-green-500/10 text-green-700 border border-green-500/20' 
                            : statusMessage.type === 'error'
                            ? 'bg-error/10 text-error border border-error/20'
                            : 'bg-surface-container-highest text-on-surface border border-outline-variant'
                    }`}>
                        <span className="material-symbols-outlined text-base shrink-0">
                            {statusMessage.type === 'success' ? 'check_circle' : 'info'}
                        </span>
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                {/* Browser Support Warning */}
                {!printerState.isSupported && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-start space-x-2.5">
                        <span className="material-symbols-outlined text-lg text-amber-600 shrink-0 mt-0.5">warning</span>
                        <div className="leading-snug">
                            <strong>Browser Belum Mendukung Bluetooth:</strong> Gunakan browser <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di Windows/Android untuk menggunakan fitur cetak langsung.
                        </div>
                    </div>
                )}

                {/* Device Connection Card */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${
                                printerState.isConnected 
                                    ? 'bg-green-500 animate-pulse' 
                                    : printerState.isConnecting 
                                    ? 'bg-amber-500 animate-ping' 
                                    : 'bg-neutral-400'
                            }`} />
                            <span className="text-xs font-bold text-on-surface">
                                {printerState.isConnected 
                                    ? `Terhubung: ${printerState.deviceName}` 
                                    : printerState.isConnecting 
                                    ? 'Sedang Mencari Printer...' 
                                    : 'Printer Belum Terhubung'}
                            </span>
                        </div>
                        {printerState.isConnected && (
                            <button
                                onClick={handleDisconnect}
                                className="text-[11px] font-bold text-error hover:underline"
                            >
                                Putuskan
                            </button>
                        )}
                    </div>

                    {!printerState.isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={!printerState.isSupported || printerState.isConnecting}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md font-bold shadow-md flex items-center justify-center space-x-2 active:scale-95 transition disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">bluetooth_searching</span>
                            <span>{printerState.isConnecting ? 'Menghubungkan...' : 'Sambungkan Printer Bluetooth'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleTestPrint}
                            disabled={isTesting}
                            className="w-full py-2.5 px-4 bg-surface-container-highest hover:bg-surface-container-high text-on-surface rounded-xl font-label-md font-bold border border-outline-variant flex items-center justify-center space-x-2 active:scale-95 transition"
                        >
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                            <span>{isTesting ? 'Mencetak Uji Coba...' : 'Uji Cetak (Test Print)'}</span>
                        </button>
                    )}
                </div>

                {/* Setting: Ukuran Kertas */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant block">
                        Ukuran Kertas Thermal:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => bluetoothPrinter.setPaperWidth(58)}
                            className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition ${
                                printerState.paperWidth === 58
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                                    : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center space-x-1">
                                <span>58 mm</span>
                                {printerState.paperWidth === 58 && (
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                )}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-normal">
                                Portabel mini (32 karakter)
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => bluetoothPrinter.setPaperWidth(80)}
                            className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition ${
                                printerState.paperWidth === 80
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                                    : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low'
                            }`}
                        >
                            <span className="text-xs font-bold flex items-center space-x-1">
                                <span>80 mm</span>
                                {printerState.paperWidth === 80 && (
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                )}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-normal">
                                Lebar Kasir (48 karakter)
                            </span>
                        </button>
                    </div>
                </div>

                {/* Option Toggles */}
                <div className="space-y-2.5 pt-1">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 cursor-pointer hover:bg-surface-container-low transition">
                        <div className="flex flex-col pr-3">
                            <span className="text-xs font-bold text-on-surface">Cetak Otomatis saat Bayar</span>
                            <span className="text-[11px] text-on-surface-variant">Struk langsung keluar saat transaksi berhasil diselesaikan</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={printerState.autoPrint}
                            onChange={(e) => bluetoothPrinter.setAutoPrint(e.target.checked)}
                            className="rounded border-outline text-secondary focus:ring-secondary w-5 h-5 cursor-pointer"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 cursor-pointer hover:bg-surface-container-low transition">
                        <div className="flex flex-col pr-3">
                            <span className="text-xs font-bold text-on-surface">Buka Laci Kasir (Drawer Kick)</span>
                            <span className="text-[11px] text-on-surface-variant">Kirim sinyal kabel RJ-11 untuk membuka cash drawer</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={printerState.openDrawer}
                            onChange={(e) => bluetoothPrinter.setOpenDrawer(e.target.checked)}
                            className="rounded border-outline text-secondary focus:ring-secondary w-5 h-5 cursor-pointer"
                        />
                    </label>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-xl font-label-md font-bold transition shadow-sm active:scale-95"
                    >
                        Selesai & Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
