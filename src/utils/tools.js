/**
 * 工具注册表：侧边栏、路由、页面参数的唯一数据源。
 * 新增工具 = 在这里加一条（component 指向视图）+ 视图文件。
 */
export const TOOL_GROUPS = [
  {
    id: 'format',
    label: '格式化',
    tools: [
      {
        id: 'json',
        name: 'JSON',
        icon: 'braces',
        to: '/json',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '格式化、压缩、校验 JSON，定位到行列',
        meta: { engine: 'prettier', lang: 'json', parser: 'json', canMinify: 'json', canValidate: 'json' }
      },
      {
        id: 'js',
        name: 'JS / TS',
        icon: 'code',
        to: '/js',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '美化与压缩 JavaScript / TypeScript',
        meta: { engine: 'prettier', lang: 'js', parser: 'babel', canMinify: 'js' }
      },
      {
        id: 'html',
        name: 'HTML',
        icon: 'layers',
        to: '/html',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '美化与压缩 HTML 片段或整页',
        meta: { engine: 'prettier', lang: 'html', parser: 'html', canMinify: 'html' }
      },
      {
        id: 'css',
        name: 'CSS',
        icon: 'sliders',
        to: '/css',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '美化与压缩 CSS / 选择器',
        meta: { engine: 'prettier', lang: 'css', parser: 'css', canMinify: 'css' }
      },
      {
        id: 'java',
        name: 'Java',
        icon: 'file',
        to: '/java',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '基于 prettier-plugin-java 的代码美化',
        meta: { engine: 'prettier', lang: 'java', parser: 'java', pluginIds: ['java'] }
      },
      {
        id: 'sql',
        name: 'SQL',
        icon: 'database',
        to: '/sql',
        component: () => import('@/views/SqlToolView.vue'),
        description: '多方言 SQL 美化与压缩',
        meta: { engine: 'sql', lang: 'sql' }
      },
      {
        id: 'xml',
        name: 'XML',
        icon: 'file',
        to: '/xml',
        component: () => import('@/views/XmlToolView.vue'),
        description: '美化与压缩 XML 配置',
        meta: { engine: 'xml', lang: 'xml' }
      },
      {
        id: 'markdown',
        name: 'Markdown',
        icon: 'book',
        to: '/markdown',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '统一 Markdown 排版格式',
        meta: { engine: 'prettier', lang: 'markdown', parser: 'markdown' }
      },
      {
        id: 'yaml',
        name: 'YAML',
        icon: 'grid',
        to: '/yaml',
        component: () => import('@/views/PrettierToolView.vue'),
        description: '统一缩进与排版 YAML 配置',
        meta: { engine: 'prettier', lang: 'yaml', parser: 'yaml' }
      }
    ]
  },
  {
    id: 'codec',
    label: '编解码',
    tools: [
      {
        id: 'base64',
        name: 'Base64',
        icon: 'key',
        to: '/base64',
        component: () => import('@/views/Base64ToolView.vue'),
        description: 'Base64 编码 / 解码（完整 Unicode 支持）'
      },
      {
        id: 'url',
        name: 'URL',
        icon: 'link',
        to: '/url',
        component: () => import('@/views/UrlToolView.vue'),
        description: 'URL 编码 / 解码（全量 / 保留分隔符）'
      },
      {
        id: 'hash',
        name: 'Hash',
        icon: 'hash',
        to: '/hash',
        component: () => import('@/views/HashToolView.vue'),
        description: 'MD5 / SHA-1 / 256 / 384 / 512 摘要计算'
      },
      {
        id: 'uuid',
        name: 'UUID',
        icon: 'key',
        to: '/uuid',
        component: () => import('@/views/UuidToolView.vue'),
        description: '批量生成 UUID v4（大写/无连字符可切换）'
      },
      {
        id: 'uuid-v7',
        name: 'UUID v7',
        icon: 'key',
        to: '/uuid-v7',
        component: () => import('@/views/UuidToolView.vue'),
        description: '时间有序 UUID v7（数据库主键/链路追踪友好）',
        meta: { version: 'v7' }
      },
      {
        id: 'jwt',
        name: 'JWT',
        icon: 'globe',
        to: '/jwt',
        component: () => import('@/views/JwtToolView.vue'),
        description: 'JWT 解码：Header/Payload 可读化、过期判断'
      },
      {
        id: 'password',
        name: '密码生成',
        icon: 'key',
        to: '/password',
        component: () => import('@/views/PasswordToolView.vue'),
        description: '可定制字符集、强度与熵评估、批量生成'
      },
      {
        id: 'radix',
        name: '进制转换',
        icon: 'grid',
        to: '/radix',
        component: () => import('@/views/RadixToolView.vue'),
        description: '二 / 八 / 十 / 十六进制互转'
      },
      {
        id: 'color',
        name: '颜色转换',
        icon: 'sliders',
        to: '/color',
        component: () => import('@/views/ColorToolView.vue'),
        description: 'HEX / RGB / HSL 互转，附取色器'
      },
      {
        id: 'qr',
        name: '二维码',
        icon: 'grid',
        to: '/qr',
        component: () => import('@/views/QrToolView.vue'),
        description: '文本/URL 生成二维码（SVG 矢量下载）'
      },
      {
        id: 'barcode',
        name: '条形码',
        icon: 'barcode',
        to: '/barcode',
        component: () => import('@/views/BarcodeToolView.vue'),
        description: '快递单号生成 Code 128 / Code 39 / EAN-13 条形码'
      },
      {
        id: 'escape',
        name: '实体转义',
        icon: 'link',
        to: '/escape',
        component: () => import('@/views/EscapeToolView.vue'),
        description: '\\u 转义 / HTML 实体（&amp; 等）双向解码与编码'
      },
      {
        id: 'aes',
        name: 'AES 加解密',
        icon: 'key',
        to: '/aes',
        component: () => import('@/views/AesToolView.vue'),
        description: 'AES-GCM 加解密：PBKDF2 密码派生，本地零依赖'
      },
      {
        id: 'url-parse',
        name: 'URL 解析',
        icon: 'link',
        to: '/url-parse',
        component: () => import('@/views/UrlParseToolView.vue'),
        description: '拆解 URL 协议/主机/路径/参数/片段，参数可编辑后重组'
      },
      {
        id: 'totp',
        name: 'TOTP 动态口令',
        icon: 'clock',
        to: '/totp',
        component: () => import('@/views/TotpToolView.vue'),
        description: 'RFC 6238 动态口令生成（otpauth URI / Base32 密钥）'
      },
      {
        id: 'rsa',
        name: 'RSA 密钥',
        icon: 'key',
        to: '/rsa',
        component: () => import('@/views/RsaToolView.vue'),
        description: 'RSA 密钥对生成、OAEP 加解密、RS256 签名验签（本地 WebCrypto）'
      },
      {
        id: 'image',
        name: '图片处理',
        icon: 'image',
        to: '/image',
        component: () => import('@/views/ImageToolView.vue'),
        description: '本地 Canvas 压缩/缩放/转格式，支持 WebP/JPEG/PNG'
      }
    ]
  },
  {
    id: 'text',
    label: '文本与效率',
    tools: [
      {
        id: 'text',
        name: '文本处理',
        icon: 'grid',
        to: '/text',
        component: () => import('@/views/TextToolView.vue'),
        description: '大小写互转、行排序/去重、字数统计'
      },
      {
        id: 'mock',
        name: 'Mock 数据',
        icon: 'sparkle',
        to: '/mock',
        component: () => import('@/views/MockToolView.vue'),
        description: '随机姓名/手机号/身份证/邮箱/地址等，批量 JSON/CSV 或模板生成'
      },
      {
        id: 'diff',
        name: '文本对比',
        icon: 'swap',
        to: '/diff',
        component: () => import('@/views/DiffToolView.vue'),
        description: '左右文本逐行差异对比，可复制差异文本'
      },
      {
        id: 'json-lab',
        name: 'JSON 实验室',
        icon: 'braces',
        to: '/json-lab',
        component: () => import('@/views/JsonLabToolView.vue'),
        description: 'JSON → TypeScript 类型、JSON Path 查询、JSON ↔ CSV'
      },
      {
        id: 'json-diff',
        name: 'JSON 对比',
        icon: 'swap',
        to: '/json-diff',
        component: () => import('@/views/JsonDiffToolView.vue'),
        description: '深度对比两段 JSON：新增/删除/修改/类型变化，支持忽略键序与数组顺序'
      },
      {
        id: 'cron',
        name: 'Cron 解析',
        icon: 'clock',
        to: '/cron',
        component: () => import('@/views/CronToolView.vue'),
        description: 'Cron 表达式转人话 + 未来执行时间预测'
      },
      {
        id: 'http-ref',
        name: 'HTTP 速查',
        icon: 'globe',
        to: '/http-ref',
        component: () => import('@/views/HttpRefToolView.vue'),
        description: '状态码 / MIME / 方法 / CORS 头速查，可搜索复制'
      },
      {
        id: 'cmd-ref',
        name: '命令速查',
        icon: 'grid',
        to: '/cmd-ref',
        component: () => import('@/views/CmdRefToolView.vue'),
        description: 'Git / Linux / Docker / NPM 常用命令速查，一键复制'
      },
      {
        id: 'snippets',
        name: '片段收藏',
        icon: 'book',
        to: '/snippets',
        component: () => import('@/views/SnippetsToolView.vue'),
        description: '跨工具保存常用代码/命令片段，标签分组与全文复制'
      },
      {
        id: 'markdown-preview',
        name: 'Markdown 预览',
        icon: 'eye',
        to: '/markdown-preview',
        component: () => import('@/views/MarkdownPreviewToolView.vue'),
        description: 'Markdown 实时渲染预览（GFM 表格/代码块/引用）'
      }
    ]
  },
  {
    id: 'devutil',
    label: '开发辅助',
    tools: [
      {
        id: 'timestamp',
        name: '时间戳',
        icon: 'clock',
        to: '/timestamp',
        component: () => import('@/views/TimestampView.vue'),
        description: '秒/毫秒、ISO、本地、相对时间互转'
      },
      {
        id: 'date-calc',
        name: '日期计算',
        icon: 'clock',
        to: '/date-calc',
        component: () => import('@/views/DateCalcToolView.vue'),
        description: '两日期差值（天/工作日/年月日）与日期加减'
      },
      {
        id: 'cidr',
        name: '子网计算',
        icon: 'globe',
        to: '/cidr',
        component: () => import('@/views/CidrToolView.vue'),
        description: 'IPv4 / CIDR 子网计算：网络/广播/掩码/主机数/二进制'
      },
      {
        id: 'chmod',
        name: 'chmod 计算',
        icon: 'file',
        to: '/chmod',
        component: () => import('@/views/ChmodToolView.vue'),
        description: 'chmod 八进制 ↔ 符号 ↔ 勾选位，含特殊位与命令生成'
      },
      {
        id: 'regex',
        name: '正则校验',
        icon: 'hash',
        to: '/regex',
        component: () => import('@/views/RegexToolView.vue'),
        description: '正则在线匹配测试 + 常用正则词典'
      },
      {
        id: 'integration',
        name: '接口测试',
        icon: 'globe',
        to: '/integration',
        component: () => import('@/views/IntegrationToolView.vue'),
        description: '轻量 API 测试：方法/请求头/请求体可配置，响应展示与历史回放'
      }
    ]
  }
]

export const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools.map((t) => ({ ...t, group: g.label })))
export const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map((t) => [t.id, t]))
