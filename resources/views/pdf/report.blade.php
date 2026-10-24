@php
    $planSlug = $tenant->plan?->slug ?? 'trial';
    $isPro = in_array($planSlug, ['pro', 'enterprise']);
@endphp

@if($isPro)
    @include('pdf.report_pro')
@else
    @include('pdf.report_starter')
@endif
