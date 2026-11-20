/**
 * 文本片段收藏（localStorage 持久化）。
 * 全局单例，结构：{ id, title, content, tag, language, ts }
 */
import { ref, computed } from 'vue'

const STORAGE_KEY = 'cute.snippets'
const MAX_SNIPPETS = 200
const MAX_CONTENT_LEN = 50000

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const snippets = ref(load())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets.value))
  } catch { /* 配额不足静默失败 */ }
}

export function addSnippet({ title = '', content = '', tag = '', language = '' } = {}) {
  if (typeof content !== 'string' || !content.trim()) return null
  if (content.length > MAX_CONTENT_LEN) return null
  if (snippets.value.length >= MAX_SNIPPETS) return null
  const rec = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim() || content.trim().split(/\r?\n/)[0].slice(0, 40),
    content,
    tag: tag.trim(),
    language: language.trim(),
    ts: Date.now()
  }
  snippets.value.unshift(rec)
  persist()
  return rec
}

export function updateSnippet(id, patch) {
  const idx = snippets.value.findIndex((s) => s.id === id)
  if (idx === -1) return false
  snippets.value[idx] = { ...snippets.value[idx], ...patch, ts: Date.now() }
  persist()
  return true
}

export function deleteSnippet(id) {
  snippets.value = snippets.value.filter((s) => s.id !== id)
  persist()
}

export function clearAllSnippets() {
  snippets.value = []
  persist()
}

/** 所有标签去重列表 */
export const allTags = computed(() => {
  const set = new Set()
  for (const s of snippets.value) {
    if (s.tag) set.add(s.tag)
  }
  return [...set].sort()
})

export function useSnippets() {
  return { snippets, allTags, addSnippet, updateSnippet, deleteSnippet, clearAllSnippets }
}
