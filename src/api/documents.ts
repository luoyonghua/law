import documentRequest from '@/utils/http/documentRequest'

/**
 * 文书管理 API
 */

// 获取文档列表
export function fetchDocumentList() {
  return documentRequest.get<Api.Documents.DocumentInfo[]>({
    url: '/api/documents/'
  })
}

// 批量上传文档
export function uploadDocuments(files: FormData) {
  return documentRequest.post<Api.Documents.BatchUploadResponse>({
    url: '/api/documents/batch-upload',
    data: files,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 查询上传进度
export function fetchBatchStatus(batchId: string) {
  return documentRequest.get<Api.Documents.BatchStatusResponse>({
    url: `/api/documents/batch-status/${batchId}`
  })
}

// 提交批量结构化提取任务
export function submitBatchExtract(docIds: string[]) {
  return documentRequest.post<Api.Documents.BatchExtractSubmitResponse>({
    url: '/api/elements/batch-structured-extract',
    data: { doc_ids: docIds }
  })
}

// 查询批次状态
export function getBatchExtractStatus(batchId: string) {
  return documentRequest.get<Api.Documents.BatchExtractStatusResponse>({
    url: `/api/elements/structured-extract/batch-status/${batchId}`
  })
}

// 查询子任务状态
export function getSubTaskStatus(taskId: string) {
  return documentRequest.get<Api.Documents.SubTaskStatusResponse>({
    url: `/api/elements/structured-extract/status/${taskId}`
  })
}

// 批量结构化提取（旧版，保留兼容）
export function batchStructuredExtract(docIds: string[]) {
  return documentRequest.post<{
    total: number
    success_count: number
    fail_count: number
    results: Api.Documents.ExtractionResult[]
  }>({
    url: '/api/elements/batch-structured-extract',
    data: { doc_ids: docIds },
    timeout: 300000 // 5 分钟超时
  })
}

// 文书对比（耗时较长，设置 5 分钟超时）
export function compareDocuments(docIds: string[], comparisonType: string = 'custom') {
  return documentRequest.post<Api.Documents.ComparisonResponse>({
    url: '/api/comparison/compare',
    data: { doc_ids: docIds, comparison_type: comparisonType },
    timeout: 300000 // 5 分钟超时
  })
}

// 获取提取历史记录
export function fetchExtractionHistory(page: number = 1, pageSize: number = 10) {
  return documentRequest.get<Api.Documents.ExtractionHistoryResponse>({
    url: '/api/extraction/history',
    params: { page, page_size: pageSize }
  })
}

// 下载文档文件
export function downloadDocument(docId: string) {
  const { VITE_DOCUMENT_API_URL } = import.meta.env
  return `${VITE_DOCUMENT_API_URL}/api/documents/${docId}/download`
}

// 预览文档文件
export function previewDocument(docId: string) {
  return downloadDocument(docId)
}

// 批量审查文书（逻辑审查）
export function batchReviewDocuments(docIds: string[], includeElements: boolean = true) {
  return documentRequest.post<Api.Documents.BatchReviewResponse>({
    url: '/api/review/batch-by-doctype',
    data: docIds,  // 直接传递 ID 数组
    timeout: 300000 // 5 分钟超时
  })
}

// 批量审查文书（规则库审查）
export function batchReviewWithRuleEngine(docIds: string[]) {
  return documentRequest.post<Api.Documents.BatchReviewResponse>({
    url: '/api/review/batch-with-rule-engine',
    data: { doc_ids: docIds },
    timeout: 300000 // 5 分钟超时
  })
}

// 获取审查历史列表
export function fetchReviewHistory(page: number = 1, pageSize: number = 20, filters?: {
  doc_type?: string
  min_score?: number
  max_score?: number
}) {
  return documentRequest.get<Api.Documents.ReviewHistoryResponse>({
    url: '/api/review/history/list',
    params: {
      page,
      page_size: pageSize,
      ...filters
    }
  })
}

// 批量删除提取记录
export function batchDeleteExtractionRecords(recordIds: string[]) {
  return documentRequest.del<{ deleted_count: number }>({
    url: '/api/extraction/history/batch',
    data: { 
      record_ids: recordIds,
      record_type: 'structured'
    }
  })
}

// 删除文档
export function deleteDocument(docId: string) {
  return documentRequest.del<null>({
    url: `/api/documents/${docId}`
  })
}

// 删除审查记录
export function deleteReviewRecord(reviewId: string) {
  return documentRequest.del<{ review_id: string }>({
    url: `/api/review/history/${reviewId}`
  })
}

// ==================== 规则管理接口 ====================

// 获取文书类型列表
export function fetchDocumentTypes() {
  return documentRequest.get<{ document_types: string[]; total: number }>({
    url: '/api/rules/document-types'
  })
}

// 获取规则统计信息
export function fetchRuleStatistics() {
  return documentRequest.get<Api.Documents.RuleStatistics>({
    url: '/api/rules/statistics'
  })
}

// 搜索规则
export function searchRules(params: {
  doc_type?: string
  keyword?: string
  severity?: string
}) {
  return documentRequest.post<{ results: Api.Documents.RuleDetail[]; total: number }>({
    url: '/api/rules/search',
    data: params
  })
}

// 获取指定文书类型的规则
export function fetchRulesByDocType(docType: string) {
  return documentRequest.get<Api.Documents.RulesByDocTypeResponse>({
    url: `/api/rules/${encodeURIComponent(docType)}`
  })
}

// 添加规则
export function addRule(docType: string, rule: Api.Documents.RuleDetail) {
  return documentRequest.post<{ rule_code: string }>({
    url: `/api/rules/${encodeURIComponent(docType)}`,
    data: rule
  })
}

// 更新规则
export function updateRule(docType: string, ruleCode: string, rule: Partial<Api.Documents.RuleDetail>) {
  return documentRequest.put<{ rule_code: string }>({
    url: `/api/rules/${encodeURIComponent(docType)}/${encodeURIComponent(ruleCode)}`,
    data: rule
  })
}

// 删除规则
export function deleteRule(docType: string, ruleCode: string) {
  return documentRequest.del<{ rule_code: string }>({
    url: `/api/rules/${encodeURIComponent(docType)}/${encodeURIComponent(ruleCode)}`
  })
}

// 预览提示词
export function previewPrompt(params: {
  doc_type: string
  include_examples: boolean
  selected_rules: string[]
}) {
  return documentRequest.post<Api.Documents.PromptPreviewResponse>({
    url: '/api/rules/preview-prompt',
    data: params
  })
}

// 测试规则（手动输入文档内容）
export function testRulesWithContent(params: {
  doc_type: string
  document_content: string
  include_examples: boolean
  selected_rules: string[]
}) {
  return documentRequest.post<{
    success: boolean
    review_result: Api.Documents.RuleTestResult
    test_info: {
      doc_type: string
      content_length: number
      rules_used: number
      include_examples: boolean
    }
  }>({
    url: '/api/rules/test-rules',
    data: params,
    timeout: 300000 // 5 分钟超时
  })
}

// 测试规则（从已上传文档中选择）
export function testRulesWithDocument(docId: string, params: {
  include_examples: boolean
  doc_type: string
  selected_rules: string[]
}) {
  return documentRequest.post<Api.Documents.RuleTestResult & { doc_id: string; file_name: string }>({
    url: `/api/review/with-rule-engine/${docId}`,
    data: params,
    timeout: 300000 // 5 分钟超时
  })
}

// 生成审查报告
export function generateReviewReport(docId: string, params?: {
  format?: 'docx' | 'pdf'
  review_id?: string
}) {
  const { VITE_DOCUMENT_API_URL } = import.meta.env
  const queryParams = new URLSearchParams()
  if (params?.format) queryParams.append('format', params.format)
  if (params?.review_id) queryParams.append('review_id', params.review_id)
  const queryString = queryParams.toString()
  return `${VITE_DOCUMENT_API_URL}/api/review/generate-report/${docId}${queryString ? '?' + queryString : ''}`
}

// 获取审查结果详情
export function fetchReviewDetail(reviewId: string) {
  return documentRequest.get<Api.Documents.ReviewDetailRecord>({
    url: `/api/review/history/detail/${reviewId}`
  })
}

// 获取文档的审查历史
export function fetchDocumentReviewHistory(docId: string, limit?: number) {
  return documentRequest.get<Api.Documents.DocumentReviewHistoryResponse['data']>({
    url: `/api/review/history/${docId}`,
    params: limit ? { limit } : undefined
  })
}

// 获取对比历史列表
export function fetchComparisonHistory(page: number = 1, pageSize: number = 20) {
  return documentRequest.get<Api.Documents.ComparisonHistoryResponse>({
    url: '/api/comparison/history/list',
    params: { page, page_size: pageSize }
  })
}

// 获取对比详情
export function fetchComparisonDetail(comparisonId: string) {
  return documentRequest.get<Api.Documents.ComparisonResponse>({
    url: `/api/comparison/${comparisonId}`
  })
}

// 删除对比记录
export function deleteComparisonRecord(comparisonId: string) {
  return documentRequest.del<{ comparison_id: string }>({
    url: `/api/comparison/${comparisonId}`
  })
}

// 批量删除对比记录
export function batchDeleteComparisonRecords(comparisonIds: string[]) {
  return documentRequest.del<{
    deleted_count: number
    failed_count: number
    failed_ids: string[]
  }>({
    url: '/api/comparison/batch',
    data: { comparison_ids: comparisonIds }
  })
}

// 生成对比报告
export function generateComparisonReport(
  comparisonId: string, 
  docIdA: string, 
  docIdB: string, 
  format: 'docx' | 'pdf' = 'docx'
) {
  const { VITE_DOCUMENT_API_URL } = import.meta.env
  const queryParams = new URLSearchParams()
  queryParams.append('doc_id_a', docIdA)
  queryParams.append('doc_id_b', docIdB)
  queryParams.append('format', format)
  queryParams.append('comparison_id', comparisonId)
  return `${VITE_DOCUMENT_API_URL}/api/comparison/generate-report?${queryParams.toString()}`
}

// 批量生成对比报告（返回ZIP）
export function batchGenerateComparisonReports(comparisonIds: string[], format: 'docx' | 'pdf' = 'docx') {
  return documentRequest.post<Blob>({
    url: '/api/comparison/batch-generate-reports',
    data: { comparison_ids: comparisonIds, format },
    responseType: 'blob'
  })
}

// 根据案件ID获取审查历史
export function fetchReviewHistoryByCase(caseId: string) {
  return documentRequest.get<Api.Documents.CaseReviewHistoryResponse>({
    url: `/api/review/history/by-case/${caseId}`
  })
}

// 根据案件ID获取对比历史
export function fetchComparisonHistoryByCase(caseId: string) {
  return documentRequest.get<Api.Documents.CaseComparisonHistoryResponse>({
    url: `/api/comparison/history/by-case/${caseId}`
  })
}

// 根据文件名获取最新的规则库审查结果
export function fetchLatestReviewByFilename(fileName: string) {
  return documentRequest.get<Api.Documents.ReviewDetailRecord>({
    url: '/api/document-review/history/latest/by-filename',
    params: { file_name: fileName }
  })
}

// 根据文件名获取最新的结构化提取结果
export function fetchLatestExtractionByFilename(fileName: string) {
  return documentRequest.get<Api.Documents.ExtractionHistoryRecord>({
    url: '/api/elements/structured-extract/latest/by-filename',
    params: { file_name: fileName }
  })
}

// 导出规则
export function exportRules(docType: string, params: Api.Documents.RuleExportParams) {
  return documentRequest.post<Blob>({
    url: `/api/rules/${encodeURIComponent(docType)}/export`,
    data: params,
    responseType: 'blob'
  })
}

// 导入规则
export function importRules(docType: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return documentRequest.post<Api.Documents.RuleImportResponse>({
    url: `/api/rules/${encodeURIComponent(docType)}/import`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 切换单个规则状态
export function toggleRuleStatus(docType: string, ruleCode: string) {
  return documentRequest.put<Api.Documents.RuleToggleResponse>({
    url: `/api/rules/${encodeURIComponent(docType)}/${encodeURIComponent(ruleCode)}/toggle`
  })
}

// 批量切换规则状态
export function batchToggleRules(docType: string, params: Api.Documents.BatchToggleParams) {
  return documentRequest.post<Api.Documents.BatchToggleResponse>({
    url: `/api/rules/${encodeURIComponent(docType)}/batch-toggle`,
    data: params
  })
}

// 获取规则层级结构
export function fetchRuleHierarchy(docType?: string) {
  if (docType) {
    // 获取单个文书类型的层级结构
    return documentRequest.get<Api.Documents.RuleHierarchyResponse>({
      url: '/api/rules/hierarchy',
      params: { doc_type: docType }
    })
  } else {
    // 获取所有文书类型的层级结构
    return documentRequest.get<Api.Documents.AllDocumentsHierarchyResponse>({
      url: '/api/rules/hierarchy'
    })
  }
}


// ==================== 一体化接口 ====================

// 一体化审查（自动提取+审查）
export function unifiedReview(docId: string, params?: {
  selected_rules?: string[] | null
  include_examples?: boolean
  force_extract?: boolean
}) {
  return documentRequest.post<Api.Documents.UnifiedReviewResponse>({
    url: `/api/review/extract-and-review/${docId}`,
    data: params ?? {},
    timeout: 300000
  })
}

// 一体化对比（自动提取+对比）
export function unifiedCompare(params: {
  doc_id_a: string
  doc_id_b: string
  force_extract?: boolean
}) {
  return documentRequest.post<Api.Documents.UnifiedComparisonResponse>({
    url: '/api/comparison/extract-and-compare',
    data: params,
    timeout: 300000
  })
}

// ==================== 对比规则管理接口 ====================

// 获取所有对比阶段（客户端自动解包 data 层，直接返回 { stages, total }）
export function fetchComparisonStages() {
  return documentRequest.get<{ stages: Api.Documents.ComparisonStage[]; total: number }>({
    url: '/api/comparison-rules/stages'
  })
}

// 获取对比规则统计信息（客户端自动解包 data 层，直接返回统计对象）
export function fetchComparisonRuleStatistics() {
  return documentRequest.get<Api.Documents.ComparisonRuleStatistics>({
    url: '/api/comparison-rules/statistics'
  })
}

// 获取指定阶段的规则列表
export function fetchComparisonRulesByStage(stage: string) {
  return documentRequest.get<Api.Documents.ComparisonRuleListResponse>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}`
  })
}

// 搜索对比规则（客户端自动解包 data 层，直接返回 { results, total }）
export function searchComparisonRules(params: {
  keyword?: string
  stage?: string
  category?: string
  severity?: string
}) {
  return documentRequest.post<{ results: Api.Documents.ComparisonRule[]; total: number }>({
    url: '/api/comparison-rules/search',
    data: params
  })
}

// 添加对比规则
export function addComparisonRule(stage: string, rule: Omit<Api.Documents.ComparisonRule, 'stage'>) {
  return documentRequest.post<{ rule: Api.Documents.ComparisonRule }>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}`,
    data: rule
  })
}

// 更新对比规则
export function updateComparisonRule(stage: string, ruleCode: string, rule: Omit<Api.Documents.ComparisonRule, 'stage'>) {
  return documentRequest.put<{ rule: Api.Documents.ComparisonRule }>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}/${encodeURIComponent(ruleCode)}`,
    data: rule
  })
}

// 删除对比规则
export function deleteComparisonRule(stage: string, ruleCode: string) {
  return documentRequest.del<null>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}/${encodeURIComponent(ruleCode)}`
  })
}

// 预览对比提示词（客户端自动解包 data 层，直接返回 { system_prompt, user_prompt, statistics }）
export function previewComparisonPrompt(params: {
  stage: string
  selected_rules?: string[]
  doc_a_content?: string
  doc_b_content?: string
}) {
  return documentRequest.post<{
    system_prompt: string
    user_prompt: string
    statistics: { system_length: number; user_length: number; total_length: number; rules_count: number; estimated_tokens: number }
  }>({
    url: '/api/comparison-rules/preview-prompt',
    data: params
  })
}

// 导出对比规则为 Excel
export function exportComparisonRulesExcel(stage: string) {
  const { VITE_DOCUMENT_API_URL } = import.meta.env
  return `${VITE_DOCUMENT_API_URL}/api/comparison-rules/${encodeURIComponent(stage)}/export-excel`
}

// 导入对比规则 Excel
export function importComparisonRulesExcel(stage: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return documentRequest.post<{ total_rules: number; last_updated: string }>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}/import-excel`,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 切换单条对比规则状态
export function toggleComparisonRule(stage: string, ruleCode: string) {
  return documentRequest.put<{ rule_code: string; enabled: boolean; status_text: string }>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}/${encodeURIComponent(ruleCode)}/toggle`
  })
}

// 批量切换对比规则状态
export function batchToggleComparisonRules(stage: string, params: { rule_codes: string[]; enabled: boolean }) {
  return documentRequest.put<{ count: number; enabled: boolean; status_text: string }>({
    url: `/api/comparison-rules/${encodeURIComponent(stage)}/batch-toggle`,
    data: params
  })
}
