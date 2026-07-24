@extends('layouts.app')

@section('content')
<div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-muted-foreground">{{ count($warehouses) }} warehouses registered</p>
        <div class="flex items-center gap-2">
            <form method="GET" action="/warehouses" class="relative text-xs text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input value="{{ $search }}" name="search" placeholder="Search warehouses" class="pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs" />
            </form>
            <a href="/warehouses" class="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Add Warehouse
            </a>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        @foreach ($warehouses as $warehouse)
            @php
                $capacity = (int) ($warehouse['capacity'] ?? 0);
                $used = (int) ($warehouse['used'] ?? 0);
                $pct = $capacity > 0 ? (int) round(($used / $capacity) * 100) : 0;
                $status = $warehouse['status'] ?? 'active';
                $statusTone = $pct >= 90 ? 'bg-red-500' : ($pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500');
                $assigned = collect($inventory)->where('warehouseId', $warehouse['id']);
            @endphp
            <div class="bg-card border border-border rounded-lg p-5 hover:border-white/10 transition-colors">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs text-primary font-medium" style="font-family: 'JetBrains Mono', monospace;">{{ $warehouse['id'] }}</span>
                            <span class="rounded-full px-2 py-1 text-[11px] {{ $status === 'near_full' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400' }}">{{ ucfirst(str_replace('_', ' ', $status)) }}</span>
                        </div>
                        <h3 class="text-sm font-semibold text-foreground">{{ $warehouse['name'] }}</h3>
                        <p class="text-xs text-muted-foreground mt-0.5">{{ $warehouse['location'] }}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                    </div>
                </div>

                <div class="mb-3">
                    <div class="flex justify-between text-xs mb-1.5">
                        <span class="text-muted-foreground">Capacity used</span>
                        <span class="font-medium {{ $pct >= 90 ? 'text-red-400' : ($pct >= 70 ? 'text-amber-400' : 'text-emerald-400') }}" style="font-family: 'JetBrains Mono', monospace;">{{ $pct }}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div class="h-full rounded-full {{ $statusTone }}" style="width: {{ $pct }}%"></div>
                    </div>
                    <div class="flex justify-between text-xs mt-1 text-muted-foreground" style="font-family: 'JetBrains Mono', monospace;">
                        <span>{{ number_format($used) }} used</span>
                        <span>{{ number_format($capacity) }} total</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div>
                        <p class="text-xs text-muted-foreground">Manager</p>
                        <p class="text-xs font-medium text-foreground mt-0.5">{{ $warehouse['manager'] }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-muted-foreground">Status</p>
                        <p class="text-xs font-medium text-foreground mt-0.5 capitalize">{{ str_replace('_', ' ', $status) }}</p>
                    </div>
                </div>

                <div class="mt-4 border-t border-border pt-3">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-xs font-medium text-foreground">Assigned items</p>
                        <p class="text-[11px] text-muted-foreground">{{ $assigned->count() }} items</p>
                    </div>
                    <div class="space-y-2">
                        @forelse ($assigned as $item)
                            <div class="rounded-md border border-border bg-background/70 px-2.5 py-2 text-[11px] text-muted-foreground">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="font-medium text-foreground">{{ $item['name'] }}</span>
                                    <span class="text-[10px] uppercase tracking-wide">Qty {{ $item['quantity'] }}</span>
                                </div>
                                <div class="mt-1 flex flex-wrap gap-2">
                                    <span>SKU {{ $item['sku'] }}</span>
                                    <span>Zone {{ $item['zone'] ?? '—' }}</span>
                                    <span>Rack {{ $item['rack'] ?? '—' }}</span>
                                    <span>Shelf {{ $item['shelf'] ?? '—' }}</span>
                                </div>
                            </div>
                        @empty
                            <p class="text-[11px] text-muted-foreground">No assigned items yet.</p>
                        @endforelse
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</div>
@endsection
