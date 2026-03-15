declare namespace Api {
  namespace SystemPrompts {
    // 提示词类型
    type PromptType = 'document_review' | 'document_comparison'

    // 提示词信息（列表项）
    interface PromptInfo {
      name: string
      description: string
      enabled: boolean
      content_length: number
      content_preview: string
    }

    // 提示词列表响应
    interface PromptListResponse {
      version: string
      last_updated: string
      description: string
      prompts: Record<PromptType, PromptInfo>
    }

    // 提示词详情
    interface PromptDetail {
      prompt_type: PromptType
      name: string
      description: string
      enabled: boolean
      content: string
    }

    // 更新提示词请求
    interface UpdatePromptRequest {
      content: string
    }

    // 更新提示词响应
    interface UpdatePromptResponse {
      prompt_type: PromptType
      content_length: number
    }

    // 切换启用状态响应
    interface TogglePromptResponse {
      prompt_type: PromptType
      enabled: boolean
    }

    // 重置提示词响应
    interface ResetPromptResponse {
      prompt_type: PromptType
      content_length: number
    }
  }
}
