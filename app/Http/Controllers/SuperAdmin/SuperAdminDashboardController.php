<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Models\WebTrafficLog;
use App\Services\DatabaseBackupService;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class SuperAdminDashboardController extends Controller
{
    /**
     * Display the Super Admin executive revenue & platform overview dashboard.
     */
    /**
     * Display the Super Admin executive revenue & platform overview dashboard with Month/Year filtering.
     */
    public function index(Request $request): Response
    {
        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        $selectedYear = (int) $request->input('year', $currentYear);
        $selectedMonth = $request->input('month', (string) $currentMonth);

        // Available years for dropdown
        $availableYears = [$currentYear - 2, $currentYear - 1, $currentYear, $currentYear + 1];
        sort($availableYears);

        // Period-filtered revenue query
        $periodRevenueQuery = TenantSubscription::where('status', 'active')
            ->whereYear('verified_at', $selectedYear);
        if ($selectedMonth !== 'all' && is_numeric($selectedMonth)) {
            $periodRevenueQuery->whereMonth('verified_at', (int) $selectedMonth);
        }
        $periodSubscriptionRevenue = (float) $periodRevenueQuery->sum('amount');

        // Total all-time subscription revenue
        $totalSubscriptionRevenue = (float) TenantSubscription::where('status', 'active')->sum('amount');

        // Monthly current revenue (current real calendar month)
        $monthlySubscriptionRevenue = (float) TenantSubscription::where('status', 'active')
            ->whereYear('verified_at', $currentYear)
            ->whereMonth('verified_at', $currentMonth)
            ->sum('amount');

        // New tenants registered in selected period
        $periodTenantsCountQuery = Tenant::whereYear('created_at', $selectedYear);
        if ($selectedMonth !== 'all' && is_numeric($selectedMonth)) {
            $periodTenantsCountQuery->whereMonth('created_at', (int) $selectedMonth);
        }
        $periodNewTenantsCount = $periodTenantsCountQuery->count();

        // Subscriptions count in selected period
        $periodSubscriptionsCountQuery = TenantSubscription::whereYear('created_at', $selectedYear);
        if ($selectedMonth !== 'all' && is_numeric($selectedMonth)) {
            $periodSubscriptionsCountQuery->whereMonth('created_at', (int) $selectedMonth);
        }
        $periodSubscriptionsCount = $periodSubscriptionsCountQuery->count();

        $pendingSubscriptionsCount = TenantSubscription::where('status', 'pending')->count();

        $activePaidTenants = Tenant::where('is_active', true)
            ->where('subscription_status', 'active')
            ->count();

        $trialTenants = Tenant::where('is_active', true)
            ->where('subscription_status', 'trial')
            ->count();

        $suspendedTenants = Tenant::where('is_active', false)->count();

        $onlineThreshold = now()->subMinutes(15)->timestamp;
        $onlineTenantsCount = (int) DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->whereNotNull('users.tenant_id')
            ->where('sessions.last_activity', '>=', $onlineThreshold)
            ->distinct('users.tenant_id')
            ->count('users.tenant_id');

        $todayPageviews = WebTrafficLog::whereDate('created_at', today())->count();
        $todayUniqueVisitors = WebTrafficLog::whereDate('created_at', today())->distinct('ip_address')->count('ip_address');

        $stats = [
            'totalTenants' => Tenant::count(),
            'activeTenants' => Tenant::where('is_active', true)->count(),
            'activePaidTenants' => $activePaidTenants,
            'trialTenants' => $trialTenants,
            'suspendedTenants' => $suspendedTenants,
            'pendingOrders' => $pendingSubscriptionsCount,
            'totalSubscriptionRevenue' => $totalSubscriptionRevenue,
            'monthlySubscriptionRevenue' => $monthlySubscriptionRevenue,
            'periodSubscriptionRevenue' => $periodSubscriptionRevenue,
            'periodNewTenants' => $periodNewTenantsCount,
            'periodSubscriptionsCount' => $periodSubscriptionsCount,
            'onlineTenantsCount' => $onlineTenantsCount,
            'todayPageviews' => $todayPageviews,
            'todayUniqueVisitors' => $todayUniqueVisitors,
        ];

        // Plans with distribution count (only paid subscription plans, sorted ascending by price)
        $plans = Plan::where('slug', '!=', 'trial')
            ->where('price', '>', 0)
            ->orderBy('price', 'asc')
            ->withCount(['tenants' => function ($q) {
                $q->where('subscription_status', 'active');
            }])->get();

        // Registered tenants in selected period
        $tenantsPeriodQuery = Tenant::withCount(['products', 'orders'])
            ->with([
                'plan',
                'users' => fn ($q) => $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email')
            ])
            ->whereYear('created_at', $selectedYear);
        if ($selectedMonth !== 'all' && is_numeric($selectedMonth)) {
            $tenantsPeriodQuery->whereMonth('created_at', (int) $selectedMonth);
        }
        $recentTenants = $tenantsPeriodQuery->latest()->take(10)->get();

        // If no tenants in selected period, provide latest 5 as fallback
        if ($recentTenants->isEmpty()) {
            $recentTenants = Tenant::withCount(['products', 'orders'])
                ->with([
                    'plan',
                    'users' => fn ($q) => $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email')
                ])
                ->latest()
                ->take(5)
                ->get();
        }

        // Subscription payment activities in selected period
        $subscriptionsPeriodQuery = TenantSubscription::with(['tenant', 'plan', 'verifier'])
            ->whereYear('created_at', $selectedYear);
        if ($selectedMonth !== 'all' && is_numeric($selectedMonth)) {
            $subscriptionsPeriodQuery->whereMonth('created_at', (int) $selectedMonth);
        }
        $recentSubscriptions = $subscriptionsPeriodQuery->latest()->take(10)->get();

        // If no transactions in selected period, provide latest 6 as fallback
        if ($recentSubscriptions->isEmpty()) {
            $recentSubscriptions = TenantSubscription::with(['tenant', 'plan', 'verifier'])
                ->latest()
                ->take(6)
                ->get();
        }

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'plans' => $plans,
            'recentTenants' => $recentTenants,
            'recentSubscriptions' => $recentSubscriptions,
            'pendingCount' => $pendingSubscriptionsCount,
            'filters' => [
                'month' => (string) $selectedMonth,
                'year' => (int) $selectedYear,
            ],
            'availableYears' => $availableYears,
        ]);
    }

    /**
     * Display the dedicated Store Management page (tenants, QRIS khusus, quota, suspend/active).
     */
    public function tenants(): Response
    {
        $tenants = Tenant::withCount(['products', 'orders', 'users'])
            ->with([
                'plan',
                'users' => fn ($q) => $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email')
            ])
            ->latest()
            ->get();

        $plans = Plan::where('is_active', true)->get();

        $pendingSubscriptionsCount = TenantSubscription::where('status', 'pending')->count();

        $stats = [
            'totalTenants' => Tenant::count(),
            'activeTenants' => Tenant::where('is_active', true)->count(),
            'activePaidTenants' => Tenant::where('is_active', true)->where('subscription_status', 'active')->count(),
            'trialTenants' => Tenant::where('is_active', true)->where('subscription_status', 'trial')->count(),
            'rejectedTenants' => Tenant::where('subscription_status', 'rejected')->count(),
            'suspendedTenants' => Tenant::where('is_active', false)->count(),
        ];

        return Inertia::render('SuperAdmin/Tenants', [
            'tenants' => $tenants,
            'plans' => $plans,
            'stats' => $stats,
            'pendingCount' => $pendingSubscriptionsCount,
        ]);
    }

    /**
     * Display the dedicated Billing & Verification page (Queue, history, financial stats).
     */
    public function billing(): Response
    {
        $pendingSubscriptions = TenantSubscription::with([
            'tenant.users' => fn ($q) => $q->where('role', 'owner')->select('id', 'tenant_id', 'name', 'email'),
            'plan'
        ])
            ->where('status', 'pending')
            ->latest()
            ->get();

        $recentSubscriptions = TenantSubscription::with(['tenant', 'plan', 'verifier'])
            ->whereIn('status', ['active', 'rejected'])
            ->latest()
            ->take(30)
            ->get();

        $totalSubscriptionRevenue = (float) TenantSubscription::where('status', 'active')->sum('amount');
        $monthlySubscriptionRevenue = (float) TenantSubscription::where('status', 'active')
            ->whereYear('verified_at', now()->year)
            ->whereMonth('verified_at', now()->month)
            ->sum('amount');

        $stats = [
            'totalSubscriptionRevenue' => $totalSubscriptionRevenue,
            'monthlySubscriptionRevenue' => $monthlySubscriptionRevenue,
            'pendingCount' => $pendingSubscriptions->count(),
            'verifiedCount' => TenantSubscription::where('status', 'active')->count(),
            'rejectedCount' => TenantSubscription::where('status', 'rejected')->count(),
        ];

        $plans = Plan::orderBy('price', 'asc')->get();

        return Inertia::render('SuperAdmin/Billing', [
            'pendingSubscriptions' => $pendingSubscriptions,
            'recentSubscriptions' => $recentSubscriptions,
            'stats' => $stats,
            'pendingCount' => $pendingSubscriptions->count(),
            'plans' => $plans,
        ]);
    }

    /**
     * Upload or update the static QRIS barcode specifically for a Plan.
     */
    public function updatePlanQris(Request $request, Plan $plan)
    {
        $request->validate([
            'qris_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'remove_qris' => 'nullable|boolean',
        ]);

        if ($request->boolean('remove_qris')) {
            if ($plan->qris_image) {
                Storage::disk('public')->delete($plan->qris_image);
            }
            $plan->qris_image = null;
        } elseif ($request->hasFile('qris_image')) {
            if ($plan->qris_image) {
                Storage::disk('public')->delete($plan->qris_image);
            }
            $path = $request->file('qris_image')->store('plans_qris', 'public');
            $plan->qris_image = $path;
        }

        $plan->save();

        return back()->with('success', "Barcode QRIS Statis untuk paket {$plan->name} berhasil disimpan.");
    }

    /**
     * Upload or update the static QRIS barcode specifically for a tenant's subscription payment.
     */
    public function updateSubscriptionQris(Request $request, Tenant $tenant)
    {
        $request->validate([
            'subscription_qris_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'remove_qris' => 'nullable|boolean',
        ]);

        if ($request->boolean('remove_qris')) {
            if ($tenant->subscription_qris_image) {
                Storage::disk('public')->delete($tenant->subscription_qris_image);
            }
            $tenant->subscription_qris_image = null;
        } elseif ($request->hasFile('subscription_qris_image')) {
            if ($tenant->subscription_qris_image) {
                Storage::disk('public')->delete($tenant->subscription_qris_image);
            }
            $path = $request->file('subscription_qris_image')->store('subscription_qris', 'public');
            $tenant->subscription_qris_image = $path;
        }

        $tenant->save();

        return back()->with('success', "Barcode QRIS Langganan untuk toko {$tenant->name} berhasil diperbarui.");
    }

    /**
     * Approve and activate a pending tenant subscription.
     */
    public function approveSubscription(Request $request, TenantSubscription $subscription)
    {
        $tenant = $subscription->tenant;
        $plan = $subscription->plan;

        $baseDate = ($tenant->subscription_ends_at && $tenant->subscription_ends_at->isFuture())
            ? $tenant->subscription_ends_at
            : now();

        $endsAt = $baseDate->copy()->addDays($plan->duration_days);

        $subscription->update([
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => $endsAt,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        $tenant->update([
            'plan_id' => $plan->id,
            'subscription_status' => 'active',
            'is_active' => true,
            'subscription_ends_at' => $endsAt,
        ]);

        return back()->with('success', "Langganan paket {$plan->name} untuk toko {$tenant->name} berhasil diverifikasi & diaktifkan hingga " . $endsAt->format('d M Y') . "!");
    }

    /**
     * Reject a pending tenant subscription.
     */
    public function rejectSubscription(Request $request, TenantSubscription $subscription)
    {
        $notes = $request->input('notes') ?: 'Bukti transfer tidak valid atau dana belum masuk.';

        $subscription->update([
            'status' => 'rejected',
            'notes' => $notes,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        $tenant = $subscription->tenant;
        if ($tenant) {
            // Jika toko belum memiliki langganan aktif atau statusnya pending, ubah status langganan tenant menjadi 'rejected'
            if ($tenant->subscription_status === 'pending' || ! $tenant->isSubscriptionActive()) {
                $tenant->update([
                    'subscription_status' => 'rejected',
                ]);
            }
        }

        return back()->with('success', "Pengajuan langganan #{$subscription->payment_reference} berhasil ditolak.");
    }

    /**
     * Toggle active/suspend status of a tenant.
     */
    public function toggleStatus(Tenant $tenant)
    {
        $tenant->is_active = ! $tenant->is_active;
        $tenant->save();

        $statusText = $tenant->is_active ? 'diaktifkan' : 'ditangguhkan (suspend)';
        return back()->with('success', "Toko {$tenant->name} berhasil {$statusText}.");
    }

    /**
     * Extend subscription or trial period for a tenant.
     */
    public function extendSubscription(Request $request, Tenant $tenant)
    {
        $days = (int) $request->input('days', 30);
        $planId = $request->input('plan_id');
        
        $baseDate = ($tenant->subscription_ends_at && $tenant->subscription_ends_at->isFuture())
            ? $tenant->subscription_ends_at
            : now();

        $tenant->subscription_status = 'active';
        $tenant->is_active = true;
        if ($planId) {
            $tenant->plan_id = $planId;
        }
        $tenant->subscription_ends_at = $baseDate->copy()->addDays($days);
        $tenant->save();

        return back()->with('success', "Masa aktif {$tenant->name} berhasil diperpanjang {$days} hari (hingga " . $tenant->subscription_ends_at->format('d M Y') . ").");
    }

    /**
     * Display the real-time live monitoring dashboard (active stores & web traffic logs).
     */
    public function monitoring(Request $request): Response
    {
        $onlineThreshold = now()->subMinutes(15)->timestamp;

        // 1. Ambil session aktif 15 menit terakhir
        $activeSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', $onlineThreshold)
            ->orderByDesc('last_activity')
            ->get();

        $userIds = $activeSessions->pluck('user_id')->unique()->filter()->values();
        $usersMap = User::with(['tenant.plan'])->whereIn('id', $userIds)->get()->keyBy('id');

        $onlineUsers = [];
        $activeTenantsMap = [];

        foreach ($activeSessions as $session) {
            $user = $usersMap->get($session->user_id);
            if (! $user) continue;

            $lastActiveCarbon = Carbon::createFromTimestamp($session->last_activity);
            $secondsAgo = now()->timestamp - $session->last_activity;
            $isIdle = $secondsAgo > 300; // > 5 menit tanpa interaksi = idle

            $device = 'Desktop';
            if (preg_match('/(mobile|android|iphone)/i', (string) $session->user_agent)) {
                $device = 'Mobile';
            } elseif (preg_match('/(ipad|tablet)/i', (string) $session->user_agent)) {
                $device = 'Tablet';
            }

            $entry = [
                'session_id' => $session->id,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'user_role' => $user->role, // superadmin, owner, admin
                'tenant_id' => $user->tenant_id,
                'tenant_name' => $user->tenant?->name ?? ($user->role === 'superadmin' ? 'Platform Super Admin' : 'Tanpa Toko'),
                'tenant_slug' => $user->tenant?->slug,
                'tenant_logo' => $user->tenant?->logo ? asset('storage/' . $user->tenant->logo) : null,
                'plan_name' => $user->tenant?->plan?->name ?? ($user->role === 'superadmin' ? 'Root System' : 'Free Trial'),
                'ip_address' => $session->ip_address ?? '127.0.0.1',
                'device' => $device,
                'last_activity_time' => $lastActiveCarbon->format('H:i:s'),
                'last_activity_human' => $lastActiveCarbon->locale('id')->diffForHumans(),
                'status' => $isIdle ? 'idle' : 'active',
            ];

            $onlineUsers[] = $entry;

            if ($user->tenant_id) {
                if (!isset($activeTenantsMap[$user->tenant_id])) {
                    $activeTenantsMap[$user->tenant_id] = [
                        'tenant_id' => $user->tenant_id,
                        'name' => $user->tenant?->name ?? 'Toko',
                        'logo' => $user->tenant?->logo ? asset('storage/' . $user->tenant->logo) : null,
                        'plan_name' => $user->tenant?->plan?->name ?? 'Free Trial',
                        'is_active' => (bool) $user->tenant?->is_active,
                        'active_users' => [],
                        'latest_activity' => $lastActiveCarbon->locale('id')->diffForHumans(),
                    ];
                }
                $activeTenantsMap[$user->tenant_id]['active_users'][] = [
                    'name' => $user->name,
                    'role' => $user->role === 'owner' ? 'Owner' : 'Kasir',
                    'status' => $isIdle ? 'idle' : 'active',
                ];
            }
        }

        $onlineTenants = array_values($activeTenantsMap);
        $onlineTenantsCount = count($onlineTenants);
        $onlineUsersCount = count($onlineUsers);

        // Daily Active Tenants (DAU) - Toko yang buka shift/login atau ada order hari ini
        $todayStartTimestamp = now()->startOfDay()->timestamp;
        $todaySessionTenantIds = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->whereNotNull('users.tenant_id')
            ->where('sessions.last_activity', '>=', $todayStartTimestamp)
            ->pluck('users.tenant_id');

        $todayOrderTenantIds = DB::table('orders')
            ->whereDate('created_at', today())
            ->pluck('tenant_id');

        $dailyActiveTenantIds = $todaySessionTenantIds->merge($todayOrderTenantIds)->unique()->filter();
        $dailyActiveTenantsCount = $dailyActiveTenantIds->count();
        $totalTenantsCount = Tenant::count();

        // 2. Traffic Analytics
        $todayPageviews = WebTrafficLog::whereDate('created_at', today())->count();
        $todayUniqueVisitors = WebTrafficLog::whereDate('created_at', today())->distinct('ip_address')->count('ip_address');
        $yesterdayPageviews = WebTrafficLog::whereDate('created_at', today()->subDay())->count();
        $totalAllTimeHits = WebTrafficLog::count();

        // 7-Day Trend
        $trafficTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $label = now()->subDays($i)->locale('id')->isoFormat('D MMM');
            $hits = WebTrafficLog::whereDate('created_at', $date)->count();
            $uniques = WebTrafficLog::whereDate('created_at', $date)->distinct('ip_address')->count('ip_address');
            $trafficTrend[] = [
                'date' => $date,
                'label' => $label,
                'hits' => $hits,
                'uniques' => $uniques,
            ];
        }

        // Top 8 Pages
        $topPages = WebTrafficLog::where('created_at', '>=', now()->subDays(7))
            ->select('path', DB::raw('count(*) as count'), DB::raw('count(distinct ip_address) as unique_ips'))
            ->groupBy('path')
            ->orderByDesc('count')
            ->take(8)
            ->get();

        // Device breakdown (Desktop vs Mobile vs Tablet vs Bot)
        $deviceStats = WebTrafficLog::where('created_at', '>=', now()->subDays(7))
            ->select('device_type', DB::raw('count(*) as count'))
            ->groupBy('device_type')
            ->pluck('count', 'device_type')
            ->toArray();

        // Recent 60 Logs
        $recentLogs = WebTrafficLog::with(['user:id,name,role', 'tenant:id,name'])
            ->latest('id')
            ->take(60)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'ip_address' => $log->ip_address,
                    'method' => $log->method,
                    'path' => $log->path,
                    'status_code' => $log->status_code,
                    'device_type' => $log->device_type,
                    'user_name' => $log->user?->name,
                    'user_role' => $log->user?->role,
                    'tenant_name' => $log->tenant?->name,
                    'time' => $log->created_at->format('H:i:s'),
                    'time_ago' => $log->created_at->locale('id')->diffForHumans(),
                ];
            });

        $pendingSubscriptionsCount = TenantSubscription::where('status', 'pending')->count();

        $backupService = app(DatabaseBackupService::class);
        $driveService = app(GoogleDriveService::class);
        $backups = $backupService->listBackups();
        $driveConfig = $driveService->getConfigSummary();

        return Inertia::render('SuperAdmin/Monitoring', [
            'metrics' => [
                'onlineTenantsCount' => $onlineTenantsCount,
                'onlineUsersCount' => $onlineUsersCount,
                'dailyActiveTenantsCount' => $dailyActiveTenantsCount,
                'totalTenantsCount' => $totalTenantsCount,
                'todayPageviews' => $todayPageviews,
                'todayUniqueVisitors' => $todayUniqueVisitors,
                'yesterdayPageviews' => $yesterdayPageviews,
                'totalAllTimeHits' => $totalAllTimeHits,
            ],
            'onlineTenants' => $onlineTenants,
            'onlineUsers' => $onlineUsers,
            'trafficTrend' => $trafficTrend,
            'topPages' => $topPages,
            'deviceStats' => $deviceStats,
            'recentLogs' => $recentLogs,
            'pendingCount' => $pendingSubscriptionsCount,
            'backups' => $backups,
            'driveConfig' => $driveConfig,
        ]);
    }

    /**
     * Bersihkan log kunjungan web lama (Database Pruning manual dari Super Admin).
     */
    public function pruneLogs(Request $request)
    {
        $days = (int) $request->input('days', 14);
        $days = max(1, $days);
        $threshold = now()->subDays($days);

        $count = WebTrafficLog::where('created_at', '<=', $threshold)->delete();

        return back()->with('success', "Pembersihan log berhasil: {$count} data log yang lebih lama dari {$days} hari telah dihapus dari database.");
    }

    /**
     * Buat backup database manual sekarang.
     */
    public function createBackup(Request $request, DatabaseBackupService $backupService)
    {
        try {
            $uploadToDrive = (bool) $request->input('upload_drive', false);
            $item = $backupService->createBackup($uploadToDrive);

            $msg = "Backup database berhasil dibuat: {$item['filename']} ({$item['size_formatted']}).";
            if ($uploadToDrive) {
                if ($item['drive_status'] === 'uploaded') {
                    $msg .= " Dan otomatis berhasil diunggah ke Google Drive!";
                } else {
                    $msg .= " Namun gagal upload ke Drive: " . ($item['drive_error'] ?? 'Periksa pengaturan Service Account.');
                }
            }

            return back()->with('success', $msg);
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal membuat backup database: ' . $e->getMessage());
        }
    }

    /**
     * Unduh langsung file backup database ke browser.
     */
    public function downloadBackup(string $filename, DatabaseBackupService $backupService)
    {
        $path = $backupService->getBackupFullPath($filename);
        if (!$path || !file_exists($path)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * Unggah file backup lokal yang dipilih ke Google Drive.
     */
    public function uploadBackupToDrive(string $filename, DatabaseBackupService $backupService)
    {
        try {
            $backupService->uploadBackupToDrive($filename);
            return back()->with('success', "File backup {$filename} berhasil diunggah ke Google Drive!");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal mengunggah ke Google Drive: " . $e->getMessage());
        }
    }

    /**
     * Hapus file backup lokal.
     */
    public function deleteBackup(string $filename, DatabaseBackupService $backupService)
    {
        if ($backupService->deleteBackup($filename)) {
            return back()->with('success', "File backup {$filename} berhasil dihapus.");
        }
        return back()->with('error', "File backup {$filename} tidak ditemukan.");
    }

    /**
     * Uji koneksi Google Drive Service Account & verifikasi akses folder.
     */
    public function testDriveConnection(GoogleDriveService $driveService)
    {
        $res = $driveService->testConnection();
        if ($res['success']) {
            return back()->with('success', $res['message']);
        }
        return back()->with('error', $res['message']);
    }

    /**
     * Simpan pengaturan Google Drive (Folder ID dan/atau file kredensial JSON).
     */
    public function saveDriveSettings(Request $request, GoogleDriveService $driveService)
    {
        try {
            $folderId = $request->input('folder_id');

            if ($request->hasFile('service_account_file')) {
                $fileContent = file_get_contents($request->file('service_account_file')->getRealPath());
                $driveService->saveCredentialsFile($fileContent, $folderId);
            } elseif ($request->filled('service_account_json')) {
                $driveService->saveCredentialsFile($request->input('service_account_json'), $folderId);
            } elseif ($folderId) {
                $driveService->setFolderId($folderId);
            }

            return back()->with('success', 'Pengaturan Google Drive berhasil disimpan. Silakan klik tombol "Uji Koneksi" untuk memverifikasi.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal menyimpan pengaturan Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * Hubungkan Google Drive via 1-Klik OAuth 2.0 (Akun Google Pribadi dengan kuota 15GB).
     */
    public function connectGoogleDrive(Request $request)
    {
        $request->session()->put('google_drive_connect', true);
        
        $host = $request->getSchemeAndHttpHost();
        $redirectUrl = $host . '/auth/google/callback';

        return \Laravel\Socialite\Facades\Socialite::driver('google')
            ->redirectUrl($redirectUrl)
            ->scopes([
                'openid',
                'profile',
                'email',
                'https://www.googleapis.com/auth/drive.file',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent select_account',
            ])
            ->redirect();
    }
}
