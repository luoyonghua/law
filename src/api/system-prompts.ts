import documentRequest from '@/utils/http/documentRequest'

const API_BASE = '/api/system-prompts'

/**
 * 获取系统提示词列表
 */
export function fetchSystemPromptList() {
  return documentRequest.get<Api.SystemPrompts.PromptListResponse>({
    url: `${API_BASE}/list`
  })
}

/**
 * 获取指定类型的系统提示词
 */
export function fetchSystemPrompt(promptType: Api.SystemPrompts.PromptType) {
  return documentRequest.get<Api.SystemPrompts.PromptDetail>({
    url: `${API_BASE}/${promptType}`
  })
}

/**
 * 更新系统提示词
 */
export function updateSystemPrompt(
  promptType: Api.SystemPrompts.PromptType,
  data: Api.SystemPrompts.UpdatePromptRequest
) {
  return documentRequest.put<Api.SystemPrompts.UpdatePromptResponse>({
    url: `${API_BASE}/${promptType}`,
    data
  })
}

/**
 * 启用/禁用系统提示词
 */
export function toggleSystemPrompt(promptType: Api.SystemPrompts.PromptType) {
  return documentRequest.post<Api.SystemPrompts.TogglePromptResponse>({
    url: `${API_BASE}/${promptType}/toggle`
  })
}

/**
 * 重置系统提示词为默认值
 */
export function resetSystemPrompt(promptType: Api.SystemPrompts.PromptType) {
  return documentRequest.post<Api.SystemPrompts.ResetPromptResponse>({
    url: `${API_BASE}/${promptType}/reset`
  })
}
