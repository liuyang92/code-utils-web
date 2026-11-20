<script setup>
import { ref } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useClipboard } from '@/composables/useClipboard'

const props = defineProps({
  value: { type: String, default: '' },
  title: { type: String, default: '复制' },
  label: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md
  disabled: { type: Boolean, default: false }
})

const { copy } = useClipboard()
const copied = ref(false)
let timer = null

async function onCopy() {
  if (props.disabled) return
  const ok = await copy(props.value)
  copied.value = ok
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1200)
}
</script>

<template>
  <button
    class="copy-btn"
    :class="[`copy-btn--${size}`, { 'is-copied': copied, 'is-disabled': disabled }]"
    :title="copied ? '已复制' : title"
    :disabled="disabled"
    @click="onCopy"
  >
    <SvgIcon :name="copied ? 'check' : 'copy'" :size="size === 'sm' ? 14 : 16" />
    <span v-if="label" class="copy-btn__label">{{ copied ? '已复制' : label }}</span>
  </button>
</template>

<style scoped>
.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast) var(--ease-out),
    color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}
.copy-btn--sm {
  height: 26px;
  padding: 0 var(--space-1);
  font-size: var(--font-size-xs);
}
.copy-btn:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.copy-btn.is-copied {
  border-color: var(--color-success);
  color: var(--color-success);
  background: var(--color-success-soft);
}
.copy-btn.is-disabled,
.copy-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
