<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import HistoryDrawer from '@/components/layout/HistoryDrawer.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'
import SettingsDrawer from '@/components/layout/SettingsDrawer.vue'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import { router } from '@/router'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import { readFileDrop } from '@/utils/file-drop'

const { theme } = useTheme()
const { notify } = useToast()
const route = useRoute()
const sidebarOpen = ref(false)
const historyOpen = ref(false)
const paletteOpen = ref(false)
const settingsOpen = ref(false)

function onPaletteKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    paletteOpen.value = true
  }
}
const isToolPage = computed(() => Boolean(route.meta?.toolId))

const mainClass = computed(() => ({
  'app-layout__content': true,
  'app-layout__content--tool': isToolPage.value
}))

// ---- 全局文件拖入：仅工具页生效 ----
const dropActive = ref(false)
let dragDepth = 0

function hasFiles(e) {
  return [...(e.dataTransfer?.types || [])].includes('Files')
}
function onDragEnter(e) {
  if (!isToolPage.value || !hasFiles(e)) return
  dragDepth++
  dropActive.value = true
}
function onDragOver(e) {
  if (!isToolPage.value || !hasFiles(e)) return
  e.preventDefault()
  dropActive.value = true
}
function onDragLeave() {
  if (--dragDepth <= 0) {
    dragDepth = 0
    dropActive.value = false
  }
}
function resetDrag() {
  dragDepth = 0
  dropActive.value = false
}
async function onDrop(e) {
  if (!isToolPage.value) return
  e.preventDefault()
  resetDrag()
  try {
    const content = await readFileDrop(e)
    if (content === null || content === undefined) return
    window.dispatchEvent(new CustomEvent('cute:file-drop', { detail: { content } }))
  } catch (msg) {
    notify(typeof msg === 'string' ? msg : '文件读取失败', 'error', 2500)
  }
}

// 懒加载 chunk 加载失败（网络/CDN 抖动）兜底：提示而非白屏
router.onError(() => {
  notify('工具代码加载失败，请检查网络后刷新页面', 'error', 4000)
})

// 拦截浏览器默认打开文件
onMounted(() => {
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
  window.addEventListener('keydown', onPaletteKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('drop', onDrop)
  window.removeEventListener('keydown', onPaletteKeydown)
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar class="app-layout__sidebar" :open="sidebarOpen" @close="sidebarOpen = false" />
    <div v-if="sidebarOpen" class="app-overlay" @click="sidebarOpen = false" />
    <div class="app-layout__main">
      <AppHeader :show-menu="true" @toggle-menu="sidebarOpen = !sidebarOpen" @open-history="historyOpen = true" @open-palette="paletteOpen = true" @open-settings="settingsOpen = true" />
      <HistoryDrawer v-model:open="historyOpen" />
    <CommandPalette v-model:open="paletteOpen" />
    <SettingsDrawer v-model:open="settingsOpen" @open-history="historyOpen = true" />
      <main :class="mainClass">
        <router-view v-slot="{ Component, route }">
          <ErrorBoundary :key="route.path">
            <Transition name="fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </ErrorBoundary>
        </router-view>
      </main>
    </div>
    <Transition name="drop">
      <div v-if="dropActive" class="drop-overlay">
        <div class="drop-card">
          <div class="drop-icon">⬇</div>
          <div class="drop-text">释放鼠标导入文件内容</div>
          <div class="drop-hint">支持 txt / json / js / sql 等文本文件（≤ 2MB）</div>
        </div>
      </div>
    </Transition>
    <ToastHost />
  </div>
</template>

<style scoped>
.app-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-overlay);
}
.app-layout__content {
  padding: var(--space-5);
}
.app-layout__content--tool,
.app-layout__content:has(.tool) {
  padding: 0;
}
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
  pointer-events: none;
}
.drop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-7);
  border: 2px dashed var(--color-primary);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-lg);
}
.drop-icon {
  font-size: 32px;
  color: var(--color-primary);
  animation: bounce 1.2s ease-in-out infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.drop-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.drop-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast) var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.drop-enter-active,
.drop-leave-active {
  transition: opacity var(--transition-fast) var(--ease-out);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
}
@media (max-width: 900px) {
  .app-layout__content {
    padding: var(--space-3);
  }
  .app-layout__content--tool,
  .app-layout__content:has(.tool) {
    padding: 0;
  }
}
</style>
