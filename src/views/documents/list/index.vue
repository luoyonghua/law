<template>
  <div class="document-list-container">
    <!-- 顶部操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="案件编号">
          <el-input
            v-model="searchForm.caseId"
            placeholder="请输入案件编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="文书类型">
          <el-select v-model="searchForm.docType" placeholder="请选择文书类型" clearable style="width: 200px">
            <el-option label="全部" value="" />
            <el-option label="提请批准逮捕书" value="提请批准逮捕书" />
            <el-option label="起诉意见书" value="起诉意见书" />
            <el-option label="审查报告（逮捕）" value="审查报告（逮捕）" />
            <el-option label="起诉书" value="起诉书" />
            <el-option label="审查报告（起诉）" value="审查报告（起诉）" />
            <el-option label="退回补充侦查提纲" value="退回补充侦查提纲" />
            <el-option label="不起诉决定书" value="不起诉决定书" />
            <el-option label="刑事判决书" value="刑事判决书" />
          </el-select>
        </el-form-item>
        <el-form-item label="解析状态">
          <el-select v-model="searchForm.parseStatus" placeholder="请选择解析状态" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="已完成" value="completed" />
            <el-option label="处理中" value="processing" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="action-buttons">
        <el-button v-if="hasAuth('upload')" type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传文书
        </el-button>
        <el-button
          v-if="hasAuth('batch-extract')"
          type="success"
          :disabled="selectedDocs.length === 0"
          @click="handleBatchExtract"
        >
          <el-icon><Document /></el-icon>
          批量提取 ({{ selectedDocs.length }})
        </el-button>
        <el-button
          v-if="hasAuth('compare')"
          type="warning"
          :disabled="selectedDocs.length < 2"
          @click="handleCompare"
        >
          <el-icon><Connection /></el-icon>
          文书比对 ({{ selectedDocs.length }})
        </el-button>
        <el-button
          v-if="hasAuth('review')"
          type="danger"
          :disabled="selectedDocs.length === 0"
          @click="handleReview"
        >
          <el-icon><DocumentChecked /></el-icon>
          文书审查 ({{ selectedDocs.length }})
        </el-button>
      </div>
    </el-card>

    <!-- 文档列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="paginatedDocuments"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="file_name" label="文件名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="case_id" label="案件编号" width="180" />
        <el-table-column prop="doc_type" label="文书类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getDocTypeTag(row.doc_type)">{{ row.doc_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parse_status" label="解析状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.parse_status)">
              {{ getStatusText(row.parse_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="text_length" label="文本长度" width="120" />
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" :width="getOperationColumnWidth()" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button link type="success" size="small" @click="handleViewLatest(row)">
              查看最新
            </el-button>
            <el-button v-if="hasAuth('extract')" link type="success" size="small" @click="handleExtract(row)">
              结构化提取
            </el-button>
            <el-button v-if="hasAuth('download')" link type="warning" size="small" @click="handleDownloadDoc(row)">
              下载
            </el-button>
            <el-button v-if="hasAuth('review')" link type="danger" size="small" @click="handleSingleReview(row)">
              文书审查
            </el-button>
            <el-button  link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredDocuments.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <UploadDialog v-model="uploadVisible" @success="handleUploadSuccess" />

    <!-- 批量提取对话框 -->
    <BatchExtractDialog
      v-model="batchExtractVisible"
      :selected-docs="selectedDocs"
      @success="handleExtractSuccess"
    />

    <!-- 单个提取进度卡片 -->
    <ExtractProgressCard
      v-model:visible="extractProgressVisible"
      :file-name="extractingFileName"
      :is-extracting="isExtracting"
      :is-completed="extractCompleted"
      :has-failed="extractFailed"
      @view-result="handleViewExtractResult"
    />

    <!-- 文档预览对话框 -->
    <DocumentPreviewDialog v-model="previewVisible" :document-info="currentDocument" />

    <!-- 查看最新结果对话框 -->
    <LatestResultsDialog v-model:visible="latestResultsVisible" :document-info="currentDocument || undefined" />

    <!-- 比对对话框 -->
    <CompareDialog
      v-model="compareVisible"
      :selected-docs="selectedDocs"
      :compare-result="compareResult"
      @success="handleCompareSuccess"
    />

    <!-- 审查对话框 -->
    <ReviewDialog
      v-model="reviewVisible"
      :selected-docs="selectedDocs"
      :review-result="reviewResult"
      @success="handleReviewSuccess"
      @clear="handleReviewClear"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Document, Connection, DocumentChecked } from '@element-plus/icons-vue'
import { submitBatchExtract, getBatchExtractStatus, getSubTaskStatus, fetchDocumentList, compareDocuments, downloadDocument, deleteDocument, unifiedCompare } from '@/api/documents'
import UploadDialog from '../components/UploadDialog.vue'
import BatchExtractDialog from '../components/BatchExtractDialog.vue'
import ExtractProgressCard from '../components/ExtractProgressCard.vue'
import CompareDialog from '../components/CompareDialog.vue'
import ReviewDialog from '../components/ReviewDialog.vue'
import DocumentPreviewDialog from '../components/DocumentPreviewDialog.vue'
import LatestResultsDialog from '../components/LatestResultsDialog.vue'
import { useAuth } from '@/hooks/core/useAuth'

const { hasAuth } = useAuth()

// 搜索表单
const searchForm = ref({
  caseId: '',
  docType: '',
  parseStatus: ''
})

// 数据
const loading = ref(false)
const documents = ref<Api.Documents.DocumentInfo[]>([])
const selectedDocs = ref<Api.Documents.DocumentInfo[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框
const uploadVisible = ref(false)
const batchExtractVisible = ref(false)
const compareVisible = ref(false)
const reviewVisible = ref(false)
const previewVisible = ref(false)
const latestResultsVisible = ref(false)
const compareResult = ref<Api.Documents.ComparisonResponse | null>(null)
const reviewResult = ref<Api.Documents.BatchReviewResponse | null>(null)
const currentDocument = ref<Api.Documents.DocumentInfo | null>(null)

// 单个提取进度卡片
const extractProgressVisible = ref(false)
const extractingFileName = ref('')
const isExtracting = ref(false)
const extractCompleted = ref(false)
const extractFailed = ref(false)

// 过滤后的文档列表
const filteredDocuments = computed(() => {
  return documents.value.filter((doc) => {
    if (searchForm.value.caseId && !doc.case_id.includes(searchForm.value.caseId)) {
      return false
    }
    if (searchForm.value.docType && doc.doc_type !== searchForm.value.docType) {
      return false
    }
    if (searchForm.value.parseStatus && doc.parse_status !== searchForm.value.parseStatus) {
      return false
    }
    return true
  })
})

// 分页后的文档列表
const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDocuments.value.slice(start, end)
})

// 获取文档列表
const getDocumentList = async () => {
  loading.value = true
  try {
    const data = await fetchDocumentList()
    documents.value = data || []
  } catch (error) {
    ElMessage.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  // 过滤逻辑已在 computed 中处理
  currentPage.value = 1 // 重置到第一页
}

// 重置
const handleReset = () => {
  searchForm.value = {
    caseId: '',
    docType: '',
    parseStatus: ''
  }
  currentPage.value = 1 // 重置到第一页
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
}

// 页码改变
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// 选择变化
const handleSelectionChange = (selection: Api.Documents.DocumentInfo[]) => {
  selectedDocs.value = selection
}

// 上传
const handleUpload = () => {
  uploadVisible.value = true
}

// 上传成功
const handleUploadSuccess = () => {
  getDocumentList()
}

// 批量提取
const handleBatchExtract = () => {
  if (selectedDocs.value.length === 0) {
    ElMessage.warning('请选择要提取的文书')
    return
  }
  batchExtractVisible.value = true
}

// 单个提取
const handleExtract = async (row: Api.Documents.DocumentInfo) => {
  // 显示进度卡片
  extractingFileName.value = row.file_name
  extractProgressVisible.value = true
  isExtracting.value = true
  extractCompleted.value = false
  extractFailed.value = false
  
  console.log('[单个提取] 开始提取文档:', row.file_name)
  
  try {
    // 1. 提交批量任务（单个文档）
    const submitResponse = await submitBatchExtract([row.doc_id])
    const { batch_id } = submitResponse
    
    console.log('[单个提取] 任务已提交，batch_id:', batch_id)
    
    // 2. 轮询批次状态，直到完成
    let batchStatus = 'pending'
    const maxAttempts = 180 // 最多轮询 3 分钟
    let attempt = 0
    
    while ((batchStatus === 'pending' || batchStatus === 'processing') && attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 每 2 秒查询一次
      
      const statusResponse = await getBatchExtractStatus(batch_id)
      batchStatus = statusResponse.status
      
      console.log(`[单个提取] 状态: ${batchStatus}, 进度: ${statusResponse.completed_count}/${statusResponse.total}`)
      
      // 检查是否完成
      if (batchStatus === 'completed') {
        // 检查结果
        if (statusResponse.results && statusResponse.results.length > 0) {
          const result = statusResponse.results[0]
          
          if (result.success) {
            console.log('[单个提取] 提取成功')
            extractCompleted.value = true
            extractFailed.value = false
            ElMessage.success('提取完成')
          } else {
            console.error('[单个提取] 提取失败')
            extractCompleted.value = true
            extractFailed.value = true
            ElMessage.error('提取失败')
          }
        } else {
          throw new Error('未获取到提取结果')
        }
        break
      } else if (batchStatus === 'failed') {
        throw new Error(statusResponse.message || '提取任务失败')
      }
      
      attempt++
    }
    
    if (attempt >= maxAttempts) {
      throw new Error('提取超时，请稍后查看提取历史')
    }
  } catch (error: any) {
    console.error('[单个提取] 提取失败:', error)
    extractCompleted.value = true
    extractFailed.value = true
    ElMessage.error(error.message || '提取失败')
  } finally {
    isExtracting.value = false
  }
}

// 查看提取结果
const handleViewExtractResult = () => {
  // 直接跳转到提取历史，不再打开预览对话框
  extractProgressVisible.value = false
}

// 提取成功
const handleExtractSuccess = () => {
  // 可以刷新列表或其他操作
}

// 比对
const handleCompare = async () => {
  if (selectedDocs.value.length < 2) {
    ElMessage.warning('请至少选择2份文书进行比对')
    return
  }
  
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书比对，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const docA = selectedDocs.value[0]
    const docB = selectedDocs.value[1]
    const res = await unifiedCompare({ doc_id_a: docA.doc_id, doc_id_b: docB.doc_id })
    const result: Api.Documents.ComparisonResponse = {
      comparison_id: res.comparison.comparison_id || '',
      doc_ids: [docA.doc_id, docB.doc_id],
      total_elements: res.comparison.rules_count ?? 0,
      matched_count: 0,
      match_rate: res.comparison.match_rate,
      differences: res.comparison.differences,
      summary: res.comparison.summary,
      created_at: res.comparison.created_at || new Date().toISOString(),
      comparison_method: res.comparison.comparison_method || 'unified',
      detailed_result: res.comparison.detailed_result as any,
      comparison_stage: res.comparison.comparison_stage,
      rules_count: res.comparison.rules_count,
      total_differences: res.comparison.total_differences,
      severity_breakdown: res.comparison.severity_breakdown,
      consistency_level: res.comparison.consistency_level,
      checked_rules: res.comparison.checked_rules
    }
    compareResult.value = result
    compareVisible.value = true
    ElMessage.success('比对完成')
  } catch (error) {
    ElMessage.error('比对失败')
  } finally {
    loading.close()
  }
}

// 比对成功
const handleCompareSuccess = () => {
  // 刷新列表或其他操作
}

// 审查
const handleReview = async () => {
  if (selectedDocs.value.length === 0) {
    ElMessage.warning('请至少选择1份文书进行审查')
    return
  }
  
  // 打开审查对话框，让用户选择审查方式
  reviewVisible.value = true
}

// 单个审查
const handleSingleReview = async (row: Api.Documents.DocumentInfo) => {
  selectedDocs.value = [row]
  // 打开审查对话框，让用户选择审查方式
  reviewVisible.value = true
}

// 审查成功
const handleReviewSuccess = (result: Api.Documents.BatchReviewResponse) => {
  reviewResult.value = result
}

// 清空审查结果
const handleReviewClear = () => {
  reviewResult.value = null
}

// 查看详情
const handleViewDetail = (row: Api.Documents.DocumentInfo) => {
  currentDocument.value = row
  previewVisible.value = true
}

// 查看最新结果
const handleViewLatest = (row: Api.Documents.DocumentInfo) => {
  currentDocument.value = row
  latestResultsVisible.value = true
}

// 下载文档
const handleDownloadDoc = (row: Api.Documents.DocumentInfo) => {
  const url = downloadDocument(row.doc_id)
  window.open(url, '_blank')
  ElMessage.success('开始下载')
}

// 删除文档
const handleDelete = async (row: Api.Documents.DocumentInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档"${row.file_name}"吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 执行删除
    await deleteDocument(row.doc_id)
    ElMessage.success('删除成功')
    
    // 刷新列表
    await getDocumentList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 获取文书类型标签
const getDocTypeTag = (type: string) => {
  const tagMap: Record<string, any> = {
    起诉书: 'primary',
    判决书: 'success',
    审查报告: 'warning',
    退回补充侦查提纲: 'info',
    补充侦查报告: 'danger'
  }
  return tagMap[type] || ''
}

// 获取状态标签
const getStatusTag = (status: string) => {
  const tagMap: Record<string, any> = {
    completed: 'success',
    processing: 'warning',
    failed: 'danger'
  }
  return tagMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    completed: '已完成',
    processing: '处理中',
    failed: '失败'
  }
  return textMap[status] || status
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

// 动态计算操作列宽度
const getOperationColumnWidth = () => {
  let buttonCount = 2 // 查看详情和查看最新始终显示
  if (hasAuth('extract')) buttonCount++
  if (hasAuth('download')) buttonCount++
  if (hasAuth('review')) buttonCount++
  buttonCount++ // 删除按钮
  
  // 每个按钮约 80px，加上边距
  return buttonCount * 80 + 20
}

onMounted(() => {
  getDocumentList()
})
</script>

<style scoped lang="scss">
.document-list-container {
  padding: 16px;

  .search-card {
    margin-bottom: 16px;

    .search-form {
      margin-bottom: 16px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }

  .table-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding: 16px 0;
    }
  }
}
</style>
