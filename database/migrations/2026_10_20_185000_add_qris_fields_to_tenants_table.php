<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('qris_type')->default('static')->after('tax_percentage'); // 'static' or 'dynamic'
            $table->string('qris_image')->nullable()->after('qris_type');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['qris_type', 'qris_image']);
        });
    }
};
