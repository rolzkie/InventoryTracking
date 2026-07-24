@extends('layouts.app')

@section('content')
<div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <x-dashboard-stat-card label="Total SKUs" :value="$stats['totalSkus']" sub="Active items" color="bg-blue-500/15 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"/><path d="M5 7v10"/><path d="M19 7v10"/><path d="M8 17h8"/></svg>
        </x-dashboard-stat-card>

        <x-dashboard-stat-card label="Warehouses" :value="$stats['warehouseCount']" sub="All operational" color="bg-purple-500/15 text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"/><path d="M6 7v10"/><path d="M18 7v10"/><path d="M9 17h6"/></svg>
        </x-dashboard-stat-card>

        <x-dashboard-stat-card label="Stock Alerts" :value="$stats['lowStock'] + $stats['outOfStock']" sub="{{ $stats['outOfStock'] }} out • {{ $stats['lowStock'] }} low" color="bg-amber-500/15 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
        </x-dashboard-stat-card>

        <x-dashboard-stat-card label="Unassigned Items" :value="$stats['unassigned']" sub="Needs warehouse" color="bg-slate-500/15 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/><path d="M12 4v16"/></svg>
        </x-dashboard-stat-card>

        <x-dashboard-stat-card label="Total Value" :value="'$' . number_format($stats['totalValue'] / 1000, 0) . 'k'" sub="Inventory value" color="bg-emerald-500/15 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17 9 11l4 4 7-7"/><path d="M14 8h7v7"/></svg>
        </x-dashboard-stat-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 rounded-lg border border-border bg-card p-5">
            <div class="flex items-center justify-between mb-5">
                <div>
                    <h3 class="text-sm font-semibold text-foreground">Stock Movement</h3>
                    <p class="text-xs text-muted-foreground mt-0.5">Inbound vs outbound — last 7 months</p>
                </div>
                <div class="flex items-center gap-3 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span>Inbound</span>
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Outbound</span>
                </div>
            </div>
            <div class="h-[210px] rounded bg-white/5"></div>
        </div>

        <div class="rounded-lg border border-border bg-card p-5">
            <h3 class="text-sm font-semibold text-foreground mb-1">By Category</h3>
            <p class="text-xs text-muted-foreground mb-3">Distribution</p>
            <div class="h-[150px] rounded bg-white/5"></div>
        </div>
    </div>

    @if ($stats['alerts'])
        <div class="rounded-lg border border-border bg-card p-5">
            <div class="flex items-center justify-between mb-4 gap-2">
                <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
                    Stock Alerts
                </h3>
                <a href="/inventory" class="text-xs text-primary hover:underline">View all →</a>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-2">
                @foreach ($stats['alerts'] as $alert)
                    <div class="flex items-center justify-between p-3 rounded-lg border {{ $alert['alertType'] === 'out_of_stock' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5' }}">
                        <div>
                            <p class="text-xs font-medium text-foreground">{{ $alert['name'] }}</p>
                            <p class="text-xs text-muted-foreground mt-0.5">{{ $alert['sku'] }} • {{ $alert['warehouseName'] }}</p>
                        </div>
                        <span class="rounded-full px-2 py-1 text-[11px] {{ $alert['alertType'] === 'out_of_stock' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400' }}">{{ $alert['alertType'] === 'out_of_stock' ? 'Out of stock' : 'Low stock' }}</span>
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>
@endsection
