import { onMounted, onBeforeUnmount } from 'vue'

/**
 * 接收 App.vue 全局拖放层派发的文件内容（文本）。
 * 使用：useFileDropImport((content) => { input.value = content })
 */
export function useFileDropImport(onFile) {
  function handler(e) {
    onFile(String(e.detail?.content || ''))
  }
  onMounted(() => window.addEventListener('cute:file-drop', handler))
  onBeforeUnmount(() => window.removeEventListener('cute:file-drop', handler))
}
