<template>
  <div class="system-prompts-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <h3 class="title">系统提示词管理</h3>
            <p class="description">{{ promptListData?.description }}</p>
          </div>
          <div class="meta-info">
            <el-tag type="info">版本: {{ promptListData?.version }}</el-tag>
            <el-tag type="info">更新时间: {{ promptListData?.last_updated }}</el-tag>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="prompts-list">
        <div
          v-for="(info, type) in promptListData?.prompts"
          :key="type"
          class="prompt-card"
        >
          <div class="prompt-header">
            <div class="prompt-info">
              <h4 class="prompt-name">
                <el-icon :size="18"><Document /></el-icon>
                {{ info.name }}
              </h4>
              <p class="prompt-description">{{ info.description }}</p>
            </div>
            <div class="prompt-actions">
              <el-switch
                :model-value="info.enabled"
                :loading="toggleLoading[type]"
                @change="handleToggle(type as Api.SystemPrompts.PromptType)"
              />
            </div>
          </div>

          <div class="prompt-content">
            <div class="content-preview">
              <div class="preview-label">内容预览:</div>
              <div class="preview-text">{{ info.content_preview }}</div>
            </div>
            <div class="content-meta">
              <el-tag size="small" type="info">
                字符数: {{ info.content_length }}
              </el-tag>
              <el-tag size="small" :type="info.enabled ? 'success' : 'info'">
                {{ info.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </div>
          </div>

          <div class="prompt-footer">
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(type as Api.SystemPrompts.PromptType)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              @click="handleView(type as Api.SystemPrompts.PromptType)"
            >
              <el-icon><View /></el-icon>
              查看完整内容
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="handleReset(type as Api.SystemPrompts.PromptType)"
            >
              <el-icon><RefreshLeft /></el-icon>
              重置为默认
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editVisible"
      :title="`编辑 - ${currentPromptDetail?.name}`"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-loading="editLoading" class="edit-dialog-content">
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #default>
            <div>请谨慎修改系统提示词，错误的配置可能影响AI的审查和对比功能。</div>
            <div>建议在修改前先备份当前内容。</div>
          </template>
        </el-alert>

        <el-form :model="editForm" label-width="100px">
          <el-form-item label="提示词类型">
            <el-tag>{{ currentPromptDetail?.name }}</el-tag>
          </el-form-item>
          <el-form-item label="描述">
            <div>{{ currentPromptDetail?.description }}</div>
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="editForm.content"
              type="textarea"
              :rows="20"
              placeholder="请输入系统提示词内容"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="字符统计">
            <el-tag type="info">{{ editForm.content.length }} 字符</el-tag>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewVisible"
      :title="`查看 - ${currentPromptDetail?.name}`"
      width="80%"
    >
      <div v-loading="viewLoading" class="view-dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="提示词类型">
            {{ currentPromptDetail?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentPromptDetail?.enabled ? 'success' : 'info'">
              {{ currentPromptDetail?.enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentPromptDetail?.description }}
          </el-descriptions-item>
          <el-descriptions-item label="字符数">
            {{ currentPromptDetail?.content?.length || 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="content-section">
          <div class="section-title">完整内容:</div>
          <div class="content-display">
            <pre>{{ currentPromptDetail?.content }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="handleCopyContent"
        >
          <el-icon><CopyDocument /></el-icon>
          复制内容
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Edit,
  View,
  RefreshLeft,
  CopyDocument
} from '@element-plus/icons-vue'
import {
  fetchSystemPromptList,
  fetchSystemPrompt,
  updateSystemPrompt,
  toggleSystemPrompt,
  resetSystemPrompt
} from '@/api/system-prompts'

const loading = ref(false)
const promptListData = ref<Api.SystemPrompts.PromptListResponse>()
const toggleLoading = reactive<Record<string, boolean>>({})

// 编辑对话框
const editVisible = ref(false)
const editLoading = ref(false)
const saveLoading = ref(false)
const currentPromptType = ref<Api.SystemPrompts.PromptType>()
const currentPromptDetail = ref<Api.SystemPrompts.PromptDetail>()
const editForm = reactive({
  content: ''
})

// 查看对话框
const viewVisible = ref(false)
const viewLoading = ref(false)

// 加载提示词列表
const loadPromptList = async () => {
  loading.value = true
  try {
    promptListData.value = await fetchSystemPromptList()
  } catch (error) {
    ElMessage.error('加载系统提示词列表失败')
  } finally {
    loading.value = false
  }
}

// 切换启用状态
const handleToggle = async (type: Api.SystemPrompts.PromptType) => {
  toggleLoading[type] = true
  try {
    const result = await toggleSystemPrompt(type)
    ElMessage.success(result.enabled ? '已启用' : '已禁用')
    await loadPromptList()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    toggleLoading[type] = false
  }
}

// 编辑提示词
const handleEdit = async (type: Api.SystemPrompts.PromptType) => {
  currentPromptType.value = type
  editLoading.value = true
  editVisible.value = true
  
  try {
    currentPromptDetail.value = await fetchSystemPrompt(type)
    editForm.content = currentPromptDetail.value.content
  } catch (error) {
    ElMessage.error('加载提示词内容失败')
    editVisible.value = false
  } finally {
    editLoading.value = false
  }
}

// 保存提示词
const handleSave = async () => {
  if (!currentPromptType.value) return
  
  if (!editForm.content.trim()) {
    ElMessage.warning('提示词内容不能为空')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要保存修改吗？修改后将立即生效。',
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    saveLoading.value = true
    await updateSystemPrompt(currentPromptType.value, {
      content: editForm.content
    })
    
    ElMessage.success('保存成功')
    editVisible.value = false
    await loadPromptList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  } finally {
    saveLoading.value = false
  }
}

// 查看完整内容
const handleView = async (type: Api.SystemPrompts.PromptType) => {
  currentPromptType.value = type
  viewLoading.value = true
  viewVisible.value = true
  
  try {
    currentPromptDetail.value = await fetchSystemPrompt(type)
  } catch (error) {
    ElMessage.error('加载提示词内容失败')
    viewVisible.value = false
  } finally {
    viewLoading.value = false
  }
}

// 复制内容
const handleCopyContent = async () => {
  if (!currentPromptDetail.value?.content) return
  
  try {
    await navigator.clipboard.writeText(currentPromptDetail.value.content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 重置为默认值
const handleReset = async (type: Api.SystemPrompts.PromptType) => {
  try {
    await ElMessageBox.confirm(
      '确定要重置为默认值吗？当前的自定义内容将被覆盖。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await resetSystemPrompt(type)
    ElMessage.success('重置成功')
    await loadPromptList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

onMounted(() => {
  loadPromptList()
})
</script>

<style scoped lang="scss">
.system-prompts-container {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.meta-info {
  display: flex;
  gap: 8px;
}

.prompts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s;
}

.prompt-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.prompt-info {
  flex: 1;
}

.prompt-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.prompt-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prompt-content {
  margin-bottom: 16px;
}

.content-preview {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.preview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-meta {
  display: flex;
  gap: 8px;
}

.prompt-footer {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.edit-dialog-content,
.view-dialog-content {
  min-height: 200px;
}

.content-section {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.content-display {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.content-display pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
