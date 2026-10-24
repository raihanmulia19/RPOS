<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    /**
     * Boot the trait to attach scope and creating observer.
     */
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (Auth::check()) {
                $user = Auth::user();
                // Superadmin can assign any tenant if explicitly provided
                if ($user->role === 'superadmin' && !empty($model->tenant_id)) {
                    return;
                }
                if ($user->tenant_id) {
                    $model->tenant_id = $user->tenant_id;
                }
            }
        });
    }

    /**
     * Relationship to the Tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
