<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tenant extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /**
     * Sembunyikan API key sensitif dari serialisasi JSON / Inertia props.
     */
    protected $hidden = [
        'midtrans_server_key',
    ];

    protected $appends = [
        'logo_url', 
        'qris_image_url',
        'subscription_qris_image_url',
        'days_remaining',
        'is_expiring_soon',
        'expiration_date_formatted',
        'quota_usage',
        'has_midtrans_server_key',
        'masked_midtrans_server_key',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }

    public function getQrisImageUrlAttribute(): ?string
    {
        return $this->qris_image ? asset('storage/' . $this->qris_image) : null;
    }

    public function getSubscriptionQrisImageUrlAttribute(): ?string
    {
        return $this->subscription_qris_image ? asset('storage/' . $this->subscription_qris_image) : null;
    }

    public function getHasMidtransServerKeyAttribute(): bool
    {
        return ! empty($this->midtrans_server_key);
    }

    public function getMaskedMidtransServerKeyAttribute(): ?string
    {
        if (empty($this->midtrans_server_key)) {
            return null;
        }

        $length = strlen($this->midtrans_server_key);
        if ($length <= 8) {
            return '••••••••';
        }

        return '••••••••' . substr($this->midtrans_server_key, -4);
    }

    public function getExpirationDateAttribute(): ?\Carbon\Carbon
    {
        return $this->subscription_status === 'trial' ? $this->trial_ends_at : $this->subscription_ends_at;
    }

    public function getExpirationDateFormattedAttribute(): ?string
    {
        $exp = $this->expiration_date;
        return $exp ? $exp->format('d M Y') : null;
    }

    public function getDaysRemainingAttribute(): ?int
    {
        $expiration = $this->expiration_date;
        if (! $expiration) {
            return null;
        }

        $now = now();
        if ($now->greaterThan($expiration)) {
            return 0;
        }

        return (int) ceil($now->diffInSeconds($expiration, false) / 86400);
    }

    public function getIsExpiringSoonAttribute(): bool
    {
        if (! $this->isSubscriptionActive()) {
            return false;
        }

        $days = $this->days_remaining;
        return $days !== null && $days <= 3 && $days >= 0;
    }

    protected function casts(): array
    {
        return [
            'tax_percentage' => 'float',
            'midtrans_server_key' => 'encrypted',
            'midtrans_is_production' => 'boolean',
            'is_active' => 'boolean',
            'show_phone_on_receipt' => 'boolean',
            'trial_ends_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    public function currentPlan(): ?Plan
    {
        return $this->plan ?? Plan::where('slug', 'trial')->first();
    }

    public function currentPlanName(): string
    {
        return $this->currentPlan()?->name ?? 'Free Trial';
    }

    public function maxProducts(): int
    {
        return $this->currentPlan()?->max_products ?? 20;
    }

    public function canAddProduct(): bool
    {
        $max = $this->maxProducts();
        if ($max === -1) {
            return true;
        }

        return $this->products()->count() < $max;
    }

    public function maxStaff(): int
    {
        return $this->currentPlan()?->max_staff ?? 1;
    }

    public function canAddStaff(): bool
    {
        $max = $this->maxStaff();
        if ($max === -1) {
            return true;
        }

        return $this->users()->where('role', 'admin')->count() < $max;
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    public function maxOutlets(): int
    {
        return $this->currentPlan()?->max_outlets ?? 1;
    }

    public function canAddOutlet(): bool
    {
        return $this->outlets()->count() < $this->maxOutlets();
    }

    public function mainOutlet(): ?Outlet
    {
        return $this->outlets()->where('is_main', true)->first() ?? $this->outlets()->first();
    }

    public function getQuotaUsageAttribute(): array
    {
        $plan = $this->currentPlan();
        $productCount = $this->products()->count();
        $staffCount = $this->users()->where('role', 'admin')->count();
        $outletCount = $this->outlets()->count();
        $maxProd = $this->maxProducts();
        $maxStf = $this->maxStaff();
        $maxOutlets = $this->maxOutlets();

        return [
            'plan_name' => $plan?->name ?? 'Free Trial',
            'plan_slug' => $plan?->slug ?? 'trial',
            'products' => [
                'current' => $productCount,
                'max' => $maxProd,
                'is_unlimited' => $maxProd === -1,
                'is_full' => $maxProd !== -1 && $productCount >= $maxProd,
                'percentage' => $maxProd > 0 ? min(100, round(($productCount / $maxProd) * 100)) : 0,
            ],
            'staff' => [
                'current' => $staffCount,
                'max' => $maxStf,
                'is_unlimited' => $maxStf === -1,
                'is_full' => $maxStf !== -1 && $staffCount >= $maxStf,
                'percentage' => $maxStf > 0 ? min(100, round(($staffCount / $maxStf) * 100)) : 0,
            ],
            'outlets' => [
                'current' => $outletCount,
                'max' => $maxOutlets,
                'is_unlimited' => false,
                'is_full' => $outletCount >= $maxOutlets,
                'percentage' => $maxOutlets > 0 ? min(100, round(($outletCount / $maxOutlets) * 100)) : 0,
            ],
        ];
    }

    public function isSubscriptionActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->subscription_status === 'trial' && $this->trial_ends_at && $this->trial_ends_at->isFuture()) {
            return true;
        }

        if ($this->subscription_status === 'active' && $this->subscription_ends_at && $this->subscription_ends_at->isFuture()) {
            return true;
        }

        return false;
    }
}
