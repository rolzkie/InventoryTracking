@extends('layouts.app')

@section('content')
<div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <form method="GET" action="/transfers" class="relative w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input value="{{ $search }}" name="search" placeholder="Search transfer ID or item..." class="h-9 w-full rounded-lg border border-border bg-input px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
        </form>
        <form method="GET" action="/transfers" class="flex items-center gap-2">
            <select name="status" class="h-9 rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none">
                <option value="all" {{ $status === 'all' ? 'selected' : '' }}>All Status</option>
                <option value="pending" {{ $status === 'pending' ? 'selected' : '' }}>Pending</option>
                <option value="in_transit" {{ $status === 'in_transit' ? 'selected' : '' }}>In Transit</option>
                <option value="completed" {{ $status === 'completed' ? 'selected' : '' }}>Completed</option>
                <option value="cancelled" {{ $status === 'cancelled' ? 'selected' : '' }}>Cancelled</option>
            </select>
            <button type="submit" class="px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Apply</button>
        </form>
        <div class="flex-1"></div>
        <a href="/transfers" class="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h10"/><path d="m14 3 4 4-4 4"/><path d="M17 17H7"/><path d="m10 21-4-4 4-4"/></svg>
            New Transfer
        </a>
    </div>

    <div class="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h3 class="text-sm font-semibold text-foreground">Available to transfer</h3>
                <p class="mt-0.5 text-xs text-muted-foreground">Current stock ready for a new transfer request.</p>
            </div>
            <span class="text-[11px] text-muted-foreground">{{ collect($inventory)->filter(fn ($item) => (int) ($item['quantity'] ?? 0) > 0)->count() }} items</span>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
            @php $availableInventory = collect($inventory)->filter(fn ($item) => (int) ($item['quantity'] ?? 0) > 0)->sortByDesc('quantity'); @endphp
            @forelse ($availableInventory as $item)
                @php
                    $warehouse = $item['warehouse'] ?? null;
                    $warehouseName = $item['warehouseName'] ?? $item['warehouseId'] ?? 'Unassigned';
                @endphp
                <div class="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <p class="text-xs font-medium text-foreground truncate">{{ $item['name'] }}</p>
                            <p class="mt-0.5 text-[11px] text-muted-foreground truncate" title="{{ $warehouse['location'] ?? '' }}">{{ $warehouseName }}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="text-xs font-semibold text-foreground" style="font-family: 'JetBrains Mono', monospace;">{{ $item['quantity'] }}</p>
                            <p class="text-[11px] text-muted-foreground">{{ $item['unit'] }}</p>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center justify-between gap-2">
                        <span class="rounded-full px-2 py-1 text-[11px] {{ $item['status'] === 'out_of_stock' ? 'bg-red-500/15 text-red-400' : ($item['status'] === 'low_stock' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400') }}">{{ ucfirst(str_replace('_', ' ', $item['status'] ?? 'in_stock')) }}</span>
                        <span class="text-[11px] text-muted-foreground">SKU {{ $item['sku'] }}</span>
                    </div>
                </div>
            @empty
                <div class="text-xs text-muted-foreground">No stock is currently available for transfer.</div>
            @endforelse
        </div>
    </div>

    <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-border bg-muted/50">
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Transfer ID</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Item</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">From</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">To</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Qty</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Initiator</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Date</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                        <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($transfers as $transfer)
                        @php
                            $statusTone = match($transfer['status']) {
                                'completed' => 'bg-emerald-500/15 text-emerald-400',
                                'in_transit' => 'bg-blue-500/15 text-blue-400',
                                'pending' => 'bg-amber-500/15 text-amber-400',
                                default => 'bg-red-500/15 text-red-400',
                            };
                        @endphp
                        <tr class="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td class="px-4 py-3">
                                <span class="text-xs font-medium text-primary" style="font-family: 'JetBrains Mono', monospace;">{{ $transfer['id'] }}</span>
                            </td>
                            <td class="px-4 py-3 text-xs text-foreground max-w-[140px] truncate">{{ $transfer['itemName'] }}</td>
                            <td class="px-4 py-3">
                                <div class="max-w-[160px]">
                                    <p class="text-xs text-muted-foreground truncate" style="font-family: 'JetBrains Mono', monospace;">{{ $transfer['sourceWarehouseName'] ?? $transfer['fromWarehouseId'] }}</p>
                                    @if (!empty($transfer['sourceLocation']))
                                        <p class="text-[11px] text-muted-foreground truncate">{{ $transfer['sourceLocation'] }}</p>
                                    @endif
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="max-w-[160px]">
                                    <p class="text-xs text-muted-foreground truncate" style="font-family: 'JetBrains Mono', monospace;">{{ $transfer['destinationWarehouseName'] ?? $transfer['toWarehouseId'] }}</p>
                                    @if (!empty($transfer['destinationLocation']))
                                        <p class="text-[11px] text-muted-foreground truncate">{{ $transfer['destinationLocation'] }}</p>
                                    @endif
                                </div>
                            </td>
                            <td class="px-4 py-3 text-xs font-semibold text-foreground" style="font-family: 'JetBrains Mono', monospace;">×{{ $transfer['quantity'] }}</td>
                            <td class="px-4 py-3 text-xs text-muted-foreground">{{ $transfer['initiator'] }}</td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" style="font-family: 'JetBrains Mono', monospace;">{{ $transfer['date'] }}</td>
                            <td class="px-4 py-3">
                                <span class="rounded-full px-2 py-1 text-[11px] {{ $statusTone }}">{{ ucfirst(str_replace('_', ' ', $transfer['status'])) }}</span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-0.5">
                                    @if ($transfer['status'] === 'pending')
                                        <button class="px-2 py-1 text-xs rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">Ship</button>
                                        <button class="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Cancel</button>
                                    @elseif ($transfer['status'] === 'in_transit')
                                        <button class="px-2 py-1 text-xs rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">Complete</button>
                                        <button class="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Cancel</button>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" class="px-4 py-8 text-center text-xs text-muted-foreground">No transfers found</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
