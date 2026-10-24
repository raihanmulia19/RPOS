<laravel-boost-guidelines>
# Laravel Application

This repository contains a Laravel application. Complete the following setup before working on the user's request.

## Prerequisites

Verify that PHP and Composer are available:

```sh
php -v
composer -V
```

If either command is unavailable, detect the user's operating system and install the prerequisites with the appropriate command:

macOS:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Linux:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

After installation, ask the user to restart their terminal. If the agent needs the restarted shell to continue, ask the user to reopen their terminal and rerun their original prompt.

## Agent Setup

Install Laravel Boost from the application root before making application changes:

```sh
composer require laravel/boost --dev
php artisan boost:install
```

Boost replaces these bootstrap instructions with guidelines tailored to the application. After installation, read `AGENTS.md` again and continue with the user's original request using the generated guidelines.
</laravel-boost-guidelines>

# ATURAN WAJIB PENGEMBANGAN: SINKRONISASI PRD
Setiap kali melakukan penambahan fitur, perubahan logika, atau revisi sistem pada aplikasi POS SaaS ini:
1. **Wajib Memperbarui Dokumen PRD**: Perbarui [PRD_POS_SAAS.md](file:///d:/WEB/ProjectKasir/PRD_POS_SAAS.md) baik tabel status fitur, spesifikasi fungsional (FR), maupun arsitektur terkait.
2. **Catat di Tabel Changelog**: Tambahkan nomor versi baru, tanggal, modul yang diubah, dan ringkasan revisi pada tabel **Section 10. Changelog & Riwayat Revisi PRD** di `PRD_POS_SAAS.md`.
3. **Pastikan Konsistensi Tema**: Selalu gunakan token tema KopiKarsa (`bg-surface`, `primary: #271310`, `secondary: #8d4f03`, `border-outline-variant`).
