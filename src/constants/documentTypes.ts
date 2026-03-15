/**
 * 文书类型常量
 * 用于统一管理系统中的文书类型选项
 */

export const DOCUMENT_TYPES = [
  { label: '提请批准逮捕书', value: '提请批准逮捕书' },
  { label: '起诉意见书', value: '起诉意见书' },
  { label: '审查报告（逮捕）', value: '审查报告（逮捕）' },
  { label: '起诉书', value: '起诉书' },
  { label: '审查报告（起诉）', value: '审查报告（起诉）' },
  { label: '退回补充侦查提纲', value: '退回补充侦查提纲' },
  { label: '不起诉决定书', value: '不起诉决定书' },
  { label: '刑事判决书', value: '刑事判决书' }
] as const

/**
 * 文书类型值的联合类型
 */
export type DocumentType = typeof DOCUMENT_TYPES[number]['value']

/**
 * 获取文书类型标签颜色
 */
export const getDocumentTypeColor = (docType: string): string => {
  const colorMap: Record<string, string> = {
    '提请批准逮捕书': 'danger',
    '起诉意见书': 'warning',
    '审查报告（逮捕）': 'info',
    '起诉书': 'success',
    '审查报告（起诉）': 'primary',
    '退回补充侦查提纲': '',
    '不起诉决定书': 'info',
    '刑事判决书': 'danger'
  }
  return colorMap[docType] || ''
}

/**
 * 文书类型简称映射
 */
export const DOCUMENT_TYPE_SHORT_NAME: Record<string, string> = {
  '提请批准逮捕书': '逮捕书',
  '起诉意见书': '起诉意见',
  '审查报告（逮捕）': '审查（逮捕）',
  '起诉书': '起诉书',
  '审查报告（起诉）': '审查（起诉）',
  '退回补充侦查提纲': '补充侦查',
  '不起诉决定书': '不起诉',
  '刑事判决书': '判决书'
}
