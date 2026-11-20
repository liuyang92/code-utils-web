<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md
  mono: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="base-input" :class="[`base-input--${size}`, { 'is-mono': mono, 'is-disabled': disabled }]">
    <slot name="prefix" />
    <input
      class="base-input__el"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <slot name="suffix" />
  </div>
</template>

<style scoped>
.base-input {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text);
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}
.base-input--sm {
  height: 26px;
  font-size: var(--font-size-xs);
}
.base-input:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.base-input.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.base-input__el {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--font-size-sm);
}
.base-input.is-mono .base-input__el {
  font-family: var(--font-mono);
}
</style>
