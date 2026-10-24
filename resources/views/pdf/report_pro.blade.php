<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan - {{ $tenant->name ?? 'Kopi Karsa' }}</title>
    <style>
        @page {
            margin: 20px 28px 22px 28px;
            size: a4 portrait;
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            font-size: 10px; 
            color: #111827;
            line-height: 1.35;
            background-color: #ffffff;
        }

        /* Kop Surat Resmi */
        .kop-table {
            width: 100%;
            border-bottom: 2.5px double #1f2937;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .store-name {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            letter-spacing: 0.5px;
        }
        .doc-meta {
            font-size: 8.5px;
            color: #4b5563;
            margin-top: 2px;
        }

        /* Section Headings */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 1px solid #374151;
            padding-bottom: 2px;
            margin-top: 8px;
            margin-bottom: 5px;
        }

        /* Tabel Standar Formal */
        table.formal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 7px;
        }
        table.formal-table th, table.formal-table td {
            border: 1px solid #d1d5db;
            padding: 3.5px 5.5px;
            text-align: left;
            font-size: 9px;
        }
        table.formal-table th {
            background-color: #f3f4f6;
            color: #111827;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .bg-subtle { background-color: #f9fafb; }
        
        /* Accounting Double Underline */
        .accounting-total {
            border-top: 1px solid #111827 !important;
            border-bottom: 2.5px double #111827 !important;
            font-weight: bold;
            background-color: #f9fafb;
        }

        /* KPI Executive Grid */
        table.kpi-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        table.kpi-table td {
            width: 25%;
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            text-align: center;
            background-color: #f9fafb;
        }
        .kpi-label {
            font-size: 8px;
            color: #4b5563;
            text-transform: uppercase;
            font-weight: bold;
        }
        .kpi-value {
            font-size: 11.5px;
            font-weight: bold;
            color: #111827;
            margin-top: 1px;
        }
        .kpi-note {
            font-size: 7.5px;
            color: #6b7280;
            margin-top: 1px;
        }

        /* Lembar Tanda Tangan */
        .signatures-table {
            width: 100%;
            margin-top: 12px;
            border-collapse: collapse;
        }
        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            border: none;
            padding: 0 30px;
        }
        .signature-line {
            border-bottom: 1px solid #374151;
            height: 38px;
            margin-bottom: 3px;
        }

        /* Footer */
        .footer-bar {
            margin-top: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 4px;
            font-size: 8px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Kop Surat Resmi -->
    <table class="kop-table">
        <tr>
            <td style="width: 62%; vertical-align: top; border: none; padding: 0;">
                <div class="store-name">{{ $tenant->name ?? 'Kopi Karsa' }}</div>
                <div class="store-meta">
                    {{ $tenant->address ?? 'Jl. Mawar No. 123, Jakarta' }} &bull; Telepon: {{ $tenant->phone ?? '-' }}
                </div>
                <div class="store-meta" style="margin-top: 2px;">
                    <strong>Periode Laporan:</strong> {{ $periodLabel ?? 'Bulan Ini' }}
                </div>
            </td>
            <td class="doc-title-box" style="width: 38%; border: none; padding: 0;">
                <div class="doc-main-title">Laporan Keuangan & Kinerja Bisnis</div>
                <div class="doc-meta">No. Dokumen: FIN-{{ strtoupper($tenant->plan?->slug ?? 'PRO') }}/{{ date('Ymd') }}/{{ $tenant->id ?? 1 }}</div>
                <div class="doc-meta">Tanggal Terbit: {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>
                <div class="doc-meta">Klasifikasi: Lisensi Paket {{ $tenant->plan?->name ?? 'Pro' }}</div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Indikator Keuangan (KPI Table) -->
    <table class="kpi-table">
        <tr>
            <td>
                <div class="kpi-label">Total Omzet Bersih</div>
                <div class="kpi-value">Rp {{ number_format($stats['revenue'], 0, ',', '.') }}</div>
                <div class="kpi-note">{{ $stats['ordersCount'] }} Transaksi &bull; AOV: Rp {{ number_format($stats['avgOrderValue'], 0, ',', '.') }}</div>
            </td>
            <td>
                <div class="kpi-label">Beban Pokok Penjualan (HPP)</div>
                <div class="kpi-value">Rp {{ number_format($stats['cogs'], 0, ',', '.') }}</div>
                <div class="kpi-note">{{ $stats['revenue'] > 0 ? round(($stats['cogs'] / $stats['revenue']) * 100, 1) : 0 }}% dari Total Omzet</div>
            </td>
            <td>
                <div class="kpi-label">Laba Kotor Toko</div>
                <div class="kpi-value">Rp {{ number_format($stats['grossProfit'], 0, ',', '.') }}</div>
                <div class="kpi-note">Marjin Laba: {{ $stats['grossMarginPercentage'] }}%</div>
            </td>
            <td>
                <div class="kpi-label">Laba Bersih Operasional</div>
                <div class="kpi-value">Rp {{ number_format($stats['netProfit'], 0, ',', '.') }}</div>
                <div class="kpi-note">Marjin Bersih: {{ $stats['netMarginPercentage'] }}%</div>
            </td>
        </tr>
    </table>

    <!-- 1. Laporan Laba Rugi Komprehensif -->
    <div class="section-title">1. Laporan Laba Rugi Komprehensif (Income Statement)</div>
    <table class="formal-table">
        <thead>
            <tr>
                <th style="width: 52%;">Pos Akun / Keterangan Keuangan</th>
                <th class="text-right" style="width: 24%;">Nominal (IDR)</th>
                <th class="text-right" style="width: 24%;">Rasio Terhadap Penjualan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Pendapatan Penjualan Bersih (Net Revenue)</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['revenue'], 0, ',', '.') }}</td>
                <td class="text-right">100.0%</td>
            </tr>
            <tr>
                <td style="padding-left: 14px; color: #374151;">Dikurangi: Harga Pokok Penjualan (HPP / Bahan Baku Terjual)</td>
                <td class="text-right">(Rp {{ number_format($stats['cogs'], 0, ',', '.') }})</td>
                <td class="text-right">{{ $stats['revenue'] > 0 ? round(($stats['cogs'] / $stats['revenue']) * 100, 1) : 0 }}%</td>
            </tr>
            <tr class="bg-subtle">
                <td><strong>LABA KOTOR (GROSS PROFIT)</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['grossProfit'], 0, ',', '.') }}</td>
                <td class="text-right font-bold">{{ $stats['grossMarginPercentage'] }}%</td>
            </tr>
            <tr>
                <td style="padding-left: 14px; color: #374151;">Dikurangi: Beban Pengeluaran Operasional Toko (OPEX)</td>
                <td class="text-right">(Rp {{ number_format($stats['expenses'], 0, ',', '.') }})</td>
                <td class="text-right">{{ $stats['revenue'] > 0 ? round(($stats['expenses'] / $stats['revenue']) * 100, 1) : 0 }}%</td>
            </tr>
            <tr class="accounting-total">
                <td><strong>LABA BERSIH OPERASIONAL (NET PROFIT)</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['netProfit'], 0, ',', '.') }}</td>
                <td class="text-right font-bold">{{ $stats['netMarginPercentage'] }}%</td>
            </tr>
            <tr style="color: #6b7280; font-size: 8.5px;">
                <td style="padding-left: 14px;"><em>Pajak PPN / PB1 Terkumpul (Kewajiban Titipan Kas Negara / Daerah)</em></td>
                <td class="text-right"><em>Rp {{ number_format($stats['tax'], 0, ',', '.') }}</em></td>
                <td class="text-right"><em>Tarif {{ $tenant->tax_percentage ?? 11 }}%</em></td>
            </tr>
        </tbody>
    </table>

    <!-- 2. Rekapitulasi Arus Kas & Rekonsiliasi Pembayaran -->
    <div class="section-title">2. Rekapitulasi Arus Kas & Saluran Pembayaran (Cash Flow Reconciliation)</div>
    <table class="formal-table">
        <thead>
            <tr>
                <th style="width: 32%;">Kanal / Saluran Pembayaran</th>
                <th class="text-center" style="width: 18%;">Jumlah Transaksi</th>
                <th class="text-right" style="width: 24%;">Total Penerimaan (IDR)</th>
                <th class="text-right" style="width: 12%;">Porsi (%)</th>
                <th style="width: 14%;">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Uang Tunai (Cash)</strong></td>
                <td class="text-center">{{ $paymentBreakdown['cash']['count'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($paymentBreakdown['cash']['total'], 0, ',', '.') }}</td>
                <td class="text-right">{{ $paymentBreakdown['cash']['percentage'] }}%</td>
                <td>Kas Fisik di Laci</td>
            </tr>
            <tr>
                <td><strong>QRIS / Pembayaran Digital</strong></td>
                <td class="text-center">{{ $paymentBreakdown['qris']['count'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($paymentBreakdown['qris']['total'], 0, ',', '.') }}</td>
                <td class="text-right">{{ $paymentBreakdown['qris']['percentage'] }}%</td>
                <td>Saldo Rekening Bank</td>
            </tr>
            <tr class="accounting-total">
                <td><strong>TOTAL PENERIMAAN KASIR</strong></td>
                <td class="text-center font-bold">{{ $stats['ordersCount'] }} Transaksi</td>
                <td class="text-right font-bold">Rp {{ number_format($stats['grandTotal'], 0, ',', '.') }}</td>
                <td class="text-right font-bold">100.0%</td>
                <td>Termasuk Pajak</td>
            </tr>
        </tbody>
    </table>

    <!-- 3. Analisis Profitabilitas Menu (Menu Engineering) -->
    <div class="section-title">3. Analisis Profitabilitas Menu & Kontribusi Margin (Menu Engineering)</div>
    <table class="formal-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">No</th>
                <th style="width: 25%;">Nama Menu Produk</th>
                <th style="width: 12%;" class="text-center">Kategori</th>
                <th style="width: 8%;" class="text-center">Terjual</th>
                <th style="width: 12%;" class="text-right">Harga Jual</th>
                <th style="width: 12%;" class="text-right">Modal (HPP)</th>
                <th style="width: 12%;" class="text-right">Margin/Unit</th>
                <th style="width: 14%;" class="text-right">Total Laba Kotor</th>
            </tr>
        </thead>
        <tbody>
            @forelse($productProfitability as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="font-bold">{{ $item['product_name'] }}</td>
                <td class="text-center">{{ $item['category_name'] }}</td>
                <td class="text-center">{{ $item['total_sold'] }}</td>
                <td class="text-right">Rp {{ number_format($item['avg_price'], 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($item['avg_cogs'], 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($item['margin_per_unit'], 0, ',', '.') }} ({{ $item['margin_percentage'] }}%)</td>
                <td class="text-right font-bold">Rp {{ number_format($item['total_profit'], 0, ',', '.') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center" style="color: #6b7280; font-style: italic;">Belum ada data penjualan pada periode ini.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- 4. Rincian Pengeluaran Operasional (Jika Ada) -->
    @if(count($expensesList) > 0)
    <div class="section-title">4. Rincian Beban Pengeluaran Operasional (OPEX)</div>
    <table class="formal-table">
        <thead>
            <tr>
                <th style="width: 15%;" class="text-center">Tanggal</th>
                <th style="width: 25%;">Kategori Beban</th>
                <th style="width: 40%;">Deskripsi / Keterangan</th>
                <th style="width: 20%;" class="text-right">Nominal (IDR)</th>
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
            <tr class="accounting-total">
                <td colspan="3" class="font-bold text-right">TOTAL PENGELUARAN OPERASIONAL:</td>
                <td class="text-right font-bold">Rp {{ number_format($stats['expenses'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    <!-- Lembar Pengesahan Tanda Tangan -->
    <table class="signatures-table">
        <tr>
            <td style="width: 60%; border: none;"></td>
            <td style="width: 40%; text-align: center; border: none; padding-right: 15px;">
                <div style="font-size: 9px; color: #4b5563; margin-bottom: 2px;">Diperiksa & Disetujui Oleh:</div>
                <div class="signature-line"></div>
                <div style="font-weight: bold; font-size: 10px;">{{ $tenant->name ?? 'Pemilik Bisnis' }}</div>
                <div style="font-size: 8.5px; color: #4b5563;">Pemilik / Pengelola Toko</div>
            </td>
        </tr>
    </table>

    <!-- Footer Catatan Resmi -->
    <div class="footer-bar">
        Dokumen ini diterbitkan secara resmi melalui sistem ProjectKasir POS SaaS &bull; Modul Pelaporan Finansial Lisensi Pro &bull; Halaman 1 dari 1
    </div>

</body>
</html>
