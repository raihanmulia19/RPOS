<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah max_outlets ke tabel plans
        if (!Schema::hasColumn('plans', 'max_outlets')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->integer('max_outlets')->default(1)->after('max_staff');
            });
        }

        // Update nilai kuota cabang paket
        DB::table('plans')->where('slug', 'enterprise')->update(['max_outlets' => 5]);
        DB::table('plans')->where('slug', 'pro')->update(['max_outlets' => 1]);
        DB::table('plans')->where('slug', 'starter')->update(['max_outlets' => 1]);
        DB::table('plans')->where('slug', 'trial')->update(['max_outlets' => 1]);

        // 2. Buat tabel outlets (Cabang Toko)
        if (!Schema::hasTable('outlets')) {
            Schema::create('outlets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('name');
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->boolean('is_main')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 3. Tambahkan outlet_id ke tabel users (kasir ditugaskan ke cabang)
        if (!Schema::hasColumn('users', 'outlet_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('outlet_id')->nullable()->after('tenant_id')->constrained('outlets')->nullOnDelete();
            });
        }

        // 4. Tambahkan outlet_id ke tabel orders (transaksi tercatat di cabang tertentu)
        if (!Schema::hasColumn('orders', 'outlet_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('outlet_id')->nullable()->after('tenant_id')->constrained('outlets')->nullOnDelete();
            });
        }

        // 5. Inisialisasi outlet utama untuk tenant yang sudah ada
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            $existing = DB::table('outlets')->where('tenant_id', $tenant->id)->first();
            if (!$existing) {
                $outletId = DB::table('outlets')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'name' => $tenant->name . ' (Pusat)',
                    'phone' => $tenant->phone ?? null,
                    'address' => $tenant->address ?? 'Pusat Operasional Toko',
                    'is_main' => true,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Hubungkan user kasir dan pesanan tenant ini ke outlet utama
                DB::table('users')->where('tenant_id', $tenant->id)->whereNull('outlet_id')->update(['outlet_id' => $outletId]);
                DB::table('orders')->where('tenant_id', $tenant->id)->whereNull('outlet_id')->update(['outlet_id' => $outletId]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orders', 'outlet_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['outlet_id']);
                $table->dropColumn('outlet_id');
            });
        }

        if (Schema::hasColumn('users', 'outlet_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['outlet_id']);
                $table->dropColumn('outlet_id');
            });
        }

        Schema::dropIfExists('outlets');

        if (Schema::hasColumn('plans', 'max_outlets')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->dropColumn('max_outlets');
            });
        }
    }
};
