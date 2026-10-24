<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class DatabaseBackupService
{
    protected string $backupDir;
    protected string $indexPath;
    protected GoogleDriveService $driveService;

    public function __construct(GoogleDriveService $driveService)
    {
        $this->driveService = $driveService;
        $this->backupDir = storage_path('app/backups');
        $this->indexPath = $this->backupDir . '/index.json';

        if (!File::isDirectory($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true);
        }
    }

    /**
     * Buat file backup database baru dan kompresi ke format .ZIP.
     */
    public function createBackup(bool $uploadToDrive = false): array
    {
        $timestamp = now()->format('Y-m-d_His');
        $driver = DB::connection()->getDriverName();
        $zipFilename = "backup-rpos-{$driver}-{$timestamp}.zip";
        $zipFullPath = $this->backupDir . '/' . $zipFilename;

        $tempSqlFile = $this->backupDir . "/temp-dump-{$timestamp}.sql";

        try {
            $tableStats = [];
            $totalRows = 0;

            if ($driver === 'sqlite') {
                $sqlitePath = config('database.connections.sqlite.database');
                if (!file_exists($sqlitePath)) {
                    throw new \RuntimeException("File database SQLite tidak ditemukan pada path: {$sqlitePath}");
                }

                // Ambil daftar tabel dan statistik baris
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
                foreach ($tables as $t) {
                    $tableName = $t->name;
                    $rowCount = DB::table($tableName)->count();
                    $tableStats[$tableName] = $rowCount;
                    $totalRows += $rowCount;
                }

                // Buat SQL text dump sederhana untuk portabilitas
                $this->generateSqlDump($tempSqlFile, $driver);

                // Buat ZIP berisi file sqlite asli + dump SQL + metadata manifest
                $zip = new ZipArchive();
                if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                    throw new \RuntimeException("Gagal membuat arsip ZIP di {$zipFullPath}");
                }

                $zip->addFile($sqlitePath, 'database.sqlite');
                if (file_exists($tempSqlFile)) {
                    $zip->addFile($tempSqlFile, 'database.sql');
                }

                $manifest = [
                    'app_name' => config('app.name', 'RPOS SaaS'),
                    'backup_date' => now()->toIso8601String(),
                    'db_driver' => $driver,
                    'total_tables' => count($tableStats),
                    'total_rows' => $totalRows,
                    'tables' => $tableStats,
                ];
                $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                $zip->close();

            } else {
                // Untuk MySQL / Postgres
                $this->generateSqlDump($tempSqlFile, $driver);

                $tables = DB::select('SHOW TABLES');
                $tablesKey = 'Tables_in_' . config('database.connections.mysql.database');
                foreach ($tables as $t) {
                    $tableName = $t->$tablesKey ?? array_values((array)$t)[0];
                    $rowCount = DB::table($tableName)->count();
                    $tableStats[$tableName] = $rowCount;
                    $totalRows += $rowCount;
                }

                $zip = new ZipArchive();
                if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                    throw new \RuntimeException("Gagal membuat arsip ZIP di {$zipFullPath}");
                }

                if (file_exists($tempSqlFile)) {
                    $zip->addFile($tempSqlFile, 'database.sql');
                }

                $manifest = [
                    'app_name' => config('app.name', 'RPOS SaaS'),
                    'backup_date' => now()->toIso8601String(),
                    'db_driver' => $driver,
                    'total_tables' => count($tableStats),
                    'total_rows' => $totalRows,
                    'tables' => $tableStats,
                ];
                $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                $zip->close();
            }

            // Hapus file temp dump sql jika ada
            if (file_exists($tempSqlFile)) {
                @unlink($tempSqlFile);
            }

            $sizeBytes = filesize($zipFullPath);

            $backupItem = [
                'filename' => $zipFilename,
                'driver' => $driver,
                'size_bytes' => $sizeBytes,
                'size_formatted' => $this->formatBytes($sizeBytes),
                'created_at' => now()->toIso8601String(),
                'created_at_human' => now()->locale('id')->isoFormat('D MMMM Y, HH:mm:ss'),
                'total_tables' => count($tableStats),
                'total_rows' => $totalRows,
                'drive_status' => 'local_only',
                'drive_file_id' => null,
                'drive_link' => null,
                'drive_uploaded_at' => null,
            ];

            // Simpan ke indeks lokal
            $this->saveToLocalIndex($backupItem);

            // Jika user memilih otomatis upload ke Google Drive
            if ($uploadToDrive && $this->driveService->isConfigured()) {
                try {
                    $driveRes = $this->driveService->uploadFile($zipFullPath, $zipFilename, 'application/zip');
                    $backupItem['drive_status'] = 'uploaded';
                    $backupItem['drive_file_id'] = $driveRes['id'] ?? null;
                    $backupItem['drive_link'] = $driveRes['link'] ?? null;
                    $backupItem['drive_uploaded_at'] = now()->toIso8601String();
                    $this->saveToLocalIndex($backupItem);
                } catch (\Throwable $e) {
                    Log::error("Gagal otomatis unggah backup ke Google Drive: " . $e->getMessage());
                    $backupItem['drive_status'] = 'upload_failed';
                    $backupItem['drive_error'] = $e->getMessage();
                    $this->saveToLocalIndex($backupItem);
                }
            }

            return $backupItem;
        } catch (\Throwable $e) {
            if (file_exists($tempSqlFile)) {
                @unlink($tempSqlFile);
            }
            if (file_exists($zipFullPath)) {
                @unlink($zipFullPath);
            }
            throw $e;
        }
    }

    /**
     * Dapatkan daftar seluruh file backup lokal beserta status Google Drive.
     */
    public function listBackups(): array
    {
        $index = $this->loadLocalIndex();
        $files = File::files($this->backupDir);
        $result = [];

        foreach ($files as $file) {
            $filename = $file->getFilename();
            if ($filename === 'index.json' || str_starts_with($filename, 'temp-')) {
                continue;
            }

            $sizeBytes = $file->getSize();
            $meta = $index[$filename] ?? null;

            $result[] = [
                'filename' => $filename,
                'driver' => $meta['driver'] ?? (str_contains($filename, 'sqlite') ? 'sqlite' : 'mysql'),
                'size_bytes' => $sizeBytes,
                'size_formatted' => $this->formatBytes($sizeBytes),
                'created_at' => $meta['created_at'] ?? date('c', $file->getMTime()),
                'created_at_human' => isset($meta['created_at']) 
                    ? \Carbon\Carbon::parse($meta['created_at'])->locale('id')->isoFormat('D MMMM Y, HH:mm:ss')
                    : date('d M Y, H:i:s', $file->getMTime()),
                'total_tables' => $meta['total_tables'] ?? null,
                'total_rows' => $meta['total_rows'] ?? null,
                'drive_status' => $meta['drive_status'] ?? 'local_only',
                'drive_file_id' => $meta['drive_file_id'] ?? null,
                'drive_link' => $meta['drive_link'] ?? null,
                'drive_uploaded_at' => $meta['drive_uploaded_at'] ?? null,
                'drive_error' => $meta['drive_error'] ?? null,
            ];
        }

        // Urutkan dari yang paling baru
        usort($result, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return $result;
    }

    /**
     * Ambil path absolut file backup untuk diunduh.
     */
    public function getBackupFullPath(string $filename): ?string
    {
        $cleanName = basename($filename);
        $path = $this->backupDir . '/' . $cleanName;
        return file_exists($path) ? $path : null;
    }

    /**
     * Unggah salah satu file backup lokal yang ada ke Google Drive.
     */
    public function uploadBackupToDrive(string $filename): array
    {
        $path = $this->getBackupFullPath($filename);
        if (!$path) {
            throw new \InvalidArgumentException("File backup tidak ditemukan: {$filename}");
        }

        $driveRes = $this->driveService->uploadFile($path, $filename, 'application/zip');

        $index = $this->loadLocalIndex();
        if (isset($index[$filename])) {
            $index[$filename]['drive_status'] = 'uploaded';
            $index[$filename]['drive_file_id'] = $driveRes['id'] ?? null;
            $index[$filename]['drive_link'] = $driveRes['link'] ?? null;
            $index[$filename]['drive_uploaded_at'] = now()->toIso8601String();
            unset($index[$filename]['drive_error']);
            $this->writeIndex($index);
        }

        return $driveRes;
    }

    /**
     * Hapus file backup lokal.
     */
    public function deleteBackup(string $filename): bool
    {
        $path = $this->getBackupFullPath($filename);
        if ($path && file_exists($path)) {
            @unlink($path);

            $index = $this->loadLocalIndex();
            unset($index[$filename]);
            $this->writeIndex($index);

            return true;
        }
        return false;
    }

    /**
     * Bersihkan backup lama dengan hanya mempertahankan N backup terakhir.
     */
    public function cleanOldBackups(int $keepLast = 10): int
    {
        $backups = $this->listBackups();
        $deletedCount = 0;

        if (count($backups) > $keepLast) {
            $toDelete = array_slice($backups, $keepLast);
            foreach ($toDelete as $b) {
                if ($this->deleteBackup($b['filename'])) {
                    $deletedCount++;
                }
            }
        }

        return $deletedCount;
    }

    /**
     * Generate SQL text file generator.
     */
    protected function generateSqlDump(string $targetPath, string $driver): void
    {
        $handle = fopen($targetPath, 'w');
        if (!$handle) return;

        fwrite($handle, "-- RPOS Database Backup\n");
        fwrite($handle, "-- Date: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- Driver: " . $driver . "\n\n");

        if ($driver === 'sqlite') {
            $tables = DB::select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
            foreach ($tables as $table) {
                fwrite($handle, "-- Structure for table: {$table->name}\n");
                fwrite($handle, "DROP TABLE IF EXISTS `{$table->name}`;\n");
                fwrite($handle, $table->sql . ";\n\n");

                $rows = DB::table($table->name)->get();
                if ($rows->isNotEmpty()) {
                    fwrite($handle, "-- Data for table: {$table->name}\n");
                    foreach ($rows->chunk(50) as $chunk) {
                        foreach ($chunk as $row) {
                            $rowArray = (array) $row;
                            $columns = array_map(fn($col) => "`{$col}`", array_keys($rowArray));
                            $values = array_map(function ($val) {
                                if (is_null($val)) return 'NULL';
                                return "'" . str_replace("'", "''", (string)$val) . "'";
                            }, array_values($rowArray));

                            fwrite($handle, "INSERT INTO `{$table->name}` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n");
                        }
                    }
                    fwrite($handle, "\n");
                }
            }
        } elseif ($driver === 'mysql') {
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n\n");
            
            $tables = DB::select('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            $tablesKey = 'Tables_in_' . config('database.connections.mysql.database');

            foreach ($tables as $tableObj) {
                $tableName = $tableObj->$tablesKey ?? array_values((array)$tableObj)[0];

                // Table structure
                fwrite($handle, "-- Structure for table `{$tableName}`\n");
                fwrite($handle, "DROP TABLE IF EXISTS `{$tableName}`;\n");
                $createRes = DB::select("SHOW CREATE TABLE `{$tableName}`");
                if (!empty($createRes)) {
                    $createObj = (array) $createRes[0];
                    $createSql = $createObj['Create Table'] ?? array_values($createObj)[1] ?? null;
                    if ($createSql) {
                        fwrite($handle, $createSql . ";\n\n");
                    }
                }

                // Table data
                $totalRows = DB::table($tableName)->count();
                if ($totalRows > 0) {
                    fwrite($handle, "-- Data for table `{$tableName}` ({$totalRows} rows)\n");
                    DB::table($tableName)->orderBy(DB::raw('1'))->chunk(200, function ($rows) use ($handle, $tableName) {
                        foreach ($rows as $row) {
                            $rowArray = (array) $row;
                            $columns = array_map(fn($col) => "`{$col}`", array_keys($rowArray));
                            $values = array_map(function ($val) {
                                if (is_null($val)) return 'NULL';
                                return "'" . addslashes((string)$val) . "'";
                            }, array_values($rowArray));

                            fwrite($handle, "INSERT INTO `{$tableName}` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n");
                        }
                    });
                    fwrite($handle, "\n");
                }
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        }

        fclose($handle);
    }

    protected function loadLocalIndex(): array
    {
        if (file_exists($this->indexPath)) {
            $content = file_get_contents($this->indexPath);
            $json = json_decode($content, true);
            if (is_array($json)) {
                return $json;
            }
        }
        return [];
    }

    protected function writeIndex(array $index): void
    {
        file_put_contents($this->indexPath, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    protected function saveToLocalIndex(array $item): void
    {
        $index = $this->loadLocalIndex();
        $index[$item['filename']] = $item;
        $this->writeIndex($index);
    }

    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
