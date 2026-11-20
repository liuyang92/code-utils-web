/**
 * 文本/行处理工具集：大小写互转、行排序、去重、统计。
 */

function lowerFirst(s) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
function upperFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** 分词：camelCase / PascalCase / snake_case / kebab-case / 空格混合 */
export function splitWords(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')        // camelCase → camel Case
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')     // HTTPServer → HTTP Server
    .replace(/[_\-./]+/g, ' ')                     // 分隔符统一为空格
    .split(/\s+/)
    .filter(Boolean)
}

export const CASE_FORMATS = {
  camelCase: (words) => words.map((w, i) => (i === 0 ? w.toLowerCase() : upperFirst(w.toLowerCase()))).join(''),
  PascalCase: (words) => words.map((w) => upperFirst(w.toLowerCase())).join(''),
  snake_case: (words) => words.map((w) => w.toLowerCase()).join('_'),
  'kebab-case': (words) => words.map((w) => w.toLowerCase()).join('-'),
  CONSTANT_CASE: (words) => words.map((w) => w.toUpperCase()).join('_'),
  'dot.case': (words) => words.map((w) => w.toLowerCase()).join('.'),
  'Title Case': (words) => words.map((w) => upperFirst(w.toLowerCase())).join(' '),
  'Sentence case': (words) => words.map((w, i) => (i === 0 ? upperFirst(w.toLowerCase()) : w.toLowerCase())).join(' ')
}

/** 把文本转换为指定大小写格式 */
export function toCase(text, format) {
  const fn = CASE_FORMATS[format]
  if (!fn) throw new Error(`不支持的格式：${format}`)
  return fn(splitWords(text))
}

/** 把多行文本整体做大小写转换（每行独立处理，行内按词转换） */
export function changeCaseLines(text, format) {
  const lines = String(text).split(/\r\n|\r|\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim()) lines[i] = toCase(line, format)
  }
  return lines.join('\n')
}

/**
 * 行操作。
 * @param {string} text  多行文本
 * @param {object} opts
 *  - sort: 'none' | 'asc' | 'desc' | 'nasc' | 'ndesc'（n 前缀为数值排序）
 *  - unique: boolean  去重（保留首次出现顺序，若同时排序则在排序后去重）
 *  - trim: boolean    去除每行首尾空白
 *  - dropEmpty: boolean  删除空行
 */
export function lineOps(text, opts = {}) {
  const lines = String(text).split(/\r\n|\r|\n/)
  if (opts.trim) {
    for (let i = 0; i < lines.length; i++) lines[i] = lines[i].trim()
  }
  if (opts.dropEmpty) {
    for (let i = lines.length - 1; i >= 0; i--) if (!lines[i]) lines.splice(i, 1)
  }
  if (opts.sort && opts.sort !== 'none') {
    const dir = opts.sort.endsWith('desc') ? -1 : 1
    const numeric = opts.sort.startsWith('n')
    lines.sort((a, b) => {
      if (numeric) {
        const na = parseFloat(a)
        const nb = parseFloat(b)
        if (!isNaN(na) && !isNaN(nb) && na !== nb) return (na - nb) * dir
      }
      return a.localeCompare(b, 'zh-Hans-CN') * dir
    })
  }
  if (opts.unique) {
    const seen = new Set()
    const out = []
    for (const l of lines) {
      if (!seen.has(l)) {
        seen.add(l)
        out.push(l)
      }
    }
    return out.join('\n')
  }
  return lines.join('\n')
}

/** 统计信息 */
export function textStats(text) {
  const s = String(text)
  const lines = s === '' ? 0 : s.split(/\r\n|\r|\n/).length
  const chars = s.length
  const charsNoSpace = s.replace(/\s/g, '').length
  const words = (s.match(/[\w\u4e00-\u9fff]+/g) || []).length
  const sentences = (s.match(/[^。！？!?.\n]+[。！？!?]?/g) || []).filter((x) => x.trim()).length
  const paragraphs = s.split(/\n\s*\n/).filter((p) => p.trim()).length
  return { lines, chars, charsNoSpace, words, sentences, paragraphs }
}

/** 提取模式注册表 */
export const EXTRACT_PATTERNS = {
  url: { label: 'URL', re: /https?:\/\/[^\s"'<>()\[\]，。；、]+/gi },
  email: { label: '邮箱', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  phone: { label: '手机号', re: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
  ipv4: { label: 'IPv4', re: /(?<!\d)(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}(?!\d)/g },
  number: { label: '数字', re: /-?\d+(?:\.\d+)?/g },
  chinese: { label: '中文', re: /[\u4e00-\u9fff]+/g }
}

function runExtract(re, text) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g'
  const r = new RegExp(re.source, flags)
  const out = []
  let m
  let guard = 0
  while ((m = r.exec(text)) !== null && guard++ < 100000) {
    out.push(m[0])
    if (m[0].length === 0) r.lastIndex++
  }
  return out
}

/** 按预置模式提取 */
export function extractByPattern(text, key, { unique = true } = {}) {
  const p = EXTRACT_PATTERNS[key]
  if (!p) throw new Error(`未知提取模式：${key}`)
  const all = runExtract(p.re, String(text || ''))
  return unique ? [...new Set(all)] : all
}

/** 按自定义正则提取 */
export function extractByRegex(text, source, flags = 'g', { unique = true } = {}) {
  const r = new RegExp(source, flags.includes('g') ? flags : flags + 'g')
  const all = runExtract(r, String(text || ''))
  return unique ? [...new Set(all)] : all
}
