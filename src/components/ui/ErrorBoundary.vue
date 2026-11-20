<script setup>
/**
 * 工具页错误边界：捕获子树运行时错误（首要目标是 TDZ 白屏：
 * Cannot access before initialization），展示错误卡片而非整页白屏。
 * 懒加载 chunk 网络错误由 router.onError 单独处理（App.vue 顶部）。
 */
import { ref, onErrorCaptured } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  // 返回 false 阻止继续向上传播，避免整棵树卸载
  return false
})

defineExpose({
  clearError() {
    error.value = null
  }
})

function reload() {
  // 路由组件重建即可恢复（已被路由 :key 机制覆盖）
  error.value = null
}
</script>

<template>
  <div v-if="error" class="eb">
    <div class="eb__card">
      <div class="eb__icon">
        <SvgIcon name="alert-triangle" :size="22" />
      </div>
      <h1 class="eb__title">工具加载出错</h1>
      <p class="eb__hint">该工具运行时抛出了异常，其它工具不受影响。可尝试重新加载或刷新整页。</p>
      <pre class="eb__msg">{{ error?.message || String(error) }}</pre>
      <div class="eb__actions">
        <BaseButton variant="primary" icon="refresh" @click="reload">重试</BaseButton>
        <CopyButton :value="String(error?.stack || error?.message || error)" label="复制错误信息" />
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.eb {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: var(--color-surface);
}
.eb__card {
  max-width: 560px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}
.eb__icon {
  color: var(--color-danger);
}
.eb__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.eb__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.eb__msg {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
}
.eb__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
</style>
