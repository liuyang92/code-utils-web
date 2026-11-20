/**
 * CSV / JSON 互转。
 * - parseCsv(text, { header }) →无 header 时返回 string[][]，有 header 时返回 object[]
 * - jsonToCsv(rows) → 字符串
 * - csvToJson(text, { header }) → object[]（带 header 推断）
 */

export function parseCsv(text, opts = {}) {
  const s = String(text)
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ }
        else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else if (c === '\r') {
      // 忽略，\n 处理行结束
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  const trimmed = rows.filter((r) => r.some((c) => c !== ''))
  return trimmed
}

export function csvToJson(text, opts = {}) {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const header = rows[0].map((h, i) => h.trim() || `col${i + 1}`)
  const body = rows.slice(1)
  const autoConvert = opts.autoConvert !== false
  return body.map((r) => {
    const obj = {}
    for (let i = 0; i < header.length; i++) {
      const key = header[i] || `col${i}`
      let v = r[i] === undefined ? '' : r[i]
      if (autoConvert) {
        if (v === 'true') v = true
        else if (v === 'false') v = false
        else if (v === 'null') v = null
        else if (v !== '' && !isNaN(Number(v))) v = Number(v)
      }
      obj[key] = v
    }
    return obj
  })
}

export function csvToJsonArray(text) {
  return parseCsv(text)
}

export function jsonToCsv(data, opts = {}) {
  if (!Array.isArray(data)) throw new Error('JSON 必须是数组才能转 CSV')
  if (!data.length) return ''
  const keys = opts.keys || Array.from(new Set(data.flatMap((r) => (r && typeof r === 'object' ? Object.keys(r) : []))))
  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const lines = [keys.map(esc).join(',')]
  for (const row of data) {
    lines.push(keys.map((k) => esc(row?.[k])).join(','))
  }
  return lines.join('\n')
}


/**
 * CSV → Markdown 表格
 * 输入已被 parseCsv 拆成二维数组的表格，表头行自动按首行处理。
 */
export function csvTableToMarkdown(rows, { align = '---' } = {}) {
  if (!Array.isArray(rows) || !rows.length) return ''
  const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const sanitize = (rows) => rows.map((r) => Array.isArray(r) ? r : [r])
  const safe = sanitize(rows)
  const width = Math.max(...safe.map((r) => r.length))
  const pad = (r) => {
    const out = [...r]
    while (out.length < width) out.push('')
    return out
  }
  const header = pad(safe[0]).map(esc)
  const body = safe.slice(1).map((r) => pad(r).map(esc))
  const lines = [`| ${header.join(' | ')} |`]
  const alignRow = Array.from({ length: width }, () => {
    if (align === 'left') return ':---'
    if (align === 'center') return ':---:'
    if (align === 'right') return '---:'
    return '---'
  })
  lines.push(`| ${alignRow.join(' | ')} |`)
  for (const r of body) lines.push(`| ${r.join(' | ')} |`)
  return lines.join('\n')
}

export function csvToMarkdown(text, opts = {}) {
  return csvTableToMarkdown(parseCsv(text), opts)
}

/**
 * Markdown 管道表格 → CSV
 * 支持 GFM 表格（含对齐分隔行）；转义 | 还原。
 */
export function markdownToCsv(md) {
  const lines = String(md || '').split(/\r?\n/)
  // 提取以 | 开头/结尾的表格行块
  const block = []
  let inBlock = false
  for (const line of lines) {
    const t = line.trim()
    const isRow = t.startsWith('|') && t.endsWith('|') && t.length > 1
    if (isRow) {
      block.push(t)
      inBlock = true
    } else if (inBlock) break
  }
  if (!block.length) return ''
  const isSep = (s) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(s)
  const rows = block.filter((s) => !isSep(s))
  const table = rows.map((line) => {
    const inner = line.slice(1, -1)
    const cells = inner.split('|').map((c) => c.trim().replace(/\\\|/g, '|').replace(/\\n/g, '\n'))
    return cells
  })
  const header = table[0].length ? table[0] : Array.from({ length: table[0].length }, (_, i) => `col${i + 1}`)
  return jsonToCsv(table.slice(1).map((r) => Object.fromEntries(r.map((v, j) => [header[j] || `col${j + 1}`, v]))),
    { keys: header.map((h, i) => (h ? h : `col${i + 1}`)) })
}
