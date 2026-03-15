<template>
  <div class="comparison-history-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>对比历史记录</span>
          <div class="header-actions">
            <el-button
              v-if="selectedRecords.length > 0"
              type="success"
              @click="handleBatchExport"
            >
              <el-icon><Download /></el-icon>
              批量导出 ({{ selectedRecords.length }})
            </el-button>
            <el-button
              v-if="selectedRecords.length > 0"
              type="danger"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedRecords.length }})
            </el-button>
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 历史记录列表 -->
      <el-table
        v-loading="loading"
        :data="historyRecords"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="对比类型" width="200">
          <template #default="{ row }">
            <el-tag type="primary">{{ getComparisonType(row.doc_types) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对比文档" min-width="300">
          <template #default="{ row }">
            <div class="doc-names">
              <div class="doc-item">
                <el-icon><Document /></el-icon>
                <span>{{ row.doc_names[0] }}</span>
              </div>
              <el-icon class="vs-icon"><Connection /></el-icon>
              <div class="doc-item">
                <el-icon><Document /></el-icon>
                <span>{{ row.doc_names[1] }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="similarity" label="相符合度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.similarity * 100)"
              :color="getMatchRateColor(row.similarity)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="differences_count" label="差异数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDifferenceType(row.differences_count)">
              {{ row.differences_count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="对比时间" width="180" />
        <el-table-column prop="created_by" label="操作人" width="120">
          <template #default="{ row }">
            {{ row.created_by || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-dropdown @command="(cmd) => handleExport(row, cmd)" style="margin-left: 8px;">
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

    <!-- 详情对话框 -->
    <ComparisonDetailDialog
      v-model="detailVisible"
      :comparison-id="currentComparisonId"
      :doc-ids="currentDocIds"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Document, Connection, Delete, Download, ArrowDown } from '@element-plus/icons-vue'
import { 
  fetchComparisonHistory, 
  deleteComparisonRecord, 
  batchDeleteComparisonRecords,
  generateComparisonReport
} from '@/api/documents'
import ComparisonDetailDialog from '../components/ComparisonDetailDialog.vue'

// 数据
const loading = ref(false)
const historyRecords = ref<Api.Documents.ComparisonHistoryRecord[]>([])
const selectedRecords = ref<Api.Documents.ComparisonHistoryRecord[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 详情对话框
const detailVisible = ref(false)
const currentComparisonId = ref('')
const currentDocIds = ref<string[]>([])

// 获取历史记录
const getHistoryRecords = async () => {
  loading.value = true
  try {
    const data = await fetchComparisonHistory(pagination.value.page, pagination.value.pageSize)
    historyRecords.value = data.comparisons || []
    pagination.value.total = data.total
    pagination.value.totalPages = data.total_pages
  } catch (error) {
    ElMessage.error('获取对比历史失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  getHistoryRecords()
}

// 选择变化
const handleSelectionChange = (selection: Api.Documents.ComparisonHistoryRecord[]) => {
  selectedRecords.value = selection
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
  getHistoryRecords()
}

// 每页数量变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  getHistoryRecords()
}

// 查看详情
const handleViewDetail = (record: Api.Documents.ComparisonHistoryRecord) => {
  currentComparisonId.value = record.comparison_id
  currentDocIds.value = record.doc_ids || []
  detailVisible.value = true
}

// 删除单个记录
const handleDelete = async (record: Api.Documents.ComparisonHistoryRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条对比记录吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    loading.value = true
    await deleteComparisonRecord(record.comparison_id)
    ElMessage.success('删除成功')
    
    // 刷新列表
    await getHistoryRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条对比记录吗？删除后将无法恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    loading.value = true
    const comparisonIds = selectedRecords.value.map(r => r.comparison_id)
    const result = await batchDeleteComparisonRecords(comparisonIds)
    
    if (result.failed_count > 0) {
      ElMessage.warning(`删除完成，成功 ${result.deleted_count} 个，失败 ${result.failed_count} 个`)
    } else {
      ElMessage.success(`成功删除 ${result.deleted_count} 条记录`)
    }
    
    // 清空选择
    selectedRecords.value = []
    
    // 刷新列表
    await getHistoryRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 导出单个报告
const handleExport = (record: Api.Documents.ComparisonHistoryRecord, format: 'docx' | 'pdf') => {
  if (!record.doc_ids || record.doc_ids.length < 2) {
    ElMessage.error('文档信息不完整，无法导出')
    return
  }
  
  const url = generateComparisonReport(
    record.comparison_id, 
    record.doc_ids[0], 
    record.doc_ids[1], 
    format
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `对比报告_${record.comparison_id}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success(`正在下载 ${format.toUpperCase()} 格式报告`)
}

// 批量导出 - 使用循环调用单个导出接口
const handleBatchExport = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请选择要导出的记录')
    return
  }

  try {
    const { value } = await ElMessageBox.confirm(
      `确定要导出选中的 ${selectedRecords.value.length} 条对比记录吗？`,
      '选择导出格式',
      {
        confirmButtonText: 'Word 格式',
        cancelButtonText: 'PDF 格式',
        distinguishCancelAndClose: true,
        type: 'info'
      }
    )
    
    // 确定按钮返回 'confirm'，取消按钮返回 'cancel'
    const exportFormat = (value === 'confirm' ? 'docx' : 'pdf') as 'docx' | 'pdf'
    
    ElMessage.info(`开始导出 ${selectedRecords.value.length} 个报告，请稍候...`)
    
    // 循环导出每个记录
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < selectedRecords.value.length; i++) {
      const record = selectedRecords.value[i]
      
      try {
        if (!record.doc_ids || record.doc_ids.length < 2) {
          console.error('文档信息不完整:', record)
          failCount++
          continue
        }
        
        const url = generateComparisonReport(
          record.comparison_id,
          record.doc_ids[0],
          record.doc_ids[1],
          exportFormat
        )
        
        // 使用 window.open 触发下载
        window.open(url, '_blank')
        
        successCount++
        
        // 每个下载之间延迟，避免浏览器阻止
        // 第一个下载后延迟更长，让用户有时间允许多个下载
        const delay = i === 0 ? 1000 : 500
        await new Promise(resolve => setTimeout(resolve, delay))
      } catch (error) {
        console.error('导出失败:', error)
        failCount++
      }
    }
    
    if (failCount > 0) {
      ElMessage.warning(`导出完成，成功 ${successCount} 个，失败 ${failCount} 个`)
    } else {
      ElMessage.success(`成功导出 ${successCount} 个报告`)
    }
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '批量导出失败')
    }
  }
}

// 获取匹配率颜色
const getMatchRateColor = (rate: number) => {
  if (rate >= 0.9) return '#67c23a'
  if (rate >= 0.7) return '#e6a23c'
  return '#f56c6c'
}

// 获取差异数量类型
const getDifferenceType = (count: number) => {
  if (count === 0) return 'success'
  if (count <= 5) return 'warning'
  return 'danger'
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

// 获取对比类型
const getComparisonType = (docTypes: string[]) => {
  if (docTypes.length >= 2) {
    return `${docTypes[0]} vs ${docTypes[1]}`
  }
  return '文书对比'
}

onMounted(() => {
  getHistoryRecords()
})
</script>

<style scoped lang="scss">
.comparison-history-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .doc-names {
    display: flex;
    align-items: center;
    gap: 12px;

    .doc-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #606266;
    }

    .vs-icon {
      color: #909399;
      font-size: 16px;
    }
  }

  .severity-stats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
}
</style>
