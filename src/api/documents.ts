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

// 批量结构化提取（耗时较长，设置 5 分钟超时）
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

// 批量审查文书
export function batchReviewDocuments(docIds: string[], includeElements: boolean = true) {
  return documentRequest.post<Api.Documents.BatchReviewResponse>({
    url: '/api/review/batch-review',
    data: { doc_ids: docIds, include_elements: includeElements },
    timeout: 300000 // 5 分钟超时
  })
}
