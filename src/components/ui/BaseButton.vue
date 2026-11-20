<script setup>
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  variant: { type: String, default: 'secondary' }, // primary | secondary | danger | ghost
  size: { type: String, default: 'md' }, // sm | md
  icon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
</script>

<template>
  <button
    class="base-btn"
    :class="[`base-btn--${variant}`, `base-btn--${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
  >
    <SvgIcon v-if="loading" name="refresh" :size="size === 'sm' ? 14 : 16" class="spin" />
    <SvgIcon v-else-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" />
    <span v-if="$slots.default" class="base-btn__label"><slot /></span>
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: background var(--transition-fast) var(--ease-out),
    border-color var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}
.base-btn--sm {
  height: 28px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
}
.base-btn__label {
  display: inline-flex;
  align-items: center;
}

.base-btn--primary {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.base-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
.base-btn--primary:active:not(:disabled) {
  background: var(--color-primary-active);
}

.base-btn--secondary {
  border-color: var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}
.base-btn--secondary:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-info-soft);
}

.base-btn--danger {
  color: var(--color-danger);
  border-color: var(--color-border);
  background: var(--color-surface);
}
.base-btn--danger:hover:not(:disabled) {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.base-btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.base-btn--ghost:hover:not(:disabled) {
  background: var(--color-info-soft);
  color: var(--color-text);
}

.base-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.base-btn.is-loading {
  pointer-events: none;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
