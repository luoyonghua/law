/**
 * Mock 工具函数
 */
import Mock from 'mockjs'

const { Random } = Mock

/**
 * 生成中国手机号
 */
export function generatePhone(): string {
  const prefixes = [
    '130',
    '131',
    '132',
    '133',
    '134',
    '135',
    '136',
    '137',
    '138',
    '139',
    '150',
    '151',
    '152',
    '153',
    '155',
    '156',
    '157',
    '158',
    '159',
    '180',
    '181',
    '182',
    '183',
    '184',
    '185',
    '186',
    '187',
    '188',
    '189'
  ]
  const prefix = Random.pick(prefixes)
  const suffix = Random.string('number', 8)
  return prefix + suffix
}

/**
 * 生成身份证号
 */
export function generateIdCard(): string {
  return Random.id()
}

/**
 * 生成地址
 */
export function generateAddress(): string {
  return Random.county(true)
}

/**
 * 生成公司名称
 */
export function generateCompany(): string {
  const prefixes = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安', '南京', '苏州']
  const suffixes = [
    '科技有限公司',
    '网络科技有限公司',
    '信息技术有限公司',
    '软件有限公司',
    '互联网科技有限公司'
  ]

  return Random.pick(prefixes) + Random.cword(2, 4) + Random.pick(suffixes)
}

/**
 * 生成银行卡号
 */
export function generateBankCard(): string {
  return Random.string('number', 16)
}

/**
 * 生成价格
 */
export function generatePrice(min: number = 1, max: number = 10000): number {
  return Random.float(min, max, 2, 2)
}

/**
 * 生成状态
 */
export function generateStatus(): '1' | '2' {
  return Random.pick(['1', '2'])
}

/**
 * 生成评分
 */
export function generateRating(min: number = 1, max: number = 5): number {
  return Random.float(min, max, 1, 1)
}

/**
 * 生成标签
 */
export function generateTags(count: number = 3): string[] {
  const allTags = ['热门', '推荐', '新品', '限时', '特价', '包邮', '现货', '预售', '爆款', '精选']
  return Random.shuffle(allTags).slice(0, count)
}

/**
 * 生成颜色
 */
export function generateColors(count: number = 3): string[] {
  const colors = ['红色', '蓝色', '绿色', '黄色', '黑色', '白色', '灰色', '紫色', '粉色', '橙色']
  return Random.shuffle(colors).slice(0, count)
}

/**
 * 生成尺寸
 */
export function generateSizes(): string[] {
  return Random.shuffle(['XS', 'S', 'M', 'L', 'XL', 'XXL']).slice(0, Random.integer(2, 4))
}

/**
 * 延迟响应（模拟网络延迟）
 */
export function delay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 随机返回成功或失败
 */
export function randomSuccess(successRate: number = 0.8): boolean {
  return Math.random() < successRate
}

/**
 * 生成分页数据
 */
export function generatePaginatedData<T>(
  data: T[],
  current: number = 1,
  size: number = 10
): Api.Common.PaginatedResponse<T> {
  const start = (current - 1) * size
  const end = start + size
  const records = data.slice(start, end)

  return {
    records,
    current: Number(current),
    size: Number(size),
    total: data.length
  }
}

/**
 * 生成树形数据
 */
export function generateTreeData(depth: number = 3, childrenCount: number = 3): any[] {
  function generateNode(level: number, parentId: string = ''): any {
    const id = parentId
      ? `${parentId}-${Random.integer(1, 999)}`
      : Random.integer(1, 999).toString()
    const node = {
      id,
      label: Random.ctitle(2, 6),
      value: id,
      children: []
    }

    if (level < depth) {
      const count = Random.integer(1, childrenCount)
      node.children = Array.from({ length: count }, () => generateNode(level + 1, id))
    }

    return node
  }

  return Array.from({ length: Random.integer(2, 5) }, () => generateNode(1))
}
