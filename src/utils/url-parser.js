/**
 * URL 解析与重组工具。
 * 基于 URL / URLSearchParams，query 参数结构化为可编辑数组。
 */

/**
 * 解析 URL。
 * @returns {{ ok: true, parts: { href, protocol, host, port, path, params, fragment } } | { ok: false, error: string }}
 */
export function parseUrl(raw) {
  const text = String(raw || '').trim()
  if (!text) return { ok: false, error: '请输入 URL' }
  // 无协议时补 https:// 便于解析
  const normalized = /^[a-zA-Z][\w+.-]*:\/\//.test(text) || text.startsWith('//') ? text : `https://${text}`
  let u
  try {
    u = new URL(normalized)
  } catch (e) {
    return { ok: false, error: `不是合法的 URL：${e?.message || ''}` }
  }
  const params = []
  u.searchParams.forEach((value, key) => {
    params.push({ key, value })
  })
  return {
    ok: true,
    parts: {
      href: u.href,
      protocol: u.protocol.replace(/:$/, ''),
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      params,
      fragment: u.hash.replace(/^#/, '')
    }
  }
}

/**
 * 把 parts 重组为完整 URL。
 */
export function buildUrl(parts) {
  if (!parts || !parts.host) return ''
  const proto = parts.protocol || 'https'
  // host 已含端口（URL.host），不再二次拼 port
  let url = `${proto}://${parts.host}${parts.path || '/'}`
  const eff = (parts.params || []).filter((p) => p.key && p.key.trim())
  if (eff.length) {
    const usp = new URLSearchParams()
    for (const p of eff) usp.append(p.key.trim(), String(p.value ?? ''))
    url += `?${usp.toString()}`
  }
  if (parts.fragment && parts.fragment.trim()) url += `#${parts.fragment.trim()}`
  return url
}

/** URL 各组成部分的浅展示（用于表格） */
export const URL_PART_FIELDS = [
  { key: 'protocol', label: '协议' },
  { key: 'host', label: '主机' },
  { key: 'port', label: '端口' },
  { key: 'path', label: '路径' },
  { key: 'fragment', label: '片段（#后）' }
]
