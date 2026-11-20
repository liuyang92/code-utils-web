import { ref, watch } from 'vue'

const STORAGE_KEY = 'cute.theme'
const THEMES = ['light', 'dark', 'xiaohei']
const theme = ref('light')

function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEMES.includes(saved)) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
}

let initialized = false
function initTheme() {
  if (initialized) return
  initialized = true
  theme.value = initialTheme()
  applyTheme(theme.value)
  watch(theme, (v) => {
    applyTheme(v)
    try {
      localStorage.setItem(STORAGE_KEY, v)
    } catch {}
  })
  // 仅在用户未显式选择主题时跟随系统
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
    } catch {}
    theme.value = e.matches ? 'dark' : 'light'
  })
}

export function useTheme() {
  initTheme()
  /** 循环切换：light → dark → xiaohei → light（罗小黑放在最后一位） */
  function cycle() {
    const idx = THEMES.indexOf(theme.value)
    theme.value = THEMES[(idx + 1) % THEMES.length]
  }
  function setTheme(v) {
    if (THEMES.includes(v)) theme.value = v
  }
  return { theme, themes: THEMES, cycle, setTheme }
}
