<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->integer('duration_days')->default(30);
            $table->integer('max_products')->default(-1); // -1 = unlimited
            $table->integer('max_staff')->default(-1); // -1 = unlimited
            $table->json('features')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default plans
        DB::table('plans')->insert([
            [
                'name' => 'Free Trial',
                'slug' => 'trial',
                'description' => 'Paket uji coba gratis 14 hari untuk toko baru.',
                'price' => 0,
                'duration_days' => 14,
                'max_products' => 20,
                'max_staff' => 1,
                'features' => json_encode(['1 Outlet Toko', 'Struk Kasir Standar', 'Masa Aktif 14 Hari']),
                'is_popular' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Cocok untuk usaha mikro, booth gerobak, dan kedai kecil.',
                'price' => 49000,
                'duration_days' => 30,
                'max_products' => 50,
                'max_staff' => 1,
                'features' => json_encode(['1 Outlet Toko', 'Laporan Omzet & HPP', 'QRIS Statis Manual']),
                'is_popular' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Paket paling diminati untuk kafe, resto, dan toko ritel berkembang.',
                'price' => 129000,
                'duration_days' => 30,
                'max_products' => 100,
                'max_staff' => 3,
                'features' => json_encode(['1 Outlet Toko', 'Ekspor Laporan PDF & Excel Lengkap', 'Payment Gateway']),
                'is_popular' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Solusi lengkap untuk bisnis multi-cabang & ritel besar.',
                'price' => 299000,
                'duration_days' => 30,
                'max_products' => -1,
                'max_staff' => -1,
                'features' => json_encode(['Hingga 5 Cabang Outlet', 'Semua Fitur Pro Termasuk', 'Transfer Stok Antar-Cabang', 'Dukungan Prioritas WhatsApp 24/7']),
                'is_popular' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
