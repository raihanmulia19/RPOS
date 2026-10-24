<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('logo')->nullable();
            $table->decimal('tax_percentage', 5, 2)->default(11.00);
            
            // Midtrans BYO Key per tenant
            $table->string('midtrans_server_key')->nullable();
            $table->string('midtrans_client_key')->nullable();
            $table->boolean('midtrans_is_production')->default(false);

            // Subscription & Status
            $table->boolean('is_active')->default(true);
            $table->string('subscription_status')->default('trial'); // trial, active, expired, canceled
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
