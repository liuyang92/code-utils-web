/**
 * RSA / WebCrypto：密钥对生成、OAEP 加解密、RS256 签名/验签。
 * PEM 格式（PKCS#8 / SPKI），文本互转 Base64。
 */

const PEM_RE = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/

export function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64')
}

export function base64ToArrayBuffer(b64) {
  const norm = String(b64).trim().replace(/\s/g, '')
  const bin = typeof atob === 'function' ? atob(norm) : Buffer.from(norm, 'base64').toString('binary')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

export function arrayBufferToPem(label, buf) {
  const b64 = arrayBufferToBase64(buf)
  const lines = b64.match(/.{1,64}/g) || []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
}

/** 解析 PEM → { label, der(ArrayBuffer) } */
export function parsePem(pem) {
  const m = PEM_RE.exec(String(pem || '').trim())
  if (!m) return { ok: false, error: '不是合法 PEM（缺 BEGIN/END 头尾）' }
  return { ok: true, label: m[1].trim(), der: base64ToArrayBuffer(m[2]) }
}

export function isPublicKeyPem(pem) {
  const p = parsePem(pem)
  return p.ok && /PUBLIC KEY/.test(p.label)
}

export function isPrivateKeyPem(pem) {
  const p = parsePem(pem)
  return p.ok && /PRIVATE KEY/.test(p.label)
}

async function importRsaKey(pem, usages, isPrivate) {
  const { ok, der, error } = parsePem(pem)
  if (!ok) throw new Error(error)
  const algo = { name: 'RSA-OAEP', hash: 'SHA-256' }
  if (isPrivate) {
    return crypto.subtle.importKey('pkcs8', der, algo, true, usages)
  }
  return crypto.subtle.importKey('spki', der, algo, true, usages)
}

async function importRsaSignKey(pem, usages, isPrivate) {
  const { ok, der, error } = parsePem(pem)
  if (!ok) throw new Error(error)
  const algo = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
  if (isPrivate) {
    return crypto.subtle.importKey('pkcs8', der, algo, true, usages)
  }
  return crypto.subtle.importKey('spki', der, algo, true, usages)
}

/** 生成 RSA-OAEP + RS256 兼容密钥对（bits: 2048 / 4096） */
export async function generateRsaKeyPair(bits = 2048) {
  const allowed = [2048, 4096]
  if (!allowed.includes(Number(bits))) throw new Error('仅支持 2048 / 4096 位')
  const kp = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: Number(bits),
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
  const priv = await crypto.subtle.exportKey('pkcs8', kp.privateKey)
  const pub = await crypto.subtle.exportKey('spki', kp.publicKey)
  return {
    bits: Number(bits),
    privateKeyPem: arrayBufferToPem('PRIVATE KEY', priv),
    publicKeyPem: arrayBufferToPem('PUBLIC KEY', pub)
  }
}

/** RSA-OAEP 公钥加密 → Base64 */
export async function rsaEncrypt(publicKeyPem, text) {
  if (!publicKeyPem?.trim()) throw new Error('请填入公钥 PEM')
  const key = await importRsaKey(publicKeyPem, ['encrypt'], false)
  const data = new TextEncoder().encode(text)
  const enc = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data)
  return arrayBufferToBase64(enc)
}

/** RSA-OAEP 私钥解密 ← Base64 */
export async function rsaDecrypt(privateKeyPem, cipherBase64) {
  if (!privateKeyPem?.trim()) throw new Error('请填入私钥 PEM')
  const key = await importRsaKey(privateKeyPem, ['decrypt'], true)
  const buf = base64ToArrayBuffer(cipherBase64)
  const dec = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, buf)
  return new TextDecoder().decode(dec)
}

/** RS256 签名（私钥）→ Base64 */
export async function rsaSign(privateKeyPem, text) {
  if (!privateKeyPem?.trim()) throw new Error('请填入私钥 PEM')
  const key = await importRsaSignKey(privateKeyPem, ['sign'], true)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(text))
  return arrayBufferToBase64(sig)
}

/** RS256 验签（公钥） */
export async function rsaVerify(publicKeyPem, text, signatureBase64) {
  if (!publicKeyPem?.trim()) throw new Error('请填入公钥 PEM')
  const key = await importRsaSignKey(publicKeyPem, ['verify'], false)
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64ToArrayBuffer(signatureBase64),
    new TextEncoder().encode(text)
  )
}

/** 同一把密钥生成后即验：加密-解密闭环（视图/测试用） */
export async function roundTrip(bits, text) {
  const kp = await generateRsaKeyPair(bits)
  const cipher = await rsaEncrypt(kp.publicKeyPem, text)
  const plain = await rsaDecrypt(kp.privateKeyPem, cipher)
  return { kp, cipher, plain, ok: plain === text }
}
