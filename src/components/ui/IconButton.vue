<script setup>
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  name: { type: String, required: true },
  title: { type: String, default: '' },
  size: { type: [Number, String], default: 16 },
  variant: { type: String, default: 'ghost' }, // ghost | soft
  disabled: { type: Boolean, default: false }
})
</script>

<template>
  <button
    class="icon-btn"
    :class="[`icon-btn--${variant}`, { 'is-disabled': disabled }]"
    :title="title"
    :aria-label="title"
    :disabled="disabled"
  >
    <SvgIcon :name="name" :size="size" />
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  transition: background var(--transition-fast) var(--ease-out),
    color var(--transition-fast) var(--ease-out);
}
.icon-btn--ghost {
  background: transparent;
}
.icon-btn--ghost:hover:not(:disabled) {
  background: var(--color-info-soft);
  color: var(--color-text);
}
.icon-btn--soft {
  background: var(--color-info-soft);
  color: var(--color-text);
}
.icon-btn--soft:hover:not(:disabled) {
  background: var(--color-selection-bg);
}
.icon-btn.is-disabled,
.icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
