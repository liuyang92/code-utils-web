/**
 * 编辑器字号调节（全局单例 + localStorage 持久化）。
 * 通过 CSS 变量 --cm-font 注入 CodeMirror 编辑器。
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'cute.cmFont'
const MIN = 11
const MAX = 20

const fontSize = ref(loadInitial())

function loadInitial() {
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  return Number.isFinite(saved) && saved >= MIN && saved <= MAX ? saved : 14
}

function apply(v) {
  document.documentElement.style.setProperty('--cm-font', `${v}px`)
}

apply(fontSize.value)

watch(fontSize, (v) => {
  apply(v)
  try {
    localStorage.setItem(STORAGE_KEY, String(v))
  } catch {}
})

export function useEditorFont() {
  function adjust(delta) {
    fontSize.value = Math.min(MAX, Math.max(MIN, fontSize.value + delta))
  }
  function reset() {
    fontSize.value = 14
  }
  return { fontSize, adjust, reset, MIN, MAX }
}
