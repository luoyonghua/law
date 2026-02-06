declare namespace Api {
  namespace Documents {
    // 文档信息
    interface DocumentInfo {
      doc_id: string
      file_name: string
      case_id: string
      doc_type: string
      parse_status: string
      ocr_confidence: string
      text_length: number
      file_size: number
      created_at: string
    }

    // 文档列表响应
    interface DocumentListResponse {
      code: number
      msg: string
      data: DocumentInfo[]
    }

    // 批量上传响应
    interface BatchUploadResponse {
      batch_id: string
      total_files: number
      valid_files: number
      task_ids: string[]
    }

    // 任务状态详情
    interface TaskStatus {
      task_id: string
      state: string
      info: {
        percentage: number
        step: string
        result?: {
          status: string
          doc_id: string
          text_length: number
          from_cache: boolean
        }
      }
    }

    // 批次状态响应
    interface BatchStatusResponse {
      batch_id: string
      total_files: number
      completed_files: number
      failed_files: number
      processing_files: number
      pending_files: number
      total_tasks: number
      completed_tasks: number
      failed_tasks: number
      processing_tasks: number
      pending_tasks: number
      progress_percentage: number
      status: string
      detailed_status: TaskStatus[]
    }

    // 被告人信息
    interface DefendantInfo {
      姓名: string
      性别: string
      出生日期: string
      身份证号: string
      住址: string
    }

    // 特定字段
    interface SpecificFields {
      公诉机关: string
      侦查机关: string
      辩护人: string
      审判机关: string
      审判人员: string[]
      判决日期: string
      逮捕必要性理由: string
      社会危险性分析: string
      补充侦查意见: string[]
      补充侦查期限: string
      量刑建议: string
      侦查监督意见: string
      审查结论: string
      承办日期?: string
      承办检察官?: string
    }

    // 结构化提取数据
    interface ExtractedData {
      案号: string
      案件名称: string
      文书类型: string
      被告人信息: DefendantInfo[]
      指控罪名: string[]
      事实概要: string
      证据列表: string[]
      法律依据: string[]
      处理结果: string
      特定字段: SpecificFields
    }

    // 提取结果
    interface ExtractionResult {
      doc_id: string
      file_name: string
      success: boolean
      data: ExtractedData
      processing_time: number
      extraction_id: string
      error?: string
    }

    // 结构化提取响应
    interface StructuredExtractResponse {
      total: number
      success_count: number
      fail_count: number
      results: ExtractionResult[]
    }

    // 提取历史记录
    interface ExtractionHistoryRecord {
      record_id: string
      record_type: string
      doc_id: string
      file_name: string
      doc_type: string
      case_id: string
      processing_time: number
      extraction_method: string
      created_at: string
      structured_data: ExtractedData
      is_verified: boolean
    }

    // 提取历史响应
    interface ExtractionHistoryResponse {
      total: number
      page: number
      page_size: number
      total_pages: number
      records: ExtractionHistoryRecord[]
    }

    // 对比差异
    interface ComparisonDifference {
      element: string
      severity: string
      description: string
      doc_a_value: string
      doc_b_value: string
      possible_reason: string
      risk_assessment: string
    }

    // 事实差异
    interface FactDifference {
      category: string
      text_in_doc_A: string
      text_in_doc_B: string
      analysis: string
      possible_reason: string
      severity: string
      risk_assessment: string
      suggestion: string
    }

    // 对比摘要
    interface ComparisonSummary {
      overall_consistency: string
      total_differences: number
      high_severity_count: number
      medium_severity_count: number
      low_severity_count: number
      main_risks: string[]
      recommendations: string[]
      conclusion: string
    }

    // 详细对比结果
    interface DetailedResult {
      similarity: number
      fact_differences: FactDifference[]
      summary: ComparisonSummary
    }

    // 对比响应
    interface ComparisonResponse {
      comparison_id: string
      doc_ids: string[]
      total_elements: number
      matched_count: number
      match_rate: number
      differences: ComparisonDifference[]
      summary: string
      created_at: string
      comparison_method: string
      detailed_result: DetailedResult
    }

    // 审查问题
    interface ReviewIssue {
      category: string
      severity: string
      description: string
      location: string
      suggestion: string
      legal_basis: string
    }

    // 审查建议
    interface ReviewRecommendation {
      priority: number
      category: string
      severity: string
      recommendation: string
      legal_basis: string
      urgency: string
    }

    // 单个文档审查结果
    interface ReviewResult {
      doc_id: string
      file_name: string
      success: boolean
      doc_type: string
      compliance_score: number
      total_issues: number
      issues: ReviewIssue[]
      summary: string
      recommendations: ReviewRecommendation[]
      error?: string
    }

    // 批量审查响应
    interface BatchReviewResponse {
      batch_id: string
      total_documents: number
      successful_reviews: number
      failed_reviews: number
      results: ReviewResult[]
      batch_time: string
    }
  }
}
