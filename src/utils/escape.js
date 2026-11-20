/**
 * Unicode / HTML 实体转义工具。
 */

/** 解码 JS unicode 转义：\u4e2d \u{1f600}（ES6 码点写法） */
export function decodeUnicodeEscape(text) {
  return text.replace(/\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})/g, (m, braced, plain) => {
    const cp = parseInt(braced || plain, 16)
    if (cp > 0x10ffff || cp < 0) return m
    return String.fromCodePoint(cp)
  })
}

/** 把字符串编码成 JS unicode 转义（默认仅转义非 ASCII，emoji 用 \u{...}） */
export function encodeUnicodeEscape(text, { asciiOnly = true } = {}) {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (!asciiOnly || cp > 0x7f) {
      out += cp > 0xffff ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, '0')}`
    } else {
      out += ch
    }
  }
  return out
}

/** 常用 HTML 命名实体表（键为字符，值为实体串） */
export const NAMED_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
  ' ': '&nbsp;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '→': '&rarr;',
  '…': '&hellip;'
}

/** 编码 HTML 实体：named=标签字符用命名实体，其余用十六进制数字实体；decimal/decimal-ascii 为数字实体模式 */
export function encodeHtmlEntities(text, { mode = 'named' } = {}) {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (mode === 'named' && NAMED_ENTITIES[ch]) {
      out += NAMED_ENTITIES[ch]
    } else if (mode === 'named-all') {
      out += NAMED_ENTITIES[ch] || (cp > 0x7f ? `&#x${cp.toString(16)};` : ch)
    } else if (mode === 'decimal') {
      out += cp > 0x7f || /[&<>"']/.test(ch) ? `&#${cp};` : ch
    } else {
      // named 是默认：标签字符命名 + 其它非 ASCII 数字实体
      out += cp > 0x7f ? `&#x${cp.toString(16)};` : ch
    }
  }
  return out
}

/** 解码 HTML 实体（命名 + 十进制 + 十六进制），未识别原样保留 */
export function decodeHtmlEntities(text) {
  let out = text
  for (const [ch, ent] of Object.entries(NAMED_ENTITIES)) {
    out = out.split(ent).join(ch)
  }
  out = out.replace(/&#(\d+);/g, (m, d) => {
    const cp = Number(d)
    return cp > 0x10ffff || cp <= 0 ? m : String.fromCodePoint(cp)
  })
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (m, h) => {
    const cp = parseInt(h, 16)
    return cp > 0x10ffff || cp <= 0 ? m : String.fromCodePoint(cp)
  })
  return out
}

/** 综合解码：JS unicode 转义 + HTML 实体一起处理 */
export function decodeAll(text) {
  return decodeHtmlEntities(decodeUnicodeEscape(text))
}
