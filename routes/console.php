<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\WebTrafficLog;
use App\Models\Tenant;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Command: Pembersihan data log trafik web lama
 */
Artisan::command('logs:prune {--days=14 : Jumlah hari retensi log}', function ($days = 14) {
    $retentionDays = max(1, (int) $days);
    $threshold = now()->subDays($retentionDays);
    
    $deletedCount = WebTrafficLog::where('created_at', '<=', $threshold)->delete();
    
    $this->info("✓ Berhasil membersihkan {$deletedCount} baris log web trafik yang lebih lama dari {$retentionDays} hari (sebelum {$threshold->format('d M Y H:i')}).");
})->purpose('Bersihkan data log kunjungan web lama dari database');

/**
 * Command: Cek dan ingatkan toko yang langganannya akan habis dalam H-3
 */
Artisan::command('subscriptions:check-expiring', function () {
    $this->info("Memeriksa toko dengan masa langganan aktif yang mendekati jatuh tempo (H-3)...");

    $expiringTenants = Tenant::where('is_active', true)
        ->whereNotNull('subscription_ends_at')
        ->whereBetween('subscription_ends_at', [now(), now()->addDays(3)])
        ->with(['plan', 'users' => function ($q) {
            $q->where('role', 'owner');
        }])
        ->get();

    if ($expiringTenants->isEmpty()) {
        $this->info("Tidak ada toko yang mendekati jatuh tempo dalam 3 hari ke depan.");
        return;
    }

    $this->warn("Ditemukan {$expiringTenants->count()} toko yang akan berakhir dalam H-3:");

    foreach ($expiringTenants as $tenant) {
        $owner = $tenant->users->first();
        $days = $tenant->days_remaining;
        $planName = $tenant->plan?->name ?? 'Langganan';
        $expDate = $tenant->subscription_ends_at->format('d M Y');

        $this->line("- [H-{$days}] Toko: {$tenant->name} | Owner: {$owner?->name} ({$owner?->phone}) | Paket: {$planName} | Berakhir: {$expDate}");
    }
})->purpose('Pindai toko yang masa aktif langganannya tersisa 3 hari atau kurang');

/**
 * Command: Pencadangan Database & Sinkronisasi ke Google Drive
 */
Artisan::command('db:backup {--drive : Otomatis upload ke Google Drive} {--keep=10 : Jumlah arsip yang dipertahankan}', function (\App\Services\DatabaseBackupService $backupService) {
    $this->info("Memulai proses pencadangan database...");
    $uploadDrive = (bool) $this->option('drive');
    $keep = (int) $this->option('keep') ?: 10;
    
    $result = $backupService->createBackup($uploadDrive);
    $this->info("✓ Berhasil membuat backup: {$result['filename']} ({$result['size_formatted']}, {$result['total_tables']} tabel, {$result['total_rows']} baris)");

    if ($uploadDrive) {
        if ($result['drive_status'] === 'uploaded') {
            $this->info("✓ Backup berhasil diunggah ke Google Drive (ID: {$result['drive_file_id']})");
        } else {
            $this->warn("! Status Google Drive: " . ($result['drive_error'] ?? 'Periksa konfigurasi Service Account / Folder ID'));
        }
    }

    $deleted = $backupService->cleanOldBackups($keep);
    if ($deleted > 0) {
        $this->line("Dibersihkan {$deleted} arsip backup lama untuk menghemat kapasitas disk.");
    }
})->purpose('Cadangkan database dan upload ke Google Drive');

/**
 * Scheduler Otomatis:
 * 1. Pruning log web setiap hari pukul 02:00 pagi
 * 2. Backup database & sinkron Google Drive setiap hari pukul 03:00 pagi
 * 3. Cek langganan H-3 setiap hari pukul 08:00 pagi
 */
Schedule::command('logs:prune --days=14')->dailyAt('02:00');
Schedule::command('db:backup --drive --keep=14')->dailyAt('03:00');
Schedule::command('subscriptions:check-expiring')->dailyAt('08:00');

