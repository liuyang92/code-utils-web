<script setup>
import SvgIcon from '@/components/icons/SvgIcon.vue'

defineProps({
  icon: { type: String, default: 'info' },
  text: { type: String, default: '暂无内容' }
})
</script>

<template>
  <div class="empty">
    <SvgIcon :name="icon" :size="22" class="empty__icon" />
    <p class="empty__text">{{ text }}</p>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 100%;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.empty__icon {
  opacity: 0.6;
}
</style>
