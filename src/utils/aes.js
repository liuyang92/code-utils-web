/**
 * AES-GCM 加解密（浏览器 SubtleCrypto，零依赖）。
 * 密钥由用户密码经 PBKDF2-SHA256 派生；输出格式 base64(salt[16] + iv[12] + ciphertext)。
 * 解密时从密文头拆出 salt/iv，用户只需提供同一密码即可还原。
 */

const TEXT_ENCODER = new TextEncoder()

function toB64(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromB64(b64) {
  const norm = String(b64).trim().replace(/\s+/g, '')
  const bin = atob(norm)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(password, salt, iterations) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * AES-GCM 加密。
 * @returns {Promise<string>} base64(salt + iv + ciphertext)
 */
export async function aesEncrypt(text, password, { iterations = 100000 } = {}) {
  if (!text) throw new Error('明文不能为空')
  if (!password) throw new Error('密码不能为空')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, TEXT_ENCODER.encode(text))
  )
  const out = new Uint8Array(salt.length + iv.length + ct.length)
  out.set(salt, 0)
  out.set(iv, salt.length)
  out.set(ct, salt.length + iv.length)
  return toB64(out)
}

/**
 * AES-GCM 解密。
 * @param {string} b64 base64(salt + iv + ciphertext)
 * @returns {Promise<string>} 明文
 */
export async function aesDecrypt(b64, password, { iterations = 100000 } = {}) {
  if (!b64) throw new Error('密文不能为空')
  if (!password) throw new Error('密码不能为空')
  const data = fromB64(b64)
  if (data.length < 28) throw new Error('密文格式无效（长度不足，应至少 28 字节）')
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 28)
  const ct = data.slice(28)
  const key = await deriveKey(password, salt, iterations)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

/** 快速估算：加密多少字节明文（用于展示） */
export function estimateEncryptedSize(textLen) {
  // salt 16 + iv 12 + 明文 + GCM tag 16，base64 后 ×4/3
  return Math.ceil((16 + 12 + textLen + 16) * 4 / 3)
}
