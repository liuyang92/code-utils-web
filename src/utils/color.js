/**
 * WCAG 2.x 对比度计算（颜色工具增强部分）。
 * - toLinear / relativeLuminance / contrastRatio
 * - wcagVerdict：AA/AAA（normal/large 文本）
 */

export function clamp255(v) {
  return Math.min(255, Math.max(0, Math.round(Number(v) || 0)))
}

export function toLinear(c8) {
  const c = clamp255(c8) / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** 相对亮度 L ∈ [0,1] */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** 对比度比值 (1,1] ~ 21 */
export function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * WCAG 判定。
 * normal: AA ≥ 4.5、AAA ≥ 7
 * large（≥18pt 或 ≥14pt bold）: AA ≥ 3、AAA ≥ 4.5
 */
export function wcagVerdict(ratio, largeText = false) {
  const r = Number(ratio)
  const pass = (th) => r >= th
  return {
    ratio: Math.round(r * 100) / 100,
    aaNormal: pass(4.5),
    aaaNormal: pass(7),
    aaLarge: pass(3),
    aaaLarge: pass(4.5),
    level: largeText
      ? pass(4.5) ? 'AAA' : pass(3) ? 'AA' : 'fail'
      : pass(7) ? 'AAA' : pass(4.5) ? 'AA' : 'fail'
  }
}

/** hex → rgb，支持 #abc / #aabbcc */
export function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error('需要 #RRGGBB 或 #RGB 颜色')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

export function rgbToHex({ r, g, b }) {
  const f = (v) => clamp255(v).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}
