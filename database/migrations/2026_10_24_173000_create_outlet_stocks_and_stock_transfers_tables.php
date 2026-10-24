<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel outlet_stocks (Stok produk per cabang outlet)
        if (!Schema::hasTable('outlet_stocks')) {
            Schema::create('outlet_stocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
                $table->integer('stock_quantity')->default(0);
                $table->timestamps();

                $table->unique(['outlet_id', 'product_id']);
            });
        }

        // 2. Tabel stock_transfers (Mutasi / Transfer stok antar-cabang)
        if (!Schema::hasTable('stock_transfers')) {
            Schema::create('stock_transfers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('transfer_number')->unique();
                $table->foreignId('source_outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('destination_outlet_id')->constrained('outlets')->onDelete('cascade');
                $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
                $table->integer('quantity');
                $table->enum('status', ['in_transit', 'completed', 'cancelled'])->default('in_transit');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('received_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Inisialisasi stok awal per outlet untuk produk yang sudah ada
        $outlets = DB::table('outlets')->get();
        $products = DB::table('products')->get();

        foreach ($outlets as $outlet) {
            foreach ($products as $product) {
                $initialStock = $outlet->is_main ? ($product->stock_quantity ?? 0) : 0;
                DB::table('outlet_stocks')->insertOrIgnore([
                    'outlet_id' => $outlet->id,
                    'product_id' => $product->id,
                    'stock_quantity' => $initialStock,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('outlet_stocks');
    }
};
