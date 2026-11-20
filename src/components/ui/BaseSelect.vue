<script setup>
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] }, // [{label, value}]
  size: { type: String, default: 'md' }, // sm | md
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="base-select" :class="`base-select--${size}`" :title="title">
    <select
      class="base-select__el"
      :value="modelValue"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <SvgIcon name="chevron-down" :size="size === 'sm' ? 12 : 14" class="base-select__chev" />
  </div>
</template>

<style scoped>
.base-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 30px;
}
.base-select--sm {
  height: 26px;
}
.base-select__el {
  appearance: none;
  height: 100%;
  padding: 0 calc(var(--space-4) + 2px) 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}
.base-select:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.base-select__chev {
  position: absolute;
  right: var(--space-2);
  pointer-events: none;
  color: var(--color-text-muted);
}
</style>
