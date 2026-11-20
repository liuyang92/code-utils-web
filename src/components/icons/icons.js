/**
 * 图标体系（自动收集）
 *
 * 图标以独立 SVG 文件存放在 src/assets/svgs/，文件名即图标名。
 * 新增/删除图标只需增删 .svg 文件，无需改动本文件。
 *
 * 图标规范（每个文件必须保持一致，以便整体风格统一）：
 * - 24x24 viewBox、线性描边风格（类 Feather）
 * - fill="none" stroke="currentColor" stroke-width="2"
 * - 使用 line/rect/circle/path/polyline/polygon 等基本图形
 *   （避免 <g> 嵌套与 transform，运行端只提取 <svg> 的内部内容）
 */
const svgModules = import.meta.glob('@/assets/svgs/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

function extractInner(raw) {
  const m = String(raw).match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  return m ? m[1].trim() : ''
}

export const ICONS = Object.fromEntries(
  Object.entries(svgModules).map(([path, raw]) => {
    const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)
    return [name, extractInner(raw)]
  })
)

export const ICON_NAMES = Object.keys(ICONS).sort((a, b) => a.localeCompare(b))
