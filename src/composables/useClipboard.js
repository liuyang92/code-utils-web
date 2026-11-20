/**
 * 复制到剪贴板，自动降级到 textarea + execCommand。
 * 返回的 copy(text) -> Promise<boolean>
 */
export function useClipboard() {
  async function copy(text) {
    if (text == null) return false
    const value = String(text)
    if (!value) return false
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
        return true
      }
      throw new Error('fallback')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        return ok
      } catch {
        return false
      }
    }
  }
  return { copy }
}
