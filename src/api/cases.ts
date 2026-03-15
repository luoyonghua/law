import documentRequest from '@/utils/http/documentRequest'

/**
 * 案件管理 API
 */

// 获取案件列表
export function fetchCaseList(params?: Api.Cases.CaseListParams) {
  return documentRequest.get<Api.Cases.CaseListResponse['data']>({
    url: '/api/cases/',
    params
  })
}

// 获取案件详情
export function fetchCaseDetail(caseId: string) {
  return documentRequest.get<Api.Cases.CaseDetail>({
    url: `/api/cases/${caseId}`
  })
}

// 创建案件
export function createCase(data: Api.Cases.CaseFormData) {
  return documentRequest.post<Api.Cases.CreateCaseResponse['data']>({
    url: '/api/cases/',
    data
  })
}

// 更新案件
export function updateCase(caseId: string, data: Partial<Api.Cases.CaseFormData>) {
  return documentRequest.put<Api.Cases.UpdateCaseResponse['data']>({
    url: `/api/cases/${caseId}`,
    data
  })
}

// 删除案件
export function deleteCase(caseId: string) {
  return documentRequest.del<null>({
    url: `/api/cases/${caseId}`
  })
}

// 获取案件统计信息
export function fetchCaseStatistics() {
  return documentRequest.get<Api.Cases.CaseStatistics>({
    url: '/api/cases/statistics/overview'
  })
}

// 上传文档到案件（批量）
export function uploadDocumentsToCase(files: File[], params: { case_id: string; uploader_name?: string }) {
  const formData = new FormData()
  
  // 添加所有文件
  files.forEach(file => {
    formData.append('files', file)
  })
  
  // 添加案件ID
  formData.append('case_id', params.case_id)
  
  // 添加上传人姓名（可选）
  if (params.uploader_name) {
    formData.append('uploader_name', params.uploader_name)
  }

  return documentRequest.post<Api.Documents.BatchUploadResponse>({
    url: '/api/documents/batch-upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除案件文档
export function deleteCaseDocument(caseId: string, docId: string) {
  return documentRequest.del<null>({
    url: `/api/cases/${caseId}/documents/${docId}`
  })
}

// 下载文档
export function downloadCaseDocument(docId: string) {
  const { VITE_DOCUMENT_API_URL } = import.meta.env
  return `${VITE_DOCUMENT_API_URL}/api/documents/${docId}/download`
}
