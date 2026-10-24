<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $startOfMonth = Carbon::parse($month)->startOfMonth();
        $endOfMonth = Carbon::parse($month)->endOfMonth();

        $expenses = Expense::whereBetween('expense_date', [$startOfMonth, $endOfMonth])
            ->latest('expense_date')
            ->latest('id')
            ->get();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'currentMonth' => $month,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_date' => 'required|date',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
        ]);

        Expense::create([
            'tenant_id' => $request->user()->tenant_id,
            'expense_date' => $validated['expense_date'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Pengeluaran berhasil dicatat.');
    }

    public function destroy(Request $request, Expense $expense)
    {
        if ($expense->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $expense->delete();
        return back()->with('success', 'Catatan pengeluaran berhasil dihapus.');
    }
}
