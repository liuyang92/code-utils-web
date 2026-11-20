/**
 * Mock 数据生成器：中文姓名 / 手机号 / 身份证 / 邮箱 / 地址 / 公司 / UUID / 数字 / 日期等。
 * 支持：单值、字段表批量（JSON/CSV）、模板占位符替换。
 */

// ---------- 字符池 ----------
const SURNAMES = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何林高罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤'.split('')
const GIVEN_CHARS = '伟芳娜秀英敏静丽强磊军洋勇艳杰娟涛明超秀兰霞平刚桂英华民永波斌玲桂兰叶琳莎晶欣怡雪倩楠婷玉鑫昊泽宪宇宸安邦辉发群品河宁诚先敬震振忍克胜伟强文武富强雪莹碧珂莎雅莉莉琪'.split('')
const PROVINCES = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '湖南', '山东', '河南', '福建', '安徽', '重庆', '陕西', '辽宁', '河北', '山西', '江西', '云南', '广西']
const CITIES = {
  北京: ['朝阳区', '海淀区', '丰台区', '东城区', '西城区'],
  上海: ['浦东新区', '徐汇区', '静安区', '黄浦区', '闵行区'],
  广东: ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
  浙江: ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市'],
  江苏: ['南京市', '苏州市', '无锡市', '常州市', '南通市'],
  四川: ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市'],
  湖北: ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄石市'],
  湖南: ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市'],
  山东: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市'],
  河南: ['郑州市', '洛阳市', '开封市', '新乡市', '南阳市'],
  福建: ['福州市', '厦门市', '泉州市', '漳州市', '莆田市'],
  安徽: ['合肥市', '芜湖市', '蚌埠市', '安庆市', '马鞍山市'],
  重庆: ['渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区'],
  陕西: ['西安市', '宝鸡市', '咸阳市', '渭南市', '汉中市'],
  辽宁: ['沈阳市', '大连市', '鞍山市', '抚顺市', '锦州市'],
  河北: ['石家庄市', '唐山市', '保定市', '廊坊市', '沧州市'],
  山西: ['太原市', '大同市', '运城市', '临汾市', '晋中市'],
  江西: ['南昌市', '赣州市', '九江市', '上饶市', '宜春市'],
  云南: ['昆明市', '大理州', '曲靖市', '玉溪市', '红河州'],
  广西: ['南宁市', '柳州市', '桂林市', '梧州市', '北海市']
}
const STREETS = ['人民路', '中山路', '解放路', '建国路', '和平路', '幸福街', '朝阳路', '长安街', '文化路', '科技大道']
const COMPANY_PREFIX = ['华', '中', '京', '申', '粤', '杭', '蓉', '汉', '鲁', '苏', '德', '信', '创', '联', '瑞', '泰', '恒']
const COMPANY_MID = ['信', '科', '云', '智', '网', '数', '新', '能', '环', '生', '医', '金', '诚', '达', '盛']
const COMPANY_SUFFIX = ['科技有限公司', '信息技术有限公司', '网络技术有限公司', '智能科技有限公司', '数据服务有限公司', '电子有限公司', '实业发展有限公司', '集团股份有限公司']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 安全随机整数 [0, max) */
function randInt(max) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

// ---------- 单值生成器 ----------
export function genName() {
  const surname = pick(SURNAMES)
  const len = randInt(2) === 0 ? 1 : 2
  let given = ''
  for (let i = 0; i < len; i++) given += pick(GIVEN_CHARS)
  return surname + given
}

export function genPhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '170', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '191', '198', '199']
  let phone = pick(prefixes)
  for (let i = 0; i < 8; i++) phone += randInt(10)
  return phone
}

/** 18 位身份证：地区 6 位 + 年月日 8 位 + 顺序 3 位 + ISO 7064 校验位 */
export function genIdCard({ minYear = 1960, maxYear = 2005 } = {}) {
  const region = '110101' // 北京东城区（示例用固定区域码更稳定）
  const year = minYear + randInt(maxYear - minYear + 1)
  const month = 1 + randInt(12)
  const dayMax = new Date(year, month, 0).getDate()
  const day = 1 + randInt(dayMax)
  const seq = 100 + randInt(900)
  const base = `${region}${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${seq}`
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checks = '10X98765432'
  let sum = 0
  for (let i = 0; i < 17; i++) sum += Number(base[i]) * weights[i]
  return base + checks[sum % 11]
}

/** 身份证校验位校验（用于测试与用户验证） */
export function isValidIdCard(id) {
  const s = String(id).trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(s)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checks = '10X98765432'
  let sum = 0
  for (let i = 0; i < 17; i++) sum += Number(s[i]) * weights[i]
  return s[17] === checks[sum % 11]
}

export function genEmail() {
  const names = ['zhang', 'li', 'wang', 'chen', 'liu', 'yang', 'zhao', 'huang', 'wu', 'xu']
  const suffixes = ['@example.com', '@qq.com', '@163.com', '@126.com', '@gmail.com', '@sina.com', '@outlook.com']
  return `${pick(names)}${randInt(10000)}${pick(suffixes)}`
}

export function genAddress() {
  const province = pick(PROVINCES)
  const city = pick(CITIES[province])
  const street = pick(STREETS)
  return `${province}${city}${street}${1 + randInt(200)}号`
}

export function genCompany() {
  return `${pick(COMPANY_PREFIX)}${pick(COMPANY_MID)}${pick(COMPANY_SUFFIX)}`
}

export function genUuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = randInt(16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function genNumber({ min = 0, max = 1000, decimals = 0 } = {}) {
  const v = min + Math.random() * (max - min)
  return Number(v.toFixed(decimals))
}

export function genDate({ minYear = 2000, maxYear = 2030 } = {}) {
  const year = minYear + randInt(maxYear - minYear + 1)
  const month = 1 + randInt(12)
  const day = 1 + randInt(new Date(year, month, 0).getDate())
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function genBoolean() {
  return Boolean(randInt(2))
}

export function genEnum(values = []) {
  const arr = values.filter((v) => v !== '' && v != null)
  return arr.length ? pick(arr) : ''
}

// ---------- 字段类型注册表 ----------
export const FIELD_TYPES = [
  { value: 'name', label: '中文姓名' },
  { value: 'phone', label: '手机号' },
  { value: 'idcard', label: '身份证号' },
  { value: 'email', label: '邮箱' },
  { value: 'address', label: '地址' },
  { value: 'company', label: '公司名' },
  { value: 'uuid', label: 'UUID' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '布尔' },
  { value: 'enum', label: '枚举' }
]

/** 按类型生成单个值，带类型参数 options */
export function genByType(type, options = {}) {
  switch (type) {
    case 'name': return genName()
    case 'phone': return genPhone()
    case 'idcard': return genIdCard(options)
    case 'email': return genEmail()
    case 'address': return genAddress()
    case 'company': return genCompany()
    case 'uuid': return genUuid()
    case 'number': return genNumber(options)
    case 'date': return genDate(options)
    case 'boolean': return genBoolean()
    case 'enum': return genEnum(options.values)
    default: throw new Error(`未知字段类型：${type}`)
  }
}

/**
 * 批量生成记录：fields = [{ name, type, options }]
 * @returns {Array<object>}
 */
export function genRecords(count, fields) {
  const out = []
  const n = Math.max(1, Math.min(Number(count) || 1, 1000))
  for (let i = 0; i < n; i++) {
    const rec = {}
    for (const f of fields) {
      rec[f.name || f.type] = genByType(f.type, f.options || {})
    }
    out.push(rec)
  }
  return out
}

/**
 * 模板生成：把文本里的 {{type}} / {{type:option}} 替换为生成值，生成 count 条。
 * 支持：{{name}} {{phone}} {{email}} {{address}} {{company}} {{uuid}} {{number:min,max,decimals}} {{date:minYear,maxYear}} {{enum:a|b|c}}
 */
export function genFromTemplate(template, count = 1) {
  const re = /\{\{\s*([\w]+)(?::([^}]*))?\s*\}\}/g
  const n = Math.max(1, Math.min(Number(count) || 1, 1000))
  const results = []
  for (let i = 0; i < n; i++) {
    results.push(template.replace(re, (m, type, optRaw) => {
      const options = {}
      if (optRaw) {
        if (type === 'number') {
          const [min, max, decimals] = optRaw.split(',').map(Number)
          if (!isNaN(min)) options.min = min
          if (!isNaN(max)) options.max = max
          if (!isNaN(decimals)) options.decimals = decimals
        } else if (type === 'date') {
          const [minYear, maxYear] = optRaw.split(',').map(Number)
          if (!isNaN(minYear)) options.minYear = minYear
          if (!isNaN(maxYear)) options.maxYear = maxYear
        } else if (type === 'enum') {
          options.values = optRaw.split('|')
        }
      }
      try {
        return String(genByType(type, options))
      } catch {
        return m // 未知类型原样保留
      }
    }))
  }
  return results
}
