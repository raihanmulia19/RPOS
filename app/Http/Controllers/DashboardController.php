<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $filterType = $request->query('filter_type', 'month');
        $filterValue = $request->query('filter_value', date('Y-m'));

        if ($filterType === 'date') {
            $startDate = Carbon::parse($filterValue)->startOfDay();
            $endDate = Carbon::parse($filterValue)->endOfDay();
            $periodLabel = "Tanggal " . $startDate->translatedFormat('d F Y');
        } else {
            $startDate = Carbon::parse($filterValue)->startOfMonth();
            $endDate = Carbon::parse($filterValue)->endOfMonth();
            $periodLabel = "Bulan " . $startDate->translatedFormat('F Y');
        }

        $financialData = $this->getFinancialData($startDate, $endDate, $periodLabel);

        $recentOrders = Order::with('user', 'items.product')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->take(10)
            ->get();

        $tenant = $request->user()->tenant?->load('plan');

        $pendingSubscription = $tenant 
            ? \App\Models\TenantSubscription::with('plan')
                ->where('tenant_id', $tenant->id)
                ->where('status', 'pending')
                ->latest()
                ->first()
            : null;

        $recentlyApprovedSubscription = $tenant 
            ? \App\Models\TenantSubscription::with('plan')
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->where('verified_at', '>=', now()->subDays(2))
                ->latest('verified_at')
                ->first()
            : null;

        return Inertia::render('Dashboard', [
            'stats' => $financialData['stats'],
            'paymentBreakdown' => $financialData['paymentBreakdown'],
            'productProfitability' => $financialData['productProfitability'],
            'expensesList' => $financialData['expensesList'],
            'bestSellers' => $financialData['bestSellers'],
            'recentOrders' => $recentOrders,
            'filters' => [
                'type' => $filterType,
                'value' => $filterValue,
            ],
            'tenant' => $tenant,
            'pendingSubscription' => $pendingSubscription,
            'recentlyApprovedSubscription' => $recentlyApprovedSubscription,
            'adminContact' => [
                'whatsapp' => env('SUPERADMIN_WHATSAPP', '6285121210403'),
                'whatsapp_display' => env('SUPERADMIN_WHATSAPP_DISPLAY', '0851-2121-0403'),
                'email' => env('SUPERADMIN_EMAIL', 'support@posapp.com'),
            ],
        ]);
    }

    public function exportPdf(Request $request)
    {
        $filterType = $request->query('filter_type', 'month');
        $filterValue = $request->query('filter_value', date('Y-m'));

        if ($filterType === 'date') {
            $startDate = Carbon::parse($filterValue)->startOfDay();
            $endDate = Carbon::parse($filterValue)->endOfDay();
            $periodLabel = "Tanggal " . $startDate->translatedFormat('d F Y');
        } else {
            $startDate = Carbon::parse($filterValue)->startOfMonth();
            $endDate = Carbon::parse($filterValue)->endOfMonth();
            $periodLabel = "Bulan " . $startDate->translatedFormat('F Y');
        }

        $financialData = $this->getFinancialData($startDate, $endDate, $periodLabel);

        $recentOrders = Order::with('user', 'items.product')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->take(25)
            ->get();

        $tenant = $request->user()->tenant?->load('plan');
        $stats = $financialData['stats'];
        $paymentBreakdown = $financialData['paymentBreakdown'];
        $productProfitability = $financialData['productProfitability'];
        $expensesList = $financialData['expensesList'];
        $bestSellers = $financialData['bestSellers'];

        $planSlug = $tenant?->plan?->slug ?? 'trial';
        $isPro = in_array($planSlug, ['pro', 'enterprise']);
        $viewName = $isPro ? 'pdf.report_pro' : 'pdf.report_starter';
        $filenamePrefix = $isPro ? 'Laporan-Keuangan-Pro-' : 'Laporan-Penjualan-Starter-';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($viewName, compact(
            'stats', 
            'paymentBreakdown', 
            'productProfitability', 
            'expensesList', 
            'bestSellers', 
            'recentOrders', 
            'periodLabel', 
            'tenant'
        ))->setPaper('a4', 'portrait');
        
        $filename = $filenamePrefix . \Illuminate\Support\Str::slug($tenant?->name ?? 'Kasir') . '-' . date('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    public function exportExcel(Request $request)
    {
        $tenant = $request->user()->tenant?->load('plan');
        $planSlug = $tenant?->plan?->slug ?? 'trial';

        // Hanya untuk paket Pro dan Enterprise
        if (!in_array($planSlug, ['pro', 'enterprise'])) {
            return redirect()->route('dashboard')->with('error', 'Fitur Ekspor Laporan Excel (.xlsx) hanya tersedia untuk paket Pro dan Enterprise. Silakan upgrade paket langganan Anda.');
        }

        $filterType = $request->query('filter_type', 'month');
        $filterValue = $request->query('filter_value', date('Y-m'));

        if ($filterType === 'date') {
            $startDate = Carbon::parse($filterValue)->startOfDay();
            $endDate = Carbon::parse($filterValue)->endOfDay();
            $periodLabel = "Tanggal " . $startDate->translatedFormat('d F Y');
            $filePeriod = $startDate->format('Y-m-d');
        } else {
            $startDate = Carbon::parse($filterValue)->startOfMonth();
            $endDate = Carbon::parse($filterValue)->endOfMonth();
            $periodLabel = "Bulan " . $startDate->translatedFormat('F Y');
            $filePeriod = $startDate->format('Y-m');
        }

        $financialData = $this->getFinancialData($startDate, $endDate, $periodLabel);
        $stats = $financialData['stats'];
        $paymentBreakdown = $financialData['paymentBreakdown'];
        $productProfitability = $financialData['productProfitability'];
        $expensesList = $financialData['expensesList'];

        $allOrders = Order::with('user', 'items.product')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->get();

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator($tenant?->name ?? 'POS SaaS')
            ->setLastModifiedBy($request->user()->name ?? 'Owner')
            ->setTitle("Laporan Keuangan {$periodLabel}")
            ->setSubject("Laporan Keuangan & Penjualan POS Pro/Enterprise")
            ->setDescription("Laporan keuangan komprehensif diekspor secara otomatis dari POS SaaS");

        // Styling definitions
        $titleStyle = [
            'font' => ['name' => 'Segoe UI', 'bold' => true, 'size' => 13, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF107C41']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ];

        $subTitleStyle = [
            'font' => ['name' => 'Segoe UI', 'size' => 9, 'color' => ['argb' => 'FF334155']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF1F5F9']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ];

        $sectionHeaderStyle = [
            'font' => ['name' => 'Segoe UI', 'bold' => true, 'size' => 11, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ];

        $tableHeaderStyle = [
            'font' => ['name' => 'Segoe UI', 'bold' => true, 'size' => 10, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
        ];

        $dataBorderStyle = [
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFE2E8F0']]],
        ];

        $totalRowStyle = [
            'font' => ['name' => 'Segoe UI', 'bold' => true, 'size' => 10, 'color' => ['argb' => 'FF065F46']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFECFDF5']],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']],
                'top' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF059669']],
                'bottom' => ['borderStyle' => Border::BORDER_DOUBLE, 'color' => ['argb' => 'FF059669']],
            ],
        ];

        $zebraFill = [
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF8FAFC']],
        ];

        // ==========================================
        // SHEET 1: RINGKASAN FINANSIAL
        // ==========================================
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Ringkasan Finansial');
        $sheet1->setShowGridLines(true);

        $sheet1->mergeCells('A1:D1');
        $sheet1->setCellValue('A1', 'LAPORAN KEUANGAN & PERFORMA BISNIS');
        $sheet1->getStyle('A1:D1')->applyFromArray($titleStyle);
        $sheet1->getRowDimension(1)->setRowHeight(32);

        $tenantName = $tenant?->name ?? 'Outlet Utama';
        $planName = $tenant?->plan?->name ?? 'Pro';
        $sheet1->mergeCells('A2:D2');
        $sheet1->setCellValue('A2', "Outlet: {$tenantName} | Paket Langganan: {$planName}");
        $sheet1->getStyle('A2:D2')->applyFromArray($subTitleStyle);
        $sheet1->getRowDimension(2)->setRowHeight(20);

        $sheet1->mergeCells('A3:D3');
        $sheet1->setCellValue('A3', "Periode: {$periodLabel} | Diunduh: " . now()->translatedFormat('d F Y H:i') . " WIB");
        $sheet1->getStyle('A3:D3')->applyFromArray($subTitleStyle);
        $sheet1->getRowDimension(3)->setRowHeight(20);

        // Section 1: KPI
        $sheet1->mergeCells('A5:D5');
        $sheet1->setCellValue('A5', 'INDIKATOR KINERJA UTAMA (KPI FINANSIAL)');
        $sheet1->getStyle('A5:D5')->applyFromArray($sectionHeaderStyle);
        $sheet1->getRowDimension(5)->setRowHeight(24);

        $kpiHeaders = ['Indikator Keuangan', 'Nilai (Rp / Jumlah)', 'Rasio (%)', 'Keterangan'];
        $cols = ['A', 'B', 'C', 'D'];
        foreach ($kpiHeaders as $idx => $header) {
            $sheet1->setCellValue($cols[$idx] . '6', $header);
        }
        $sheet1->getStyle('A6:D6')->applyFromArray($tableHeaderStyle);
        $sheet1->getRowDimension(6)->setRowHeight(22);

        $kpiRows = [
            [
                'label' => 'Total Omzet / Penjualan Kotor (Revenue)',
                'val' => $stats['revenue'],
                'ratio' => 1.0,
                'desc' => 'Total nilai penjualan produk sebelum dikurangi beban',
                'is_currency' => true,
            ],
            [
                'label' => 'Modal Pokok Penjualan (HPP / COGS)',
                'val' => $stats['cogs'],
                'ratio' => $stats['revenue'] > 0 ? ($stats['cogs'] / $stats['revenue']) : 0,
                'desc' => 'Total biaya modal pokok bahan / barang terjual',
                'is_currency' => true,
            ],
            [
                'label' => 'Laba Kotor (Gross Profit)',
                'val' => '=B7-B8',
                'ratio' => '=IF(B7>0, B9/B7, 0)',
                'desc' => 'Laba kotor = Omzet - Modal Pokok (HPP)',
                'is_currency' => true,
                'highlight' => true,
            ],
            [
                'label' => 'Beban Operasional Toko (Expenses)',
                'val' => $stats['expenses'],
                'ratio' => $stats['revenue'] > 0 ? ($stats['expenses'] / $stats['revenue']) : 0,
                'desc' => 'Biaya operasional (sewa, listrik, gaji, utilitas, dll)',
                'is_currency' => true,
            ],
            [
                'label' => 'Laba Bersih Operasional (Net Profit)',
                'val' => '=B9-B10',
                'ratio' => '=IF(B7>0, B11/B7, 0)',
                'desc' => 'Laba bersih = Laba Kotor - Beban Operasional',
                'is_currency' => true,
                'highlight' => true,
            ],
            [
                'label' => 'Total Pajak PB1 / PPN Terkumpul',
                'val' => $stats['tax'],
                'ratio' => '-',
                'desc' => 'Pajak restoran / toko yang dipungut dari transaksi',
                'is_currency' => true,
            ],
            [
                'label' => 'Total Penerimaan Kas & QRIS (Grand Total)',
                'val' => $stats['grandTotal'],
                'ratio' => '-',
                'desc' => 'Total arus kas masuk (Penjualan + Pajak)',
                'is_currency' => true,
            ],
            [
                'label' => 'Total Transaksi / Struk Pesanan',
                'val' => $stats['ordersCount'],
                'ratio' => '-',
                'desc' => 'Jumlah keseluruhan pesanan pelanggan selesai',
                'is_currency' => false,
            ],
            [
                'label' => 'Rata-rata Nilai Transaksi (AOV)',
                'val' => '=IF(B14>0, B7/B14, 0)',
                'ratio' => '-',
                'desc' => 'Rata-rata pembelanjaan tiap transaksi (Average Order Value)',
                'is_currency' => true,
            ],
        ];

        $curRow = 7;
        foreach ($kpiRows as $kpi) {
            $sheet1->setCellValue('A' . $curRow, $kpi['label']);
            $sheet1->setCellValue('B' . $curRow, $kpi['val']);
            $sheet1->setCellValue('C' . $curRow, $kpi['ratio']);
            $sheet1->setCellValue('D' . $curRow, $kpi['desc']);

            $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($dataBorderStyle);
            $sheet1->getStyle("A{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet1->getStyle("B{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet1->getStyle("C{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet1->getStyle("D{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            $sheet1->getStyle("B{$curRow}")->getNumberFormat()->setFormatCode('#,##0');

            if (is_numeric($kpi['ratio']) || str_starts_with((string)$kpi['ratio'], '=')) {
                $sheet1->getStyle("C{$curRow}")->getNumberFormat()->setFormatCode('0.0%');
            }

            if (!empty($kpi['highlight'])) {
                $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FF065F46']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFECFDF5']],
                ]);
            } elseif ($curRow % 2 === 0) {
                $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($zebraFill);
            }

            $sheet1->getRowDimension($curRow)->setRowHeight(20);
            $curRow++;
        }

        // Section 2: Metode Pembayaran
        $curRow += 1;
        $sheet1->mergeCells("A{$curRow}:D{$curRow}");
        $sheet1->setCellValue("A{$curRow}", 'DISTRIBUSI METODE PEMBAYARAN');
        $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($sectionHeaderStyle);
        $sheet1->getRowDimension($curRow)->setRowHeight(24);

        $curRow++;
        $paymentHeaders = ['Metode Pembayaran', 'Jumlah Transaksi', 'Total Diterima (Rp)', 'Porsi Kontribusi (%)'];
        foreach ($paymentHeaders as $idx => $h) {
            $sheet1->setCellValue($cols[$idx] . $curRow, $h);
        }
        $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($tableHeaderStyle);
        $sheet1->getRowDimension($curRow)->setRowHeight(22);

        $curRow++;
        $payStartRow = $curRow;

        $methods = [
            ['name' => 'Tunai (Cash)', 'data' => $paymentBreakdown['cash']],
            ['name' => 'QRIS Digital', 'data' => $paymentBreakdown['qris']],
        ];

        foreach ($methods as $m) {
            $sheet1->setCellValue("A{$curRow}", $m['name']);
            $sheet1->setCellValue("B{$curRow}", $m['data']['count'] ?? 0);
            $sheet1->setCellValue("C{$curRow}", $m['data']['total'] ?? 0);
            $sheet1->setCellValue("D{$curRow}", ($m['data']['percentage'] ?? 0) / 100);

            $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($dataBorderStyle);
            $sheet1->getStyle("A{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet1->getStyle("B{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet1->getStyle("C{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet1->getStyle("D{$curRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet1->getStyle("B{$curRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet1->getStyle("C{$curRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet1->getStyle("D{$curRow}")->getNumberFormat()->setFormatCode('0.0%');

            $sheet1->getRowDimension($curRow)->setRowHeight(20);
            $curRow++;
        }

        $payEndRow = $curRow - 1;
        $sheet1->setCellValue("A{$curRow}", 'TOTAL PEMBAYARAN');
        $sheet1->setCellValue("B{$curRow}", "=SUM(B{$payStartRow}:B{$payEndRow})");
        $sheet1->setCellValue("C{$curRow}", "=SUM(C{$payStartRow}:C{$payEndRow})");
        $sheet1->setCellValue("D{$curRow}", "=SUM(D{$payStartRow}:D{$payEndRow})");

        $sheet1->getStyle("A{$curRow}:D{$curRow}")->applyFromArray($totalRowStyle);
        $sheet1->getStyle("B{$curRow}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet1->getStyle("C{$curRow}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet1->getStyle("D{$curRow}")->getNumberFormat()->setFormatCode('0.0%');
        $sheet1->getRowDimension($curRow)->setRowHeight(22);

        foreach (range('A', 'D') as $col) {
            $sheet1->getColumnDimension($col)->setAutoSize(true);
        }

        // ==========================================
        // SHEET 2: RIWAYAT TRANSAKSI
        // ==========================================
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Riwayat Transaksi');
        $sheet2->setShowGridLines(true);

        $sheet2->mergeCells('A1:J1');
        $sheet2->setCellValue('A1', 'DETAIL RIWAYAT TRANSAKSI PENJUALAN');
        $sheet2->getStyle('A1:J1')->applyFromArray($titleStyle);
        $sheet2->getRowDimension(1)->setRowHeight(32);

        $sheet2->mergeCells('A2:J2');
        $sheet2->setCellValue('A2', "Periode: {$periodLabel} | Total Transaksi: " . $allOrders->count() . " Pesanan");
        $sheet2->getStyle('A2:J2')->applyFromArray($subTitleStyle);
        $sheet2->getRowDimension(2)->setRowHeight(20);

        $orderHeaders = [
            'No', 'No. Invoice', 'Tanggal & Waktu', 'Kasir', 'Metode',
            'Subtotal (Rp)', 'Pajak (Rp)', 'Total Bayar (Rp)', 'Uang Diterima (Rp)', 'Kembalian (Rp)'
        ];
        $orderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        foreach ($orderHeaders as $idx => $h) {
            $sheet2->setCellValue($orderCols[$idx] . '4', $h);
        }
        $sheet2->getStyle('A4:J4')->applyFromArray($tableHeaderStyle);
        $sheet2->getRowDimension(4)->setRowHeight(24);

        $orderStartRow = 5;
        $orderRow = 5;
        if ($allOrders->isEmpty()) {
            $sheet2->mergeCells("A5:J5");
            $sheet2->setCellValue("A5", "Tidak ada transaksi penjualan pada periode ini.");
            $sheet2->getStyle("A5:J5")->applyFromArray($dataBorderStyle);
            $sheet2->getStyle("A5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet2->getRowDimension(5)->setRowHeight(24);
            $orderRow = 6;
        } else {
            foreach ($allOrders as $idx => $order) {
                $sheet2->setCellValue("A{$orderRow}", $idx + 1);
                $sheet2->setCellValueExplicit("B{$orderRow}", (string) $order->order_number, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
                $sheet2->setCellValue("C{$orderRow}", $order->created_at ? $order->created_at->format('Y-m-d H:i') : '-');
                $sheet2->setCellValue("D{$orderRow}", $order->user?->name ?? 'Kasir');
                $sheet2->setCellValue("E{$orderRow}", strtoupper((string) $order->payment_method));
                $sheet2->setCellValue("F{$orderRow}", (float) $order->subtotal);
                $sheet2->setCellValue("G{$orderRow}", (float) $order->tax_amount);
                $sheet2->setCellValue("H{$orderRow}", (float) $order->total_amount);
                $sheet2->setCellValue("I{$orderRow}", (float) $order->tendered_amount);
                $sheet2->setCellValue("J{$orderRow}", (float) $order->change_amount);

                $sheet2->getStyle("A{$orderRow}:J{$orderRow}")->applyFromArray($dataBorderStyle);
                $sheet2->getStyle("A{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet2->getStyle("B{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet2->getStyle("C{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet2->getStyle("D{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet2->getStyle("E{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                foreach (['F', 'G', 'H', 'I', 'J'] as $c) {
                    $sheet2->getStyle("{$c}{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet2->getStyle("{$c}{$orderRow}")->getNumberFormat()->setFormatCode('#,##0');
                }

                if ($orderRow % 2 === 0) {
                    $sheet2->getStyle("A{$orderRow}:J{$orderRow}")->applyFromArray($zebraFill);
                }

                $sheet2->getRowDimension($orderRow)->setRowHeight(19);
                $orderRow++;
            }

            $orderEndRow = $orderRow - 1;
            $sheet2->mergeCells("A{$orderRow}:E{$orderRow}");
            $sheet2->setCellValue("A{$orderRow}", 'TOTAL TRANSAKSI KESELURUHAN');
            $sheet2->getStyle("A{$orderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet2->setCellValue("F{$orderRow}", "=SUM(F{$orderStartRow}:F{$orderEndRow})");
            $sheet2->setCellValue("G{$orderRow}", "=SUM(G{$orderStartRow}:G{$orderEndRow})");
            $sheet2->setCellValue("H{$orderRow}", "=SUM(H{$orderStartRow}:H{$orderEndRow})");
            $sheet2->setCellValue("I{$orderRow}", "=SUM(I{$orderStartRow}:I{$orderEndRow})");
            $sheet2->setCellValue("J{$orderRow}", "=SUM(J{$orderStartRow}:J{$orderEndRow})");

            $sheet2->getStyle("A{$orderRow}:J{$orderRow}")->applyFromArray($totalRowStyle);
            foreach (['F', 'G', 'H', 'I', 'J'] as $c) {
                $sheet2->getStyle("{$c}{$orderRow}")->getNumberFormat()->setFormatCode('#,##0');
            }
            $sheet2->getRowDimension($orderRow)->setRowHeight(22);
        }

        foreach (range('A', 'J') as $col) {
            $sheet2->getColumnDimension($col)->setAutoSize(true);
        }

        // ==========================================
        // SHEET 3: PERFORMA PRODUK
        // ==========================================
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle('Performa Produk');
        $sheet3->setShowGridLines(true);

        $sheet3->mergeCells('A1:K1');
        $sheet3->setCellValue('A1', 'ANALISIS PROFITABILITAS & PERFORMA PRODUK');
        $sheet3->getStyle('A1:K1')->applyFromArray($titleStyle);
        $sheet3->getRowDimension(1)->setRowHeight(32);

        $sheet3->mergeCells('A2:K2');
        $sheet3->setCellValue('A2', "Periode: {$periodLabel} | Total Produk Aktif Terjual: " . count($productProfitability));
        $sheet3->getStyle('A2:K2')->applyFromArray($subTitleStyle);
        $sheet3->getRowDimension(2)->setRowHeight(20);

        $prodHeaders = [
            'No', 'Nama Produk', 'Kategori', 'Terjual (Qty)',
            'Harga Rata-rata (Rp)', 'Modal Satuan / HPP (Rp)', 'Margin / Unit (Rp)', 'Margin (%)',
            'Total Omzet (Rp)', 'Total Laba Kotor (Rp)', 'Klasifikasi Performa'
        ];
        $prodCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
        foreach ($prodHeaders as $idx => $h) {
            $sheet3->setCellValue($prodCols[$idx] . '4', $h);
        }
        $sheet3->getStyle('A4:K4')->applyFromArray($tableHeaderStyle);
        $sheet3->getRowDimension(4)->setRowHeight(24);

        $prodStartRow = 5;
        $prodRow = 5;
        if (empty($productProfitability) || count($productProfitability) === 0) {
            $sheet3->mergeCells("A5:K5");
            $sheet3->setCellValue("A5", "Tidak ada penjualan produk pada periode ini.");
            $sheet3->getStyle("A5:K5")->applyFromArray($dataBorderStyle);
            $sheet3->getStyle("A5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet3->getRowDimension(5)->setRowHeight(24);
            $prodRow = 6;
        } else {
            foreach ($productProfitability as $idx => $prod) {
                $sheet3->setCellValue("A{$prodRow}", $idx + 1);
                $sheet3->setCellValue("B{$prodRow}", $prod['product_name']);
                $sheet3->setCellValue("C{$prodRow}", $prod['category_name']);
                $sheet3->setCellValue("D{$prodRow}", $prod['total_sold']);
                $sheet3->setCellValue("E{$prodRow}", $prod['avg_price']);
                $sheet3->setCellValue("F{$prodRow}", $prod['avg_cogs']);
                $sheet3->setCellValue("G{$prodRow}", "=E{$prodRow}-F{$prodRow}");
                $sheet3->setCellValue("H{$prodRow}", "=IF(E{$prodRow}>0, G{$prodRow}/E{$prodRow}, 0)");
                $sheet3->setCellValue("I{$prodRow}", $prod['total_revenue']);
                $sheet3->setCellValue("J{$prodRow}", $prod['total_profit']);
                $sheet3->setCellValue("K{$prodRow}", $prod['badge'] ?? '-');

                $sheet3->getStyle("A{$prodRow}:K{$prodRow}")->applyFromArray($dataBorderStyle);
                $sheet3->getStyle("A{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet3->getStyle("B{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet3->getStyle("C{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet3->getStyle("D{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("E{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("F{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("G{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("H{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("I{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("J{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet3->getStyle("K{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $sheet3->getStyle("D{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet3->getStyle("E{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet3->getStyle("F{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet3->getStyle("G{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet3->getStyle("H{$prodRow}")->getNumberFormat()->setFormatCode('0.0%');
                $sheet3->getStyle("I{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet3->getStyle("J{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');

                if ($prodRow % 2 === 0) {
                    $sheet3->getStyle("A{$prodRow}:K{$prodRow}")->applyFromArray($zebraFill);
                }

                $sheet3->getRowDimension($prodRow)->setRowHeight(19);
                $prodRow++;
            }

            $prodEndRow = $prodRow - 1;
            $sheet3->mergeCells("A{$prodRow}:C{$prodRow}");
            $sheet3->setCellValue("A{$prodRow}", 'TOTAL PERFORMA PRODUK');
            $sheet3->getStyle("A{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet3->setCellValue("D{$prodRow}", "=SUM(D{$prodStartRow}:D{$prodEndRow})");
            $sheet3->setCellValue("E{$prodRow}", '-');
            $sheet3->setCellValue("F{$prodRow}", '-');
            $sheet3->setCellValue("G{$prodRow}", '-');
            $sheet3->setCellValue("H{$prodRow}", "=IF(I{$prodRow}>0, J{$prodRow}/I{$prodRow}, 0)");
            $sheet3->setCellValue("I{$prodRow}", "=SUM(I{$prodStartRow}:I{$prodEndRow})");
            $sheet3->setCellValue("J{$prodRow}", "=SUM(J{$prodStartRow}:J{$prodEndRow})");
            $sheet3->setCellValue("K{$prodRow}", '-');

            $sheet3->getStyle("A{$prodRow}:K{$prodRow}")->applyFromArray($totalRowStyle);
            $sheet3->getStyle("D{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet3->getStyle("H{$prodRow}")->getNumberFormat()->setFormatCode('0.0%');
            $sheet3->getStyle("I{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet3->getStyle("J{$prodRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet3->getStyle("E{$prodRow}:G{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet3->getStyle("K{$prodRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet3->getRowDimension($prodRow)->setRowHeight(22);
        }

        foreach (range('A', 'K') as $col) {
            $sheet3->getColumnDimension($col)->setAutoSize(true);
        }

        // ==========================================
        // SHEET 4: BEBAN OPERASIONAL
        // ==========================================
        $sheet4 = $spreadsheet->createSheet();
        $sheet4->setTitle('Beban Operasional');
        $sheet4->setShowGridLines(true);

        $sheet4->mergeCells('A1:E1');
        $sheet4->setCellValue('A1', 'RINCIAN BEBAN OPERASIONAL (EXPENSES)');
        $sheet4->getStyle('A1:E1')->applyFromArray($titleStyle);
        $sheet4->getRowDimension(1)->setRowHeight(32);

        $sheet4->mergeCells('A2:E2');
        $sheet4->setCellValue('A2', "Periode: {$periodLabel} | Total Beban: " . count($expensesList) . " Catatan");
        $sheet4->getStyle('A2:E2')->applyFromArray($subTitleStyle);
        $sheet4->getRowDimension(2)->setRowHeight(20);

        $expHeaders = ['No', 'Tanggal', 'Kategori Beban', 'Keterangan / Deskripsi', 'Nominal Pengeluaran (Rp)'];
        $expCols = ['A', 'B', 'C', 'D', 'E'];
        foreach ($expHeaders as $idx => $h) {
            $sheet4->setCellValue($expCols[$idx] . '4', $h);
        }
        $sheet4->getStyle('A4:E4')->applyFromArray($tableHeaderStyle);
        $sheet4->getRowDimension(4)->setRowHeight(24);

        $expStartRow = 5;
        $expRow = 5;
        if ($expensesList->isEmpty()) {
            $sheet4->mergeCells("A5:E5");
            $sheet4->setCellValue("A5", "Tidak ada catatan beban operasional pada periode ini.");
            $sheet4->getStyle("A5:E5")->applyFromArray($dataBorderStyle);
            $sheet4->getStyle("A5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet4->getRowDimension(5)->setRowHeight(24);
            $expRow = 6;
        } else {
            foreach ($expensesList as $idx => $exp) {
                $sheet4->setCellValue("A{$expRow}", $idx + 1);
                $sheet4->setCellValue("B{$expRow}", Carbon::parse($exp->expense_date)->format('Y-m-d'));
                $sheet4->setCellValue("C{$expRow}", $exp->category);
                $sheet4->setCellValue("D{$expRow}", $exp->description ?: '-');
                $sheet4->setCellValue("E{$expRow}", (float) $exp->amount);

                $sheet4->getStyle("A{$expRow}:E{$expRow}")->applyFromArray($dataBorderStyle);
                $sheet4->getStyle("A{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet4->getStyle("B{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet4->getStyle("C{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet4->getStyle("D{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet4->getStyle("E{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet4->getStyle("E{$expRow}")->getNumberFormat()->setFormatCode('#,##0');

                if ($expRow % 2 === 0) {
                    $sheet4->getStyle("A{$expRow}:E{$expRow}")->applyFromArray($zebraFill);
                }

                $sheet4->getRowDimension($expRow)->setRowHeight(19);
                $expRow++;
            }

            $expEndRow = $expRow - 1;
            $sheet4->mergeCells("A{$expRow}:D{$expRow}");
            $sheet4->setCellValue("A{$expRow}", 'TOTAL BEBAN OPERASIONAL');
            $sheet4->getStyle("A{$expRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $sheet4->setCellValue("E{$expRow}", "=SUM(E{$expStartRow}:E{$expEndRow})");

            $sheet4->getStyle("A{$expRow}:E{$expRow}")->applyFromArray($totalRowStyle);
            $sheet4->getStyle("E{$expRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet4->getRowDimension($expRow)->setRowHeight(22);
        }

        foreach (range('A', 'E') as $col) {
            $sheet4->getColumnDimension($col)->setAutoSize(true);
        }

        // Set active sheet to 1st tab
        $spreadsheet->setActiveSheetIndex(0);

        $fileName = 'Laporan-Keuangan-' . Str::slug($tenant?->name ?? 'Kasir') . '-' . $filePeriod . '.xlsx';

        return response()->streamDownload(function() use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0, no-cache, must-revalidate',
            'Pragma' => 'public',
        ]);
    }

    private function getFinancialData($startDate, $endDate, $periodLabel): array
    {
        $orders = Order::whereBetween('created_at', [$startDate, $endDate])->get();
        $ordersCount = $orders->count();
        $revenue = (float) $orders->sum('subtotal');
        $tax = (float) $orders->sum('tax_amount');
        $grandTotal = (float) $orders->sum('total_amount');
        $avgOrderValue = $ordersCount > 0 ? round($revenue / $ordersCount) : 0;

        $cogs = (float) (OrderItem::whereHas('order', function($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate]);
        })->select(DB::raw('SUM(cost_price_at_purchase * quantity) as total_cogs'))->value('total_cogs') ?? 0);

        $expenses = (float) \App\Models\Expense::whereBetween('expense_date', [
            $startDate->format('Y-m-d'), 
            $endDate->format('Y-m-d')
        ])->sum('amount');

        $grossProfit = $revenue - $cogs;
        $grossMarginPercentage = $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : 0;

        $netProfit = $grossProfit - $expenses;
        $netMarginPercentage = $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0;

        $cashOrders = $orders->where('payment_method', 'cash');
        $qrisOrders = $orders->where('payment_method', 'qris');
        $cashTotal = (float) $cashOrders->sum('total_amount');
        $qrisTotal = (float) $qrisOrders->sum('total_amount');
        $totalSettled = $cashTotal + $qrisTotal;

        $paymentBreakdown = [
            'cash' => [
                'total' => $cashTotal,
                'count' => $cashOrders->count(),
                'percentage' => $totalSettled > 0 ? round(($cashTotal / $totalSettled) * 100, 1) : 0,
            ],
            'qris' => [
                'total' => $qrisTotal,
                'count' => $qrisOrders->count(),
                'percentage' => $totalSettled > 0 ? round(($qrisTotal / $totalSettled) * 100, 1) : 0,
            ],
        ];

        $productProfitability = OrderItem::with('product.category')
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(subtotal) as total_revenue'),
                DB::raw('SUM(cost_price_at_purchase * quantity) as total_cogs'),
                DB::raw('SUM(subtotal - (cost_price_at_purchase * quantity)) as total_profit')
            )
            ->whereHas('order', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_profit')
            ->get()
            ->map(function($item) {
                $avgPrice = $item->total_sold > 0 ? round($item->total_revenue / $item->total_sold) : 0;
                $avgCogs = $item->total_sold > 0 ? round($item->total_cogs / $item->total_sold) : 0;
                $marginPerUnit = $avgPrice - $avgCogs;
                $marginPercentage = $avgPrice > 0 ? round(($marginPerUnit / $avgPrice) * 100, 1) : 0;

                $badge = 'Standar';
                if ($item->total_profit >= 50000 && $marginPercentage >= 50) {
                    $badge = 'Kontribusi Utama';
                } elseif ($item->total_sold >= 10 && $marginPercentage < 40) {
                    $badge = 'Perputaran Cepat';
                } elseif ($marginPercentage >= 60) {
                    $badge = 'Margin Tinggi';
                }

                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name ?? 'Produk Dihapus',
                    'category_name' => $item->product?->category?->name ?? 'Umum',
                    'total_sold' => (int) $item->total_sold,
                    'avg_price' => $avgPrice,
                    'avg_cogs' => $avgCogs,
                    'margin_per_unit' => $marginPerUnit,
                    'margin_percentage' => $marginPercentage,
                    'total_profit' => (float) $item->total_profit,
                    'total_revenue' => (float) $item->total_revenue,
                    'badge' => $badge,
                ];
            });

        $expensesList = \App\Models\Expense::whereBetween('expense_date', [
            $startDate->format('Y-m-d'), 
            $endDate->format('Y-m-d')
        ])->latest('expense_date')->get();

        return [
            'stats' => [
                'revenue' => $revenue,
                'cogs' => $cogs,
                'grossProfit' => $grossProfit,
                'grossMarginPercentage' => $grossMarginPercentage,
                'expenses' => $expenses,
                'netProfit' => $netProfit,
                'netMarginPercentage' => $netMarginPercentage,
                'tax' => $tax,
                'grandTotal' => $grandTotal,
                'ordersCount' => $ordersCount,
                'avgOrderValue' => $avgOrderValue,
                'periodLabel' => $periodLabel,
            ],
            'paymentBreakdown' => $paymentBreakdown,
            'productProfitability' => $productProfitability,
            'expensesList' => $expensesList,
            'bestSellers' => $productProfitability->take(5),
        ];
    }
}
