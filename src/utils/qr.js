/**
 * QR 码生成封装（qrcode-generator）。
 * generate(text, { level, size }) → dataURL（PNG）
 */
import qrcode from 'qrcode-generator'

const LEVELS = ['L', 'M', 'Q', 'H']

export function generateQr(text, opts = {}) {
  const level = LEVELS.includes(opts.level) ? opts.level : 'M'
  const border = Number.isInteger(opts.border) ? opts.border : 2
  const pixel = Number.isInteger(opts.pixel) && opts.pixel > 0 ? opts.pixel : 6
  if (!text) throw new Error('内容不能为空')
  const qr = qrcode(0, level)
  qr.addData(text)
  qr.make()
  const count = qr.getModuleCount()
  const total = (count + border * 2) * pixel
  const svg = toSvg(qr, pixel, border)
  return { svg, size: total, modules: count }
}

function toSvg(qr, pixel, border) {
  const count = qr.getModuleCount()
  const size = (count + border * 2) * pixel
  let shapes = []
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        shapes.push(`<path d="M${(c + border) * pixel},${(r + border) * pixel}h${pixel}v${pixel}h-${pixel}z"/>`)
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/><g fill="#000000">${shapes.join('')}</g></svg>`
}

export function svgToDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
