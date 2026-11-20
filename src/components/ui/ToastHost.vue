<script setup>
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const ICONS = { success: 'check-circle', error: 'alert-circle', info: 'info' }
</script>

<template>
  <transition-group name="toast" tag="div" class="toast-host">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.type}`">
      <SvgIcon :name="ICONS[t.type] || 'info'" :size="15" />
      <span class="toast__msg">{{ t.message }}</span>
    </div>
  </transition-group>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  pointer-events: auto;
}
.toast--success {
  color: var(--color-success);
}
.toast--error {
  color: var(--color-danger);
}
.toast--info {
  color: var(--color-info);
}
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base) var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
