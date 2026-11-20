/**
 * 压缩工具集。各引擎错误统一抛出，由视图层捕获后经 errors.plainError 展示。
 */
import { minify as terserMinify } from 'terser'
import { minify as cssoMinify } from 'csso'

export function minifyJson(code) {
  const obj = JSON.parse(code)
  return JSON.stringify(obj)
}

export async function minifyJs(code) {
  const result = await terserMinify(code, {
    module: false,
    compress: { drop_console: false, passes: 2 },
    format: { comments: false }
  })
  if (result.error) throw result.error
  if (result.code == null) throw new Error('压缩失败，请检查 JS 语法')
  return result.code
}

export function minifyCss(code) {
  const result = cssoMinify(code, { forceMediaMerge: false })
  return result.css
}

const RAW_TAGS = /(<(script|style|pre|textarea)\b[\s\S]*?<\/\2>)/gi

/**
 * 轻量 HTML 压缩：去注释、折叠空白、合并相邻标签间的空白。
 * script/style/pre/textarea 内部内容原样保留。
 */
export function minifyHtml(code) {
  const store = []
  const protectedCode = code.replace(RAW_TAGS, (m) => {
    store.push(m)
    return `\u0001${store.length - 1}\u0002`
  })
  let out = protectedCode
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
  out = out.replace(/\u0001(\d+)\u0002/g, (_, i) => store[Number(i)])
  return out
}

export function minifyXml(code) {
  return code
    .replace(/<!--(?!\[)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim()
}

const SQL_ALIAS = {
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlite: 'sqlite',
  tsql: 'tsql',
  plsql: 'plsql',
  mariadb: 'mariadb',
  db2: 'db2',
  transactsql: 'tsql'
}

const MERGE_DIALECTS = new Set(['tsql', 'transactsql', 'db2', 'plsql'])

/**
 * SQL 压缩（不依赖 sql-formatter，自行处理）：
 * - 去掉 -- 与 /* *!/ 注释（注释两侧均为词字符时补一个空格，避免粘连）
 * - 折叠空白：两侧都是词字符（含 *）时保留单个空格，其余丢弃
 * - 字符串字面量（'...' 含 '' 转义、"..." 标识符、\`...\`）原样保留
 * - dialect 用于决定别名（虽不参与压缩逻辑，保留参数兼容调用方）
 */
export function minifySql(code, dialect = 'mysql') {
  let out = ''
  let i = 0
  const n = code.length
  const isWord = (ch) => /\w/.test(ch)

  const prevChar = () => (out.length ? out[out.length - 1] : '')
  const nextChar = (j) => (j < n ? code[j] : '')
  // 词与词、词与引号/反引号/星号/美元符之间必须保留一个空格，
  // 引号/反引号/右括号与后面的词之间同理，防止 token 粘合。
  // 字符类用 \x27(') \x22(") \x60(`) 十六进制转义，避免引号/反引号的字符串转义问题。
  const keepSpaceAt = (j) => {
    const prev = prevChar()
    const next = nextChar(j)
    if (isWord(prev) && (isWord(next) || /[\x27\x22\x60*$]/.test(next))) {
      out += ' '
    } else if (isWord(next) && (isWord(prev) || /[)\x27\x22\x60*$]/.test(prev))) {
      out += ' '
    }
  }

  while (i < n) {
    const c = code[i]
    // 单引号字符串（含 '' 转义）
    if (c === "'") {
      out += c
      i++
      while (i < n) {
        out += code[i]
        if (code[i] === "'") {
          if (code[i + 1] === "'") {
            out += code[i + 1]
            i += 2
            continue
          }
          i++
          break
        }
        i++
      }
      continue
    }
    // 双引号标识符
    if (c === '"') {
      out += c
      i++
      while (i < n && code[i] !== '"') {
        out += code[i]
        i++
      }
      if (i < n) {
        out += code[i]
        i++
      }
      continue
    }
    // MySQL 反引号标识符
    if (c === '\`') {
      out += c
      i++
      while (i < n && code[i] !== '\`') {
        out += code[i]
        i++
      }
      if (i < n) {
        out += code[i]
        i++
      }
      continue
    }
    // 行注释 --
    if (c === '-' && code[i + 1] === '-') {
      while (i < n && code[i] !== '\n') i++
      if (i < n) i++
      keepSpaceAt(i)
      continue
    }
    // 块注释 /* */
    if (c === '/' && code[i + 1] === '*') {
      i += 2
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      keepSpaceAt(i)
      continue
    }
    // 空白折叠
    if (/\s/.test(c)) {
      let j = i
      while (j < n && /\s/.test(code[j])) j++
      keepSpaceAt(j)
      i = j
      continue
    }
    out += c
    i++
  }
  return out.trim()
}

/**
 * 校验 SQL 能否被 sql-formatter 解析（用于压缩前的语法检查）。
 * MERGE_DIALECTS 里的方言在 sql-formatter 中支持有限，直接跳过校验。
 */
export async function validateSql(code, dialect = 'mysql') {
  if (MERGE_DIALECTS.has(dialect)) return true
  const { format } = await import('sql-formatter')
  format(code, { language: SQL_ALIAS[dialect] || 'mysql' })
  return true
}
