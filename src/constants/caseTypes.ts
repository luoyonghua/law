// 案件状态选项
export const CASE_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending', color: 'info' },
  { label: '侦查中', value: 'investigating', color: '' },
  { label: '审查逮捕', value: 'arrest_review', color: 'warning' },
  { label: '审查起诉', value: 'prosecution_review', color: 'warning' },
  { label: '审判', value: 'trial', color: 'danger' },
  { label: '结案', value: 'closed', color: 'success' }
] as const

// 案件类型选项
export const CASE_TYPE_OPTIONS = [
  { label: '刑事案件', value: '刑事案件' },
  { label: '民事案件', value: '民事案件' },
  { label: '行政案件', value: '行政案件' }
] as const

// 性别选项
export const GENDER_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
] as const

// 获取状态显示配置
export function getCaseStatusConfig(status: string) {
  return CASE_STATUS_OPTIONS.find(item => item.value === status) || CASE_STATUS_OPTIONS[0]
}
