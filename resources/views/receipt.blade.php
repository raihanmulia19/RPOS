<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Struk - {{ $order->invoice_number }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 10px;
            width: 58mm; /* Standard thermal printer width */
            font-size: 12px;
            color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        hr { border-top: 1px dashed #000; border-bottom: none; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding-bottom: 4px; }
        .mt-2 { margin-top: 10px; }
        .mb-2 { margin-bottom: 10px; }
    </style>
</head>
<body>
    @if($order->tenant?->logo)
        <div class="text-center" style="margin-bottom: 8px;">
            <img src="{{ asset('storage/' . $order->tenant->logo) }}" alt="Logo Toko" style="max-height: 48px; max-width: 100px; object-fit: contain; filter: grayscale(100%);">
        </div>
    @endif
    <div class="text-center font-bold" style="font-size: 16px;">{{ strtoupper($order->tenant->name ?? 'KASIR') }}</div>
    @if($order->outlet && !$order->outlet->is_main)
        <div class="text-center font-bold" style="font-size: 12px; margin-top: 2px;">{{ $order->outlet->name }}</div>
    @endif
    @if($order->outlet?->address)
        <div class="text-center">{{ $order->outlet->address }}</div>
    @elseif($order->tenant?->address)
        <div class="text-center">{{ $order->tenant->address }}</div>
    @endif
    @if(($order->tenant->show_phone_on_receipt ?? true))
        @if($order->outlet?->phone)
            <div class="text-center">Telp: {{ $order->outlet->phone }}</div>
        @elseif($order->tenant?->phone)
            <div class="text-center">Telp: {{ $order->tenant->phone }}</div>
        @endif
    @endif
    <hr class="mt-2 mb-2">
    <div>Kasir: {{ $order->user->name }}</div>
    <div>Waktu: {{ $order->created_at->format('d/m/Y H:i') }}</div>
    <div>No: {{ $order->invoice_number }}</div>
    <hr class="mt-2 mb-2">
    <table>
        @foreach($order->items as $item)
        <tr>
            <td colspan="3">
                {{ $item->product->name }}
                @if($item->note)
                    <span style="font-size: 11px;">({{ $item->note }})</span>
                @endif
            </td>
        </tr>
        <tr>
            <td style="width: 30%;">{{ $item->quantity }}x</td>
            <td style="width: 30%;">Rp {{ number_format($item->price_at_purchase, 0, ',', '.') }}</td>
            <td style="width: 40%;" class="text-right">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
        </tr>
        @endforeach
    </table>
    <hr class="mt-2 mb-2">
    <table>
        <tr>
            <td>Subtotal</td>
            <td class="text-right">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Pajak ({{ $order->tenant->tax_percentage ?? 11 }}%)</td>
            <td class="text-right">Rp {{ number_format($order->tax_amount, 0, ',', '.') }}</td>
        </tr>
        <tr class="font-bold" style="font-size: 14px;">
            <td style="padding-top: 8px;">TOTAL</td>
            <td class="text-right" style="padding-top: 8px;">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
        </tr>
    </table>
    <hr class="mt-2 mb-2">
    <table>
        <tr>
            <td>Metode</td>
            <td class="text-right">{{ strtoupper($order->payment_method) }}</td>
        </tr>
        @if($order->payment_method === 'cash')
        <tr>
            <td>Tunai</td>
            <td class="text-right">Rp {{ number_format($order->amount_tendered, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Kembali</td>
            <td class="text-right">Rp {{ number_format($order->change_amount, 0, ',', '.') }}</td>
        </tr>
        @elseif($order->payment_method === 'qris')
        <tr>
            <td>Bayar QRIS</td>
            <td class="text-right">Rp {{ number_format($order->total_amount, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Status</td>
            <td class="text-right font-bold">LUNAS</td>
        </tr>
        @endif
    </table>
    <hr class="mt-2 mb-2">
    <div class="text-center mt-2 mb-2">
        <div>Terima kasih atas kunjungan Anda!</div>
        <div style="font-size: 10px; margin-top: 4px;">Sistem POS by RPOS</div>
    </div>

    <script>
        // Cetak otomatis jika dibuka di jendela baru (window.self === window.top) atau ada parameter ?print=1
        if (window.self === window.top || new URLSearchParams(window.location.search).get('print') === '1') {
            window.onload = function() {
                window.print();
            };
        }
    </script>
    
    <!-- CSS Page Break agar printer thermal memotong kertas secara otomatis (jika mendukung auto-cut per halaman) -->
    <div style="page-break-after: always;"></div>

    <!-- TICKET DAPUR -->
    <div class="text-center font-bold mt-2" style="font-size: 16px;">TICKET DAPUR</div>
    <div class="text-center mt-2">No: {{ $order->invoice_number }}</div>
    <div class="text-center">Waktu: {{ $order->created_at->format('H:i') }}</div>
    <hr class="mt-2 mb-2">
    <table>
        @foreach($order->items as $item)
        <tr>
            <td style="width: 20%; font-size: 14px; padding-bottom: 10px;" class="font-bold">{{ $item->quantity }}x</td>
            <td style="width: 80%; font-size: 14px; padding-bottom: 10px;" class="font-bold">
                {{ $item->product->name }}
                @if($item->note)
                    <br><span style="font-size: 12px; font-weight: normal;">({{ $item->note }})</span>
                @endif
            </td>
        </tr>
        @endforeach
    </table>
    <hr class="mt-2 mb-2">
    <div class="text-center" style="margin-top: 20px;">.</div>
</body>
</html>
