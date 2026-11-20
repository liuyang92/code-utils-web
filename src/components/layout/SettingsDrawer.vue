<script setup>
/**
 * 设置抽屉：主题、编辑器字号、快捷键速查、本地数据管理。
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import IconButton from '@/components/ui/IconButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useTheme } from '@/composables/useTheme'
import { useEditorFont } from '@/composables/useEditorFont'
import { useToast } from '@/composables/useToast'
import { clearAllHistory, histories } from '@/composables/useHistory'
import { useFavorites } from '@/composables/useFavorites'
import { useSnippets, clearAllSnippets } from '@/composables/useSnippets'

const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open', 'open-history'])

const { theme, setTheme } = useTheme()
const { fontSize, adjust, reset, MIN, MAX } = useEditorFont()
const { notify } = useToast()
const { favorites } = useFavorites()
const { snippets } = useSnippets()

const API_HISTORY_KEY = 'cute.apiHistory'
const ENV_KEY = 'cute.apiEnv'

const apiHistoryCount = ref(0)
const apiEnvCount = ref(0)
function readCounts() {
  try {
    apiHistoryCount.value = (JSON.parse(localStorage.getItem(API_HISTORY_KEY) || '[]') || []).length
  } catch { apiHistoryCount.value = 0 }
  try {
    apiEnvCount.value = (JSON.parse(localStorage.getItem(ENV_KEY) || '[]') || []).length
  } catch { apiEnvCount.value = 0 }
}
// 打开时刷新计数（props.open watch 在模板挂载后触发）
import { watch } from 'vue'
watch(() => props.open, (v) => { if (v) readCounts() })

const close = () => emit('update:open', false)

const SHORTCUTS = [
  { keys: ['Ctrl/Cmd', 'K'], desc: '打开命令面板，快速跳转任何工具' },
  { keys: ['Ctrl/Cmd', 'Enter'], desc: '触发当前工具的主操作（格式化/编码/生成等）' },
  { keys: ['Esc'], desc: '关闭命令面板 / 弹层' },
  { keys: ['↑', '↓'], desc: '命令面板中切换选中项，Enter 跳转' }
]

const confirmKey = ref('')
let confirmTimer = null
function askClear(key, label, action) {
  if (confirmKey.value === key) {
    action()
    confirmKey.value = ''
    clearTimeout(confirmTimer)
    notify(`${label}已清空`, 'success', 1500)
    readCounts()
    return
  }
  confirmKey.value = key
  clearTimeout(confirmTimer)
  confirmTimer = setTimeout(() => (confirmKey.value = ''), 3000)
}
onBeforeUnmount(() => { clearTimeout(confirmTimer); clearTimeout(confirmImportTimer) })

function clearHistory() {
  askClear('history', '历史记录', () => clearAllHistory())
}
function clearFav() {
  askClear('fav', '收藏', () => {
    favorites.value.splice(0) // 触发 useFavorites 内部 set 重建
    localStorage.removeItem('cute.favorites')
  })
}
function clearSnippets() {
  askClear('snippets', '片段', () => clearAllSnippets())
}
function clearApiHistory() {
  askClear('api', '接口测试历史', () => {
    localStorage.removeItem(API_HISTORY_KEY)
  })
}
function clearAllLocal() {
  askClear('all', '全部本地数据', () => {
    const keys = ['cute.history', 'cute.favorites', 'cute.snippets', API_HISTORY_KEY, ENV_KEY, 'cute.apiEnv']
    for (const k of keys) localStorage.removeItem(k)
    clearAllHistory()
    clearAllSnippets()
    favorites.value.splice(0)
  })
}

const fileInput = ref(null)
const importArmed = ref(false)
let confirmImportTimer = null

/** 导出全部 cute.* 本地数据为 JSON 备份文件 */
function exportLocal() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('cute.')) continue
    const raw = localStorage.getItem(k)
    try {
      data[k] = JSON.parse(raw)
    } catch {
      data[k] = raw
    }
  }
  const container = {
    app: 'code-utils-web',
    version: 1,
    exportedAt: new Date().toISOString(),
    data
  }
  const blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `code-utils-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(blobUrl)
  notify(`已导出 ${Object.keys(data).length} 项本地数据`, 'success', 1800)
}

/** 导入前二次确认：点击一次变红，再点才打开文件选择，导入即覆盖同名键 */
function onImportClick() {
  if (!importArmed.value) {
    importArmed.value = true
    clearTimeout(confirmImportTimer)
    confirmImportTimer = setTimeout(() => (importArmed.value = false), 4000)
    return
  }
  importArmed.value = false
  fileInput.value?.click()
}

async function importLocal(ev) {
  const file = ev.target.files && ev.target.files[0]
  ev.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const data = parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
      ? parsed.data
      : (parsed && typeof parsed === 'object' ? parsed : null)
    if (!data) throw new Error('不是有效的备份文件（缺少数据对象）')
    const keys = Object.keys(data).filter((k) => k.startsWith('cute.'))
    if (!keys.length) throw new Error('备份文件中没有 cute.* 数据')
    for (const k of keys) {
      const v = data[k]
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
    }
    notify(`已导入 ${keys.length} 项数据，刷新页面后全部生效`, 'success', 3000)
    readCounts()
  } catch (e) {
    notify(e?.message || '导入失败', 'error', 3000)
  }
}

const section = ref('general') // general | shortcuts | data
const SECTIONS = [
  { value: 'general', label: '通用' },
  { value: 'shortcuts', label: '快捷键' },
  { value: 'data', label: '数据管理' }
]
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="sdrawer__overlay" @click="close" />
    </Transition>
    <Transition name="drawer-l">
      <aside v-if="open" class="sdrawer" role="dialog" aria-label="设置">
        <header class="sdrawer__head">
          <div class="sdrawer__title">
            <SvgIcon name="sliders" :size="16" />
            <span>设置</span>
          </div>
          <IconButton name="x" title="关闭" @click="close" />
        </header>
        <div class="sdrawer__tabs">
          <button
            v-for="s in SECTIONS"
            :key="s.value"
            class="sdrawer__tab"
            :class="{ 'is-active': section === s.value }"
            @click="section = s.value"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- 通用 -->
        <div v-if="section === 'general'" class="sdrawer__body">
          <section class="s-group">
            <h3 class="s-group__title">外观</h3>
            <div class="s-row">
              <span class="s-row__label">主题</span>
              <div class="s-theme">
                <button class="s-theme__btn" :class="{ 'is-active': theme === 'light' }" @click="setTheme('light')">
                  <SvgIcon name="sun" :size="14" /> 浅色
                </button>
                <button class="s-theme__btn" :class="{ 'is-active': theme === 'dark' }" @click="setTheme('dark')">
                  <SvgIcon name="moon" :size="14" /> 深色
                </button>
                <button class="s-theme__btn" :class="{ 'is-active': theme === 'xiaohei' }" @click="setTheme('xiaohei')">
                  <SvgIcon name="cat" :size="14" /> 罗小黑
                </button>
              </div>
            </div>
            <div class="s-row">
              <span class="s-row__label">编辑器字号</span>
              <div class="s-font">
                <BaseButton size="sm" @click="adjust(-1)" :disabled="fontSize <= MIN">A−</BaseButton>
                <code class="s-font__val">{{ fontSize }}px</code>
                <BaseButton size="sm" @click="adjust(1)" :disabled="fontSize >= MAX">A+</BaseButton>
                <BaseButton size="sm" variant="ghost" @click="reset">恢复默认</BaseButton>
              </div>
            </div>
          </section>
        </div>

        <!-- 快捷键 -->
        <div v-else-if="section === 'shortcuts'" class="sdrawer__body">
          <ul class="s-shortcut-list">
            <li v-for="s in SHORTCUTS" :key="s.desc" class="s-shortcut">
              <div class="s-shortcut__keys">
                <kbd v-for="k in s.keys" :key="k">{{ k }}</kbd>
              </div>
              <span class="s-shortcut__desc">{{ s.desc }}</span>
            </li>
          </ul>
        </div>

        <!-- 数据管理 -->
        <div v-else class="sdrawer__body">
          <section class="s-group">
            <h3 class="s-group__title">本地数据（仅保存在浏览器，不上传）</h3>
            <ul class="s-data-list">
              <li class="s-data">
                <div class="s-data__info">
                  <span class="s-data__label">操作历史</span>
                  <code class="s-data__count">{{ histories.length }} 条</code>
                </div>
                <BaseButton size="sm" variant="danger" @click="clearHistory">
                  {{ confirmKey === 'history' ? '确认清空？' : '清空' }}
                </BaseButton>
              </li>
              <li class="s-data">
                <div class="s-data__info">
                  <span class="s-data__label">工具收藏</span>
                  <code class="s-data__count">{{ favorites.length }} 个</code>
                </div>
                <BaseButton size="sm" variant="danger" @click="clearFav">
                  {{ confirmKey === 'fav' ? '确认清空？' : '清空' }}
                </BaseButton>
              </li>
              <li class="s-data">
                <div class="s-data__info">
                  <span class="s-data__label">片段收藏</span>
                  <code class="s-data__count">{{ snippets.length }} 条</code>
                </div>
                <BaseButton size="sm" variant="danger" @click="clearSnippets">
                  {{ confirmKey === 'snippets' ? '确认清空？' : '清空' }}
                </BaseButton>
              </li>
              <li class="s-data">
                <div class="s-data__info">
                  <span class="s-data__label">接口测试历史</span>
                  <code class="s-data__count">{{ apiHistoryCount }} 条</code>
                </div>
                <BaseButton size="sm" variant="danger" @click="clearApiHistory">
                  {{ confirmKey === 'api' ? '确认清空？' : '清空' }}
                </BaseButton>
              </li>
              <li class="s-data">
                <div class="s-data__info">
                  <span class="s-data__label">接口测试环境变量</span>
                  <code class="s-data__count">{{ apiEnvCount }} 条</code>
                </div>
                <BaseButton size="sm" variant="danger" @click="askClear('env', '接口环境变量', () => localStorage.removeItem(ENV_KEY))">
                  {{ confirmKey === 'env' ? '确认清空？' : '清空' }}
                </BaseButton>
              </li>
            </ul>
            <div class="s-backup">
              <BaseButton size="sm" icon="arrow-up-right" @click="exportLocal">导出备份</BaseButton>
              <BaseButton size="sm" :variant="importArmed ? 'danger' : 'ghost'" icon="undo" @click="onImportClick">
                {{ importArmed ? '确认覆盖现有数据？' : '导入备份' }}
              </BaseButton>
              <input ref="fileInput" type="file" accept="application/json,.json" class="s-file-input" @change="importLocal" />
            </div>
            <div class="s-danger-zone">
              <BaseButton variant="danger" @click="clearAllLocal">
                {{ confirmKey === 'all' ? '再次点击确认清空全部本地数据' : '清空全部本地数据' }}
              </BaseButton>
              <p class="s-danger-zone__hint">包含历史/收藏/片段/接口测试记录，操作不可恢复</p>
            </div>
            <div class="s-history-entry">
              <BaseButton variant="ghost" icon="clock" @click="emit('open-history'); close()">打开历史记录</BaseButton>
            </div>
          </section>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sdrawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-overlay);
}
.sdrawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--z-overlay) + 1);
  width: min(420px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}
.sdrawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3) 0 var(--space-4);
  height: var(--layout-header-h);
  flex: none;
  border-bottom: 1px solid var(--color-border);
}
.sdrawer__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
}
.sdrawer__tabs {
  flex: none;
  display: flex;
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-2);
}
.sdrawer__tab {
  height: 36px;
  padding: 0 var(--space-3);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.sdrawer__tab.is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.sdrawer__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.s-group__title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.s-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}
.s-row__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.s-theme {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.s-theme__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 30px;
  padding: 0 var(--space-3);
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.s-theme__btn + .s-theme__btn {
  border-left: 1px solid var(--color-border);
}
.s-theme__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.s-font {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.s-font__val {
  min-width: 44px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.s-shortcut-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.s-shortcut {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.s-shortcut__keys {
  display: inline-flex;
  gap: var(--space-1);
  flex: none;
}
.s-shortcut__keys kbd {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border-strong);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text);
}
.s-shortcut__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.s-data-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.s-data {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.s-data__info {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.s-data__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.s-data__count {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.s-danger-zone {
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-danger-soft);
}
.s-danger-zone__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}
.s-backup {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.s-file-input {
  display: none;
}
.s-history-entry {
  margin-top: var(--space-3);
}
.fade-enter-active, .fade-leave-active { transition: opacity var(--transition-base) var(--ease-out); }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.drawer-l-enter-active, .drawer-l-leave-active { transition: transform var(--transition-base) var(--ease-out); }
.drawer-l-enter-from, .drawer-l-leave-to { transform: translateX(100%); }
</style>
