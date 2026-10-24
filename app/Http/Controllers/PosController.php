<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::all();
        $products = Product::where('is_active', true)->with('category')->get();
        $tenant = $request->user()->tenant;
        $user = $request->user();
        $currentOutlet = $user->outlet ?? $tenant?->mainOutlet();

        return Inertia::render('POS/Index', [
            'categories' => $categories,
            'products' => $products,
            'tenant' => $tenant,
            'currentOutlet' => $currentOutlet,
        ]);
    }
}
