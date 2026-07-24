@props([
  'title' => '',
  'wide' => false,
])

<div x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" x-show="open" x-transition>
  <div class="bg-card border border-border rounded-xl shadow-2xl w-full {{ $wide ? 'max-w-2xl' : 'max-w-lg' }} max-h-[90vh] flex flex-col">
    <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
      <h2 class="text-sm font-semibold text-foreground">{{ $title }}</h2>
      <button type="button" class="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" @click="open=false">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="overflow-y-auto flex-1">
      {{ $slot }}
    </div>
  </div>
</div>

