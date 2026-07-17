@extends('layouts.app')

@section('content')
<div x-data="transactionsPage()" x-init="init()" class="flex flex-col gap-4">

    {{-- Toasts (reusable) --}}
    <x-alpine-toast />

    {{-- Filters + Create button --}}
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div class="relative w-full sm:flex-1 sm:min-w-[12rem] sm:max-w-xs">
            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" x-model="search" placeholder="Search transactions..." class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 pl-9" />
        </div>

        <select x-model="filterType" class="w-full sm:w-auto bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer">
            <option value="all">All Types</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
        </select>

        <select x-model="filterWarehouse" class="w-full sm:w-auto bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer">
            <option value="all">All Warehouses</option>
            <template x-for="w in warehouses" :key="w.id">
                <option :value="w.id" x-text="w.name"></option>
            </template>
        </select>

        <div class="flex-1"></div>

        <button type="button" class="flex items-center gap-1.5 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors" @click="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Transaction
        </button>
    </div>

    {{-- KPI cards --}}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="rounded-xl border border-border bg-card p-4">
            <p class="text-xs text-muted-foreground">Transactions</p>
            <p class="mt-2 text-2xl font-semibold text-foreground" x-text="transactions.length"></p>
        </div>
        <div class="rounded-xl border border-border bg-card p-4">
            <p class="text-xs text-muted-foreground">Last 24h</p>
            <p class="mt-2 text-2xl font-semibold text-foreground" x-text="last24hCount"></p>
        </div>
    </div>

    {{-- Table --}}
    <div class="bg-card border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                <tr class="border-b border-border bg-muted/50">
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Date</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Item</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Warehouse</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Type</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Qty</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Expires</th>
                    <th class="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap">Notes</th>
                </tr>
                </thead>
                <tbody>
                <template x-if="loading">
                    <tr>
                        <td :colspan="7" class="py-16 text-center">
                            <div class="flex flex-col items-center gap-3 text-muted-foreground">
                                <div class="flex items-center gap-2 text-muted-foreground">
                                    <div class="animate-spin rounded-full border border-current border-t-transparent w-5 h-5"></div>
                                    <span class="text-xs">Loading data...</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>

                <template x-if="!loading && filtered.length === 0">
                    <tr>
                        <td :colspan="7" class="py-16 text-center">
                            <div class="flex flex-col items-center gap-2 text-muted-foreground">
                                <div class="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v10l9 5 9-5V8"/><path d="M12 13v10"/></svg>
                                </div>
                                <span class="text-xs">No transactions found</span>
                            </div>
                        </td>
                    </tr>
                </template>

                <template x-if="!loading && filtered.length > 0">
                    <template x-for="t in filtered" :key="t.id">
                        <tr class="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td class="px-4 py-3 text-xs text-muted-foreground" style="font-family: 'JetBrains Mono, monospace'" x-text="toLocalDate(t.createdAt)"></td>
                            <td class="px-4 py-3 text-xs font-medium text-foreground" x-text="t.itemName"></td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" x-text="t.warehouseName"></td>
                            <td class="px-4 py-3 text-xs font-medium text-foreground" x-text="t.transactionType === 'stock_in' ? 'Stock In' : 'Stock Out'"></td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" style="font-family: 'JetBrains Mono, monospace'" x-text="t.quantity"></td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" x-text="t.expirationDate || '—'"></td>
                            <td class="px-4 py-3 text-xs text-muted-foreground" x-text="t.notes || '—'"></td>
                        </tr>
                    </template>
                </template>
                </tbody>
            </table>
        </div>
    </div>

    {{-- New Transaction Modal --}}
    <template x-if="showModal">
        <div x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" x-show="showModal" x-transition>
            <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 class="text-sm font-semibold text-foreground">New Stock Transaction</h2>
                    <button type="button" class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" @click="closeModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
                    </button>
                </div>

                <div class="overflow-y-auto flex-1">
                    <form class="p-5 flex flex-col gap-4" @submit.prevent="submitCreate()">

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <x-form-field label="Transaction Type" required>
                                <select class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer" x-model="form.transactionType">
                                    <option value="stock_in">Stock In</option>
                                    <option value="stock_out">Stock Out</option>
                                </select>
                            </x-form-field>

                            <x-form-field label="Item" required :error="errors.itemId">
                                <select class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer" x-model="form.itemId">
                                    <option value="">Select item</option>
                                    <template x-for="it in assignedItems" :key="it.id">
                                        <option :value="it.id" x-text="it.name + ' (' + it.sku + ')' "></option>
                                    </template>
                                </select>
                            </x-form-field>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <x-form-field label="Warehouse" required :error="errors.warehouseId">
                                <select class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 cursor-pointer" x-model="form.warehouseId" @change="syncExpirationOnWarehouseChange()">
                                    <option value="">Select warehouse</option>
                                    <template x-for="w in warehouses" :key="w.id">
                                        <option :value="w.id" x-text="w.name"></option>
                                    </template>
                                </select>
                            </x-form-field>

                            <x-form-field label="Quantity" required :error="errors.quantity">
                                <input type="number" min="1" class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" x-model="form.quantity" style="font-family: 'JetBrains Mono, monospace'" />
                            </x-form-field>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <x-form-field label="Expiration Date">
                                <input type="date" class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" x-model="form.expirationDate" />
                            </x-form-field>

                            <x-form-field label="Notes">
                                <input class="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" x-model="form.notes" placeholder="Optional notes" />
                            </x-form-field>
                        </div>

                        <template x-if="selectedItem">
                            <div class="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                                <div class="flex items-center justify-between gap-2">
                                    <span x-text="selectedItem.name + ' stock'"></span>
                                    <span class="font-medium text-foreground" style="font-family: 'JetBrains Mono, monospace'" x-text="selectedItem.quantity + ' ' + selectedItem.unit"></span>
                                </div>
                                <div class="mt-2 flex items-center gap-2 text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M14 14h2"/><path d="M8 18h2"/></svg>
                                    <span x-text="'Warehouse: ' + (currentWarehouse?.name ?? selectedItem.warehouseName ?? 'Unassigned')"></span>
                                </div>
                            </div>
                        </template>

                        <div class="flex justify-end gap-2 pt-2 border-t border-border">
                            <button type="button" class="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors" @click="closeModal()">Cancel</button>
                            <button type="submit" class="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors" :disabled="saving">
                                <template x-if="saving">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>
                                </template>
                                <template x-if="!saving">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </template>
                                <span x-text="saving ? 'Recording...' : 'Save Transaction'" ></span>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </template>

    {{-- Delete confirmation modal --}}
    <template x-if="confirmOpen">
        <div x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" x-show="confirmOpen" x-transition>
            <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h2 class="text-sm font-semibold text-foreground">Delete Transaction</h2>
                    <button type="button" class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" @click="cancelDelete()">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="p-5 flex flex-col gap-5">
                    <p class="text-xs text-muted-foreground leading-relaxed" x-text="confirmMessage"></p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-4 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors" @click="cancelDelete()">Cancel</button>
                        <button type="button" class="px-4 py-2 text-xs rounded-lg text-white bg-red-500 hover:bg-red-600" @click="confirmDelete()">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    </template>

    {{-- Delete action is not present in React UI snippet (no buttons). Keeping state hooks ready; actual UI parity may be implemented when React includes delete buttons in full. --}}

    <script>
        function transactionsPage() {
            return {
                loading: true,
                saving: false,
                showModal: false,
                confirmOpen: false,
                confirmId: null,
                confirmMessage: '',
                search: '',
                filterType: 'all',
                filterWarehouse: 'all',
                transactions: [],
                warehouses: @json($warehouses ?? []),
                inventory: @json($inventory ?? []),

                form: {
                    transactionType: 'stock_in',
                    itemId: '',
                    warehouseId: '',
                    quantity: '',
                    expirationDate: '',
                    notes: '',
                },
                errors: {},

                init() {
                    // preselect defaults like React: first assigned item
                    const assigned = this.assignedItems;
                    const firstAssigned = assigned[0];
                    this.form.itemId = firstAssigned?.id ?? '';
                    this.form.warehouseId = firstAssigned?.warehouseId ?? this.warehouses[0]?.id ?? '';

                    this.load();
                    this.$watch('filterWarehouse', () => {});
                },

                get assignedItems() {
                    return (this.inventory || []).filter(i => i.warehouseId);
                },

                get selectedItem() {
                    return this.inventory.find(i => String(i.id) === String(this.form.itemId));
                },

                get currentWarehouse() {
                    return this.warehouses.find(w => String(w.id) === String(this.form.warehouseId));
                },

                get last24hCount() {
                    const now = Date.now();
                    return (this.transactions || []).filter(t => {
                        const d = new Date(t.createdAt).getTime();
                        return d >= now - 86400000;
                    }).length;
                },

                get filtered() {
                    const query = (this.search || '').toLowerCase();
                    return (this.transactions || []).filter(transaction => {
                        const itemMatch = (transaction.itemName || '').toLowerCase().includes(query);
                        const warehouseMatch = (transaction.warehouseName || '').toLowerCase().includes(query);
                        const typeMatch = this.filterType === 'all' || transaction.transactionType === this.filterType;
                        const warehouseFilter = this.filterWarehouse === 'all' || transaction.warehouseId === this.filterWarehouse;
                        return (itemMatch || warehouseMatch) && typeMatch && warehouseFilter;
                    });
                },

                async load() {
                    this.loading = true;
                    try {
const res = await fetch('/api/transactions');
                        if (!res.ok) throw new Error(await res.text());
                        const data = await res.json();
                        this.transactions = data;
                    } catch (e) {
                        window.__toast?.('error', e.message || 'Failed to load transactions');
                    } finally {
                        this.loading = false;
                    }
                },

                openCreateModal() {
                    this.errors = {};
                    this.showModal = true;
                },

                closeModal() {
                    this.showModal = false;
                },

                syncExpirationOnWarehouseChange() {
                    // no-op placeholder for parity with React's implicit behavior
                },

                validate() {
                    const errs = {};
                    if (!this.form.itemId) errs.itemId = 'Required';
                    if (!this.form.warehouseId) errs.warehouseId = 'Required';

                    const qty = Number(this.form.quantity);
                    if (!this.form.quantity || isNaN(qty) || qty <= 0) errs.quantity = 'Enter a positive quantity';
                    if (this.form.transactionType === 'stock_out' && this.selectedItem && qty > this.selectedItem.quantity) {
                        errs.quantity = `Max available ${this.selectedItem.quantity}`;
                    }
                    if (this.selectedItem && String(this.selectedItem.warehouseId) !== String(this.form.warehouseId)) {
                        errs.warehouseId = 'Warehouse must match item location';
                    }
                    this.errors = errs;
                    return Object.keys(errs).length === 0;
                },

                async submitCreate() {
                    if (!this.validate()) return;
                    this.saving = true;

                    try {
                        const payload = {
                            transactionType: this.form.transactionType,
                            itemId: this.form.itemId,
                            warehouseId: this.form.warehouseId,
                            quantity: Number(this.form.quantity),
                            expirationDate: this.form.expirationDate || undefined,
                            notes: this.form.notes,
                        };

                        const res = await fetch('/transactions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                                'X-CSRF-TOKEN': '{{ csrf_token() }}'
                            },
                            body: JSON.stringify(payload)
                        });

                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to save transaction');

                        window.__toast?.('success', 'Transaction recorded successfully');
                        // prepend row
                        this.transactions = [data, ...this.transactions];
                        this.closeModal();
                    } catch (e) {
                        window.__toast?.('error', e.message || 'Failed to save transaction');
                    } finally {
                        this.saving = false;
                    }
                },

                // Delete handlers (UI parity will appear when React provides delete buttons)
                requestDelete(id) {
                    this.confirmId = id;
                    this.confirmMessage = `Delete transaction ${id}? This cannot be restored.`;
                    this.confirmOpen = true;
                },

                cancelDelete() {
                    this.confirmOpen = false;
                    this.confirmId = null;
                },

                async confirmDelete() {
                    if (!this.confirmId) return;
                    try {
                        const res = await fetch(`/transactions/${this.confirmId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                                'X-CSRF-TOKEN': '{{ csrf_token() }}'
                            }
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || 'Delete failed');
                        this.transactions = this.transactions.filter(t => String(t.id) !== String(this.confirmId));
                        window.__toast?.('success', 'Transaction removed');
                    } catch (e) {
                        window.__toast?.('error', e.message || 'Delete failed');
                    } finally {
                        this.cancelDelete();
                    }
                }
            }
        }
    </script>

</div>
@endsection

