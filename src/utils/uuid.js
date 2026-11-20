/**
 * UUID 生成：v4（全随机） / v7（48 位毫秒时间戳前缀 + 随机，时间有序）。
 * v7 见 RFC 9562 —— 数据库主键 / 链路追踪场景下比 v4 更友好。
 */

function randomBytes(len) {
  const buf = new Uint8Array(len)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf)
  else for (let i = 0; i < len; i++) buf[i] = Math.floor(Math.random() * 256) & 0xff
  return buf
}

function toHex(buf) {
  let out = ''
  for (const b of buf) out += b.toString(16).padStart(2, '0')
  return out
}

function hexToUuid(hex) {
  if (hex.length !== 32) throw new Error(`UUID hex 应为 32 字符，实际 ${hex.length}`)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/** UUID v4：全随机，版本位 0100，变体位 10xx */
export function genUuidV4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const buf = randomBytes(16)
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80
  return hexToUuid(toHex(buf))
}

/** UUID v7：48 位毫秒时间戳 + 版本 7 + 随机；now 可注入便于测试 */
export function genUuidV7(now = Date.now()) {
  const tsHex = BigInt(now).toString(16).padStart(12, '0').slice(-12)
  const rand = randomBytes(10)
  rand[0] = (rand[0] & 0x0f) | 0x70 // 版本 0111
  rand[2] = (rand[2] & 0x3f) | 0x80 // 变体 10xx
  return hexToUuid(tsHex + toHex(rand))
}

/** 提取 UUID 版本号（第三段首位十六进制），非法格式返回 null */
export function uuidVersion(uuid) {
  const m = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-/.exec(String(uuid || '').toLowerCase())
  return m ? parseInt(m[1], 16) : null
}

/** 从 v7 提取 48 位毫秒时间戳；非 v7 返回 null */
export function uuidV7Timestamp(uuid) {
  if (uuidVersion(uuid) !== 7) return null
  const hex = String(uuid).toLowerCase().replace(/-/g, '').slice(0, 12)
  return Number(`0x${hex}`)
}
