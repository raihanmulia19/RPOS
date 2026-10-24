<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $tenant = $request->user()->tenant;
        $admins = User::with('outlet')
            ->where('role', 'admin')
            ->where('tenant_id', $request->user()->tenant_id)
            ->latest()
            ->get();

        $outlets = $tenant ? $tenant->outlets()->get() : collect();

        return Inertia::render('Admins/Index', [
            'admins' => $admins,
            'outlets' => $outlets,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->tenant;
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
            'outlet_id' => 'nullable|exists:outlets,id',
        ]);

        if ($tenant && ! $tenant->canAddStaff()) {
            $max = $tenant->maxStaff();
            return back()->withErrors([
                'email' => "Batas kuota akun kasir untuk paket {$tenant->currentPlanName()} telah tercapai ({$tenant->users()->where('role', 'admin')->count()}/{$max}). Silakan upgrade paket langganan Anda.",
            ]);
        }

        User::create([
            'tenant_id' => $request->user()->tenant_id,
            'outlet_id' => $request->outlet_id ?? $tenant?->mainOutlet()?->id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
        ]);

        return back()->with('success', 'Akun kasir berhasil dibuat.');
    }

    public function update(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id || $user->role !== 'admin') {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|lowercase|email|max:255|unique:'.User::class.',email,'.$user->id,
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->name;
        }
        if ($request->has('email')) {
            $data['email'] = $request->email;
        }
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', "Akun kasir \"{$user->name}\" berhasil diperbarui.");
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id || $user->role !== 'admin') {
            return back()->withErrors(['error' => 'Tidak dapat menghapus akun ini.']);
        }

        $user->delete();
        return back()->with('success', 'Akun kasir berhasil dihapus.');
    }
}
