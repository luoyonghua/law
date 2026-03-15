<template>
  <div class="case-list-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-left">
          <el-input
            v-model="searchParams.keyword"
            placeholder="搜索案件编号、名称、被告人"
            style="width: 300px"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="searchParams.status"
            placeholder="案件状态"
            style="width: 150px; margin-left: 12px"
            clearable
            @change="handleSearch"
          >
            <el-option label="待处理" value="待处理" />
            <el-option label="侦查中" value="侦查中" />
            <el-option label="审查逮捕" value="审查逮捕" />
            <el-option label="审查起诉" value="审查起诉" />
            <el-option label="审判" value="审判" />
            <el-option label="结案" value="结案" />
          </el-select>
          <el-button type="primary" :icon="Search" style="margin-left: 12px" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </div>
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新建案件
        </el-button>
      </div>

      <!-- 卡片列表 -->
      <div v-loading="loading" class="case-cards">
        <el-empty v-if="!loading && dataSource.length === 0" description="暂无案件数据" />
        
        <div v-else class="card-grid">
          <el-card
            v-for="item in dataSource"
            :key="item.case_id"
            class="case-card"
            shadow="hover"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="case-title">
                <el-icon class="title-icon" :size="20"><Folder /></el-icon>
                <span class="case-number">{{ item.case_number }}</span>
              </div>
              <el-tag type="primary" size="small">
                {{ item.case_status || '-' }}
              </el-tag>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="info-row">
                <span class="label">案件名称：</span>
                <span class="value" :title="item.case_name">{{ item.case_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">被告人：</span>
                <span class="value">{{ item.defendant_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">文书数量：</span>
                <span class="value">
                  <el-tag type="info" size="small">{{ item.document_count }} 份</el-tag>
                </span>
              </div>
              <div class="info-row">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDateTime(item.created_at) }}</span>
              </div>
            </div>

            <!-- 卡片底部操作按钮 -->
            <div class="card-footer">
              <el-button type="primary" size="small" :icon="View" @click="handleView(item)">
                查看详情
              </el-button>
              <el-button size="small" :icon="Upload" @click="handleUploadDoc(item)">
                上传文书
              </el-button>
              <el-button size="small" :icon="Edit" @click="handleEdit(item)">
                编辑
              </el-button>
              <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(item)">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-if="dataSource.length > 0"
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 24px; justify-content: flex-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 案件表单对话框 -->
    <CaseFormDialog
      v-model:visible="formVisible"
      :case-id="currentCaseId"
      @success="handleFormSuccess"
    />

    <!-- 上传文档对话框 -->
    <UploadDocumentDialog
      v-model:visible="uploadVisible"
      :case-id="currentUploadCaseId"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Folder, View, Upload, Edit, Delete } from '@element-plus/icons-vue'
import { fetchCaseList, deleteCase } from '@/api/cases'
import CaseFormDialog from '../components/CaseFormDialog.vue'
import UploadDocumentDialog from '../components/UploadDocumentDialog.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 搜索参数
const searchParams = reactive({
  keyword: '',
  status: undefined as string | undefined,
  page: 1,
  size: 10
})

// 表格数据
const dataSource = ref<Api.Cases.CaseInfo[]>([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 表单对话框
const formVisible = ref(false)
const currentCaseId = ref<string>()

// 上传对话框
const uploadVisible = ref(false)
const currentUploadCaseId = ref<string>('')

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 19)
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchCaseList({
      page: searchParams.page,
      size: searchParams.size,
      keyword: searchParams.keyword || undefined,
      status: searchParams.status
    })
    dataSource.value = res.items
    pagination.total = res.total
    pagination.current = res.page
    pagination.pageSize = res.size
  } catch (error) {
    ElMessage.error('加载案件列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  searchParams.page = 1
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchParams.keyword = ''
  searchParams.status = undefined
  searchParams.page = 1
  pagination.current = 1
  loadData()
}

// 分页变化
const handleSizeChange = (size: number) => {
  searchParams.size = size
  searchParams.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  searchParams.page = page
  loadData()
}

// 新建案件
const handleCreate = () => {
  currentCaseId.value = undefined
  formVisible.value = true
}

// 查看案件
const handleView = (record: Api.Cases.CaseInfo) => {
  router.push(`/cases/detail/${record.case_id}`)
}

// 上传文书
const handleUploadDoc = (record: Api.Cases.CaseInfo) => {
  currentUploadCaseId.value = record.case_id
  uploadVisible.value = true
}

// 编辑案件
const handleEdit = (record: Api.Cases.CaseInfo) => {
  currentCaseId.value = record.case_id
  formVisible.value = true
}

// 删除案件
const handleDelete = async (record: Api.Cases.CaseInfo) => {
  try {
    await ElMessageBox.confirm('确定要删除此案件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCase(record.case_id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 表单提交成功
const handleFormSuccess = () => {
  formVisible.value = false
  loadData()
}

// 上传成功
const handleUploadSuccess = () => {
  uploadVisible.value = false
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.case-list-container {
  padding: 16px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-left {
  display: flex;
  align-items: center;
}

.case-cards {
  min-height: 400px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.case-card {
  transition: all 0.3s ease;
  border-radius: 8px;
}

.case-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.case-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.title-icon {
  color: #409eff;
}

.case-number {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-content {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.value {
  color: #606266;
  flex: 1;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.card-footer .el-button {
  flex: 1;
  min-width: 80px;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .search-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-left .el-input,
  .search-left .el-select {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style>
