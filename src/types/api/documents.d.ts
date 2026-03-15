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
      success: boolean
      doc_id: string
      file_name: string
      doc_type: string
      data: ExtractedData
      processing_time: number
      extraction_id?: string
      error?: string
    }

    // 批量提取任务提交响应
    interface BatchExtractSubmitResponse {
      batch_id: string
      task_id: string
      total: number
      valid_count: number
      invalid_count: number
      invalid_doc_ids: string[]
      status: string
      message: string
      estimated_time: string
    }

    // 批量提取批次状态响应
    interface BatchExtractStatusResponse {
      batch_id: string
      task_id: string
      status: string
      message: string
      progress: number
      updated_at: string
      sub_task_ids: string[]
      total: number
      completed_count: number
      success_count: number
      fail_count: number
      results: ExtractionResult[]
    }

    // 子任务状态响应
    interface SubTaskStatusResponse {
      task_id: string
      status: string
      message: string
      result?: ExtractionResult
      error?: string
    }

    // 结构化提取响应（旧版，保留兼容）
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

    // 对比差异（旧格式）
    interface ComparisonDifference {
      element: string
      severity: string
      description: string
      doc_a_value: string
      doc_b_value: string
      possible_reason: string
      risk_assessment: string
    }

    // 规则化对比差异（新格式）
    interface RuleBasedDifference {
      rule_code: string
      category: string
      item: string
      doc_a_content: string
      doc_b_content: string
      difference_type: string
      severity: string
      analysis: string
      reason: string
      suggestion: string
    }

    // 规则检查状态
    interface RuleCheckStatus {
      code: string
      name: string
      category: string
      severity?: string
      status: 'passed' | 'failed'
      differences_count?: number
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
      similarity?: number
      fact_differences?: FactDifference[]
      summary: ComparisonSummary | {
        total_differences: number
        consistency_level: string
        main_issues: string[]
        conclusion: string
      }
      comparison_type?: string
      differences?: RuleBasedDifference[]
    }

    // 对比响应（兼容旧格式和新一体化格式）
    interface ComparisonResponse {
      comparison_id: string
      doc_ids: string[]
      total_elements: number
      matched_count: number
      match_rate: number
      differences: ComparisonDifference[] | RuleBasedDifference[]
      summary: string
      created_at: string
      comparison_method: string
      detailed_result: DetailedResult
      // 新一体化格式额外字段
      comparison_stage?: string
      rules_count?: number
      total_differences?: number
      severity_breakdown?: Record<string, number>
      consistency_level?: string
      checked_rules?: RuleCheckStatus[]
    }

    // 审查问题
    interface ReviewIssue {
      rule_code: string
      rule_name?: string
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
      location: string
      description: string
      recommendation: string
      legal_basis: string
      urgency: string
    }

    // 单个文档审查结果
    interface ReviewResult {
      review_id?: string
      doc_id: string
      file_name: string
      success: boolean
      doc_type: string
      compliance_score: number
      total_issues: number
      issues: ReviewIssue[]
      summary: string
      recommendations: ReviewRecommendation[]
      checked_rules?: RuleCheckStatus[]
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

    // 审查历史记录
    interface ReviewHistoryRecord {
      review_id: string
      doc_id: string
      file_name: string
      doc_type: string
      review_type: string
      compliance_score: number
      total_issues: number
      high_issues: number
      medium_issues: number
      low_issues: number
      status: string
      created_at: string
      created_by: string
    }

    // 审查历史响应
    interface ReviewHistoryResponse {
      total: number
      page: number
      page_size: number
      total_pages: number
      reviews: ReviewHistoryRecord[]
    }

    // 审查记录详情
    interface ReviewDetailRecord {
      review_id: string
      doc_id: string
      file_name: string
      doc_type: string
      review_type: string
      review_config?: {
        selected_rules?: string[]
        include_examples?: boolean
        rules_used?: number
      }
      compliance_score: number
      total_issues: number
      high_issues: number
      medium_issues: number
      low_issues: number
      issues: ReviewIssue[]
      suggestions: string[] | ReviewRecommendation[]
      recommendations?: ReviewRecommendation[]
      checked_rules?: RuleCheckStatus[]
      status: string
      reviewed_by?: string
      reviewed_at?: string
      created_at: string
      created_by?: string
    }

    // 审查记录详情响应
    interface ReviewDetailResponse {
      code: number
      msg: string
      success: boolean
      data: ReviewDetailRecord
    }

    // 文档审查历史
    interface DocumentReviewHistory {
      review_id: string
      doc_id: string
      review_type: string
      compliance_score: number
      total_issues: number
      high_issues: number
      medium_issues: number
      low_issues: number
      status: string
      created_at: string
      created_by?: string
    }

    // 文档审查历史响应
    interface DocumentReviewHistoryResponse {
      code: number
      msg: string
      success: boolean
      data: {
        doc_id: string
        file_name: string
        doc_type: string
        total_reviews: number
        reviews: DocumentReviewHistory[]
      }
    }

    // ==================== 规则管理类型定义 ====================

    // 对比历史记录
    interface ComparisonHistoryRecord {
      comparison_id: string
      doc_ids: string[]
      doc_names: string[]
      doc_types: string[]
      operation: string
      similarity: number
      differences_count: number
      created_at: string
      created_by: string | null
    }

    // 对比历史响应
    interface ComparisonHistoryResponse {
      comparisons: ComparisonHistoryRecord[]
      total: number
      page: number
      page_size: number
      total_pages: number
    }

    // 案件审查历史记录
    interface CaseReviewHistoryRecord {
      review_id: string
      doc_id: string
      file_name: string
      doc_type: string
      review_type: string
      compliance_score: number
      total_issues: number
      high_issues: number
      medium_issues: number
      low_issues: number
      status: string
      created_at: string
      created_by: string | null
    }

    // 案件审查历史响应
    interface CaseReviewHistoryResponse {
      case_id: string
      total_documents: number
      total_reviews: number
      reviews: CaseReviewHistoryRecord[]
    }

    // 案件对比历史记录
    interface CaseComparisonHistoryRecord {
      comparison_id: string
      doc_id: string
      file_name: string
      doc_type: string
      operation: string
      comparison_type: string
      doc1_name: string
      doc2_name: string
      total_differences: number
      high_severity: number
      medium_severity: number
      low_severity: number
      created_at: string
      user_id: string | null
    }

    // 案件对比历史响应
    interface CaseComparisonHistoryResponse {
      case_id: string
      total_documents: number
      total_comparisons: number
      comparisons: CaseComparisonHistoryRecord[]
    }

    // ==================== 规则管理类型定义 ====================

    // 文书类型列表响应
    interface DocumentTypesResponse {
      success: boolean
      document_types: string[]
      total: number
    }

    // 规则统计信息
    interface RuleStatistics {
      total_documents: number
      completed_documents: number
      total_rules: number
      rules_by_category: Record<string, number>
      rules_by_severity: {
        critical: number
        moderate: number
        minor: number
      }
    }

    // 规则统计响应
    interface RuleStatisticsResponse {
      success: boolean
      statistics: RuleStatistics
    }

    // 规则详情
    interface RuleDetail {
      code: string
      name: string
      category: string
      severity: string
      scope: string
      description: string
      check_points: string[]
      rule_for_llm: string
      error_examples: string[]
      correct_examples: string[]
      legal_basis: string
      document_type: string
      enabled?: boolean // 规则启用状态
    }

    // 规则搜索响应
    interface RuleSearchResponse {
      success: boolean
      results: RuleDetail[]
      total: number
    }

    // 指定文书类型规则响应
    interface RulesByDocTypeResponse {
      success: boolean
      document_type: string
      document_code: string | null
      version: string
      last_updated: string | null
      description: string
      legal_basis: string[]
      rules: RuleDetail[]
      statistics: Record<string, any>
    }

    // 提示词预览响应
    interface PromptPreviewResponse {
      success: boolean
      system_prompt: string
      user_prompt: string
      prompt: string
      statistics: {
        system_length: number
        user_length: number
        total_length: number
        rules_count: number
        estimated_tokens: number
        doc_type: string
        length: number
      }
    }

    // 规则导出请求参数
    interface RuleExportParams {
      format: 'excel' | 'json'
      rule_codes?: string[]
    }

    // 规则导入响应
    interface RuleImportResponse {
      success_count: number
      total_count: number
      failed_rules: Array<{
        row: number
        rule_code: string
        reason: string
      }>
      imported_rules: string[]
    }

    // 规则状态切换响应
    interface RuleToggleResponse {
      rule_code: string
      enabled: boolean
      status_text: string
    }

    // 批量规则状态切换请求参数
    interface BatchToggleParams {
      rule_codes: string[]
      enabled: boolean
    }

    // 批量规则状态切换响应
    interface BatchToggleResponse {
      success_count: number
      total_count: number
      failed_rules: Array<{
        rule_code: string
        reason: string
      }>
      enabled: boolean
      status_text: string
    }

    // 规则层级结构 - 二级模块
    interface RuleSubModule {
      name: string
      description: string
      rule_count: number
      rules: RuleDetail[]
    }

    // 规则层级结构 - 一级模块
    interface RuleModule {
      name: string
      description: string
      rule_count: number
      sub_modules: RuleSubModule[]
    }

    // 单个文书类型的层级结构
    interface DocumentHierarchy {
      document_type: string
      structure_version: string
      total_rules: number
      total_modules: number
      total_sub_modules: number
      modules: RuleModule[]
      statistics?: {
        total_rules: number
        by_category: Record<string, number>
        by_severity: Record<string, number>
      }
      metadata?: {
        name: string
        version: string
        description: string
        last_updated: string
      }
    }

    // 所有文书类型的层级结构响应
    interface AllDocumentsHierarchyResponse {
      all_documents: DocumentHierarchy[]
      total_document_types: number
      total_rules: number
      total_modules: number
      total_sub_modules: number
    }

    // 规则层级结构响应（单个文书类型）
    type RuleHierarchyResponse = DocumentHierarchy

    // 规则测试结果
    interface RuleTestResult {
      review_id: string
      doc_type: string
      review_time: string
      review_method: string
      rules_used: number
      selected_rules: string[]
      checked_rules: RuleCheckStatus[]
      issues: ReviewIssue[]
      summary: {
        total_issues: number
        severe_issues: number
        moderate_issues: number
        minor_issues: number
        categories_affected: string[]
        category_distribution: Record<string, number>
        compliance_status: string
        risk_level: string
      }
      recommendations: ReviewRecommendation[]
      compliance_score: number
      score_grade: string
      status: string
    }

    // 规则测试响应（手动输入）
    interface RuleTestResponse {
      success: boolean
      review_result: RuleTestResult
      test_info: {
        doc_type: string
        content_length: number
        rules_used: number
        include_examples: boolean
      }
    }

    // 规则测试响应（文档）
    interface RuleTestWithDocResponse {
      code: number
      msg: string
      data: RuleTestResult & {
        doc_id: string
        file_name: string
      }
    }

    // ==================== 一体化接口 ====================

    // 一体化审查响应
    interface UnifiedReviewResponse {
      doc_id: string
      doc_type: string
      file_name: string
      extraction: {
        performed: boolean
        result: any
      }
      review: {
        result: {
          compliance_score: number
          score_grade: string
          issues: ReviewIssue[]
          summary: { total_issues: number; severe_issues: number }
          checked_rules?: RuleCheckStatus[]
          recommendations?: ReviewRecommendation[]
        }
        rules_used: string
      }
      workflow: {
        step1_extraction: 'completed' | 'skipped'
        step2_review: 'completed' | 'skipped'
      }
    }

    // 一体化对比响应（comparison 字段是完整的规则化对比结果）
    interface UnifiedComparisonResponse {
      doc_a: { doc_id: string; file_name: string; doc_type: string; extraction_performed: boolean }
      doc_b: { doc_id: string; file_name: string; doc_type: string; extraction_performed: boolean }
      comparison: {
        comparison_id: string
        doc_ids: string[]
        comparison_stage: string
        rules_count: number
        total_differences: number
        severity_breakdown: Record<string, number>
        match_rate: number
        consistency_level: string
        differences: RuleBasedDifference[]
        summary: string
        created_at: string
        comparison_method: string
        prompt_length: number
        checked_rules: RuleCheckStatus[]
        detailed_result: DetailedResult
      }
      workflow: {
        step1_extract_a: 'completed' | 'skipped'
        step2_extract_b: 'completed' | 'skipped'
        step3_compare: 'completed' | 'skipped'
      }
    }

    // ==================== 对比阶段 ====================

    // 对比阶段
    interface ComparisonStage {
      id: string
      name: string
      file: string
    }

    // 对比规则
    interface ComparisonRule {
      code: string
      name: string
      category: string
      severity: string
      description: string
      check_points: string[]
      rule_for_llm: string
      legal_basis?: string
      stage?: string
      enabled?: boolean
    }

    // 对比规则统计
    interface ComparisonRuleStatistics {
      total_rules: number
      rules_by_stage: Record<string, number>
      rules_by_severity: Record<string, number>
      rules_by_category: Record<string, number>
    }

    // 对比规则列表响应
    interface ComparisonRuleListResponse {
      success: boolean
      data: {
        stage: string
        stage_name: string
        rules: ComparisonRule[]
        total: number
        statistics: {
          total_rules: number
          by_category: Record<string, number>
          by_severity: Record<string, number>
        }
      }
    }

    // 对比规则搜索响应
    interface ComparisonRuleSearchResponse {
      success: boolean
      data: {
        results: ComparisonRule[]
        total: number
      }
    }
  }
}
