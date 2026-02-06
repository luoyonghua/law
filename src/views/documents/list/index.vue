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
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="文书类型">
          <el-select v-model="searchForm.docType" placeholder="请选择文书类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="起诉书" value="起诉书" />
            <el-option label="判决书" value="判决书" />
            <el-option label="审查报告" value="审查报告" />
            <el-option label="退回补充侦查提纲" value="退回补充侦查提纲" />
            <el-option label="补充侦查报告" value="补充侦查报告" />
          </el-select>
        </el-form-item>
        <el-form-item label="解析状态">
          <el-select v-model="searchForm.parseStatus" placeholder="请选择解析状态" clearable>
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
        <el-button type="primary" @click="handleUpload">
          <el-icon><Upload /></el-icon>
          上传文书
        </el-button>
        <el-button
          type="success"
          :disabled="selectedDocs.length === 0"
          @click="handleBatchExtract"
        >
          <el-icon><Document /></el-icon>
          批量提取 ({{ selectedDocs.length }})
        </el-button>
        <el-button
          type="warning"
          :disabled="selectedDocs.length < 2"
          @click="handleCompare"
        >
          <el-icon><Connection /></el-icon>
          文书比对 ({{ selectedDocs.length }})
        </el-button>
        <el-button
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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button link type="success" size="small" @click="handleExtract(row)">
              结构化提取
            </el-button>
            <el-button link type="warning" size="small" @click="handleSingleCompare(row)">
              发起比对
            </el-button>
            <el-button link type="danger" size="small" @click="handleSingleReview(row)">
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

    <!-- 比对对话框 -->
    <CompareDialog
      v-model="compareVisible"
      :selected-docs="selectedDocs"
      @success="handleCompareSuccess"
    />

    <!-- 审查对话框 -->
    <ReviewDialog
      v-model="reviewVisible"
      :selected-docs="selectedDocs"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Upload, Document, Connection, DocumentChecked } from '@element-plus/icons-vue'
import { fetchDocumentList, batchStructuredExtract } from '@/api/documents'
import UploadDialog from '../components/UploadDialog.vue'
import BatchExtractDialog from '../components/BatchExtractDialog.vue'
import ExtractDialog from '../components/ExtractDialog.vue'
import CompareDialog from '../components/CompareDialog.vue'
import ReviewDialog from '../components/ReviewDialog.vue'

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
const extractData = ref<Api.Documents.ExtractionResult | null>(null)

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
  try {
    const response = await batchStructuredExtract([row.doc_id])
    if (response.results && response.results.length > 0) {
      extractData.value = response.results[0]
      extractVisible.value = true
    }
  } catch (error) {
    ElMessage.error('提取失败')
  }
}

// 提取成功
const handleExtractSuccess = () => {
  // 可以刷新列表或其他操作
}

// 比对
const handleCompare = () => {
  if (selectedDocs.value.length < 2) {
    ElMessage.warning('请至少选择2份文书进行比对')
    return
  }
  compareVisible.value = true
}

// 单个比对
const handleSingleCompare = (row: Api.Documents.DocumentInfo) => {
  selectedDocs.value = [row]
  compareVisible.value = true
}

// 比对成功
const handleCompareSuccess = () => {
  // 刷新列表或其他操作
}

// 审查
const handleReview = () => {
  if (selectedDocs.value.length === 0) {
    ElMessage.warning('请至少选择1份文书进行审查')
    return
  }
  reviewVisible.value = true
}

// 单个审查
const handleSingleReview = (row: Api.Documents.DocumentInfo) => {
  selectedDocs.value = [row]
  reviewVisible.value = true
}

// 审查成功
const handleReviewSuccess = () => {
  // 刷新列表或其他操作
}

// 查看详情
const handleViewDetail = (row: Api.Documents.DocumentInfo) => {
  ElMessage.info('详情功能开发中')
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
