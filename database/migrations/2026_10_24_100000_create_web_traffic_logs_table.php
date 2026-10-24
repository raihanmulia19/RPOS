<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('web_traffic_logs', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45)->nullable()->index();
            $table->string('method', 10)->default('GET');
            $table->string('path', 255)->index();
            $table->string('full_url', 500)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('device_type', 20)->default('desktop')->index(); // desktop, mobile, tablet, bot
            $table->text('user_agent')->nullable();
            $table->integer('status_code')->default(200);
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_traffic_logs');
    }
};
