<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin Platform
        User::firstOrCreate(
            ['email' => 'superadmin@posapp.com'],
            [
                'tenant_id' => null,
                'name' => 'Platform Super Admin',
                'password' => Hash::make('Super@dmin21'),
                'role' => 'superadmin',
            ]
        );

        // Default Tenant
        $tenant = Tenant::create([
            'name' => 'Kopi Karsa',
            'slug' => 'kopi-karsa',
            'phone' => '0812-3456-7890',
            'address' => 'Jl. Mawar No. 123, Jakarta',
            'tax_percentage' => 11.00,
            'is_active' => true,
            'subscription_status' => 'active',
            'subscription_ends_at' => now()->addYear(),
        ]);

        // Admin user (Kasir)
        User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Dimas Prayoga (Admin)',
            'email' => 'dimas.barista@kopikarsa.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Owner user
        User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Rian Hermawan (Owner)',
            'email' => 'rian.supervisor@kopikarsa.com',
            'password' => Hash::make('password'),
            'role' => 'owner',
        ]);

        // Categories
        $coffee = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Coffee',
        ]);
        $nonCoffee = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Non-Coffee',
        ]);
        $snack = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Snacks',
        ]);

        // Products
        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $coffee->id,
            'name' => 'Kopi Susu Gula Aren',
            'price' => 25000,
            'cost_price' => 12000,
            'is_stock_tracked' => false,
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $coffee->id,
            'name' => 'Americano (Hot/Ice)',
            'price' => 20000,
            'cost_price' => 8000,
            'is_stock_tracked' => false,
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $coffee->id,
            'name' => 'Caramel Macchiato',
            'price' => 32000,
            'cost_price' => 15000,
            'is_stock_tracked' => false,
        ]);

        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $nonCoffee->id,
            'name' => 'Matcha Latte',
            'price' => 28000,
            'cost_price' => 14000,
            'is_stock_tracked' => false,
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $nonCoffee->id,
            'name' => 'Lychee Tea',
            'price' => 22000,
            'cost_price' => 9000,
            'is_stock_tracked' => false,
        ]);

        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $snack->id,
            'name' => 'Croissant Butter',
            'price' => 18000,
            'cost_price' => 9000,
            'is_stock_tracked' => true,
            'stock_quantity' => 20,
        ]);
        Product::create([
            'tenant_id' => $tenant->id,
            'category_id' => $snack->id,
            'name' => 'Fries Platter',
            'price' => 25000,
            'cost_price' => 11000,
            'is_stock_tracked' => false,
        ]);
    }
}
