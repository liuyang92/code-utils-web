/**
 * JSON 深度对比工具：
 * - parseJsonSafe：安全解析 + 错误定位（行列）
 * - deepEqual / deepDiff：结构化深度差异（新增/删除/修改/类型变化/数组长度/数组顺序）
 * - canonicalize：键排序规范化（用于「忽略键顺序」的语义等价判断与文本模式）
 * - formatDiffReport：纯文本差异报告
 * 路径格式：$ 根，$.key，$.arr[0]，支持嵌套。
 */

/** 收敛类型判断：区分 array / object / null / 基础类型 */
export function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object') return 'object'
  return typeof v
}

/** 深度相等（与键顺序无关，null 严格区分） */
export function deepEqual(a, b, options = {}) {
  if (options.ignoreArrayOrder && typeOf(a) === 'array' && typeOf(b) === 'array') {
    if (a.length !== b.length) return false
    const as = [...a].map(cloneSafe).sort(compareAny)
    const bs = [...b].map(cloneSafe).sort(compareAny)
    return as.every((x, i) => deepEqual(x, bs[i]))
  }
  if (Object.is(a, b)) return true
  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) return false
  if (ta === 'array') {
    if (a.length !== b.length) return false
    return a.every((x, i) => deepEqual(x, b[i], options))
  }
  if (ta === 'object') {
    const ak = Object.keys(a)
    const bk = Object.keys(b)
    if (ak.length !== bk.length) return false
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false
      if (!deepEqual(a[k], b[k], options)) return false
    }
    return true
  }
  return false
}

/** 数组排序比较器（忽略顺序模式下使用） */
function compareAny(a, b) {
  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) return ta < tb ? -1 : 1
  if (ta === 'array' || ta === 'object') {
    const sa = stableStringify(a)
    const sb = stableStringify(b)
    return sa < sb ? -1 : sa > sb ? 1 : 0
  }
  if (ta === 'null') return 0
  if (a < b) return -1
  return a > b ? 1 : 0
}

/** 不修改输入的安全克隆（仅 JSON 安全数据） */
function cloneSafe(v) {
  if (typeOf(v) === 'object' || typeOf(v) === 'array') return JSON.parse(JSON.stringify(v))
  return v
}

/** 键排序后的稳定字符串化（用于比较与浅层排序） */
export function stableStringify(value) {
  const seen = new WeakSet()
  const walk = (v) => {
    const t = typeOf(v)
    if (t === 'array') {
      if (seen.has(v)) return null
      seen.add(v)
      return v.map(walk)
    }
    if (t === 'object') {
      if (seen.has(v)) return null
      seen.add(v)
      const out = {}
      for (const k of Object.keys(v).sort()) out[k] = walk(v[k])
      return out
    }
    return v
  }
  return JSON.stringify(walk(value))
}

/**
 * 手写递归下降 JSON 解析器（精确行列错误定位）。
 * 新版 V8 的 JSON.parse 报错已不带 position，故自实现以提供工具级定位。
 */
class JsonSyntaxError extends Error {
  constructor(message, pos) {
    super(message)
    this.pos = pos
  }
}

function posToLineColumn(text, pos) {
  const before = text.slice(0, pos)
  const lines = before.split(/\r\n|\r|\n/)
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  return { line, column }
}

function chr(text, i) {
  return i < text.length ? text[i] : ''
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9'
}

function isHex(ch) {
  return isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
}

function skipWs(text, i) {
  while (i < text.length) {
    const ch = text[i]
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') i++
    else break
  }
  return i
}

function parseStringValue(text, i) {
  // 入口：text[i] === '"'
  let out = ''
  i++ // 跳过开头引号
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"') return { value: out, next: i + 1 }
    if (ch === '\\') {
      const esc = text[i + 1]
      if (esc === undefined) throw new JsonSyntaxError('字符串未闭合（反斜杠后无字符）', i)
      if (esc === '"' || esc === '\\' || esc === '/') { out += esc; i += 2; continue }
      if (esc === 'b') { out += '\b'; i += 2; continue }
      if (esc === 'f') { out += '\f'; i += 2; continue }
      if (esc === 'n') { out += '\n'; i += 2; continue }
      if (esc === 'r') { out += '\r'; i += 2; continue }
      if (esc === 't') { out += '\t'; i += 2; continue }
      if (esc === 'u') {
        const hex = text.slice(i + 2, i + 6)
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new JsonSyntaxError('非法 Unicode 转义 \\u（需 4 位十六进制）', i)
        out += String.fromCharCode(parseInt(hex, 16))
        i += 6
        continue
      }
      throw new JsonSyntaxError(`非法转义 \\${esc}`, i)
    }
    if (ch === '\n' || ch === '\r') throw new JsonSyntaxError('字符串未闭合（遇到换行）', i)
    out += ch
    i++
  }
  throw new JsonSyntaxError('字符串未闭合（缺少结尾引号）', i)
}

function parseNumberValue(text, i) {
  const start = i
  if (chr(text, i) === '-') i++
  if (!isDigit(chr(text, i))) throw new JsonSyntaxError('非法数字（整数部分缺失）', i)
  if (chr(text, i) === '0') {
    i++
    if (isDigit(chr(text, i))) throw new JsonSyntaxError('数字前导零非法', i)
  } else {
    while (isDigit(chr(text, i))) i++
  }
  if (chr(text, i) === '.') {
    i++
    if (!isDigit(chr(text, i))) throw new JsonSyntaxError('小数部分缺失', i)
    while (isDigit(chr(text, i))) i++
  }
  if (chr(text, i) === 'e' || chr(text, i) === 'E') {
    i++
    if (chr(text, i) === '+' || chr(text, i) === '-') i++
    if (!isDigit(chr(text, i))) throw new JsonSyntaxError('指数部分缺失', i)
    while (isDigit(chr(text, i))) i++
  }
  const raw = text.slice(start, i)
  return { value: Number(raw), next: i }
}

function parseValue(text, i) {
  i = skipWs(text, i)
  if (i >= text.length) throw new JsonSyntaxError('内容为空或不完整', i)
  const ch = text[i]
  if (ch === '{') return parseObject(text, i)
  if (ch === '[') return parseArray(text, i)
  if (ch === '"') return parseStringValue(text, i)
  if (ch === '-' || isDigit(ch)) return parseNumberValue(text, i)
  if (text.startsWith('true', i)) return { value: true, next: i + 4 }
  if (text.startsWith('false', i)) return { value: false, next: i + 5 }
  if (text.startsWith('null', i)) return { value: null, next: i + 4 }
  throw new JsonSyntaxError(`意外字符「${ch}」`, i)
}

function parseObject(text, i) {
  const obj = {}
  i++ // 跳过 {
  i = skipWs(text, i)
  if (chr(text, i) === '}') return { value: obj, next: i + 1 }
  while (true) {
    i = skipWs(text, i)
    if (i >= text.length) throw new JsonSyntaxError('对象未闭合（缺少 }）', i)
    if (chr(text, i) !== '"') throw new JsonSyntaxError(`对象键应为字符串，遇到「${chr(text, i) || '结尾'}」`, i)
    const keyRes = parseStringValue(text, i)
    i = skipWs(text, keyRes.next)
    if (i >= text.length) throw new JsonSyntaxError('对象未闭合（缺少 }）', i)
    if (chr(text, i) !== ':') throw new JsonSyntaxError(`缺少冒号，遇到「${chr(text, i) || '结尾'}」`, i)
    i++
    const valRes = parseValue(text, i)
    obj[keyRes.value] = valRes.value // 重复键遵循标准 JSON：后者覆盖
    i = skipWs(text, valRes.next)
    if (chr(text, i) === ',') { i++; continue }
    if (chr(text, i) === '}') return { value: obj, next: i + 1 }
    throw new JsonSyntaxError(`对象缺少逗号或 }，遇到「${chr(text, i) || '结尾'}」`, i)
  }
}

function parseArray(text, i) {
  const arr = []
  i++ // 跳过 [
  i = skipWs(text, i)
  if (chr(text, i) === ']') return { value: arr, next: i + 1 }
  while (true) {
    const valRes = parseValue(text, i)
    arr.push(valRes.value)
    i = skipWs(text, valRes.next)
    if (chr(text, i) === ',') { i++; continue }
    if (chr(text, i) === ']') return { value: arr, next: i + 1 }
    if (i >= text.length) throw new JsonSyntaxError('数组未闭合（缺少 ]）', i)
    throw new JsonSyntaxError(`数组缺少逗号或 ]，遇到「${chr(text, i) || '结尾'}」`, i)
  }
}

/**
 * 解析 JSON 文本。成功 {ok:true, value}；失败 {ok:false, error, line, column}。
 */
export function parseJsonSafe(text) {
  const raw = typeof text === 'string' ? text : ''
  if (!raw.trim()) return { ok: false, error: '内容为空', line: 0, column: 0 }
  try {
    let i = skipWs(raw, 0)
    if (i >= raw.length) throw new JsonSyntaxError('内容为空或不完整', 0)
    const first = parseValue(raw, i)
    const after = skipWs(raw, first.next)
    if (after < raw.length) throw new JsonSyntaxError(`JSON 后有多余内容「${raw[after]}」`, after)
    return { ok: true, value: first.value }
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      const { line, column } = posToLineColumn(raw, Math.max(0, Math.min(e.pos ?? 0, raw.length)))
      return { ok: false, error: e.message, line, column }
    }
    return { ok: false, error: e?.message || '解析失败', line: 0, column: 0 }
  }
}

/**
 * 键集合并集（按 a 的键序在前，b 的独有键在后），保证差异顺序稳定可读。
 */
function orderedUnionKeys(a, b) {
  const seen = new Set(Object.keys(a))
  const extra = Object.keys(b).filter((k) => !seen.has(k))
  return [...Object.keys(a), ...extra]
}

/**
 * 深度差异。返回 entries：{ path, kind, key?, index?, left?, right?, typeLeft?, typeRight? }
 * kind: 'added' | 'removed' | 'valueChanged' | 'typeChanged' | 'arrayOrderChanged'
 * a = 旧值，b = 新值；added 表示 b 比 a 多出的部分，removed 反之。
 */
export function deepDiff(a, b, options = {}) {
  const out = []
  const ignoreArrayOrder = !!options.ignoreArrayOrder

  const cmp = (x, y, path) => {
    if (deepEqual(x, y, options)) return
    const tx = typeOf(x)
    const ty = typeOf(y)
    if (tx !== ty) {
      out.push({ path, kind: 'typeChanged', left: x, right: y, typeLeft: tx, typeRight: ty })
      return
    }
    if (tx === 'array') {
      if (ignoreArrayOrder) {
        // 多重集差异：贪心配对（deepEqual），未配对的 a 元素 → 删除，未配对的 b 元素 → 新增
        const bPool = [...y]
        const aUnmatched = []
        for (const elem of x) {
          const idx = bPool.findIndex((pe) => deepEqual(elem, pe))
          if (idx === -1) aUnmatched.push(elem)
          else bPool.splice(idx, 1)
        }
        for (const elem of aUnmatched) out.push({ path, kind: 'removed', left: elem })
        for (const elem of bPool) out.push({ path, kind: 'added', right: elem })
        return
      }
      const n = Math.max(x.length, y.length)
      for (let i = 0; i < n; i++) {
        const p = `${path}[${i}]`
        if (i >= x.length) out.push({ path: p, kind: 'added', right: y[i], index: i })
        else if (i >= y.length) out.push({ path: p, kind: 'removed', left: x[i], index: i })
        else cmp(x[i], y[i], p)
      }
      return
    }
    if (tx === 'object') {
      for (const k of orderedUnionKeys(x, y)) {
        const p = `${path}.${k}`
        const inX = Object.prototype.hasOwnProperty.call(x, k)
        const inY = Object.prototype.hasOwnProperty.call(y, k)
        if (inX && !inY) out.push({ path: p, kind: 'removed', left: x[k], key: k })
        else if (!inX && inY) out.push({ path: p, kind: 'added', right: y[k], key: k })
        else cmp(x[k], y[k], p)
      }
      return
    }
    out.push({ path, kind: 'valueChanged', left: x, right: y, typeLeft: tx, typeRight: ty })
  }

  cmp(a, b, '$')
  return out
}

/** 差异统计：按 kind 计数，含 total */
export function diffStatsByKind(entries) {
  const stats = { added: 0, removed: 0, valueChanged: 0, typeChanged: 0, total: entries.length }
  for (const e of entries) {
    if (stats[e.kind] !== undefined) stats[e.kind]++
  }
  return stats
}

export function kindLabel(kind) {
  return {
    added: '新增',
    removed: '删除',
    valueChanged: '修改',
    typeChanged: '类型变化'
  }[kind] || kind
}

/** 用于差异列表的值展示（截断 + 紧凑 JSON） */
export function formatValue(v, maxLen = 120) {
  if (v === undefined) return '—'
  const t = typeOf(v)
  if (t === 'string') {
    const s = JSON.stringify(v)
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
  }
  if (t === 'object' || t === 'array') {
    const s = JSON.stringify(v)
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s
  }
  if (t === 'null') return 'null'
  return String(v)
}

/** 生成纯文本差异报告（便于复制/存档） */
export function formatDiffReport(entries, aLabel = 'A', bLabel = 'B') {
  if (!entries.length) return '两段 JSON 完全一致（含键顺序语义等价）'
  const lines = []
  for (const e of entries) {
    const tag = kindLabel(e.kind)
    if (e.kind === 'added') {
      lines.push(`[新增] ${e.path} = ${formatValue(e.right, 200)}`)
    } else if (e.kind === 'removed') {
      lines.push(`[删除] ${e.path} = ${formatValue(e.left, 200)}`)
    } else if (e.kind === 'typeChanged') {
      lines.push(`[类型] ${e.path}: ${aLabel}=${formatValue(e.left, 200)} (${e.typeLeft}) → ${bLabel}=${formatValue(e.right, 200)} (${e.typeRight})`)
    } else {
      lines.push(`[修改] ${e.path}: ${formatValue(e.left, 200)} → ${formatValue(e.right, 200)}`)
    }
  }
  return lines.join('\n')
}

/**
 * 键排序规范化（语义等价用）。
 * options: { sortKeys=true, sortArrays=false }
 */
export function canonicalize(value, options = {}) {
  const sortKeys = options.sortKeys !== false
  const sortArrays = !!options.sortArrays
  const walk = (v) => {
    const t = typeOf(v)
    if (t === 'array') {
      const arr = v.map(walk)
      return sortArrays ? [...arr].sort(compareAny) : arr
    }
    if (t === 'object') {
      const out = {}
      const keys = sortKeys ? Object.keys(v).sort() : Object.keys(v)
      for (const k of keys) out[k] = walk(v[k])
      return out
    }
    return v
  }
  return walk(value)
}
