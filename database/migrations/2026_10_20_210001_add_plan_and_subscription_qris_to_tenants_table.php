<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('subscription_status')->constrained('plans')->nullOnDelete();
            // Static QRIS barcode uploaded by Super Admin specifically for this tenant to pay their SaaS subscription
            $table->string('subscription_qris_image')->nullable()->after('plan_id');
        });

        // Set default plan_id for existing tenants to trial plan
        $trialPlan = DB::table('plans')->where('slug', 'trial')->first();
        if ($trialPlan) {
            DB::table('tenants')->whereNull('plan_id')->update(['plan_id' => $trialPlan->id]);
        }
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'subscription_qris_image']);
        });
    }
};
