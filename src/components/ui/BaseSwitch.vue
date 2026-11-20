<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="base-switch" :class="{ 'is-disabled': disabled }">
    <span
      class="base-switch__track"
      :class="{ 'is-on': modelValue }"
      role="switch"
      :aria-checked="modelValue"
    />
    <input
      type="checkbox"
      class="base-switch__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', $event.target.checked)"
    />
    <span v-if="label" class="base-switch__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.base-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  user-select: none;
}
.base-switch.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.base-switch__track {
  position: relative;
  width: 34px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  transition: background var(--transition-base) var(--ease-out);
  flex: none;
}
.base-switch__track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-base) var(--ease-out);
}
.base-switch__track.is-on {
  background: var(--color-primary);
}
.base-switch__track.is-on::after {
  transform: translateX(16px);
}
.base-switch__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
