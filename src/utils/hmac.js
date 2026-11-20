/**
 * HMAC 摘要计算。
 * - SHA 系列：浏览器原生 SubtleCrypto（HMAC 算法）
 * - MD5：手写 HMAC 构造（ipad/opad），基于 HashToolView 的 MD5 实现
 */

export async function hmacMd5(keyBytes, data) {
  const blockSize = 64
  let k = keyBytes
  if (k.length > blockSize) k = hexToBytes(md5Hex(k))
  const padded = new Uint8Array(blockSize)
  padded.set(k)
  const ipad = new Uint8Array(blockSize)
  const opad = new Uint8Array(blockSize)
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = padded[i] ^ 0x36
    opad[i] = padded[i] ^ 0x5c
  }
  const inner = md5Hex(new Uint8Array([...ipad, ...data]))
  return md5Hex(new Uint8Array([...opad, ...hexToBytes(inner)]))
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}

const MD5_S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21]
const MD5_K = Array.from({length: 64}, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0)
export function md5Hex(bytes) {
  const bitLen = bytes.length * 8
  const padLen = ((56 - (bytes.length + 1) % 64) + 64) % 64
  const padded = new Uint8Array(bytes.length + 1 + padLen + 8)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 8, bitLen >>> 0, true)
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 4294967296), true)
  let a0 = 0x67452301, b0 = -271733879, c0 = -1732584194, d0 = 271733878
  for (let off = 0; off < padded.length; off += 64) {
    const M = new Uint32Array(16)
    const mdv = new DataView(padded.buffer, off, 64)
    for (let i = 0; i < 16; i++) M[i] = mdv.getUint32(i * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + MD5_K[i] + M[g]) | 0
      A = D; D = C; C = B
      B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) | 0
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0
  }
  const out = new DataView(new ArrayBuffer(16))
  out.setUint32(0, a0 >>> 0, true); out.setUint32(4, b0 >>> 0, true)
  out.setUint32(8, c0 >>> 0, true); out.setUint32(12, d0 >>> 0, true)
  return [...new Uint8Array(out.buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** HMAC 主入口（与 Hash 工具的 ALGOS 键对齐） */
export async function hmac(algo, keyText, text) {
  if (!keyText) throw new Error('HMAC 需要填写密钥')
  const data = new TextEncoder().encode(text)
  const keyBytes = new TextEncoder().encode(keyText)
  if (algo === 'MD5') return hmacMd5(keyBytes, data)
  const buf = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algo }, false, ['sign']),
    data
  )
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** HS256/HS384/HS512 签名校验（用于 JWT） */
export async function verifyHsJwt(alg, signingInput, signature, secret) {
  const hash = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : null
  if (!hash) throw new Error(`不支持对称算法 ${alg} 的本地验签，请使用 RS256 私钥/公钥或仅查看解码内容`)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash }, false, ['verify'])
  const sigBytes = base64UrlToBytes(signature)
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(signingInput))
}

export function bytesToBase64Url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function base64UrlToBytes(b64) {
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = norm + '='.repeat((4 - norm.length % 4) % 4)
  const bin = atob(pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * 生成 HS256 / HS384 / HS512 签名的 JWT。
 * options:
 *   - expSeconds: 有效期秒数（>0 时注入 exp = now + expSeconds，0/缺省不注入）
 *   - iat: true 时注入签发时间（payload 已有 iat 则不覆盖）
 *   - nbf: true 时注入生效时间（payload 已有 nbf 则不覆盖）
 *   - header: 附加 header claim（如 { kid: 'key-1' }）
 */
export async function signHsJwt(alg, payloadObj, secret, options = {}) {
  const hash = alg === 'HS256' ? 'SHA-256' : alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : null
  if (!hash) throw new Error(`暂不支持 ${alg}，请选择 HS256 / HS384 / HS512`)
  if (!secret) throw new Error('请填写共享密钥')
  const header = { typ: 'JWT', alg, ...(options.header || {}) }
  const now = Math.floor(Date.now() / 1000)
  const payload = { ...payloadObj }
  if (options.iat && payload.iat === undefined) payload.iat = now
  if (options.nbf && payload.nbf === undefined) payload.nbf = now
  const expSec = Number(options.expSeconds)
  if (Number.isFinite(expSec) && expSec > 0 && payload.exp === undefined) payload.exp = now + Math.floor(expSec)
  const headerB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`
}
