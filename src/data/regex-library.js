/**
 * 常用正则词条。同一类别内的词条按常用度排序。
 * 注意：手机号/身份证等有政策/号段时效性的词条，note 里注明更新时间，
 * 建议关键业务仍以后端校验为准。
 */

export const REGEX_GROUPS = [
  {
    id: 'cn',
    label: '常见号码（中国大陆）',
    items: [
      {
        id: 'cn-mobile',
        name: '手机号',
        pattern: '^1[3-9]\\d{9}$',
        flags: '',
        desc: '中国大陆手机号：1 开头 + 3-9 号段 + 共 11 位',
        note: '号段随运营商会调整，2026-10 校对；关键场景请以后端为准'
      },
      {
        id: 'cn-landline',
        name: '固定电话',
        pattern: '^(0\\d{2,3}-?)?\\d{7,8}$',
        flags: '',
        desc: '区号 2-3 位（可带连字符）+ 号码 7-8 位'
      },
      {
        id: 'cn-postcode',
        name: '邮政编码',
        pattern: '^\\d{6}$',
        flags: '',
        desc: '中国邮政编码 6 位数字'
      },
      {
        id: 'cn-plate',
        name: '车牌号',
        pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$',
        flags: '',
        desc: '普通车 7 位 / 新能源 8 位，支持挂学警港澳',
        note: '不含部分地方性特种号牌，2026-10 校对'
      },
      {
        id: 'cn-id',
        name: '身份证号（格式）',
        pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
        flags: '',
        desc: '18 位身份证格式（地址码 + 出生日期 + 顺序码 + 校验位）',
        note: '仅校验格式。18 位最后一位为 ISO 校验码，严格校验需要算法，工具暂未实现'
      },
      {
        id: 'cn-credit-code',
        name: '统一社会信用代码',
        pattern: '^[0-9A-HJ-NPQRTUWXY]{2}\\d{6}[0-9A-HJ-NPQRTUWXY]{10}$',
        flags: '',
        desc: '18 位统一社会信用代码（去 I O S V Z）'
      }
    ]
  },
  {
    id: 'general',
    label: '通用格式',
    items: [
      {
        id: 'email',
        name: '电子邮箱',
        pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
        flags: '',
        desc: '常见邮箱地址，允许 + 号别名与点号',
        note: 'RFC 完整规则更复杂，此正则覆盖 99% 常见场景'
      },
      {
        id: 'url',
        name: 'URL（http/https）',
        pattern: '^https?://[\\w.-]+(:\\d+)?(/[^\\s]*)?$',
        flags: '',
        desc: '以 http/https 开头的网址'
      },
      {
        id: 'date',
        name: '日期 YYYY-MM-DD',
        pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
        flags: '',
        desc: '日期，月份与日期有范围限制（不含 2 月 30 日等精确性）'
      },
      {
        id: 'time',
        name: '时间 HH:mm:ss',
        pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$',
        flags: '',
        desc: '24 小时制时间'
      },
      {
        id: 'money-cny',
        name: '金额（元）',
        pattern: '^-?(0|[1-9]\\d*)(,\\d{3})*(\\.\\d{1,2})?$',
        flags: '',
        desc: '支持千分位逗号与两位小数，可带正负号'
      },
      {
        id: 'int',
        name: '整数',
        pattern: '^-?(0|[1-9]\\d*)$',
        flags: '',
        desc: '十进制整数，不允许 012 这种前导零'
      },
      {
        id: 'float',
        name: '数字（整数/小数）',
        pattern: '^-?(0|[1-9]\\d*)(\\.\\d+)?$',
        flags: '',
        desc: '十进制整数或小数'
      }
    ]
  },
  {
    id: 'net',
    label: '网络与标识',
    items: [
      {
        id: 'ipv4',
        name: 'IPv4 地址',
        pattern: '^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)$',
        flags: '',
        desc: '每段 0-255 的 IPv4 地址'
      },
      {
        id: 'ipv6',
        name: 'IPv6 地址（完整）',
        pattern: '^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$',
        flags: '',
        desc: '8 段完整写法的 IPv6，不含 :: 缩写',
        note: ':: 缩写形态规则复杂，如需完整覆盖建议用专门解析库'
      },
      {
        id: 'mac',
        name: 'MAC 地址',
        pattern: '^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$',
        flags: '',
        desc: '冒号或连字符分隔的 MAC'
      },
      {
        id: 'hex-color',
        name: '十六进制颜色',
        pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$',
        flags: '',
        desc: '支持 3/6/8 位（含 alpha）写法'
      },
      {
        id: 'uuid',
        name: 'UUID',
        pattern: '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$',
        flags: '',
        desc: '标准 8-4-4-4-12 格式'
      },
      {
        id: 'jwt',
        name: 'JWT',
        pattern: '^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$',
        flags: '',
        desc: 'JWT 三段式（Base64URL，无签名变体也能匹配）'
      }
    ]
  },
  {
    id: 'char',
    label: '字符与文本',
    items: [
      {
        id: 'chinese',
        name: '纯中文',
        pattern: '^[\\u4e00-\\u9fa5]+$',
        flags: '',
        desc: 'CJK 基本区汉字'
      },
      {
        id: 'word-count-zh',
        name: '匹配所有中文',
        pattern: '[\\u4e00-\\u9fa5]+',
        flags: 'g',
        desc: '从文本中提取连续中文片段（全局匹配）'
      },
      {
        id: 'ascii',
        name: '纯 ASCII 可见字符',
        pattern: '^[\\x21-\\x7E]+$',
        flags: '',
        desc: '不含空格的可见 ASCII 字符'
      },
      {
        id: 'qq',
        name: 'QQ 号',
        pattern: '^[1-9]\\d{4,10}$',
        flags: '',
        desc: '5-11 位、不以 0 开头'
      },
      {
        id: 'wx',
        name: '微信号',
        pattern: '^[A-Za-z][A-Za-z0-9_-]{5,19}$',
        flags: '',
        desc: '字母开头，6-20 位，允许字母/数字/下划线/连字符',
        note: '官方规则偶有调整，2026-10 校对'
      },
      {
        id: 'strong-password',
        name: '强密码',
        pattern: '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()-+=])[\\S]{8,32}$',
        flags: '',
        desc: '8-32 位，至少含字母、数字、常见符号各一类'
      }
    ]
  }
]
