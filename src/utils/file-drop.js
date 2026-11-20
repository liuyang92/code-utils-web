/**
 * 处理拖拽事件，读取首个文本文件内容。
 * 返回 Promise<string|null>：非文件或非文本类返回 null，由调用方决定是否提示。
 */
export function readFileDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (!file) return Promise.resolve(null)
  const size = file.size
  const MB = 1024 * 1024
  if (size > 2 * MB) {
    return Promise.reject(`文件过大（${(size / MB).toFixed(1)}MB），支持 ≤ 2MB 的文本文件`)
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject('文件读取失败')
    reader.readAsText(file)
  })
}
