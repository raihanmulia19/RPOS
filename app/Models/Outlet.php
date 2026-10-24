<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outlet extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_main' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(OutletStock::class);
    }

    public function sentTransfers(): HasMany
    {
        return $this->hasMany(StockTransfer::class, 'source_outlet_id');
    }

    public function receivedTransfers(): HasMany
    {
        return $this->hasMany(StockTransfer::class, 'destination_outlet_id');
    }
}
