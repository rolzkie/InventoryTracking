@props([
    'label' => '',
    'value' => '',
    'sub' => '',
    'color' => 'bg-blue-500/15 text-blue-400',
])

<div {{ $attributes->merge(['class' => 'rounded-lg border border-border bg-card p-4']) }}>
    <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md {{ $color }}">
            {{ $slot }}
        </div>
        <div>
            <p class="text-xs text-muted-foreground">{{ $label }}</p>
            <p class="text-lg font-semibold text-foreground">{{ $value }}</p>
            @if ($sub)
                <p class="text-xs text-muted-foreground">{{ $sub }}</p>
            @endif
        </div>
    </div>
</div>
