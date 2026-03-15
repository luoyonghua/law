declare namespace Api {
  namespace Cases {
    // 案件基本信息
    interface CaseInfo {
      case_id: string
      case_number: string
      case_name: string
      defendant_name: string
      defendant_id_number?: string
      case_type: string
      crime_name: string
      case_status: string
      filing_date: string
      handler: string
      department: string
      document_count: number
      created_at: string
      updated_at: string
      description?: string
    }

    // 案件详情
    interface CaseDetail extends CaseInfo {
      defendant_gender?: string
      defendant_birth_date?: string
      defendant_address?: string
      crime_amount?: string
      arrest_date?: string
      case_source?: string
      remarks?: string
      documents: CaseDocument[]
    }

    // 案件关联文档
    interface CaseDocument {
      doc_id: string
      file_name: string
      doc_type: string
      file_size: number
      upload_time: string
      uploader_name?: string
      ocr_status: string
      extraction_status?: string
    }

    // 案件列表请求参数
    interface CaseListParams {
      page?: number
      size?: number
      keyword?: string
      status?: string
    }

    // 案件列表响应
    interface CaseListResponse {
      code: number
      msg: string
      data: {
        items: CaseInfo[]
        total: number
        page: number
        size: number
        pages: number
      }
      success: boolean
    }

    // 案件详情响应
    interface CaseDetailResponse {
      code: number
      msg: string
      data: CaseDetail
      success: boolean
    }

    // 创建/更新案件请求
    interface CaseFormData {
      case_number: string
      case_name: string
      defendant_name: string
      defendant_id_number?: string
      defendant_gender?: string
      defendant_birth_date?: string
      defendant_address?: string
      case_type?: string
      crime_name?: string
      crime_amount?: string
      case_status?: string
      filing_date?: string
      arrest_date?: string
      handler?: string
      department?: string
      case_source?: string
      description?: string
      remarks?: string
    }

    // 创建案件响应
    interface CreateCaseResponse {
      code: number
      msg: string
      data: {
        case_id: string
        case_number: string
        created_at: string
      }
      success: boolean
    }

    // 更新案件响应
    interface UpdateCaseResponse {
      code: number
      msg: string
      data: {
        case_id: string
        updated_at: string
      }
      success: boolean
    }

    // 删除案件响应
    interface DeleteCaseResponse {
      code: number
      msg: string
      data: null
      success: boolean
    }

    // 案件统计信息
    interface CaseStatistics {
      total_cases: number
      status_distribution: Record<CaseStatus, number>
      recent_cases: number
      case_type_distribution: Record<string, number>
      crime_distribution: Record<string, number>
      monthly_trend: Array<{
        month: string
        count: number
      }>
    }

    // 案件统计响应
    interface CaseStatisticsResponse {
      code: number
      msg: string
      data: CaseStatistics
      success: boolean
    }

    // 上传文档到案件请求
    interface UploadDocumentParams {
      case_id: string
      uploader_name?: string
    }

    // 上传文档响应
    interface UploadDocumentResponse {
      code: number
      msg: string
      data: {
        doc_id: string
        file_name: string
        doc_type: string
        file_size: number
        case_id: string
        upload_time: string
        ocr_status: string
      }
      success: boolean
    }

    // 删除案件文档响应
    interface DeleteDocumentResponse {
      code: number
      msg: string
      data: null
      success: boolean
    }
  }
}
