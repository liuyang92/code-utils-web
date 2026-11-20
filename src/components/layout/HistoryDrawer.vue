<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  histories,
  deleteHistory,
  clearAllHistory,
  restoreHistory,
  fmtHistoryTime
} from '@/composables/useHistory'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open'])

const router = useRouter()

const keyword = ref('')
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return histories.value
  return histories.value.filter((h) =>
    h.toolName?.toLowerCase().includes(kw) ||
    (h.content || '').toLowerCase().includes(kw)
  )
})

const preview = (text) => (text || '').replace(/\s+/g, ' ').trim().slice(0, 140)
const close = () => emit('update:open', false)

function onDelete(e, rec) {
  e.stopPropagation()
  deleteHistory(rec.id)
}

// “全部清空”两步确认：首次点击切换为确认态，3 秒内再点执行
const confirmClear = ref(false)
let clearTimer = null
function onClear() {
  if (!histories.value.length) return
  if (!confirmClear.value) {
    confirmClear.value = true
    clearTimeout(clearTimer)
    clearTimer = setTimeout(() => (confirmClear.value = false), 3000)
    return
  }
  clearAllHistory()
  confirmClear.value = false
  clearTimeout(clearTimer)
}
onBeforeUnmount(() => clearTimeout(clearTimer))

function onRestore(rec) {
  restoreHistory(rec)
  close()
  router.push(rec.to)
  // 同工具页点击历史时路由不变、组件不重新挂载，靠全局事件让当前页消费复原请求
  window.dispatchEvent(new CustomEvent('cute:restore'))
}
function onKeyEnter(e, rec) {
  if (e.key === 'Enter') onRestore(rec)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="hdrawer__overlay" @click="close" />
    </Transition>
    <Transition name="drawer">
      <aside v-if="open" class="hdrawer" role="dialog" aria-label="历史记录">
        <header class="hdrawer__head">
          <div class="hdrawer__title">
            <SvgIcon name="clock" :size="16" />
            <span>历史记录</span>
            <em v-if="histories.length" class="hdrawer__count">{{ filtered.length }}</em>
          </div>
          <div class="hdrawer__actions">
            <button
              class="hdrawer__clear"
              :class="{ 'is-confirm': confirmClear }"
              :disabled="!histories.length"
              @click="onClear"
            >
              {{ confirmClear ? '确认清空？' : '全部清空' }}
            </button>
            <IconButton name="x" title="关闭" @click="close" />
          </div>
        </header>
        <div v-if="histories.length" class="hdrawer__search">
          <BaseInput v-model="keyword" size="sm" placeholder="搜索历史（工具名或内容）…" />
        </div>

        <div class="hdrawer__body">
          <ul v-if="filtered.length" class="hdrawer__list">
            <li
              v-for="rec in filtered"
              :key="rec.id"
              class="hrec"
              tabindex="0"
              @click="onRestore(rec)"
              @keydown.enter="onKeyEnter($event, rec)"
            >
              <div class="hrec__top">
                <span class="hrec__tool"><SvgIcon :name="rec.icon" :size="13" />{{ rec.toolName }}</span>
                <time class="hrec__time">{{ fmtHistoryTime(rec.ts) }}</time>
                <button class="hrec__del" title="删除该条" @click="onDelete($event, rec)">
                  <SvgIcon name="trash" :size="13" />
                </button>
              </div>
              <p class="hrec__preview">{{ preview(rec.content) }}</p>
            </li>
          </ul>
          <EmptyState v-else-if="!keyword.trim()" icon="clock" text="暂无历史记录" />
          <EmptyState v-else icon="search" :text="`没有匹配“${keyword.trim()}”的记录`" />
        </div>

        <footer class="hdrawer__foot">
          <span>记录保存在浏览器本地，最多保留 50 条，不会上传服务器</span>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hdrawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-overlay);
}
.hdrawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--z-overlay) + 1);
  width: min(400px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}
.hdrawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex: none;
  height: var(--layout-header-h);
  padding: 0 var(--space-3) 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.hdrawer__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.hdrawer__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-selection-bg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-style: normal;
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}
.hdrawer__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.hdrawer__clear {
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast) var(--ease-out);
}
.hdrawer__clear:hover:not(:disabled) {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.hdrawer__clear.is-confirm {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}
.hdrawer__clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hdrawer__search {
  flex: none;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.hdrawer__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-3) var(--space-3) var(--space-5);
}
.hdrawer__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.hrec {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out),
    transform var(--transition-fast) var(--ease-out);
}
.hrec:hover {
  border-color: var(--color-primary);
  transform: translateX(-2px);
}
.hrec:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.hrec__top {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.hrec__tool {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.hrec__time {
  flex: 1;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}
.hrec__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.hrec__del:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.hrec__preview {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--color-text-secondary);
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hdrawer__foot {
  flex: none;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base) var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform var(--transition-base) var(--ease-out);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
