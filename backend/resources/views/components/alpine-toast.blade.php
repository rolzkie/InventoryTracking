<div x-cloak x-data="toastState()" x-init="init()" class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
    <template x-for="t in toasts" :key="t.id">
        <div x-show="t.visible" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 transform translate-y-2" x-transition:enter-end="opacity-100 transform translate-y-0" x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border pointer-events-auto" :class="toastClass(t.type)">
            <template x-if="t.type === 'success'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </template>
            <template x-if="t.type === 'error'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </template>
            <template x-if="t.type === 'info'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </template>
            <span x-text="t.message"></span>
        </div>
    </template>
</div>

<script>
    function toastState() {
        return {
            toasts: [],
            init() {
                window.__toast = (type, message) => this.push(type, message);
            },
            push(type, message) {
                const id = Math.random().toString(36).slice(2);
                const toast = { id, type, message: String(message ?? ''), visible: true };
                this.toasts = [...this.toasts, toast];
                setTimeout(() => {
                    this.toasts = this.toasts.map(t => t.id === id ? { ...t, visible: false } : t);
                }, 3500);
                setTimeout(() => {
                    this.toasts = this.toasts.filter(t => t.id !== id);
                }, 3650);
            },
            toastClass(type) {
                if (type === 'success') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
                if (type === 'error') return 'bg-red-500/15 border-red-500/30 text-red-300';
                return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
            }
        }
    }
</script>

