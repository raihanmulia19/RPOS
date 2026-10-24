<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    protected ?array $serviceAccount = null;
    protected ?array $oauthConfig = null;
    protected ?string $folderId = null;
    protected ?string $cachedToken = null;
    protected int $tokenExpiresAt = 0;

    public function __construct()
    {
        $this->folderId = config('services.google_drive.folder_id') 
            ?: env('GOOGLE_DRIVE_FOLDER_ID');

        $this->loadOAuthConfig();
        $this->loadServiceAccount();
    }

    /**
     * Muat kredensial OAuth 2.0 (Akun Google Pribadi dengan kuota 15GB).
     */
    protected function loadOAuthConfig(): void
    {
        $oauthPath = storage_path('app/google-oauth-token.json');
        if (file_exists($oauthPath)) {
            $content = file_get_contents($oauthPath);
            $json = json_decode($content, true);
            if (is_array($json) && (!empty($json['refresh_token']) || !empty($json['access_token']))) {
                $this->oauthConfig = $json;
                return;
            }
        }

        $envRefresh = env('GOOGLE_DRIVE_REFRESH_TOKEN');
        if ($envRefresh) {
            $this->oauthConfig = [
                'account_type' => 'oauth_user',
                'refresh_token' => $envRefresh,
                'client_email' => env('GOOGLE_DRIVE_ACCOUNT_EMAIL', 'Akun Google Terhubung'),
            ];
        }
    }

    /**
     * Simpan refresh token OAuth ke .env dan storage.
     */
    public function setRefreshToken(string $refreshToken, string $email): void
    {
        $this->oauthConfig = [
            'account_type' => 'oauth_user',
            'client_email' => $email,
            'refresh_token' => $refreshToken,
        ];

        $envPath = base_path('.env');
        if (file_exists($envPath)) {
            $content = file_get_contents($envPath);
            if (preg_match('/^GOOGLE_DRIVE_REFRESH_TOKEN=.*/m', $content)) {
                $content = preg_replace('/^GOOGLE_DRIVE_REFRESH_TOKEN=.*/m', 'GOOGLE_DRIVE_REFRESH_TOKEN=' . $refreshToken, $content);
            } else {
                $content .= "\nGOOGLE_DRIVE_REFRESH_TOKEN=" . $refreshToken . "\n";
            }
            if (preg_match('/^GOOGLE_DRIVE_ACCOUNT_EMAIL=.*/m', $content)) {
                $content = preg_replace('/^GOOGLE_DRIVE_ACCOUNT_EMAIL=.*/m', 'GOOGLE_DRIVE_ACCOUNT_EMAIL=' . $email, $content);
            } else {
                $content .= "GOOGLE_DRIVE_ACCOUNT_EMAIL=" . $email . "\n";
            }
            file_put_contents($envPath, $content);
        }
    }

    /**
     * Muat kredensial Service Account dari file storage atau env.
     */
    protected function loadServiceAccount(): void
    {
        // 1. Cek file di storage/app/google-service-account.json
        $storagePath = storage_path('app/google-service-account.json');
        if (file_exists($storagePath)) {
            $content = file_get_contents($storagePath);
            $json = json_decode($content, true);
            if (is_array($json) && !empty($json['client_email']) && !empty($json['private_key'])) {
                $this->serviceAccount = $json;
                return;
            }
        }

        // 2. Cek path yang dispesifikasi di ENV
        $envPath = env('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON');
        if ($envPath && file_exists($envPath)) {
            $content = file_get_contents($envPath);
            $json = json_decode($content, true);
            if (is_array($json) && !empty($json['client_email']) && !empty($json['private_key'])) {
                $this->serviceAccount = $json;
                return;
            }
        }

        // 3. Cek jika JSON disematkan langsung sebagai string di ENV
        if ($envPath && str_starts_with(trim($envPath), '{')) {
            $json = json_decode($envPath, true);
            if (is_array($json) && !empty($json['client_email']) && !empty($json['private_key'])) {
                $this->serviceAccount = $json;
                return;
            }
        }
    }

    /**
     * Apakah konfigurasi Google Drive sudah lengkap.
     */
    public function isConfigured(): bool
    {
        return (!empty($this->oauthConfig) || !empty($this->serviceAccount)) && !empty($this->folderId);
    }

    /**
     * Dapatkan informasi ringkas konfigurasi (tanpa membocorkan private key).
     */
    public function getConfigSummary(): array
    {
        $isOAuth = !empty($this->oauthConfig) && (!empty($this->oauthConfig['refresh_token']) || !empty($this->oauthConfig['access_token']));
        return [
            'is_configured' => $this->isConfigured(),
            'auth_type' => $isOAuth ? 'oauth' : (!empty($this->serviceAccount) ? 'service_account' : null),
            'has_oauth' => $isOAuth,
            'has_service_account' => !empty($this->serviceAccount),
            'client_email' => $isOAuth 
                ? ($this->oauthConfig['client_email'] ?? 'Akun Google') 
                : ($this->serviceAccount['client_email'] ?? null),
            'project_id' => $this->serviceAccount['project_id'] ?? null,
            'folder_id' => $this->folderId,
            'has_folder_id' => !empty($this->folderId),
        ];
    }

    /**
     * Simpan kredensial Service Account JSON ke storage lokal.
     */
    public function saveCredentialsFile(string $jsonContent, ?string $folderId = null): array
    {
        $parsed = json_decode($jsonContent, true);
        if (!is_array($parsed) || empty($parsed['client_email']) || empty($parsed['private_key'])) {
            throw new \InvalidArgumentException('Format file JSON Service Account tidak valid. Pastikan file berisi "client_email" dan "private_key".');
        }

        $targetPath = storage_path('app/google-service-account.json');
        if (!is_dir(dirname($targetPath))) {
            mkdir(dirname($targetPath), 0755, true);
        }
        file_put_contents($targetPath, json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->serviceAccount = $parsed;

        if ($folderId !== null) {
            $this->updateFolderIdInEnv($folderId);
            $this->folderId = $folderId;
        }

        return $this->getConfigSummary();
    }

    /**
     * Perbarui atau simpan GOOGLE_DRIVE_FOLDER_ID di file .env.
     */
    public function setFolderId(string $folderId): void
    {
        $this->folderId = trim($folderId);
        $this->updateFolderIdInEnv($this->folderId);
    }

    /**
     * Update parameter di file .env
     */
    protected function updateFolderIdInEnv(string $folderId): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) {
            return;
        }

        $content = file_get_contents($envPath);
        if (preg_match('/^GOOGLE_DRIVE_FOLDER_ID=.*/m', $content)) {
            $content = preg_replace('/^GOOGLE_DRIVE_FOLDER_ID=.*/m', 'GOOGLE_DRIVE_FOLDER_ID=' . $folderId, $content);
        } else {
            $content .= "\nGOOGLE_DRIVE_FOLDER_ID=" . $folderId . "\n";
        }
        file_put_contents($envPath, $content);
    }

    /**
     * Dapatkan OAuth Access Token via OAuth 2.0 Refresh Token atau Service Account JWT.
     */
    public function getAccessToken(): string
    {
        if ($this->cachedToken && time() < ($this->tokenExpiresAt - 60)) {
            return $this->cachedToken;
        }

        // 1. Coba OAuth 2.0 (Akun Google Pribadi - memiliki kuota 15 GB)
        if (!empty($this->oauthConfig) && !empty($this->oauthConfig['refresh_token'])) {
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');

            if ($clientId && $clientSecret) {
                $res = Http::asForm()->timeout(15)->post('https://oauth2.googleapis.com/token', [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'refresh_token' => $this->oauthConfig['refresh_token'],
                    'grant_type' => 'refresh_token',
                ]);

                if ($res->successful()) {
                    $tokenData = $res->json();
                    $this->cachedToken = $tokenData['access_token'];
                    $this->tokenExpiresAt = time() + ($tokenData['expires_in'] ?? 3600);
                    return $this->cachedToken;
                } else {
                    Log::warning('Google Drive OAuth refresh failed: ' . $res->body());
                }
            }
        } elseif (!empty($this->oauthConfig['access_token'])) {
            $this->cachedToken = $this->oauthConfig['access_token'];
            return $this->cachedToken;
        }

        // 2. Fallback ke Service Account JWT Flow
        if (empty($this->serviceAccount) || empty($this->serviceAccount['private_key']) || empty($this->serviceAccount['client_email'])) {
            throw new \RuntimeException('Kredensial Service Account / OAuth Google Drive belum dikonfigurasi.');
        }

        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claim = [
            'iss' => $this->serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now,
        ];

        $base64UrlHeader = $this->base64UrlEncode(json_encode($header));
        $base64UrlClaim = $this->base64UrlEncode(json_encode($claim));
        $signatureInput = $base64UrlHeader . '.' . $base64UrlClaim;

        $privateKey = openssl_pkey_get_private($this->serviceAccount['private_key']);
        if (!$privateKey) {
            throw new \RuntimeException('Kunci privat (private_key) Google Service Account tidak valid.');
        }

        $signature = '';
        $success = openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        if (!$success) {
            throw new \RuntimeException('Gagal menandatangani JWT Service Account Google.');
        }

        $base64UrlSignature = $this->base64UrlEncode($signature);
        $jwt = $signatureInput . '.' . $base64UrlSignature;

        $response = Http::asForm()->timeout(15)->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (!$response->successful()) {
            Log::error('Google OAuth Token Error: ' . $response->body());
            throw new \RuntimeException('Gagal mendapatkan token Google Drive: ' . ($response->json('error_description') ?: $response->body()));
        }

        $tokenData = $response->json();
        $this->cachedToken = $tokenData['access_token'];
        $this->tokenExpiresAt = $now + ($tokenData['expires_in'] ?? 3600);

        return $this->cachedToken;
    }

    /**
     * Uji koneksi ke Google Drive API dan verifikasi akses ke folder tujuan.
     */
    public function testConnection(): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Konfigurasi Google Drive belum lengkap (file Service Account/OAuth atau Folder ID belum terisi).',
            ];
        }

        try {
            $token = $this->getAccessToken();

            // Cek folder Google Drive tujuan
            $url = "https://www.googleapis.com/drive/v3/files/{$this->folderId}?fields=id,name,mimeType,capabilities,driveId&supportsAllDrives=true";
            $res = Http::withToken($token)->timeout(15)->get($url);

            if (!$res->successful()) {
                $err = $res->json('error.message') ?: $res->body();
                return [
                    'success' => false,
                    'message' => "Folder Google Drive tidak dapat diakses ({$err}). Pastikan folder ID benar dan folder tersebut sudah Anda 'Bagikan' (Share) ke email: " . ($this->oauthConfig['client_email'] ?? $this->serviceAccount['client_email']) . " sebagai Editor.",
                ];
            }

            $folderData = $res->json();
            $authType = !empty($this->oauthConfig) ? 'Akun Google OAuth (Kuota 15GB Aktif)' : 'Service Account';
            return [
                'success' => true,
                'message' => "Koneksi Google Drive Berhasil! Folder '{$folderData['name']}' siap digunakan ({$authType}).",
                'folder_name' => $folderData['name'] ?? 'Backup Folder',
                'client_email' => $this->oauthConfig['client_email'] ?? $this->serviceAccount['client_email'],
                'auth_type' => $authType,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Gagal menghubungkan ke Google Drive: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Unggah file lokal ke Google Drive folder tujuan.
     */
    public function uploadFile(string $filePath, string $fileName, string $mimeType = 'application/zip'): array
    {
        if (!file_exists($filePath)) {
            throw new \InvalidArgumentException("File lokal tidak ditemukan: {$filePath}");
        }

        if (!$this->isConfigured()) {
            throw new \RuntimeException("Google Drive belum dikonfigurasi.");
        }

        $token = $this->getAccessToken();
        $fileSize = filesize($filePath);
        $fileContent = file_get_contents($filePath);

        $metadata = [
            'name' => $fileName,
            'parents' => [$this->folderId],
            'description' => 'Cadangan database otomatis RPOS SaaS dibuat pada ' . date('Y-m-d H:i:s'),
        ];

        $boundary = '-------314159265358979323846';
        $delimiter = "\r\n--" . $boundary . "\r\n";
        $closeDelimiter = "\r\n--" . $boundary . "--";

        $multipartBody = $delimiter
            . "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            . json_encode($metadata)
            . $delimiter
            . "Content-Type: {$mimeType}\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . base64_encode($fileContent)
            . $closeDelimiter;

        $url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,size';

        $response = Http::withToken($token)
            ->withHeaders([
                'Content-Type' => 'multipart/related; boundary=' . $boundary,
                'Content-Length' => strlen($multipartBody),
            ])
            ->timeout(120)
            ->withBody($multipartBody, 'multipart/related; boundary=' . $boundary)
            ->post($url);

        if (!$response->successful()) {
            $err = $response->json('error.message') ?: $response->body();
            Log::error('Google Drive Upload Error: ' . $err);
            throw new \RuntimeException("Gagal mengunggah file ke Google Drive: {$err}");
        }

        $result = $response->json();

        return [
            'id' => $result['id'] ?? null,
            'name' => $result['name'] ?? $fileName,
            'size' => $result['size'] ?? $fileSize,
            'link' => $result['webViewLink'] ?? null,
        ];
    }

    /**
     * Dapatkan daftar file backup yang ada di folder Google Drive.
     */
    public function listFiles(int $limit = 30): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $token = $this->getAccessToken();
            $query = "'{$this->folderId}' in parents and trashed = false";
            $url = "https://www.googleapis.com/drive/v3/files?q=" . urlencode($query) . "&pageSize={$limit}&fields=files(id,name,mimeType,size,createdTime,webViewLink)&orderBy=createdTime desc&supportsAllDrives=true";

            $res = Http::withToken($token)->timeout(15)->get($url);
            if ($res->successful()) {
                return $res->json('files') ?? [];
            }
        } catch (\Throwable $e) {
            Log::warning('Google Drive listFiles error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Hapus file di Google Drive.
     */
    public function deleteFile(string $fileId): bool
    {
        try {
            $token = $this->getAccessToken();
            $res = Http::withToken($token)->timeout(15)->delete("https://www.googleapis.com/drive/v3/files/{$fileId}?supportsAllDrives=true");
            return $res->successful();
        } catch (\Throwable $e) {
            Log::warning("Google Drive deleteFile error ({$fileId}): " . $e->getMessage());
            return false;
        }
    }

    protected function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
