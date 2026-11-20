/**
 * IPv4 / CIDR 子网计算：纯函数，零依赖。
 * /31 按 RFC 3021 点对点处理；/32 为单主机。
 */

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

/** 校验 IPv4 点分十进制 */
export function validateIpv4(ip) {
  return typeof ip === 'string' && IPV4_RE.test(ip.trim())
}

/** IPv4 → 无符号 32 位整数（用乘法避免位运算的符号位问题） */
export function ipv4ToInt(ip) {
  const [a, b, c, d] = ip.trim().split('.').map(Number)
  return ((a * 256 + b) * 256 + c) * 256 + d
}

/** 无符号 32 位整数 → IPv4 */
export function intToIpv4(n) {
  const v = n >>> 0
  return `${(v >>> 24) & 0xff}.${(v >>> 16) & 0xff}.${(v >>> 8) & 0xff}.${v & 0xff}`
}

/** 前缀长度 → 点分掩码，非法返回 null */
export function prefixToMask(prefix) {
  const p = Number(prefix)
  if (!Number.isInteger(p) || p < 0 || p > 32) return null
  if (p === 0) return '0.0.0.0'
  return intToIpv4(p === 32 ? 0xffffffff : (0xffffffff << (32 - p)) >>> 0)
}

/** 历史地址分类（A/B/C/D/E） */
export function ipClass(firstOctet) {
  if (firstOctet < 128) return 'A'
  if (firstOctet < 192) return 'B'
  if (firstOctet < 224) return 'C'
  if (firstOctet < 240) return 'D（组播）'
  return 'E（保留）'
}

/**
 * 计算 CIDR 子网信息。输入 "10.0.4.5/22"（IP 可为网内任意地址）。
 * 返回 { ok: true, ... } 或 { ok: false, error }。
 */
export function computeCidr(input) {
  if (typeof input !== 'string' || !input.trim()) return { ok: false, error: '请输入 CIDR，如 10.0.4.5/22' }
  const idx = input.indexOf('/')
  if (idx === -1) return { ok: false, error: '缺少前缀长度，请用 IP/前缀 格式，如 10.0.4.5/22' }
  const ipStr = input.slice(0, idx).trim()
  const prefixStr = input.slice(idx + 1).trim()
  if (!validateIpv4(ipStr)) return { ok: false, error: `IP 地址不合法：${ipStr || '空'}` }
  if (!/^\d+$/.test(prefixStr)) return { ok: false, error: `前缀长度需为 0-32 的整数，当前：${prefixStr || '空'}` }
  const prefix = Number(prefixStr)
  if (prefix > 32) return { ok: false, error: `前缀长度需为 0-32 的整数，当前：${prefixStr}` }

  const ip = ipv4ToInt(ipStr)
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcard = (~mask) >>> 0
  const network = (ip & mask) >>> 0
  const broadcast = (network | wildcard) >>> 0

  let firstHost, lastHost, hostCount, hostType
  if (prefix === 32) {
    firstHost = network
    lastHost = network
    hostCount = 1
    hostType = 'single'
  } else if (prefix === 31) {
    firstHost = network
    lastHost = broadcast
    hostCount = 2
    hostType = 'point-to-point'
  } else {
    firstHost = network + 1
    lastHost = broadcast - 1
    hostCount = broadcast - network - 1
    hostType = 'normal'
  }

  return {
    ok: true,
    ip: ipStr,
    prefix,
    mask: intToIpv4(mask),
    wildcard: intToIpv4(wildcard),
    network: intToIpv4(network),
    broadcast: intToIpv4(broadcast),
    firstHost: intToIpv4(firstHost),
    lastHost: intToIpv4(lastHost),
    hostCount,
    hostType,
    ipClass: ipClass(Number(ipStr.split('.')[0])),
    ipInt: ip,
    maskInt: mask
  }
}
