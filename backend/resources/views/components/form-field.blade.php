@props([
  'label' => '',
  'required' => false,
  'error' => null,
])

<div class="flex flex-col gap-1.5">
  <label class="text-xs font-medium text-foreground">
    {{ $label }}
    @if($required)
      <span class="text-red-400 ml-0.5">*</span>
    @endif
  </label>
  {{ $slot }}
  @if(!empty($error))
    <p class="text-xs text-red-400">{{ $error }}</p>
  @endif
</div>

