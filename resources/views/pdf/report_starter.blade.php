<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan - {{ $tenant->name ?? 'Toko' }} (Paket Starter)</title>
    <style>
        @page {
            margin: 22px 28px;
            size: a4 portrait;
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            font-size: 10px; 
            color: #1f2937;
            line-height: 1.4;
            background-color: #ffffff;
        }

        /* Kop Surat Sederhana */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #374151;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        .store-name {
            font-size: 15px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
        }
        .store-meta {
            font-size: 9px;
            color: #4b5563;
            margin-top: 1px;
        }
        .doc-title-box {
            text-align: right;
            vertical-align: top;
        }
        .doc-main-title {
            font-size: 11px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .doc-badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            font-size: 8px;
            font-weight: bold;
            padding: 1.5px 6px;
            border-radius: 3px;
            margin-top: 2px;
            text-transform: uppercase;
        }
        .doc-meta {
            font-size: 8.5px;
            color: #6b7280;
            margin-top: 2px;
        }

        /* Section Title */
        .section-title {
            font-size: 9.5px;
            font-weight: bold;
            color: #1f2937;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 2px;
            margin-top: 10px;
            margin-bottom: 5px;
        }

        /* Tables */
        table.simple-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        table.simple-table th, table.simple-table td {
            border: 1px solid #e5e7eb;
            padding: 3.5px 5.5px;
            text-align: left;
            font-size: 9px;
        }
        table.simple-table th {
            background-color: #f9fafb;
            color: #374151;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .total-row {
            background-color: #f3f4f6;
            font-weight: bold;
            border-top: 1.5px solid #374151;
            border-bottom: 1.5px solid #374151;
        }

        /* 3-column KPI Box */
        table.kpi-simple {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        table.kpi-simple td {
            width: 33.33%;
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            background-color: #f9fafb;
            text-align: center;
        }
        .kpi-label {
            font-size: 8px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: bold;
        }
        .kpi-value {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
            margin-top: 1px;
        }
        .kpi-sub {
            font-size: 7.5px;
            color: #6b7280;
            margin-top: 1px;
        }

        /* Upgrade Banner Box */
        .upgrade-box {
            background-color: #f8fafc;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            padding: 6px 10px;
            margin-top: 10px;
            text-align: center;
        }
        .upgrade-title {
            font-size: 8.5px;
            font-weight: bold;
            color: #0f172a;
        }
        .upgrade-text {
            font-size: 7.5px;
            color: #475569;
            margin-top: 1px;
        }

        /* Footer */
        .footer-note {
            margin-top: 8px;
            border-top: 1px solid #e5e7eb;
            padding-top: 4px;
            font-size: 7.5px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Header / Kop Sederhana -->
    <table class="header-table">
        <tr>
            <td style="width: 60%; vertical-align: top; border: none; padding: 0;">
                <div class="store-name">{{ $tenant->name ?? 'Toko Saya' }}</div>
                <div class="store-meta">{{ $tenant->address ?? '-' }} &bull; Telp: {{ $tenant->phone ?? '-' }}</div>
                <div class="store-meta" style="margin-top: 2px;">
                    <strong>Periode:</strong> {{ $periodLabel ?? 'Bulan Ini' }}
                </div>
            </td>
            <td class="doc-title-box" style="width: 40%; border: none; padding: 0;">
                <div class="doc-main-title">Ringkasan Laporan Penjualan</div>
                <div><span class="doc-badge">Lisensi Paket Starter</span></div>
                <div class="doc-meta">Tanggal Cetak: {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Cepat KPI (3 Kolom Sederhana) -->
    <table class="kpi-simple">
        <tr>
            <td>
                <div class="kpi-label">Total Omzet Penjualan</div>
                <div class="kpi-value">Rp {{ number_format($stats['revenue'], 0, ',', '.') }}</div>
                <div class="kpi-sub">{{ $stats['ordersCount'] }} Transaksi</div>
            </td>
            <td>
                <div class="kpi-label">Total Modal HPP</div>
                <div class="kpi-value">Rp {{ number_format($stats['cogs'], 0, ',', '.') }}</div>
                <div class="kpi-sub">Modal Barang Terjual</div>
            </td>
            <td>
                <div class="kpi-label">Estimasi Laba Bersih</div>
                <div class="kpi-value">Rp {{ number_format($stats['netProfit'], 0, ',', '.') }}</div>
                <div class="kpi-sub">Setelah Beban Operasional</div>
            </td>
        </tr>
    </table>

    <!-- 1. Ringkasan Laba Rugi Sederhana -->
    <div class="section-title">1. Ringkasan Laba Rugi</div>
    <table class="simple-table">
        <thead>
            <tr>
                <th style="width: 65%;">Keterangan</th>
                <th class="text-right" style="width: 35%;">Jumlah (IDR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Total Penjualan (Omzet)</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['revenue'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td style="padding-left: 12px; color: #4b5563;">Dikurangi: Total Harga Pokok Penjualan (HPP)</td>
                <td class="text-right">(Rp {{ number_format($stats['cogs'], 0, ',', '.') }})</td>
            </tr>
            <tr style="background-color: #f9fafb;">
                <td><strong>Laba Kotor</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['grossProfit'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td style="padding-left: 12px; color: #4b5563;">Dikurangi: Total Pengeluaran Operasional</td>
                <td class="text-right">(Rp {{ number_format($stats['expenses'], 0, ',', '.') }})</td>
            </tr>
            <tr class="total-row">
                <td><strong>ESTIMASI LABA BERSIH</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['netProfit'], 0, ',', '.') }}</td>
            </tr>
            @if($stats['tax'] > 0)
            <tr style="color: #6b7280; font-size: 8px;">
                <td style="padding-left: 12px;"><em>Pajak PPN / PB1 Titipan (Tarif {{ $tenant->tax_percentage ?? 11 }}%)</em></td>
                <td class="text-right"><em>Rp {{ number_format($stats['tax'], 0, ',', '.') }}</em></td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- 2. Ringkasan Metode Pembayaran -->
    <div class="section-title">2. Rekapitulasi Pembayaran Kasir</div>
    <table class="simple-table">
        <thead>
            <tr>
                <th style="width: 45%;">Metode Pembayaran</th>
                <th class="text-center" style="width: 25%;">Jumlah Transaksi</th>
                <th class="text-right" style="width: 30%;">Total Diterima (IDR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Tunai (Cash di Laci)</strong></td>
                <td class="text-center">{{ $paymentBreakdown['cash']['count'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($paymentBreakdown['cash']['total'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>QRIS / Non-Tunai</strong></td>
                <td class="text-center">{{ $paymentBreakdown['qris']['count'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($paymentBreakdown['qris']['total'], 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td><strong>TOTAL PENERIMAAN KASIR</strong></td>
                <td class="text-center font-bold">{{ $stats['ordersCount'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($stats['grandTotal'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- 3. Rekap Produk Terjual Sederhana (Tanpa Analisis Menu Engineering Pro) -->
    <div class="section-title">3. Rekap Produk Terjual</div>
    <table class="simple-table">
        <thead>
            <tr>
                <th style="width: 6%;" class="text-center">No</th>
                <th style="width: 44%;">Nama Produk</th>
                <th style="width: 20%;" class="text-center">Kategori</th>
                <th style="width: 12%;" class="text-center">Terjual</th>
                <th style="width: 18%;" class="text-right">Total Penjualan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($productProfitability as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="font-bold">{{ $item['product_name'] }}</td>
                <td class="text-center">{{ $item['category_name'] }}</td>
                <td class="text-center">{{ $item['total_sold'] }}</td>
                <td class="text-right">Rp {{ number_format($item['total_revenue'], 0, ',', '.') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center" style="color: #6b7280; font-style: italic;">Belum ada penjualan pada periode ini.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- 4. Ringkasan Pengeluaran (Jika ada) -->
    @if(count($expensesList) > 0)
    <div class="section-title">4. Pengeluaran Operasional</div>
    <table class="simple-table">
        <thead>
            <tr>
                <th style="width: 18%;" class="text-center">Tanggal</th>
                <th style="width: 32%;">Kategori</th>
                <th style="width: 28%;">Keterangan</th>
                <th style="width: 22%;" class="text-right">Nominal (IDR)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expensesList as $exp)
            <tr>
                <td class="text-center">{{ \Carbon\Carbon::parse($exp->expense_date)->format('d/m/Y') }}</td>
                <td class="font-bold">{{ $exp->category }}</td>
                <td>{{ $exp->description ?? '-' }}</td>
                <td class="text-right">Rp {{ number_format($exp->amount, 0, ',', '.') }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3" class="text-right font-bold">TOTAL PENGELUARAN:</td>
                <td class="text-right font-bold">Rp {{ number_format($stats['expenses'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    <!-- Kotak Upgrade ke Paket Pro -->
    <div class="upgrade-box">
        <div class="upgrade-title">Ingin Laporan Keuangan Lengkap Standar Audit & Analisis Menu Engineering?</div>
        <div class="upgrade-text">
            Paket Starter menyajikan laporan ringkasan dasar. Untuk mendapatkan fitur <strong>Laporan Laba Rugi Komprehensif Berstandar Akuntansi</strong>, <strong>Rekonsiliasi Arus Kas Tunai vs Rekening Digital</strong>, <strong>Analisis Margin & Profitabilitas Menu (Menu Engineering)</strong>, serta <strong>Lembar Pengesahan Tanda Tangan Resmi Pemilik Toko</strong>, silakan upgrade ke <strong>Paket Pro</strong>.
        </div>
    </div>

    <!-- Footer -->
    <div class="footer-note">
        Dokumen dicetak dari ProjectKasir POS SaaS &bull; Lisensi Paket Starter &bull; Halaman 1 dari 1
    </div>

</body>
</html>
