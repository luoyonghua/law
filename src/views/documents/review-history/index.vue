<template>
  <div class="review-history-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>审查历史记录</span>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="文书类型">
          <el-select v-model="searchForm.docType" placeholder="请选择" clearable style="width: 200px">
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
        <el-form-item label="合规评分">
          <el-input-number
            v-model="searchForm.minScore"
            :min="0"
            :max="100"
            placeholder="最低分"
            style="width: 120px"
          />
          <span style="margin: 0 8px">-</span>
          <el-input-number
            v-model="searchForm.maxScore"
            :min="0"
            :max="100"
            placeholder="最高分"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 审查历史列表 -->
      <el-table v-loading="loading" :data="reviews" stripe>
        <el-table-column prop="file_name" label="文件名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="doc_type" label="文书类型" width="150">
          <template #default="{ row }">
            <el-tag>{{ row.doc_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_type" label="审查类型" width="150">
          <template #default="{ row }">
            <el-tag :type="row.review_type === 'rule_engine' ? 'success' : 'primary'">
              {{ formatReviewType(row.review_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="compliance_score" label="合规评分" width="120">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.compliance_score)">
              {{ row.compliance_score }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_issues" label="问题总数" width="100" />
        <el-table-column label="问题分布" width="180">
          <template #default="{ row }">
            <el-space>
              <el-tag v-if="row.high_issues > 0" type="danger" size="small">
                严重: {{ row.high_issues }}
              </el-tag>
              <el-tag v-if="row.medium_issues > 0" type="warning" size="small">
                中等: {{ row.medium_issues }}
              </el-tag>
              <el-tag v-if="row.low_issues > 0" type="info" size="small">
                轻微: {{ row.low_issues }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="审查时间" width="180" />
        <el-table-column prop="created_by" label="审查人" width="120" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-dropdown @command="(command) => handleExport(row, command)" style="margin-left: 8px">
              <el-button link type="success" size="small">
                导出报告<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="docx">Word 格式</el-dropdown-item>
                  <el-dropdown-item command="pdf">PDF 格式</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 审查详情对话框 -->
    <ReviewDetailDialog
      v-model:visible="detailVisible"
      :review-id="currentReviewId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { fetchReviewHistory, deleteReviewRecord, generateReviewReport } from '@/api/documents'
import ReviewDetailDialog from '../components/ReviewDetailDialog.vue'

// 搜索表单
const searchForm = ref({
  docType: '',
  minScore: undefined as number | undefined,
  maxScore: undefined as number | undefined
})

// 数据
const loading = ref(false)
const reviews = ref<Api.Documents.ReviewHistoryRecord[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 获取审查历史
const getReviewHistory = async () => {
  loading.value = true
  try {
    const filters: any = {}
    if (searchForm.value.docType) {
      filters.doc_type = searchForm.value.docType
    }
    if (searchForm.value.minScore !== undefined) {
      filters.min_score = searchForm.value.minScore
    }
    if (searchForm.value.maxScore !== undefined) {
      filters.max_score = searchForm.value.maxScore
    }
    
    const data = await fetchReviewHistory(pagination.value.page, pagination.value.pageSize, filters)
    reviews.value = data.reviews || []
    pagination.value.total = data.total
    pagination.value.totalPages = data.total_pages
  } catch (error) {
    ElMessage.error('获取审查历史失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  getReviewHistory()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    docType: '',
    minScore: undefined,
    maxScore: undefined
  }
  pagination.value.page = 1
  getReviewHistory()
}

// 刷新
const handleRefresh = () => {
  getReviewHistory()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
  getReviewHistory()
}

// 每页数量变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  getReviewHistory()
}

// 详情对话框
const detailVisible = ref(false)
const currentReviewId = ref<string>()

// 查看详情
const handleViewDetail = (row: Api.Documents.ReviewHistoryRecord) => {
  currentReviewId.value = row.review_id
  detailVisible.value = true
}

// 导出审查报告
const handleExport = (row: Api.Documents.ReviewHistoryRecord, format: 'docx' | 'pdf') => {
  const url = generateReviewReport(row.doc_id, {
    format,
    review_id: row.review_id
  })
  
  // 创建隐藏的 a 标签下载
  const link = document.createElement('a')
  link.href = url
  link.download = `审查报告_${row.file_name}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success(`正在下载 ${format.toUpperCase()} 格式报告`)
}

// 删除审查记录
const handleDelete = async (row: Api.Documents.ReviewHistoryRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${row.file_name}"的审查记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await deleteReviewRecord(row.review_id)
    ElMessage.success('删除成功')
    
    // 如果当前页只有一条记录且不是第一页，则返回上一页
    if (reviews.value.length === 1 && pagination.value.page > 1) {
      pagination.value.page--
    }
    
    await getReviewHistory()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 格式化审查类型
const formatReviewType = (type: string) => {
  const typeMap: Record<string, string> = {
    rule_engine: '规则库审查',
    logic: '逻辑审查',
    by_doctype: '逻辑审查'
  }
  return typeMap[type] || type
}

// 获取评分类型
const getScoreType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

onMounted(() => {
  getReviewHistory()
})
</script>

<style scoped lang="scss">
.review-history-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 16px;
  }
}
</style>
