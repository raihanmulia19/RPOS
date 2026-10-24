<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use BelongsToTenant;

    protected $guarded = ['id'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function outletStocks()
    {
        return $this->hasMany(OutletStock::class);
    }

    public function stockForOutlet(?int $outletId): int
    {
        if (!$outletId) {
            return (int)($this->stock_quantity ?? 0);
        }

        $outletStock = $this->outletStocks()->where('outlet_id', $outletId)->first();
        return $outletStock ? (int)$outletStock->stock_quantity : 0;
    }
}
