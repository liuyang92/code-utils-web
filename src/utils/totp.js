/**
 * RFC 6238 TOTP（时间一次性口令）/ HOTP。
 * 零依赖：Base32 解码 + WebCrypto HMAC-SHA1。
 * - decodeBase32 / encodeBase32
 * - totp(secretBase32, { period, digits, timestamp }) → 6/8 位码（纯同步计算用注入密钥字节，供单测）
 * - generateTotp(secretBase32, { period, digits }) → 异步（WebCrypto）
 * - parseOtpauthUri(uri) → { label, issuer, secret, digits, period }
 * - remainingSeconds(period)
 */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function decodeBase32(str) {
  const s = String(str || '').toUpperCase().replace(/[=\s-]/g, '')
  if (!s) throw new Error('Base32 内容为空')
  let bits = 0
  let value = 0
  const out = []
  for (const ch of s) {
    const idx = B32.indexOf(ch)
    if (idx === -1) throw new Error(`非法 Base32 字符「${ch}」`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((value >>> bits) & 0xff)
    }
  }
  return new Uint8Array(out)
}

export function encodeBase32(bytes) {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += B32[(value >>> bits) & 0x1f]
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 0x1f]
  return out
}

/** HOTP：输入已解码密钥字节 + counter，输出 digits 位码（同步计算，纯函数，可测） */
export function hotpFromBytes(keyBytes, counter, digits = 6) {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  // counter 大端 8 字节（JS safe integer 内）
  view.setUint32(0, Math.floor(counter / 2 ** 32))
  view.setUint32(4, counter >>> 0)
  // 同步 HMAC-SHA1：WebCrypto 是异步，这里手写 SHA1 + HMAC（很短，RFC 向量可锚定）
  const mac = hmacSha1(keyBytes, new Uint8Array(buf))
  const offset = mac[mac.length - 1] & 0x0f
  const code =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff)
  const d = Math.min(Math.max(Number(digits) || 6, 6), 8)
  return String(code % 10 ** d).padStart(d, '0')
}

/** SHA-1 纯实现（HMAC/CT 需要它；TOTP 为唯一用处，输入是密钥+counter 短数据） */
function sha1(bytes) {
  const h0 = 0x67452301
  const h1 = 0xefcdab89
  const h2 = 0x98badcfe
  const h3 = 0x10325476
  const h4 = 0xc3d2e1f0
  const len = bytes.length
  const bitLen = len * 8
  const padLen = ((56 - (len + 1) % 64) + 64) % 64
  const padded = new Uint8Array(len + 1 + padLen + 8)
  padded.set(bytes)
  padded[len] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32))
  dv.setUint32(padded.length - 4, bitLen >>> 0)
  let a = h0
  let b = h1
  let c = h2
  let d = h3
  let e = h4
  const w = new Uint32Array(80)
  for (let off = 0; off < padded.length; off += 64) {
    const bv = new DataView(padded.buffer, off, 64)
    for (let i = 0; i < 16; i++) w[i] = bv.getUint32(i * 4)
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1)
    }
    let A = a
    let B = b
    let C = c
    let D = d
    let E = e
    for (let i = 0; i < 80; i++) {
      let f
      let k
      if (i < 20) {
        f = (B & C) | (~B & D)
        k = 0x5a827999
      } else if (i < 40) {
        f = B ^ C ^ D
        k = 0x6ed9eba1
      } else if (i < 60) {
        f = (B & C) | (B & D) | (C & D)
        k = 0x8f1bbcdc
      } else {
        f = B ^ C ^ D
        k = 0xca62c1d6
      }
      const t = (rotl(A, 5) + f + E + k + w[i]) >>> 0
      E = D
      D = C
      C = rotl(B, 30)
      B = A
      A = t
    }
    a = (a + A) >>> 0
    b = (b + B) >>> 0
    c = (c + C) >>> 0
    d = (d + D) >>> 0
    e = (e + E) >>> 0
  }
  const out = new Uint8Array(20)
  const odv = new DataView(out.buffer)
  odv.setUint32(0, a)
  odv.setUint32(4, b)
  odv.setUint32(8, c)
  odv.setUint32(12, d)
  odv.setUint32(16, e)
  return out
}

function rotl(n, b) {
  return ((n << b) | (n >>> (32 - b))) >>> 0
}

function hmacSha1(keyBytes, data) {
  const blockSize = 64
  let k = keyBytes
  if (k.length > blockSize) k = sha1(k)
  const padded = new Uint8Array(blockSize)
  padded.set(k)
  const ipad = new Uint8Array(blockSize)
  const opad = new Uint8Array(blockSize)
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = padded[i] ^ 0x36
    opad[i] = padded[i] ^ 0x5c
  }
  const inner = sha1(new Uint8Array([...ipad, ...data]))
  return sha1(new Uint8Array([...opad, ...inner]))
}

/**
 * TOTP（同步，密钥字节已解码）。time 默认当前时间。
 * period 默认 30，digits 6/8。
 */
export function totpFromBytes(keyBytes, options = {}) {
  const period = Math.max(1, Number(options.period) || 30)
  const digits = Number(options.digits) || 6
  const time = Number(options.timestamp ?? Date.now())
  const counter = Math.floor(Math.floor(time / 1000) / period)
  return { code: hotpFromBytes(keyBytes, counter, digits), counter, period, digits }
}

/** TOTP 入口（Base32 密钥，同步）。非法密钥抛错。 */
export function totp(secretBase32, options = {}) {
  return totpFromBytes(decodeBase32(secretBase32), options)
}

/** 当前周期剩余秒数（供倒计时展示） */
export function remainingSeconds(period = 30, timestamp = Date.now()) {
  const p = Math.max(1, period)
  return p - Math.floor(Math.floor(timestamp / 1000) % p)
}

/**
 * 解析 otpauth:// URI。
 * otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=6&period=30
 */
export function parseOtpauthUri(uri) {
  const s = String(uri || '').trim()
  if (!s) return { ok: false, error: '请输入 otpauth URI 或密钥' }
  if (!/^otpauth:\/\/totp\//i.test(s)) return { ok: false, error: '仅支持 otpauth://totp/ URI' }
  let rest = s.replace(/^otpauth:\/\/totp\//i, '')
  const qIdx = rest.indexOf('?')
  const labelPart = qIdx === -1 ? rest : rest.slice(0, qIdx)
  const query = qIdx === -1 ? '' : rest.slice(qIdx + 1)
  const params = new URLSearchParams(query)
  const secret = params.get('secret') || ''
  try {
    decodeBase32(secret)
  } catch (e) {
    return { ok: false, error: `URI 中 secret 非法：${e?.message || e}` }
  }
  const label = decodeURIComponent(labelPart)
  const issuerFromLabel = label.includes(':') ? label.split(':')[0] : ''
  return {
    ok: true,
    label,
    issuer: params.get('issuer') || issuerFromLabel,
    secret,
    digits: Number(params.get('digits')) || 6,
    period: Number(params.get('period')) || 30
  }
}
