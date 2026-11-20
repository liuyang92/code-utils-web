/**
 * 条形码编码（输入 → 模块位串），零依赖纯函数。
 * 支持 Code 128（自动选 B/C 子集，快递单号首选）、Code 39、EAN-13。
 * 输出统一为 { ok, bits }：bits 为 '0'/'1' 字符串，1=条(bar)，0=空(space)。
 */

/** Code 128 条/空宽度模式表（0-102 数据字符，103-105 起始符，106 停止符）。
 * 每项 6 位数字（bar space bar space bar space），宽度和=11；停止符 7 位数字和=13。 */
const C128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
]
const C128_START_A = 103
const C128_START_B = 104
const C128_START_C = 105
const C128_STOP = 106

function patternToBits(pattern) {
  let bits = ''
  for (let i = 0; i < pattern.length; i++) {
    bits += (i % 2 === 0 ? '1' : '0').repeat(Number(pattern[i]))
  }
  return bits
}

/**
 * Code 128 编码。自动取码集：
 * - 全数字且长度 ≥4 的偶数 → 码集 C（数字对，密度最高）
 * - 其余 → 码集 B（可打印 ASCII）
 * 自动附加起始符、模 103 校验符、停止符。
 */
export function encodeCode128(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: '请输入要编码的快递单号' }
  const data = text.trim()
  const useC = /^\d+$/.test(data) && data.length >= 4 && data.length % 2 === 0
  const values = []
  if (useC) {
    values.push(C128_START_C)
    for (let i = 0; i < data.length; i += 2) values.push(Number(data.slice(i, i + 2)))
  } else {
    values.push(C128_START_B)
    for (const ch of data) {
      const code = ch.codePointAt(0)
      if (code < 32 || code > 126) return { ok: false, error: `Code 128 不支持字符「${ch}」（仅支持可打印 ASCII）` }
      values.push(code - 32)
    }
  }
  let sum = values[0]
  for (let i = 1; i < values.length; i++) sum += values[i] * i
  values.push(sum % 103)
  values.push(C128_STOP)
  let bits = ''
  for (const v of values) bits += patternToBits(C128_PATTERNS[v])
  return { ok: true, bits, values, type: 'code128', subset: useC ? 'C' : 'B' }
}

/** Code 39 宽/窄编码表（9 元素 b s b s b s b s b，n=窄 w=宽），
 * 每字符 3 宽 6 窄，共 15 模块。 */
const C39_CHARS = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn'
}

function c39PatternToBits(pattern) {
  let bits = ''
  for (let i = 0; i < pattern.length; i++) {
    const w = pattern[i] === 'w' ? 3 : 1
    bits += (i % 2 === 0 ? '1' : '0').repeat(w)
  }
  return bits
}

/**
 * Code 39 编码：自动包 * 起始/停止符，字符间 1 模块窄空隙，小写自动转大写。
 * 不附加可选的模 43 校验符（快递面单普遍不使用）。
 */
export function encodeCode39(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: '请输入要编码的快递单号' }
  const data = options.noUppercase ? text : text.toUpperCase()
  const patterns = [C39_CHARS['*']]
  for (const ch of data) {
    const pat = C39_CHARS[ch]
    if (!pat) return { ok: false, error: `Code 39 不支持字符「${ch}」（支持 0-9、A-Z、空格、- . $ / + %）` }
    patterns.push(pat)
  }
  patterns.push(C39_CHARS['*'])
  let bits = patterns.map(c39PatternToBits).join('0')
  return { ok: true, bits, chars: data.length, type: 'code39' }
}

const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

/** EAN-13 校验位：前 12 位奇位×1、偶位×3 求和，(10 - 和%10) % 10 */
export function computeEan13CheckDigit(first12) {
  if (!/^\d{12}$/.test(first12)) return null
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10
}

/**
 * EAN-13 编码：13 位纯数字，末位校验位必须正确（错误时提示正确校验位）。
 * 结构：起始 101 + 左 6 位（按首位奇偶表 L/G）+ 中间 01010 + 右 6 位 R + 结束 101，共 95 模块。
 */
export function encodeEan13(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: '请输入 13 位 EAN-13 编号' }
  const data = text.trim()
  if (!/^\d{13}$/.test(data)) {
    if (/^\d{12}$/.test(data)) {
      return { ok: false, error: `EAN-13 需 13 位数字，当前 12 位；校验位应为 ${computeEan13CheckDigit(data)}` }
    }
    return { ok: false, error: `EAN-13 仅支持 13 位数字，当前 ${data.length} 位` }
  }
  const expected = computeEan13CheckDigit(data.slice(0, 12))
  if (Number(data[12]) !== expected) {
    return { ok: false, error: `校验位错误：第 13 位应为 ${expected}，当前为 ${data[12]}` }
  }
  const parity = EAN_PARITY[Number(data[0])]
  let bits = '101'
  for (let i = 1; i <= 6; i++) {
    const d = Number(data[i])
    bits += parity[i - 1] === 'L' ? EAN_L[d] : EAN_G[d]
  }
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += EAN_R[Number(data[i])]
  bits += '101'
  return { ok: true, bits, digits: 13, type: 'ean13' }
}

/** 统一入口 */
export function encodeBarcode(text, type) {
  switch (type) {
    case 'code128':
      return encodeCode128(text)
    case 'code39':
      return encodeCode39(text)
    case 'ean13':
      return encodeEan13(text)
    default:
      return { ok: false, error: `不支持的码制：${type}` }
  }
}

/** Code 128 模式表健全性自检（供单测用） */
export function c128PatternInvariant() {
  const results = []
  for (let i = 0; i < C128_PATTERNS.length; i++) {
    const p = C128_PATTERNS[i]
    const sum = [...p].reduce((a, c) => a + Number(c), 0)
    const isStop = i === C128_STOP
    results.push({ idx: i, digits: p.length, sum, ok: isStop ? (p.length === 7 && sum === 13) : (p.length === 6 && sum === 11) })
  }
  return results
}

/** Code 39 模式表健全性自检：每字符 9 元素、恰 3 宽 6 窄 */
export function c39PatternInvariant() {
  return Object.entries(C39_CHARS).map(([ch, p]) => {
    const wideBars = [0, 2, 4, 6, 8].filter((i) => p[i] === 'w').length
    const wideSpaces = [1, 3, 5, 7].filter((i) => p[i] === 'w').length
    const wide = wideBars + wideSpaces
    const ok = p.length === 9 && wide === 3 && ((wideBars === 2 && wideSpaces === 1) || (wideBars === 0 && wideSpaces === 3))
    return { ch, len: p.length, wide, wideBars, wideSpaces, ok }
  })
}

export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]))
}

/**
 * 将位串渲染为 SVG（含左右静区）。返回 SVG 字符串。
 * options: { modulePx, height, quietX, withText, text, textColor }
 */
export function barcodeToSvg(bits, options = {}) {
  const modulePx = Number(options.modulePx) || 2
  const height = Number(options.height) || 80
  const quietX = Number(options.quietX) || 10
  const withText = !!options.withText
  const text = String(options.text ?? '')
  const textHeight = withText ? 18 : 0
  const offset = quietX * modulePx
  let rects = ''
  let x = 0
  let i = 0
  while (i < bits.length) {
    if (bits[i] === '1') {
      let w = 0
      while (i < bits.length && bits[i] === '1') { w++; i++ }
      rects += `<rect x="${offset + x * modulePx}" y="0" width="${w * modulePx}" height="${height}" fill="#000"/>`
      x += w
    } else {
      while (i < bits.length && bits[i] === '0') { i++; x++ }
    }
  }
  const totalW = bits.length * modulePx + 2 * offset
  const textEl = withText
    ? `<text x="${totalW / 2}" y="${height + 14}" text-anchor="middle" font-family="Menlo, Consolas, monospace" font-size="13" fill="${options.textColor || '#000'}">${escapeXml(text)}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height + textHeight}" viewBox="0 0 ${totalW} ${height + textHeight}"><rect width="100%" height="100%" fill="#fff"/>${rects}${textEl}</svg>`
}

export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
