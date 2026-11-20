/**
 * cURL 命令解析（接口测试导入方向）。
 * 支持单引号/双引号/$'...'、反斜杠续行、-X/-H/-d/--data/--data-raw/--data-binary/-F/-u/--compressed。
 * 输出与接口测试工具结构对齐：{ method, url, headers, bodyType, rawLang, rawBody, formData, urlencoded }
 */

const DOUBLE_QUOTED = /\\(["\\$`])/g

function unescapeDouble(s) {
  return s.replace(DOUBLE_QUOTED, '$1')
}

function unescapeSingle(s) {
  return s.replace(/\\'/g, "'")
}

function unescapeDollar(s) {
  // $'...' 支持 \n \t \r \\
  return s.replace(/\\(n|t|r|\\)/g, (m, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '\r' : '\\'))
}

/** 将一段 cURL 文本按 shell 规则拆成参数数组 */
export function tokenizeCurl(input) {
  const s = String(input || '').replace(/\\\r?\n/g, ' ') // 续行合并
  const tokens = []
  let i = 0
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++
    if (i >= s.length) break
    let tok = ''
    while (i < s.length && !/\s/.test(s[i])) {
      const c = s[i]
      if (c === "'") {
        i++
        while (i < s.length && s[i] !== "'") {
          if (s[i] === '\\' && s[i + 1] === "'") {
            tok += "'"
            i += 2
          } else tok += s[i++]
        }
        i++ // 跳过右引号
      } else if (c === '"') {
        i++
        while (i < s.length && s[i] !== '"') {
          if (s[i] === '\\' && s[i + 1] === '"') {
            tok += '"'
            i += 2
          } else if (s[i] === '\\' && s[i + 1] === '\\') {
            tok += '\\'
            i += 2
          } else tok += s[i++]
        }
        i++ // 跳过右引号
      } else {
        tok += c
        i++
      }
    }
    if (tok !== '') tokens.push(tok)
  }
  return tokens
}

const KNOWN_LONG = new Set(['--request', '--header', '--data', '--data-raw', '--data-binary', '--data-urlencode', '--form', '--user', '--url', '--compressed', '--location', '--insecure'])

/**
 * 解析 cURL。
 * 宽松策略：未知选项跳过其值不报错；仅当完全没有 URL/数据时报错。
 */
export function parseCurl(input) {
  if (typeof input !== 'string' || !input.trim()) return { ok: false, error: '请粘贴 cURL 命令' }
  let s = input.trim()
  const m = /^curl(?:\s+|$)([\s\S]*)$/.exec(s)
  const actual = m ? m[1] : s
  const tokens = tokenizeCurl(actual)
  if (!tokens.length) return { ok: false, error: '未解析到任何参数' }

  const result = {
    method: 'GET',
    url: '',
    headers: [],
    bodyType: 'none',
    rawLang: 'text',
    rawBody: '',
    formData: [],
    urlencoded: []
  }
  let sawBodyFlag = null // 'data' | 'form' | 'urlencode'
  const dataParts = []
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === '-X' || t === '--request') {
      const v = tokens[++i]
      if (v) result.method = v.toUpperCase()
      i += 1
      continue
    }
    if (t === '-H' || t === '--header') {
      const v = tokens[++i]
      if (v) result.headers.push(v)
      i += 1
      continue
    }
    if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      const v = tokens[++i]
      if (v !== undefined) {
        sawBodyFlag = 'data'
        dataParts.push(v)
      }
      i += 1
      continue
    }
    if (t === '--data-urlencode') {
      const v = tokens[++i]
      if (v !== undefined) {
        sawBodyFlag = 'urlencode'
        const eq = v.indexOf('=')
        if (eq >= 0) result.urlencoded.push({ key: v.slice(0, eq), value: v.slice(eq + 1) })
        else result.urlencoded.push({ key: '', value: v })
      }
      i += 1
      continue
    }
    if (t === '-F' || t === '--form') {
      const v = tokens[++i]
      if (v !== undefined) {
        sawBodyFlag = 'form'
        const eq = v.indexOf('=')
        if (eq >= 0) result.formData.push({ key: v.slice(0, eq), value: v.slice(eq + 1), checked: true })
        else result.formData.push({ key: v, value: '', checked: true })
      }
      i += 1
      continue
    }
    if (t === '-u' || t === '--user') {
      const v = tokens[++i]
      if (v) {
        const b64 = typeof btoa === 'function' ? btoa(v) : Buffer.from(v).toString('base64')
        result.headers.push(`Authorization: Basic ${b64}`)
      }
      i += 1
      continue
    }
    if (KNOWN_LONG.has(t) || /^-[A-Za-z-]+$/.test(t)) {
      // 其它短/长选项：带值的长选项跳值，短选项不跳
      i += KNOWN_LONG.has(t) ? 2 : 1
      continue
    }
    // 首个非选项 token 视为 URL
    if (!result.url) result.url = t
    i += 1
  }

  if (!result.url && !dataParts.length && !result.formData.length && !result.urlencoded.length) {
    return { ok: false, error: '未找到 URL 或请求体参数' }
  }

  // 组装 body
  if (sawBodyFlag === 'data') {
    result.bodyType = 'raw'
    result.rawBody = dataParts.join('&')
    const isJsonStart = /^[\s]*[[]|[{]/.test(result.rawBody)
    result.rawLang = isJsonStart ? 'json' : 'text'
    const lower = result.rawBody.toLowerCase()
    if (lower.includes('<') && lower.includes('>')) result.rawLang = 'text'
    const hasCt = result.headers.some((h) => /^content-type\s*:/i.test(h))
    if (!hasCt) {
      const isUrlEncoded = /^[^=]*=[^&]*(&[^=]*=[^&]*)*$/.test(result.rawBody) && result.rawBody.includes('=')
      if (isUrlEncoded && !isJsonStart) {
        // -d 'a=1&b=2' 常见为 x-www-form-urlencoded
        const usp = new URLSearchParams(result.rawBody)
        for (const [k, v] of usp.entries()) result.urlencoded.push({ key: k, value: v })
        if (result.urlencoded.length) {
          result.bodyType = 'x-www-form-urlencoded'
          result.headers.push('Content-Type: application/x-www-form-urlencoded')
          result.rawBody = ''
        }
      } else if (isJsonStart) {
        result.headers.push('Content-Type: application/json')
      }
    }
  } else if (sawBodyFlag === 'form') {
    result.bodyType = 'form-data'
    if (result.method === 'GET' || result.method === 'HEAD') result.method = 'POST'
  } else if (sawBodyFlag === 'urlencode') {
    result.bodyType = 'x-www-form-urlencoded'
  }

  const headers = []
  const seen = new Set()
  for (const h of result.headers) {
    const idx = h.indexOf(':')
    if (idx === -1) continue
    const k = h.slice(0, idx).trim()
    if (!k) continue
    if (k.toLowerCase() === 'content-type' && seen.has('content-type')) continue
    seen.add(k.toLowerCase())
    headers.push({ key: k, value: h.slice(idx + 1).trim() })
  }
  result.headers = headers

  return { ok: true, ...result }
}
