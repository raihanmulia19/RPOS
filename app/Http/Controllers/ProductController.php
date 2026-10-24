<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with('category')->latest()->get();
        $categories = Category::latest()->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('tenant_id', $tenantId),
            ],
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_stock_tracked' => 'boolean',
            'stock_quantity' => 'required_if:is_stock_tracked,true|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $tenant = $request->user()->tenant;
        if ($tenant && ! $tenant->canAddProduct()) {
            $max = $tenant->maxProducts();
            return back()->withErrors([
                'name' => "Batas kuota produk untuk paket {$tenant->currentPlanName()} telah tercapai ({$tenant->products()->count()}/{$max}). Silakan upgrade paket langganan Anda.",
            ]);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        Product::create([
            'tenant_id' => $tenantId,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'price' => $request->price,
            'cost_price' => $request->cost_price ?? 0,
            'is_stock_tracked' => $request->boolean('is_stock_tracked'),
            'stock_quantity' => $request->stock_quantity ?? 0,
            'is_active' => $request->boolean('is_active', true),
            'image' => $imagePath,
        ]);

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function update(Request $request, Product $product)
    {
        $tenantId = $request->user()->tenant_id;
        if ($product->tenant_id !== $tenantId) {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('tenant_id', $tenantId),
            ],
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_stock_tracked' => 'boolean',
            'stock_quantity' => 'required_if:is_stock_tracked,true|numeric|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = [
            'category_id' => $request->category_id,
            'name' => $request->name,
            'price' => $request->price,
            'cost_price' => $request->cost_price ?? 0,
            'is_stock_tracked' => $request->boolean('is_stock_tracked'),
            'stock_quantity' => $request->stock_quantity ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Request $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Aksi tidak diizinkan.');
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        $product->delete();
        return back()->with('success', 'Produk berhasil dihapus.');
    }

    public function storeCategory(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
        ]);

        Category::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
        ]);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }
    
    public function destroyCategory(Request $request, Category $category)
    {
        if ($category->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}
