<template>
  <div class="case-detail-container">
    <el-page-header @back="handleBack">
      <template #content>
        <span style="font-size: 18px; font-weight: 600">案件详情</span>
      </template>
      <template #extra>
        <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
        <el-button type="primary" :icon="Upload" @click="handleUpload">上传文档</el-button>
      </template>
    </el-page-header>

    <div v-loading="loading" style="margin-top: 16px">
      <el-card shadow="never" class="detail-card">
        <!-- 案件基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">案件详情</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="item-label">案件编号:</span>
              <span class="item-value">{{ caseDetail?.case_number || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="item-label">案件名称:</span>
              <span class="item-value">{{ caseDetail?.case_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="item-label">案件类型:</span>
              <span class="item-value">{{ caseDetail?.case_type || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="item-label">案件状态:</span>
              <span class="item-value">
                <el-tag type="primary">
                  {{ caseDetail?.case_status || '-' }}
                </el-tag>
              </span>
            </div>
            <div class="detail-item">
              <span class="item-label">被告人姓名:</span>
              <span class="item-value">{{ caseDetail?.defendant_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="item-label">立案时间:</span>
              <span class="item-value">{{ caseDetail?.filing_date || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 案情摘要 -->
        <div class="detail-section">
          <h3 class="section-title">案情摘要:</h3>
          <div class="summary-content">
            {{ caseDetail?.description || '暂无案情摘要' }}
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="detail-section">
          <h3 class="section-title">统计信息:</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <el-icon class="stat-icon" :size="20" color="#409eff"><Document /></el-icon>
              <span class="stat-label">文书数量:</span>
              <span class="stat-value">{{ caseDetail?.document_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon" :size="20" color="#67c23a"><CircleCheck /></el-icon>
              <span class="stat-label">审查次数:</span>
              <span class="stat-value">{{ reviewCount }}</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon" :size="20" color="#e6a23c"><Refresh /></el-icon>
              <span class="stat-label">对比次数:</span>
              <span class="stat-value">{{ compareCount }}</span>
            </div>
          </div>
        </div>

        <!-- 创建和更新信息 -->
        <div class="detail-section">
          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">创建信息:</span>
              <span class="meta-value">{{ createdBy }} 于 {{ formatDateTime(caseDetail?.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">更新信息:</span>
              <span class="meta-value">{{ updatedBy }} 于 {{ formatDateTime(caseDetail?.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 关联文书 -->
        <div class="detail-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon :size="18"><Document /></el-icon>
              关联文书 ({{ caseDetail?.documents?.length || 0 }})
            </h3>
            <el-space>
              <el-button
                v-if="selectedDocuments.length > 0"
                type="success"
                size="small"
                @click="handleReview"
              >
                <el-icon><CircleCheck /></el-icon>
                文书审查 ({{ selectedDocuments.length }})
              </el-button>
              <el-button
                v-if="selectedDocuments.length >= 2"
                type="warning"
                size="small"
                @click="handleCompare"
              >
                <el-icon><Refresh /></el-icon>
                文书对比 ({{ selectedDocuments.length }})
              </el-button>
              <el-button link type="primary" :icon="Upload" @click="handleUpload">
                上传文档
              </el-button>
            </el-space>
          </div>

          <el-empty v-if="!caseDetail?.documents || caseDetail.documents.length === 0" description="暂无关联文书" />
          
          <el-table
            v-else
            :data="caseDetail.documents"
            @selection-change="handleDocumentSelectionChange"
            style="width: 100%"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="文件名称" min-width="200">
              <template #default="{ row }">
                <el-link type="primary" @click="handleDownload(row)">
                  {{ row.file_name }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="doc_type" label="文书类型" width="150">
              <template #default="{ row }">
                <el-tag>{{ row.doc_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="file_size" label="文件大小" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row.file_size) }}
              </template>
            </el-table-column>
            <el-table-column prop="parse_status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOcrStatusColor(row.parse_status)" size="small">
                  {{ getOcrStatusText(row.parse_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="upload_time" label="上传时间" width="180" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button link type="success" size="small" @click="handleViewLatestReview(row)">
                  最新审查
                </el-button>
                <el-button link type="primary" size="small" @click="handleDownload(row)">
                  下载
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteDocument(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 审查历史 -->
        <div class="detail-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon :size="18"><CircleCheck /></el-icon>
              审查历史 ({{ reviewHistory.length }})
            </h3>
          </div>

          <div v-loading="loadingReview">
            <el-empty v-if="reviewHistory.length === 0" description="暂无审查记录" />
            
            <div v-else class="history-list">
              <div
                v-for="review in reviewHistory"
                :key="review.review_id"
                class="history-item"
              >
                <div class="history-info">
                  <div class="history-header">
                    <span class="history-title">{{ review.file_name }}</span>
                    <el-tag :type="review.review_type === 'rule_engine' ? 'success' : 'primary'" size="small">
                      {{ review.review_type === 'rule_engine' ? '规则库审查' : '逻辑审查' }}
                    </el-tag>
                  </div>
                  <div class="history-meta">
                    <span>{{ review.doc_type }}</span>
                    <span class="separator">|</span>
                    <span>合规评分: {{ review.compliance_score }}%</span>
                    <span class="separator">|</span>
                    <span>问题总数: {{ review.total_issues }}</span>
                    <span class="separator">|</span>
                    <span>{{ formatDateTime(review.created_at) }}</span>
                    <span v-if="review.created_by" class="separator">|</span>
                    <span v-if="review.created_by">{{ review.created_by }}</span>
                  </div>
                  <div class="history-stats">
                    <el-tag v-if="review.high_issues > 0" type="danger" size="small">
                      严重: {{ review.high_issues }}
                    </el-tag>
                    <el-tag v-if="review.medium_issues > 0" type="warning" size="small">
                      中等: {{ review.medium_issues }}
                    </el-tag>
                    <el-tag v-if="review.low_issues > 0" type="info" size="small">
                      轻微: {{ review.low_issues }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 对比历史 -->
        <div class="detail-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon :size="18"><Refresh /></el-icon>
              对比历史 ({{ comparisonHistory.length }})
            </h3>
          </div>

          <div v-loading="loadingComparison">
            <el-empty v-if="comparisonHistory.length === 0" description="暂无对比记录" />
            
            <div v-else class="history-list">
              <div
                v-for="comparison in comparisonHistory"
                :key="comparison.comparison_id"
                class="history-item"
              >
                <div class="history-info">
                  <div class="history-header">
                    <span class="history-title">{{ comparison.comparison_type }}</span>
                    <el-tag type="primary" size="small">{{ comparison.operation }}</el-tag>
                  </div>
                  <div class="history-meta">
                    <span>{{ comparison.doc1_name }}</span>
                    <span class="vs-text">vs</span>
                    <span>{{ comparison.doc2_name }}</span>
                  </div>
                  <div class="history-meta">
                    <span>差异总数: {{ comparison.total_differences }}</span>
                    <span class="separator">|</span>
                    <span>{{ formatDateTime(comparison.created_at) }}</span>
                    <span v-if="comparison.user_id" class="separator">|</span>
                    <span v-if="comparison.user_id">{{ comparison.user_id }}</span>
                  </div>
                  <div class="history-stats">
                    <el-tag v-if="comparison.high_severity > 0" type="danger" size="small">
                      严重: {{ comparison.high_severity }}
                    </el-tag>
                    <el-tag v-if="comparison.medium_severity > 0" type="warning" size="small">
                      中等: {{ comparison.medium_severity }}
                    </el-tag>
                    <el-tag v-if="comparison.low_severity > 0" type="info" size="small">
                      轻微: {{ comparison.low_severity }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 编辑对话框 -->
    <CaseFormDialog
      v-model:visible="editVisible"
      :case-id="caseId"
      @success="handleEditSuccess"
    />

    <!-- 上传对话框 -->
    <UploadDocumentDialog
      v-model:visible="uploadVisible"
      :case-id="caseId"
      @success="handleUploadSuccess"
    />

    <!-- 审查对话框 -->
    <ReviewDialog
      v-model="reviewVisible"
      :selected-docs="convertToDocumentInfo(selectedDocuments)"
      :review-result="reviewResult"
      @success="handleReviewSuccess"
      @clear="reviewResult = null"
    />

    <!-- 对比对话框 -->
    <CompareDialog
      v-model="compareVisible"
      :selected-docs="convertToDocumentInfo(selectedDocuments)"
      :compare-result="compareResult"
      @success="handleCompareSuccess"
      @clear="handleCompareClear"
    />

    <!-- 最新结果对话框 -->
    <LatestResultsDialog
      v-model:visible="latestResultsVisible"
      :document-info="currentDocument ? convertToDocumentInfo([currentDocument])[0] : undefined"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Upload, Document, CircleCheck, Refresh } from '@element-plus/icons-vue'
import { fetchCaseDetail, deleteCaseDocument, downloadCaseDocument } from '@/api/cases'
import { fetchReviewHistoryByCase, fetchComparisonHistoryByCase } from '@/api/documents'
import CaseFormDialog from '../components/CaseFormDialog.vue'
import UploadDocumentDialog from '../components/UploadDocumentDialog.vue'
import ReviewDialog from '@/views/documents/components/ReviewDialog.vue'
import CompareDialog from '@/views/documents/components/CompareDialog.vue'
import LatestResultsDialog from '@/views/documents/components/LatestResultsDialog.vue'

const route = useRoute()
const router = useRouter()

const caseId = ref(route.params.id as string)
const caseDetail = ref<Api.Cases.CaseDetail>()
const loading = ref(false)
const editVisible = ref(false)
const uploadVisible = ref(false)

// 审查和对比历史
const reviewHistory = ref<Api.Documents.CaseReviewHistoryRecord[]>([])
const comparisonHistory = ref<Api.Documents.CaseComparisonHistoryRecord[]>([])
const loadingReview = ref(false)
const loadingComparison = ref(false)

// 文档选择
const selectedDocuments = ref<Api.Cases.CaseDocument[]>([])

// 审查和对比对话框
const reviewVisible = ref(false)
const compareVisible = ref(false)
const latestResultsVisible = ref(false)
const reviewResult = ref<Api.Documents.BatchReviewResponse | null>(null)
const compareResult = ref<Api.Documents.ComparisonResponse | null>(null)
const currentDocument = ref<Api.Cases.CaseDocument | null>(null)

// 统计数据
const reviewCount = computed(() => reviewHistory.value.length)
const compareCount = computed(() => comparisonHistory.value.length)

// 创建人和更新人（从案件详情中提取，如果没有则显示"未知"）
const createdBy = computed(() => {
  // 这里可以根据实际API返回的字段调整
  return caseDetail.value?.handler || '未知'
})

const updatedBy = computed(() => {
  // 这里可以根据实际API返回的字段调整
  return caseDetail.value?.handler || '未知'
})

// 格式化日期时间
const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 加载案件详情
const loadCaseDetail = async () => {
  loading.value = true
  try {
    caseDetail.value = await fetchCaseDetail(caseId.value)
    // 加载审查和对比历史
    loadReviewHistory()
    loadComparisonHistory()
  } catch (error) {
    ElMessage.error('加载案件详情失败')
  } finally {
    loading.value = false
  }
}

// 加载审查历史
const loadReviewHistory = async () => {
  loadingReview.value = true
  try {
    const data = await fetchReviewHistoryByCase(caseId.value)
    reviewHistory.value = data.reviews || []
  } catch (error) {
    console.error('加载审查历史失败:', error)
  } finally {
    loadingReview.value = false
  }
}

// 加载对比历史
const loadComparisonHistory = async () => {
  loadingComparison.value = true
  try {
    const data = await fetchComparisonHistoryByCase(caseId.value)
    comparisonHistory.value = data.comparisons || []
  } catch (error) {
    console.error('加载对比历史失败:', error)
  } finally {
    loadingComparison.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 编辑
const handleEdit = () => {
  editVisible.value = true
}

// 编辑成功
const handleEditSuccess = () => {
  editVisible.value = false
  loadCaseDetail()
}

// 上传文档
const handleUpload = () => {
  uploadVisible.value = true
}

// 上传成功
const handleUploadSuccess = () => {
  uploadVisible.value = false
  loadCaseDetail()
}

// 文档选择变化
const handleDocumentSelectionChange = (selection: Api.Cases.CaseDocument[]) => {
  selectedDocuments.value = selection
}

// 转换文档格式（从 CaseDocument 到 DocumentInfo）
const convertToDocumentInfo = (docs: Api.Cases.CaseDocument[]): Api.Documents.DocumentInfo[] => {
  return docs.map(doc => ({
    doc_id: doc.doc_id,
    file_name: doc.file_name,
    case_id: caseId.value,
    doc_type: doc.doc_type,
    parse_status: doc.ocr_status || 'completed',
    ocr_confidence: '0',
    text_length: 0,
    file_size: doc.file_size,
    created_at: doc.upload_time
  }))
}

// 发起审查
const handleReview = () => {
  if (selectedDocuments.value.length === 0) {
    ElMessage.warning('请至少选择一份文书进行审查')
    return
  }
  reviewVisible.value = true
}

// 审查成功
const handleReviewSuccess = (result: Api.Documents.BatchReviewResponse) => {
  reviewResult.value = result
  // 刷新审查历史
  loadReviewHistory()
}

// 清空审查结果
const handleReviewClear = () => {
  reviewResult.value = null
}

// 发起对比
const handleCompare = () => {
  if (selectedDocuments.value.length < 2) {
    ElMessage.warning('请至少选择2份文书进行对比')
    return
  }
  compareVisible.value = true
}

// 对比成功
const handleCompareSuccess = (result: Api.Documents.ComparisonResponse) => {
  compareResult.value = result
  // 刷新对比历史
  loadComparisonHistory()
}

// 清空对比结果
const handleCompareClear = () => {
  compareResult.value = null
}

// 下载文档
const handleDownload = (record: Api.Cases.CaseDocument) => {
  const url = downloadCaseDocument(record.doc_id)
  window.open(url, '_blank')
}

// 查看最新审查结果
const handleViewLatestReview = (record: Api.Cases.CaseDocument) => {
  currentDocument.value = record
  latestResultsVisible.value = true
}

// 删除文档
const handleDeleteDocument = async (record: Api.Cases.CaseDocument) => {
  try {
    await ElMessageBox.confirm('确定要删除此文档吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCaseDocument(caseId.value, record.doc_id)
    ElMessage.success('删除成功')
    loadCaseDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

// OCR状态颜色
const getOcrStatusColor = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

// OCR状态文本
const getOcrStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

onMounted(() => {
  loadCaseDetail()
})
</script>

<style scoped>
.case-detail-container {
  padding: 16px;
}

.detail-card {
  border-radius: 8px;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.item-label {
  color: #909399;
  font-size: 14px;
  min-width: 90px;
  flex-shrink: 0;
}

.item-value {
  color: #606266;
  font-size: 14px;
  flex: 1;
  word-break: break-all;
}

.summary-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  margin-left: auto;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-label {
  color: #909399;
}

.meta-value {
  color: #606266;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.document-item:hover {
  background: #ecf5ff;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.doc-icon {
  flex-shrink: 0;
}

.doc-details {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.doc-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.separator {
  margin: 0 4px;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: #ecf5ff;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.history-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.vs-text {
  margin: 0 4px;
  font-weight: 600;
  color: #409eff;
}

.history-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .document-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .doc-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
