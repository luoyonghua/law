<template>
  <el-dialog
    v-model="dialogVisible"
    title="审查结果详情"
    width="95%"
    :close-on-click-modal="false"
    fullscreen
  >
    <div v-loading="loading" class="review-detail-container">
      <el-empty v-if="!reviewDetail" description="暂无数据" />
      
      <div v-else class="detail-container-split">
        <!-- 左侧：原始文件预览 -->
        <div class="left-panel">
          <div class="panel-header">
            <h3>原始文件</h3>
            <div class="header-actions">
              <el-button size="small" @click="handleDownload">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button size="small" @click="handleOpenNewTab">
                <el-icon><FullScreen /></el-icon>
                新窗口打开
              </el-button>
            </div>
          </div>
          <div class="file-preview">
            <!-- DOCX 预览 -->
            <div v-if="isDocx" v-loading="isLoadingPreview" class="docx-preview-wrapper">
              <div ref="docxPreviewContainer" class="docx-container"></div>
            </div>
            <!-- PDF 预览 -->
            <iframe
              v-else-if="isPdf"
              :src="previewUrl"
              frameborder="0"
              class="preview-iframe"
            />
            <!-- 图片预览 -->
            <div v-else-if="isImage" class="image-preview">
              <img :src="previewUrl" alt="文档预览" />
            </div>
            <!-- 不支持预览 -->
            <div v-else class="no-preview">
              <el-icon :size="64"><Document /></el-icon>
              <p>该文件类型不支持在线预览</p>
              <el-button type="primary" @click="handleDownload">
                <el-icon><Download /></el-icon>
                下载文件
              </el-button>
            </div>
          </div>
        </div>

        <!-- 右侧：审查结果 -->
        <div class="right-panel">
          <div class="panel-header">
            <h3>审查结果</h3>
            <div class="header-actions">
              <el-dropdown @command="handleExport">
                <el-button size="small" type="primary">
                  导出报告<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="docx">Word 格式</el-dropdown-item>
                    <el-dropdown-item command="pdf">PDF 格式</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="review-content">
            <el-scrollbar height="calc(100vh - 180px)">
              <div class="content-inner">
                <!-- 基本信息 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">基本信息</span>
                  </template>
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="文件名称">
                      {{ reviewDetail.file_name }}
                    </el-descriptions-item>
                    <el-descriptions-item label="文书类型">
                      <el-tag>{{ reviewDetail.doc_type }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="审查方式">
                      <el-tag :type="reviewDetail.review_type === 'rule_engine' ? 'success' : 'primary'">
                        {{ reviewDetail.review_type === 'rule_engine' ? '规则库审查' : '逻辑审查' }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="审查状态">
                      <el-tag :type="reviewDetail.status === 'completed' ? 'success' : 'info'">
                        {{ reviewDetail.status === 'completed' ? '已完成' : '进行中' }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="审查时间">
                      {{ reviewDetail.created_at }}
                    </el-descriptions-item>
                    <el-descriptions-item label="审查人">
                      {{ reviewDetail.created_by || '-' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>

                <!-- 审查配置 -->
                <el-card v-if="reviewDetail.review_config" shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">审查配置</span>
                  </template>
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="使用规则数">
                      {{ reviewDetail.review_config.rules_used || 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="包含示例">
                      <el-tag :type="reviewDetail.review_config.include_examples ? 'success' : 'info'">
                        {{ reviewDetail.review_config.include_examples ? '是' : '否' }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="reviewDetail.review_config.selected_rules" label="选中规则" :span="2">
                      <el-space wrap>
                        <el-tag
                          v-for="rule in reviewDetail.review_config.selected_rules"
                          :key="rule"
                          size="small"
                        >
                          {{ rule }}
                        </el-tag>
                      </el-space>
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>

                <!-- 审查概览 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">审查概览</span>
                  </template>
                  <el-row :gutter="16">
                    <el-col :span="6">
                      <el-statistic title="合规评分" :value="reviewDetail.compliance_score" suffix="%" />
                    </el-col>
                    <el-col :span="6">
                      <el-statistic title="问题总数" :value="reviewDetail.total_issues" />
                    </el-col>
                    <el-col :span="4">
                      <el-statistic 
                        title="严重问题" 
                        :value="reviewDetail.high_issues"
                        :value-style="{ color: '#f56c6c' }"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-statistic 
                        title="中等问题" 
                        :value="reviewDetail.medium_issues"
                        :value-style="{ color: '#e6a23c' }"
                      />
                    </el-col>
                    <el-col :span="4">
                      <el-statistic 
                        title="轻微问题" 
                        :value="reviewDetail.low_issues"
                        :value-style="{ color: '#909399' }"
                      />
                    </el-col>
                  </el-row>
                </el-card>

                <!-- 规则检查结果 -->
                <el-card v-if="reviewDetail.checked_rules && reviewDetail.checked_rules.length > 0" shadow="never" class="info-card">
                  <template #header>
                    <div class="card-header-with-stats">
                      <span class="card-title">规则检查结果 ({{ reviewDetail.checked_rules.length }})</span>
                      <div class="rule-stats">
                        <el-tag type="success" size="small">
                          通过: {{ passedRulesCount }}
                        </el-tag>
                        <el-tag type="danger" size="small">
                          未通过: {{ failedRulesCount }}
                        </el-tag>
                      </div>
                    </div>
                  </template>
                  <div class="rules-list">
                    <div
                      v-for="(rule, index) in reviewDetail.checked_rules"
                      :key="index"
                      class="rule-item"
                      :class="`status-${rule.status}`"
                    >
                      <div class="rule-header">
                        <div class="rule-title">
                          <el-icon :size="18" :color="rule.status === 'passed' ? '#67c23a' : '#f56c6c'">
                            <component :is="rule.status === 'passed' ? 'CircleCheck' : 'CircleClose'" />
                          </el-icon>
                          <span class="rule-name">{{ rule.name }}</span>
                          <el-tag size="small" type="info">{{ rule.code }}</el-tag>
                        </div>
                        <el-tag :type="rule.status === 'passed' ? 'success' : 'danger'" size="small">
                          {{ rule.status === 'passed' ? '通过' : '未通过' }}
                        </el-tag>
                      </div>
                      <div class="rule-meta">
                        <el-tag size="small" effect="plain">{{ rule.category }}</el-tag>
                        <el-tag :type="getSeverityType(rule.severity || '')" size="small" effect="plain">
                          {{ rule.severity }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </el-card>

                <!-- 问题列表 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">问题列表 ({{ reviewDetail.issues.length }})</span>
                  </template>
                  <el-empty v-if="reviewDetail.issues.length === 0" description="未发现问题" />
                  <div v-else class="issues-list">
                    <div
                      v-for="(issue, index) in reviewDetail.issues"
                      :key="index"
                      class="issue-item"
                      :class="`severity-${getSeverityClass(issue.severity)}`"
                    >
                      <div class="issue-header">
                        <div class="issue-title">
                          <el-tag :type="getSeverityType(issue.severity)" size="small">
                            {{ issue.severity }}
                          </el-tag>
                          <span class="issue-name">{{ issue.rule_name || issue.category }}</span>
                          <el-tag v-if="issue.rule_code" type="info" size="small">
                            {{ issue.rule_code }}
                          </el-tag>
                        </div>
                        <el-tag size="small">{{ issue.category }}</el-tag>
                      </div>
                      <div class="issue-content">
                        <div class="issue-row">
                          <span class="label">问题描述：</span>
                          <span class="value">{{ issue.description }}</span>
                        </div>
                        <div class="issue-row">
                          <span class="label">位置信息：</span>
                          <span class="value">{{ issue.location }}</span>
                        </div>
                        <div class="issue-row">
                          <span class="label">整改建议：</span>
                          <span class="value">{{ issue.suggestion }}</span>
                        </div>
                        <div v-if="issue.legal_basis" class="issue-row">
                          <span class="label">法律依据：</span>
                          <span class="value">{{ issue.legal_basis }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>

                <!-- 审查建议 -->
                <el-card v-if="parsedRecommendations.length > 0" shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">审查建议 ({{ parsedRecommendations.length }})</span>
                  </template>
                  <div class="recommendations-list">
                    <div
                      v-for="(rec, index) in parsedRecommendations"
                      :key="index"
                      class="recommendation-item"
                      :class="`severity-${getSeverityClass(rec.severity)}`"
                    >
                      <div class="recommendation-header">
                        <div class="recommendation-title">
                          <el-tag type="warning" size="small">
                            优先级 {{ rec.priority }}
                          </el-tag>
                          <el-tag :type="getSeverityType(rec.severity)" size="small">
                            {{ rec.severity }}
                          </el-tag>
                          <el-tag v-if="rec.urgency" :type="getUrgencyType(rec.urgency)" size="small">
                            {{ rec.urgency }}
                          </el-tag>
                        </div>
                        <el-tag size="small">{{ rec.category }}</el-tag>
                      </div>
                      <div class="recommendation-content">
                        <div class="recommendation-row">
                          <span class="label">问题描述：</span>
                          <span class="value">{{ rec.description }}</span>
                        </div>
                        <div class="recommendation-row">
                          <span class="label">位置信息：</span>
                          <span class="value">{{ rec.location }}</span>
                        </div>
                        <div class="recommendation-row highlight">
                          <span class="label">整改建议：</span>
                          <span class="value">{{ rec.recommendation }}</span>
                        </div>
                        <div v-if="rec.legal_basis" class="recommendation-row">
                          <span class="label">法律依据：</span>
                          <span class="value">{{ rec.legal_basis }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Download, FullScreen, Document, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { fetchReviewDetail, generateReviewReport, downloadDocument, previewDocument } from '@/api/documents'
import { renderAsync } from 'docx-preview'

interface Props {
  visible: boolean
  reviewId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible'])

const dialogVisible = ref(false)
const loading = ref(false)
const reviewDetail = ref<Api.Documents.ReviewDetailRecord>()
const docxPreviewContainer = ref<HTMLElement>()
const isLoadingPreview = ref(false)

// 文件类型判断
const isDocx = computed(() => {
  if (!reviewDetail.value) return false
  return reviewDetail.value.file_name.toLowerCase().endsWith('.docx')
})

const isPdf = computed(() => {
  if (!reviewDetail.value) return false
  return reviewDetail.value.file_name.toLowerCase().endsWith('.pdf')
})

const isImage = computed(() => {
  if (!reviewDetail.value) return false
  const fileName = reviewDetail.value.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')
})

// 预览URL
const previewUrl = computed(() => {
  if (!reviewDetail.value) return ''
  return previewDocument(reviewDetail.value.doc_id)
})

// 规则统计
const passedRulesCount = computed(() => {
  if (!reviewDetail.value?.checked_rules) return 0
  return reviewDetail.value.checked_rules.filter(r => r.status === 'passed').length
})

const failedRulesCount = computed(() => {
  if (!reviewDetail.value?.checked_rules) return 0
  return reviewDetail.value.checked_rules.filter(r => r.status === 'failed').length
})

// 解析审查建议
const parsedRecommendations = computed(() => {
  if (!reviewDetail.value) return []
  
  // 如果有 recommendations 字段，直接使用
  if (reviewDetail.value.recommendations && Array.isArray(reviewDetail.value.recommendations)) {
    return reviewDetail.value.recommendations
  }
  
  // 否则尝试解析 suggestions 字段
  if (!reviewDetail.value.suggestions || reviewDetail.value.suggestions.length === 0) {
    return []
  }
  
  const recommendations: Api.Documents.ReviewRecommendation[] = []
  
  for (const suggestion of reviewDetail.value.suggestions) {
    // 如果已经是对象，直接使用
    if (typeof suggestion === 'object') {
      recommendations.push(suggestion as Api.Documents.ReviewRecommendation)
      continue
    }
    
    // 如果是字符串，尝试解析 JSON
    if (typeof suggestion === 'string') {
      try {
        // 处理连续的 JSON 对象（没有逗号分隔）
        const jsonMatches = suggestion.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
        if (jsonMatches) {
          for (const jsonStr of jsonMatches) {
            try {
              const parsed = JSON.parse(jsonStr)
              recommendations.push(parsed)
            } catch (e) {
              console.warn('Failed to parse recommendation JSON:', jsonStr, e)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse suggestion:', suggestion, error)
      }
    }
  }
  
  // 按优先级排序
  return recommendations.sort((a, b) => (a.priority || 0) - (b.priority || 0))
})

// 加载审查详情
const loadReviewDetail = async () => {
  if (!props.reviewId) return

  loading.value = true
  try {
    reviewDetail.value = await fetchReviewDetail(props.reviewId)
    // 加载文档预览
    await nextTick()
    if (isDocx.value && docxPreviewContainer.value) {
      await loadDocxPreview()
    }
  } catch (error) {
    ElMessage.error('加载审查详情失败')
  } finally {
    loading.value = false
  }
}

// 加载 DOCX 预览
const loadDocxPreview = async () => {
  if (!reviewDetail.value || !docxPreviewContainer.value) return

  isLoadingPreview.value = true
  try {
    const response = await fetch(previewUrl.value)
    const blob = await response.blob()
    await renderAsync(blob, docxPreviewContainer.value, undefined, {
      className: 'docx-wrapper',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: false,
      renderChanges: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
  } catch (error) {
    console.error('DOCX 预览加载失败:', error)
    ElMessage.error('文档预览加载失败')
  } finally {
    isLoadingPreview.value = false
  }
}

// 下载文档
const handleDownload = () => {
  if (!reviewDetail.value) return
  const url = downloadDocument(reviewDetail.value.doc_id)
  window.open(url, '_blank')
}

// 新窗口打开
const handleOpenNewTab = () => {
  if (!reviewDetail.value) return
  window.open(previewUrl.value, '_blank')
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const map: Record<string, any> = {
    '严重': 'danger',
    '中等': 'warning',
    '轻微': 'info'
  }
  return map[severity] || 'info'
}

// 获取严重程度类名
const getSeverityClass = (severity: string) => {
  const map: Record<string, string> = {
    '严重': 'high',
    '中等': 'medium',
    '轻微': 'low'
  }
  return map[severity] || 'low'
}

// 获取紧急程度类型
const getUrgencyType = (urgency: string) => {
  const map: Record<string, any> = {
    '紧急': 'danger',
    '重要': 'warning',
    '一般': 'info'
  }
  return map[urgency] || 'info'
}

// 导出报告
const handleExport = (format: 'docx' | 'pdf') => {
  if (!reviewDetail.value) return

  const url = generateReviewReport(reviewDetail.value.doc_id, {
    format,
    review_id: reviewDetail.value.review_id
  })
  
  const link = document.createElement('a')
  link.href = url
  link.download = `审查报告_${reviewDetail.value.file_name}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success(`正在下载 ${format.toUpperCase()} 格式报告`)
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    loadReviewDetail()
  } else {
    reviewDetail.value = undefined
  }
})

watch(dialogVisible, (val) => {
  if (!val) {
    emit('update:visible', false)
  }
})
</script>

<style scoped>
.review-detail-container {
  min-height: 400px;
}

/* 左右分栏布局 */
.detail-container-split {
  display: flex;
  height: calc(100vh - 120px);
  gap: 16px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 文件预览区域 */
.file-preview {
  flex: 1;
  overflow: hidden;
  background: #f5f7fa;
}

.docx-preview-wrapper {
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: #525659;
}

.docx-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.preview-iframe {
  width: 100%;
  height: 100%;
}

.image-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #909399;
}

/* 审查结果区域 */
.review-content {
  flex: 1;
  overflow: hidden;
}

.content-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  border-radius: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.card-header-with-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-stats {
  display: flex;
  gap: 8px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  background: #fff;
  transition: all 0.3s;
}

.rule-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.rule-item.status-passed {
  border-left: 3px solid #67c23a;
  background: #f0f9ff;
}

.rule-item.status-failed {
  border-left: 3px solid #f56c6c;
  background: #fef0f0;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rule-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.rule-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.rule-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f5f7fa;
}

.issue-item.severity-high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.issue-item.severity-medium {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.issue-item.severity-low {
  border-left-color: #909399;
  background: #f4f4f5;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.issue-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.issue-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.issue-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-row {
  display: flex;
  font-size: 14px;
  line-height: 1.6;
}

.issue-row .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.issue-row .value {
  color: #606266;
  flex: 1;
}

.suggestions-list {
  margin: 0;
  padding-left: 24px;
}

.suggestions-list li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.8;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f5f7fa;
}

.recommendation-item.severity-high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.recommendation-item.severity-medium {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.recommendation-item.severity-low {
  border-left-color: #909399;
  background: #f4f4f5;
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recommendation-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendation-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendation-row {
  display: flex;
  font-size: 14px;
  line-height: 1.6;
}

.recommendation-row.highlight {
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.recommendation-row .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
  font-weight: 500;
}

.recommendation-row .value {
  color: #606266;
  flex: 1;
}

.recommendation-row.highlight .value {
  color: #303133;
  font-weight: 500;
}
</style>
