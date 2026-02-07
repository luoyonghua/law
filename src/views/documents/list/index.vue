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
            <el-option label="起诉书" value="起诉书" />
            <el-option label="判决书" value="判决书" />
            <el-option label="审查报告" value="审查报告" />
            <el-option label="退回补充侦查提纲" value="退回补充侦查提纲" />
            <el-option label="补充侦查报告" value="补充侦查报告" />
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
        :data="filteredDocuments"
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
            <el-button v-if="hasAuth('extract')" link type="success" size="small" @click="handleExtract(row)">
              结构化提取
            </el-button>
            <el-button v-if="hasAuth('download')" link type="warning" size="small" @click="handleDownloadDoc(row)">
              下载
            </el-button>
            <el-button v-if="hasAuth('review')" link type="danger" size="small" @click="handleSingleReview(row)">
              文书审查
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传对话框 -->
    <UploadDialog v-model="uploadVisible" @success="handleUploadSuccess" />

    <!-- 批量提取对话框 -->
    <BatchExtractDialog
      v-model="batchExtractVisible"
      :selected-docs="selectedDocs"
      @success="handleExtractSuccess"
    />

    <!-- 提取结果对话框 -->
    <ExtractDialog v-model="extractVisible" :extract-data="extractData" />

    <!-- 文档预览对话框 -->
    <DocumentPreviewDialog v-model="previewVisible" :document-info="currentDocument" />

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
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { Search, Upload, Document, Connection, DocumentChecked } from '@element-plus/icons-vue'
import { fetchDocumentList, batchStructuredExtract, compareDocuments, batchReviewDocuments, downloadDocument } from '@/api/documents'
import UploadDialog from '../components/UploadDialog.vue'
import BatchExtractDialog from '../components/BatchExtractDialog.vue'
import ExtractDialog from '../components/ExtractDialog.vue'
import CompareDialog from '../components/CompareDialog.vue'
import ReviewDialog from '../components/ReviewDialog.vue'
import DocumentPreviewDialog from '../components/DocumentPreviewDialog.vue'
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

// 对话框
const uploadVisible = ref(false)
const batchExtractVisible = ref(false)
const extractVisible = ref(false)
const compareVisible = ref(false)
const reviewVisible = ref(false)
const previewVisible = ref(false)
const extractData = ref<Api.Documents.ExtractionResult | null>(null)
const compareResult = ref<Api.Documents.ComparisonResponse | null>(null)
const reviewResult = ref<Api.Documents.BatchReviewResponse | null>(null)
const currentDocument = ref<Api.Documents.DocumentInfo | null>(null)

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
}

// 重置
const handleReset = () => {
  searchForm.value = {
    caseId: '',
    docType: '',
    parseStatus: ''
  }
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
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行结构化提取，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const response = await batchStructuredExtract([row.doc_id])
    if (response.results && response.results.length > 0) {
      const result = response.results[0]
      // 确保 file_name 存在，如果不存在则使用 row 中的信息
      if (!result.file_name) {
        result.file_name = row.file_name
      }
      extractData.value = result
      extractVisible.value = true
      ElMessage.success('提取完成')
    }
  } catch (error) {
    ElMessage.error('提取失败')
  } finally {
    loading.close()
  }
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
    const docIds = selectedDocs.value.map((doc) => doc.doc_id)
    const result = await compareDocuments(docIds, 'custom')
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
  
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书审查，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const docIds = selectedDocs.value.map((doc) => doc.doc_id)
    const result = await batchReviewDocuments(docIds, true)
    reviewResult.value = result
    reviewVisible.value = true
    ElMessage.success('审查完成')
  } catch (error) {
    ElMessage.error('审查失败')
  } finally {
    loading.close()
  }
}

// 单个审查
const handleSingleReview = async (row: Api.Documents.DocumentInfo) => {
  selectedDocs.value = [row]
  
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书审查，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const result = await batchReviewDocuments([row.doc_id], true)
    reviewResult.value = result
    reviewVisible.value = true
    ElMessage.success('审查完成')
  } catch (error) {
    ElMessage.error('审查失败')
  } finally {
    loading.close()
  }
}

// 审查成功
const handleReviewSuccess = () => {
  // 刷新列表或其他操作
}

// 查看详情
const handleViewDetail = (row: Api.Documents.DocumentInfo) => {
  currentDocument.value = row
  previewVisible.value = true
}

// 下载文档
const handleDownloadDoc = (row: Api.Documents.DocumentInfo) => {
  const url = downloadDocument(row.doc_id)
  window.open(url, '_blank')
  ElMessage.success('开始下载')
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
  let buttonCount = 1 // 查看详情始终显示
  if (hasAuth('extract')) buttonCount++
  if (hasAuth('download')) buttonCount++
  if (hasAuth('review')) buttonCount++
  
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
  }
}
</style>
