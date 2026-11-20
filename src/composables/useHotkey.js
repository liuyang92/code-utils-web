/**
 * 全局快捷键：Ctrl/Cmd+Enter 触发主操作（格式化类工具自动绑定格式化按钮动作）。
 * 组件卸载时自动解绑。
 */
import { onBeforeUnmount } from 'vue'

export function useCtrlEnter(action) {
  function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }
  window.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}
