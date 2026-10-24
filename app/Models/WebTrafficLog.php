<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Builder;

class WebTrafficLog extends Model
{
    use HasFactory, Prunable;

    /**
     * Tentukan kueri data log yang dapat dibersihkan otomatis (lebih lama dari 14 hari).
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(14));
    }

    public $timestamps = false;

    protected $fillable = [
        'ip_address',
        'method',
        'path',
        'full_url',
        'user_id',
        'tenant_id',
        'device_type',
        'user_agent',
        'status_code',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'status_code' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
