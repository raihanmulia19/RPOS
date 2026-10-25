<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $appends = ['qris_image_url'];

    public function getQrisImageUrlAttribute(): ?string
    {
        if (!$this->qris_image) {
            return null;
        }

        $timestamp = $this->updated_at ? $this->updated_at->timestamp : time();
        return asset('storage/' . $this->qris_image) . '?v=' . $timestamp;
    }

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'duration_days' => 'integer',
            'max_products' => 'integer',
            'max_staff' => 'integer',
            'max_outlets' => 'integer',
            'features' => 'array',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function maxOutlets(): int
    {
        if ($this->slug !== 'enterprise') {
            return 0;
        }
        return $this->max_outlets ?? 5;
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    public function isUnlimitedProducts(): bool
    {
        return $this->max_products === -1;
    }

    public function isUnlimitedStaff(): bool
    {
        return $this->max_staff === -1;
    }
}
