@extends('layouts.app')

@section('content')
<div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <form method="GET" action="/inventory" class="w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
            <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input value="{{ $search }}" name="search" placeholder="Search name, SKU, or category..." class="h-9 w-full rounded-lg border border-border bg-input px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
            </div>
        </form>

        <div class="flex flex-wrap items-center gap-2">
            <form method="GET" action="/inventory" class="flex flex-wrap items-center gap-2">
                <select name="status" class="h-9 rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none">
                    <option value="all" {{ $status === 'all' ? 'selected' : '' }}>All Status</option>
                    <option value="unassigned" {{ $status === 'unassigned' ? 'selected' : '' }}>Unassigned</option>
                    <option value="in_stock" {{ $status === 'in_stock' ? 'selected' : '' }}>In Stock</option>
                    <option value="low_stock" {{ $status === 'low_stock' ? 'selected' : '' }}>Low Stock</option>
                    <option value="out_of_stock" {{ $status === 'out_of_stock' ? 'selected' : '' }}>Out of Stock</option>
                </select>
                <select name="category" class="h-9 rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none">
                    <option value="all" {{ $category === 'all' ? 'selected' : '' }}>All Categories</option>
                    @foreach ($categories as $categoryName)
                        <option value="{{ $categoryName }}" {{ $category === $categoryName ? 'selected' : '' }}>{{ $categoryName }}</option>
                    @endforeach
                </select>
                <button type="submit" class="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Apply</button>
            </form>
        </div>

        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
            <a href="/inventory" class="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3.16-6.78"/><path d="M21 3v6h-6"/></svg>
            </a>
            <a href="/inventory" class="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Add Item
            </a>
        </div>
    </div>

    <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-border bg-muted/50">
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Item / SKU</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Category</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Warehouse</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Qty on Hand</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Reorder Pt.</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Expiry</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Unit Cost</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Total Value</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($items as $item)
                        @php
                            $warehouse = $item['warehouse'] ?? null;
                            $warehouseName = $item['warehouseName'] ?? 'Unassigned';
                            $location = $warehouse['location'] ?? '';
                            $quantity = (int) ($item['quantity'] ?? 0);
                            $unitPrice = (float) ($item['unitPrice'] ?? 0);
                            $value = $quantity * $unitPrice;
                            $statusClass = match($item['status'] ?? 'in_stock') {
                                'out_of_stock' => 'bg-red-500/15 text-red-400',
                                'low_stock' => 'bg-amber-500/15 text-amber-400',
                                'unassigned' => 'bg-slate-500/15 text-slate-400',
                                default => 'bg-emerald-500/15 text-emerald-400',
                            };
                        @endphp
                        <tr class="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td class="px-4 py-3">
                                <p class="text-xs font-medium text-foreground">{{ $item['name'] }}</p>
                                <p class="text-xs text-muted-foreground mt-0.5" style="font-family: 'JetBrains Mono', monospace;">{{ $item['sku'] }}</p>
                            </td>
                            <td class="px-4 py-3 text-xs text-muted-foreground">{{ $item['category'] }}</td>
                            <td class="px-4 py-3">
                                <div class="max-w-[180px]">
                                    <p class="text-xs font-medium text-foreground truncate">{{ $warehouseName }}</p>
                                    @if ($location !== '')
                                        <p class="text-[11px] text-muted-foreground truncate">{{ $location }}</p>
                                    @endif
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <span class="text-xs font-semibold {{ $quantity === 0 ? 'text-red-400' : ($quantity < ($item['reorderPoint'] ?? 0) ? 'text-amber-400' : 'text-foreground') }}" style="font-family: 'JetBrains Mono', monospace;">{{ number_format($quantity) }}</span>
                                <span class="text-xs text-muted-foreground ml-1">{{ $item['unit'] }}</span>
                            </td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" style="font-family: 'JetBrains Mono', monospace;">{{ $item['reorderPoint'] ?? 0 }}</td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" style="font-family: 'JetBrains Mono', monospace;">{{ $item['expiryDate'] ? \Carbon\Carbon::parse($item['expiryDate'])->format('M d, Y') : '—' }}</td>
                            <td class="px-4 py-3 text-xs text-foreground" style="font-family: 'JetBrains Mono', monospace;">${{ number_format($unitPrice, 2) }}</td>
                            <td class="px-4 py-3 text-xs text-foreground" style="font-family: 'JetBrains Mono', monospace;">${{ number_format($value, 2) }}</td>
                            <td class="px-4 py-3">
                                <span class="rounded-full px-2 py-1 text-[11px] {{ $statusClass }}">{{ str_replace('_', ' ', ucfirst($item['status'] ?? 'in_stock')) }}</span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-0.5">
                                    <button class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="View">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </button>
                                    <button class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                    </button>
                                    <button class="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" class="px-4 py-8 text-center text-xs text-muted-foreground">No items match your filters</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between">
            <p class="text-xs text-muted-foreground">{{ count($items) }} items • Total value: <span class="text-foreground font-medium" style="font-family: 'JetBrains Mono', monospace;">${{ number_format($totalValue, 2) }}</span></p>
        </div>
    </div>
</div>
@endsection
