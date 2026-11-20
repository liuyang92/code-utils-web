/**
 * 操作历史记录（localStorage 持久化）
 *
 * - 记录范围：有明确执行动作的工具（格式化 / 压缩 / 编码 / 解码），最多 50 条
 * - 单条内容超过 50000 字符不记录，避免写爆存储配额
 * - 复原 = 设置待恢复请求 + 写入对应草稿 + 跳转工具，页面挂载时取走
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ALL_TOOLS } from '@/utils/tools'

const STORAGE_KEY = 'cute.history'
const MAX_HISTORY = 50
const MAX_CONTENT_LEN = 50000

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const histories = ref(load())
const pendingRestore = ref(null)

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories.value))
  } catch {
    /* 存储配额不足时静默失败，不影响功能使用 */
  }
}

const pad = (n) => String(n).padStart(2, '0')

/** 格式化为“年-月-日 时:分:秒” */
export function fmtHistoryTime(ts) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 记录一次操作历史。
 * @param {{ toolId: string, content: string, extra?: object }} param
 * @returns {boolean} 是否记录成功（内容为空或超长会跳过）
 */
export function addHistory({ toolId, content, extra = null }) {
  if (!toolId) return false
  if (typeof content !== 'string' || !content) return false
  if (content.length > MAX_CONTENT_LEN) return false
  const tool = ALL_TOOLS.find((t) => t.id === toolId)
  if (!tool) return false
  const rec = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    toolId,
    toolName: tool.name,
    icon: tool.icon,
    to: tool.to,
    content,
    extra,
    ts: Date.now()
  }
  histories.value.unshift(rec)
  if (histories.value.length > MAX_HISTORY) {
    histories.value.splice(MAX_HISTORY)
  }
  persist()
  return true
}

export function deleteHistory(id) {
  histories.value = histories.value.filter((h) => h.id !== id)
  persist()
}

export function clearAllHistory() {
  histories.value = []
  persist()
}

/**
 * 发起一次复原：登记待恢复请求，并同步写对应工具的输入草稿。
 * 随后由调用方进行路由跳转，目标页面挂载时通过 consumeRestore 取走数据。
 */
export function restoreHistory(rec) {
  if (!rec) return false
  pendingRestore.value = {
    toolId: rec.toolId,
    content: rec.content,
    extra: rec.extra || null
  }
  return true
}

/** 页面挂载时取走属于自己的复原请求（一次性消费） */
export function consumeRestore(toolId) {
  const req = pendingRestore.value
  if (!req || req.toolId !== toolId) return null
  pendingRestore.value = null
  return req
}

/**
 * 工具页接入历史复原（统一入口）。
 * - 挂载时消费一次（跨页跳转场景）
 * - 监听全局 cute:restore 事件再消费一次（同页点击历史、路由未变不触发重新挂载的场景）
 * 两路都通过 consumeRestore 按 toolId 一次性消费，天然互斥，不会重复回填。
 * @param {string} toolId 当前工具 id
 * @param {(req:{content:string,extra?:object})=>void} apply 复原回调
 */
export function useRestoreTool(toolId, apply) {
  function tryConsume() {
    const req = consumeRestore(toolId)
    if (req) apply(req)
  }
  onMounted(() => {
    tryConsume()
    window.addEventListener('cute:restore', tryConsume)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('cute:restore', tryConsume)
  })
}
