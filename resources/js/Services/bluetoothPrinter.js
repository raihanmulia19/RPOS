/**
 * Web Bluetooth Thermal Printer & ESC/POS Generator Service
 * Mendukung printer thermal 58mm & 80mm via Web Bluetooth API
 */

// Kumpulan UUID GATT Service umum pada printer thermal Bluetooth
const PRINTER_SERVICES = [
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard FFE0 (Panda, MPT-II, Iware, Eppos, GOOJPRT)
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard 18F0 ESC/POS Service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Serial
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '0000e0ff-0000-1000-8000-00805f9b34fb',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000fff0-0000-1000-8000-00805f9b34fb',
    '0000af30-0000-1000-8000-00805f9b34fb',
];

// Helper: Format angka rupiah tanpa simbol Rp
export function formatNum(num) {
    return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
}

// Helper: Menyelaraskan teks kiri dan kanan dalam satu baris struk (monospace)
export function alignRow(left, right, width = 32) {
    const l = String(left || '');
    const r = String(right || '');
    const available = width - r.length;
    
    if (l.length <= available) {
        return l + ' '.repeat(Math.max(1, available - l.length)) + r;
    }
    
    // Jika teks kiri terlalu panjang, potong dan beri spasi
    const truncatedLeft = l.substring(0, Math.max(0, available - 1));
    return truncatedLeft + ' ' + r;
}

/**
 * ESC/POS Byte Buffer Builder
 */
export class EscPosBuilder {
    constructor() {
        this.buffer = [];
    }

    raw(bytes) {
        if (Array.isArray(bytes) || bytes instanceof Uint8Array) {
            for (let i = 0; i < bytes.length; i++) {
                this.buffer.push(bytes[i]);
            }
        }
        return this;
    }

    init() {
        // ESC @: Inisialisasi printer
        return this.raw([0x1B, 0x40]);
    }

    align(mode = 'left') {
        // ESC a n (0: Left, 1: Center, 2: Right)
        const code = mode === 'center' ? 0x01 : mode === 'right' ? 0x02 : 0x00;
        return this.raw([0x1B, 0x61, code]);
    }

    bold(enable = true) {
        // ESC E n (1: On, 0: Off)
        return this.raw([0x1B, 0x45, enable ? 0x01 : 0x00]);
    }

    doubleSize(enable = true) {
        // GS ! n (0x11: Double Width + Height, 0x00: Normal)
        return this.raw([0x1D, 0x21, enable ? 0x11 : 0x00]);
    }

    doubleHeight(enable = true) {
        // GS ! n (0x01: Double Height, 0x00: Normal)
        return this.raw([0x1D, 0x21, enable ? 0x01 : 0x00]);
    }

    text(str) {
        if (!str) return this;
        const encoder = new TextEncoder();
        const encoded = encoder.encode(str);
        return this.raw(encoded);
    }

    line(str = '') {
        this.text(str);
        return this.raw([0x0A]); // LF
    }

    feed(lines = 1) {
        // ESC d n: Feed n lines
        return this.raw([0x1B, 0x64, lines]);
    }

    cut() {
        // GS V 66 0: Partial cut / Full cut
        return this.raw([0x1D, 0x56, 0x42, 0x00]);
    }

    openCashDrawer() {
        // ESC p 0 25 250: Pulse pin 2 untuk buka laci uang
        return this.raw([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    }

    build() {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Generate Struk Thermal ESC/POS dari Data Transaksi
 */
export function buildReceiptEscPos(data, options = {}) {
    const paperWidth = options.paperWidth || 58;
    const width = paperWidth === 80 ? 48 : 32;
    const divider = '-'.repeat(width);
    const builder = new EscPosBuilder();

    builder.init();

    if (options.openDrawer) {
        builder.openCashDrawer();
    }

    // 1. Header Toko
    builder.align('center');
    builder.bold(true);
    builder.doubleSize(true);
    builder.line(data.tenant_name || 'KASIR');
    builder.doubleSize(false);
    builder.bold(false);

    if (data.tenant_address) {
        builder.line(data.tenant_address);
    }
    if (data.tenant_phone) {
        builder.line(`Telp: ${data.tenant_phone}`);
    }

    // 2. Metadata Transaksi
    builder.align('left');
    builder.line(divider);
    builder.line(alignRow(`Kasir: ${data.cashier_name || '-'}`, '', width));
    builder.line(alignRow(`Waktu: ${data.created_at || '-'}`, '', width));
    builder.line(alignRow(`No: ${data.invoice_number || '-'}`, '', width));
    builder.line(divider);

    // 3. Item Belanja
    if (Array.isArray(data.items)) {
        data.items.forEach(item => {
            const name = item.name || 'Produk';
            builder.line(name);
            if (item.note) {
                builder.line(` (${item.note})`);
            }
            const qtyPrice = `${item.quantity}x  Rp ${formatNum(item.price)}`;
            const subtotal = `Rp ${formatNum(item.subtotal)}`;
            builder.line(alignRow(qtyPrice, subtotal, width));
        });
    }

    builder.line(divider);

    // 4. Kalkulasi Subtotal & Total
    builder.line(alignRow('Subtotal', `Rp ${formatNum(data.subtotal)}`, width));
    builder.line(alignRow(`Pajak (${data.tax_percentage ?? 11}%)`, `Rp ${formatNum(data.tax_amount)}`, width));
    builder.bold(true);
    builder.doubleHeight(true);
    builder.line(alignRow('TOTAL', `Rp ${formatNum(data.total_amount)}`, width));
    builder.doubleHeight(false);
    builder.bold(false);

    builder.line(divider);

    // 5. Pembayaran
    const method = String(data.payment_method || 'CASH').toUpperCase();
    builder.line(alignRow('Metode', method, width));
    if (method === 'CASH') {
        builder.line(alignRow('Tunai', `Rp ${formatNum(data.amount_tendered)}`, width));
        builder.line(alignRow('Kembali', `Rp ${formatNum(data.change_amount)}`, width));
    } else {
        builder.line(alignRow('Bayar QRIS', `Rp ${formatNum(data.total_amount)}`, width));
        builder.bold(true);
        builder.line(alignRow('Status', 'LUNAS', width));
        builder.bold(false);
    }

    builder.line(divider);

    // 6. Ucapan Terima Kasih
    builder.align('center');
    builder.line('Terima kasih atas kunjungan Anda!');
    builder.line('Sistem POS by RPOS');
    builder.line('Simpan struk ini sebagai bukti');
    builder.line('pembayaran yang sah.');
    builder.feed(2);

    // 7. Kitchen Ticket (Pesanan Dapur)
    builder.line(divider);
    builder.bold(true);
    builder.doubleSize(true);
    builder.line('TICKET DAPUR');
    builder.doubleSize(false);
    builder.bold(false);
    builder.line(`No: ${data.invoice_number}`);
    builder.line(`Waktu: ${data.created_at}`);
    builder.line(divider);
    builder.align('left');

    if (Array.isArray(data.items)) {
        data.items.forEach(item => {
            builder.bold(true);
            builder.line(`${item.quantity}x ${item.name}`);
            builder.bold(false);
            if (item.note) {
                builder.line(`   * Catatan: ${item.note}`);
            }
        });
    }

    builder.line(divider);
    builder.feed(4);
    builder.cut();

    return builder.build();
}

/**
 * Bluetooth Printer Manager Class (Singleton)
 */
class BluetoothPrinterManager {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.deviceName = localStorage.getItem('pos_printer_name') || '';
        this.paperWidth = parseInt(localStorage.getItem('pos_printer_width') || '58', 10);
        this.autoPrint = localStorage.getItem('pos_auto_print') !== 'false';
        this.openDrawer = localStorage.getItem('pos_open_drawer') === 'true';
        this.listeners = new Set();
    }

    isSupported() {
        return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(cb => {
            try {
                cb(state);
            } catch (err) {
                console.error('Error notifying printer listener:', err);
            }
        });
    }

    getState() {
        return {
            isSupported: this.isSupported(),
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            deviceName: this.deviceName,
            paperWidth: this.paperWidth,
            autoPrint: this.autoPrint,
            openDrawer: this.openDrawer,
        };
    }

    setPaperWidth(width) {
        this.paperWidth = width === 80 ? 80 : 58;
        localStorage.setItem('pos_printer_width', String(this.paperWidth));
        this.notify();
    }

    setAutoPrint(enabled) {
        this.autoPrint = Boolean(enabled);
        localStorage.setItem('pos_auto_print', this.autoPrint ? 'true' : 'false');
        this.notify();
    }

    setOpenDrawer(enabled) {
        this.openDrawer = Boolean(enabled);
        localStorage.setItem('pos_open_drawer', this.openDrawer ? 'true' : 'false');
        this.notify();
    }

    async connect() {
        if (!this.isSupported()) {
            throw new Error('Browser ini belum mendukung Web Bluetooth API. Gunakan Chrome di Windows, Mac, atau Android.');
        }

        try {
            this.isConnecting = true;
            this.notify();

            // 1. Minta pengguna memilih perangkat Bluetooth
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: PRINTER_SERVICES,
            });

            this.device = device;
            this.deviceName = device.name || 'Thermal Printer';
            localStorage.setItem('pos_printer_name', this.deviceName);

            // Pasang event listener jika koneksi terputus
            device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                this.characteristic = null;
                this.notify();
            });

            // 2. Hubungkan ke GATT Server
            const server = await device.gatt.connect();

            // 3. Cari karakteristik writable (menulis byte ESC/POS)
            let writableChar = null;

            // Coba lewat getPrimaryServices()
            try {
                const services = await server.getPrimaryServices();
                for (const service of services) {
                    try {
                        const chars = await service.getCharacteristics();
                        for (const char of chars) {
                            if (char.properties.write || char.properties.writeWithoutResponse) {
                                writableChar = char;
                                break;
                            }
                        }
                    } catch (e) {
                        // Lanjut ke service berikutnya jika ditolak
                    }
                    if (writableChar) break;
                }
            } catch (e) {
                // Fallback jika getPrimaryServices() tanpa filter dicegah
            }

            // Jika belum ketemu, cari di known services satu persatu
            if (!writableChar) {
                for (const sUuid of PRINTER_SERVICES) {
                    try {
                        const service = await server.getPrimaryService(sUuid);
                        const chars = await service.getCharacteristics();
                        for (const char of chars) {
                            if (char.properties.write || char.properties.writeWithoutResponse) {
                                writableChar = char;
                                break;
                            }
                        }
                        if (writableChar) break;
                    } catch (e) {
                        // Service tidak ada pada printer ini, lanjut
                    }
                }
            }

            if (!writableChar) {
                throw new Error('Karakteristik penulisan (write) printer tidak ditemukan pada perangkat ini.');
            }

            this.characteristic = writableChar;
            this.isConnected = true;
            this.isConnecting = false;
            this.notify();

            return { success: true, deviceName: this.deviceName };
        } catch (error) {
            this.isConnecting = false;
            this.isConnected = false;
            this.notify();
            throw error;
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.notify();
    }

    /**
     * Kirim byte array ke printer dalam pecahan chunk kecil (BLE MTU Safe)
     */
    async writeBytes(bytes) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Printer Bluetooth belum terhubung.');
        }

        const CHUNK_SIZE = 40; // Aman untuk buffer BLE MTU pada micro-controller thermal printer
        for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
            const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(chunk);
            } else {
                await this.characteristic.writeValue(chunk);
            }
            // Jeda singkat 20ms agar buffer mikrokontroler printer tidak overflow
            await new Promise(r => setTimeout(r, 20));
        }
    }

    /**
     * Cetak Struk Transaksi Lengkap
     */
    async printReceipt(receiptData) {
        if (!receiptData) {
            throw new Error('Data struk tidak ditemukan.');
        }

        const bytes = buildReceiptEscPos(receiptData, {
            paperWidth: this.paperWidth,
            openDrawer: this.openDrawer,
        });

        await this.writeBytes(bytes);
        return true;
    }

    /**
     * Uji Cetak (Test Print)
     */
    async testPrint(storeName = 'RPOS KASIR') {
        const width = this.paperWidth === 80 ? 48 : 32;
        const divider = '='.repeat(width);
        const builder = new EscPosBuilder();

        builder.init();
        builder.align('center');
        builder.bold(true);
        builder.doubleSize(true);
        builder.line('UJI CETAK THERMAL');
        builder.doubleSize(false);
        builder.bold(false);
        builder.line(divider);
        builder.line(`Printer: ${this.deviceName || 'Bluetooth'}`);
        builder.line(`Lebar Kertas: ${this.paperWidth}mm (${width} Karakter)`);
        builder.line(`Status: Terhubung & Siap Pakai`);
        builder.line(divider);
        builder.line('Jika teks ini terbaca dengan jelas,');
        builder.line('printer siap untuk cetak transaksi!');
        builder.line(divider);
        builder.feed(4);
        builder.cut();

        await this.writeBytes(builder.build());
        return true;
    }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterManager();
