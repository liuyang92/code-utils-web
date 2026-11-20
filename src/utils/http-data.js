/**
 * HTTP 速查数据：状态码、常见 MIME 类型、CORS 基础。
 */

export const STATUS_GROUPS = [
  { range: '1xx', label: '信息响应', color: 'info' },
  { range: '2xx', label: '成功响应', color: 'success' },
  { range: '3xx', label: '重定向', color: 'info' },
  { range: '4xx', label: '客户端错误', color: 'error' },
  { range: '5xx', label: '服务端错误', color: 'error' }
]

export const HTTP_STATUS = [
  { code: 100, name: 'Continue', desc: '客户端应继续请求' },
  { code: 101, name: 'Switching Protocols', desc: '切换协议（如 WebSocket）' },
  { code: 200, name: 'OK', desc: '请求成功' },
  { code: 201, name: 'Created', desc: '资源创建成功' },
  { code: 202, name: 'Accepted', desc: '已接受，处理中' },
  { code: 204, name: 'No Content', desc: '无返回内容' },
  { code: 206, name: 'Partial Content', desc: '范围请求成功' },
  { code: 301, name: 'Moved Permanently', desc: '永久重定向' },
  { code: 302, name: 'Found', desc: '临时重定向' },
  { code: 304, name: 'Not Modified', desc: '缓存未变更' },
  { code: 307, name: 'Temporary Redirect', desc: '临时重定向（保持方法）' },
  { code: 308, name: 'Permanent Redirect', desc: '永久重定向（保持方法）' },
  { code: 400, name: 'Bad Request', desc: '请求语法错误' },
  { code: 401, name: 'Unauthorized', desc: '未认证（需登录/Token）' },
  { code: 403, name: 'Forbidden', desc: '已认证但无权限' },
  { code: 404, name: 'Not Found', desc: '资源不存在' },
  { code: 405, name: 'Method Not Allowed', desc: '方法不被允许' },
  { code: 408, name: 'Request Timeout', desc: '请求超时' },
  { code: 409, name: 'Conflict', desc: '状态冲突（如重复创建）' },
  { code: 410, name: 'Gone', desc: '资源已永久消失' },
  { code: 413, name: 'Payload Too Large', desc: '请求体过大' },
  { code: 415, name: 'Unsupported Media Type', desc: 'Content-Type 不支持' },
  { code: 422, name: 'Unprocessable Entity', desc: '语法对但语义错误' },
  { code: 429, name: 'Too Many Requests', desc: '请求过于频繁（限流）' },
  { code: 500, name: 'Internal Server Error', desc: '服务端内部错误' },
  { code: 501, name: 'Not Implemented', desc: '服务端不支持该功能' },
  { code: 502, name: 'Bad Gateway', desc: '网关收到无效响应' },
  { code: 503, name: 'Service Unavailable', desc: '服务不可用（过载/维护）' },
  { code: 504, name: 'Gateway Timeout', desc: '网关超时' }
]

export const MIME_TYPES = [
  { ext: 'html', mime: 'text/html', desc: 'HTML 页面' },
  { ext: 'css', mime: 'text/css', desc: '样式表' },
  { ext: 'js', mime: 'application/javascript', desc: 'JavaScript 脚本' },
  { ext: 'json', mime: 'application/json', desc: 'JSON 数据' },
  { ext: 'xml', mime: 'application/xml', desc: 'XML 数据' },
  { ext: 'yaml/yml', mime: 'application/yaml', desc: 'YAML 配置' },
  { ext: 'txt', mime: 'text/plain', desc: '纯文本' },
  { ext: 'csv', mime: 'text/csv', desc: 'CSV 表格' },
  { ext: 'md', mime: 'text/markdown', desc: 'Markdown 文档' },
  { ext: 'png', mime: 'image/png', desc: 'PNG 图片' },
  { ext: 'jpg/jpeg', mime: 'image/jpeg', desc: 'JPEG 图片' },
  { ext: 'gif', mime: 'image/gif', desc: 'GIF 动图' },
  { ext: 'svg', mime: 'image/svg+xml', desc: 'SVG 矢量图' },
  { ext: 'webp', mime: 'image/webp', desc: 'WebP 图片' },
  { ext: 'octet-stream', mime: 'application/octet-stream', desc: '未知二进制流（通用下载）' },
  { ext: 'pdf', mime: 'application/pdf', desc: 'PDF 文档' },
  { ext: 'zip', mime: 'application/zip', desc: 'ZIP 压缩包' },
  { ext: 'form-data', mime: 'multipart/form-data', desc: '表单文件上传' },
  { ext: 'x-www-form-urlencoded', mime: 'application/x-www-form-urlencoded', desc: '表单键值对' }
]

export const CORS_HEADERS = [
  { header: 'Access-Control-Allow-Origin', desc: '允许访问的源（* 或具体域名）' },
  { header: 'Access-Control-Allow-Methods', desc: '允许的 HTTP 方法列表' },
  { header: 'Access-Control-Allow-Headers', desc: '允许的自定义请求头' },
  { header: 'Access-Control-Allow-Credentials', desc: '是否允许携带 Cookie' },
  { header: 'Access-Control-Max-Age', desc: '预检请求缓存时间（秒）' },
  { header: 'Access-Control-Expose-Headers', desc: '允许 JS 读取的响应头' }
]

export const HTTP_METHODS_REF = [
  { method: 'GET', desc: '获取资源，无副作用，可缓存', safe: true, idempotent: true },
  { method: 'POST', desc: '创建资源/提交数据，非幂等', safe: false, idempotent: false },
  { method: 'PUT', desc: '整体替换资源，幂等', safe: false, idempotent: true },
  { method: 'PATCH', desc: '部分更新资源，非幂等（常用）', safe: false, idempotent: false },
  { method: 'DELETE', desc: '删除资源，幂等', safe: false, idempotent: true },
  { method: 'HEAD', desc: '同 GET 但只要响应头', safe: true, idempotent: true },
  { method: 'OPTIONS', desc: '预检/查询支持的方法', safe: true, idempotent: true }
]
