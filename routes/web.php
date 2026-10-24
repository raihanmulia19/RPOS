<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'plans' => \App\Models\Plan::where('is_active', true)->orderBy('price', 'asc')->get(),
        'supportPhone' => config('app.support_phone', env('SUPERADMIN_WHATSAPP', '6285121210403')),
    ]);
})->name('home');

Route::middleware(['auth', 'verified', 'role:owner', 'subscribed'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/export-pdf', [\App\Http\Controllers\DashboardController::class, 'exportPdf'])->name('dashboard.export-pdf');
    Route::get('/dashboard/export-excel', [\App\Http\Controllers\DashboardController::class, 'exportExcel'])->name('dashboard.export-excel');

    Route::resource('admins', \App\Http\Controllers\AdminController::class)->except(['create', 'edit', 'show']);

    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy');

    Route::post('/categories', [\App\Http\Controllers\ProductController::class, 'storeCategory'])->name('categories.store');
    Route::delete('/categories/{category}', [\App\Http\Controllers\ProductController::class, 'destroyCategory'])->name('categories.destroy');

    Route::resource('expenses', \App\Http\Controllers\ExpenseController::class)->only(['index', 'store', 'destroy']);

    Route::get('/store-settings', [\App\Http\Controllers\TenantSettingsController::class, 'edit'])->name('tenant.settings');
    Route::match(['post', 'patch'], '/store-settings', [\App\Http\Controllers\TenantSettingsController::class, 'update'])->name('tenant.settings.update');

    Route::get('/outlets', [\App\Http\Controllers\OutletController::class, 'index'])->name('outlets.index');
    Route::post('/outlets', [\App\Http\Controllers\OutletController::class, 'store'])->name('outlets.store');
    Route::put('/outlets/{outlet}', [\App\Http\Controllers\OutletController::class, 'update'])->name('outlets.update');
    Route::delete('/outlets/{outlet}', [\App\Http\Controllers\OutletController::class, 'destroy'])->name('outlets.destroy');
    Route::post('/outlets/{outlet}/set-main', [\App\Http\Controllers\OutletController::class, 'setMain'])->name('outlets.set-main');

    Route::get('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'index'])->name('stock-transfers.index');
    Route::post('/stock-transfers', [\App\Http\Controllers\StockTransferController::class, 'store'])->name('stock-transfers.store');
    Route::post('/stock-transfers/{stockTransfer}/complete', [\App\Http\Controllers\StockTransferController::class, 'complete'])->name('stock-transfers.complete');
    Route::post('/stock-transfers/{stockTransfer}/cancel', [\App\Http\Controllers\StockTransferController::class, 'cancel'])->name('stock-transfers.cancel');
});

Route::middleware(['auth', 'role:superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/monitoring', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'monitoring'])->name('monitoring');
    Route::post('/monitoring/prune-logs', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'pruneLogs'])->name('monitoring.prune-logs');
    Route::post('/monitoring/backup/create', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'createBackup'])->name('monitoring.backup.create');
    Route::get('/monitoring/backup/download/{filename}', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'downloadBackup'])->name('monitoring.backup.download');
    Route::post('/monitoring/backup/upload-drive/{filename}', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'uploadBackupToDrive'])->name('monitoring.backup.upload-drive');
    Route::delete('/monitoring/backup/{filename}', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'deleteBackup'])->name('monitoring.backup.delete');
    Route::post('/monitoring/backup/test-drive', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'testDriveConnection'])->name('monitoring.backup.test-drive');
    Route::post('/monitoring/backup/save-settings', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'saveDriveSettings'])->name('monitoring.backup.save-settings');
    Route::get('/monitoring/backup/connect-google', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'connectGoogleDrive'])->name('monitoring.backup.connect-google');
    Route::get('/tenants', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'tenants'])->name('tenants.index');
    Route::get('/billing', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'billing'])->name('billing.index');
    Route::post('/tenants/{tenant}/toggle-status', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'toggleStatus'])->name('tenants.toggle-status');
    Route::post('/tenants/{tenant}/extend-subscription', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'extendSubscription'])->name('tenants.extend');
    Route::post('/tenants/{tenant}/subscription-qris', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'updateSubscriptionQris'])->name('tenants.subscription-qris');
    Route::post('/plans/{plan}/qris', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'updatePlanQris'])->name('plans.qris');
    Route::post('/subscriptions/{subscription}/approve', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'approveSubscription'])->name('subscriptions.approve');
    Route::post('/subscriptions/{subscription}/reject', [\App\Http\Controllers\SuperAdmin\SuperAdminDashboardController::class, 'rejectSubscription'])->name('subscriptions.reject');
});

Route::middleware(['auth', 'role:admin,owner', 'subscribed'])->group(function () {
    Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])->name('pos.index');
    Route::post('/checkout', [\App\Http\Controllers\OrderController::class, 'store'])->middleware('throttle:60,1')->name('checkout');
    Route::post('/generate-qris', [\App\Http\Controllers\OrderController::class, 'generateQris'])->middleware('throttle:30,1')->name('generate-qris');
    Route::get('/orders/{order}/receipt', [\App\Http\Controllers\OrderController::class, 'receipt'])->name('orders.receipt');
    Route::get('/orders/{order}/receipt-data', [\App\Http\Controllers\OrderController::class, 'receiptData'])->name('orders.receipt-data');
});

Route::middleware('auth')->group(function () {
    Route::get('/subscription/plans', [\App\Http\Controllers\SubscriptionController::class, 'plans'])->name('subscription.plans');
    Route::post('/subscription/checkout', [\App\Http\Controllers\SubscriptionController::class, 'checkout'])->middleware('throttle:10,1')->name('subscription.checkout');
    Route::post('/subscription/{subscription}/proof', [\App\Http\Controllers\SubscriptionController::class, 'uploadProof'])->name('subscription.upload-proof');
    Route::get('/subscription/waiting-approval', [\App\Http\Controllers\SubscriptionController::class, 'waitingApproval'])->name('subscription.waiting-approval');
    Route::get('/subscription/expired', [\App\Http\Controllers\SubscriptionController::class, 'expired'])->name('subscription.expired');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (!file_exists($filePath) || is_dir($filePath)) {
        $filePath = public_path('storage/' . $path);
    }
    if (!file_exists($filePath) || is_dir($filePath)) {
        abort(404);
    }

    // Clean all active output buffers to prevent any corrupting whitespace/newlines
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    $mime = mime_content_type($filePath) ?: 'application/octet-stream';
    $filesize = filesize($filePath);

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . $filesize);
    header('Cache-Control: public, max-age=86400');
    header('Accept-Ranges: bytes');
    readfile($filePath);
    exit;
})->where('path', '.*')->name('storage.file');

require __DIR__.'/auth.php';
