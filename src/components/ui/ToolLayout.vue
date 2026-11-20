<script setup>
/**
 * 工具页通用骨架：标题/描述 + 工具条 + 主体 + 状态行。
 * 状态通过 status={type,message,line?,column?} 统一展示（内容由各视图给出）。
 */
import Toolbar from '@/components/ui/Toolbar.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: Object,
    default: () => ({ type: 'info', message: '' })
  }
})
</script>

<template>
  <section class="tool">
    <header class="tool__head">
      <h1 class="tool__title">{{ title }}</h1>
      <p v-if="description" class="tool__desc">{{ description }}</p>
    </header>
    <Toolbar v-if="$slots['toolbar-left'] || $slots['toolbar-right']">
      <template #left><slot name="toolbar-left" /></template>
      <template #right><slot name="toolbar-right" /></template>
    </Toolbar>
    <div class="tool__body">
      <slot />
    </div>
    <StatusMessage
      :type="status.type"
      :message="status.message"
      :line="status.line || 0"
      :column="status.column || 0"
    />
  </section>
</template>

<style scoped>
.tool {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.tool__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-2);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.tool__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}
.tool__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tool__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
