/**
 * 错误归一化：各种引擎抛出的错误统一成 { message, line?, column? }
 */

export function offsetToLineCol(text, offset) {
  if (typeof offset !== 'number' || offset < 0 || offset > text.length) return null
  let line = 1
  let lastLf = -1
  for (let i = 0; i < offset; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      lastLf = i
    }
  }
  const column = offset - lastLf
  return { line, column }
}

/** 去掉 Prettier 报错里带路径/坐标的前缀，例如 "(json:1:3) Unexpected token" */
function cleanMessage(message = '') {
  return String(message)
    .replace(/^\(([^()]+:\d+:\d+)\)\s*/, '')
    .replace(/\s*\((parser|file|code)":?[^)]*\)\s*/i, '')
    .trim()
}

/** Prettier SyntaxError：通常带 loc: { start: { line, column } } */
export function normalizePrettierError(e) {
  const message = cleanMessage(e?.message || '格式化失败')
  let line = 0
  let column = 0
  const loc = e?.loc?.start
  if (loc) {
    line = loc.line || 0
    column = loc.column || 0
  } else {
    const found = String(e?.message || '').match(/\((?:[\w-]+):(\d+):(\d+)\)/)
    if (found) {
      line = Number(found[1]) || 0
      column = Number(found[2]) || 0
    }
  }
  return { message, line, column }
}

/** JSON.parse 报错：新版本 V8 会在 message 里附带 position / (line x column y) */
export function normalizeJsonError(e, source) {
  // 剥离消息尾部的位置后缀（位置信息由状态行徽章单独展示，避免重复）
  const message = cleanMessage(e?.message || '无效的 JSON')
    .replace(/\s*\(line \d+ column \d+\)\s*$/, '')
    .replace(/\s*at position \d+\s*$/, '')
    .trim()
  if (!source) return { message, line: 0, column: 0 }
  let line = 0
  let column = 0
  const locMatch = String(e?.message || '').match(/line (\d+) column (\d+)/)
  if (locMatch) {
    line = Number(locMatch[1]) || 0
    column = Number(locMatch[2]) || 0
  } else {
    const posMatch = String(e?.message || '').match(/position (\d+)/)
    if (posMatch) {
      const loc = offsetToLineCol(source, Number(posMatch[1]) || 0)
      if (loc) {
        line = loc.line
        column = loc.column
      }
    }
  }
  return { message, line, column }
}

export function plainError(e) {
  return { message: cleanMessage(e?.message || String(e)) }
}
