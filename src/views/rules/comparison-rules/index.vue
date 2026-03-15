<template>
  <div class="comparison-rules-container">
    <!-- 统计卡片 -->
    <el-row v-if="statistics" :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="规则总数" :value="statistics.total_rules || 0">
            <template #prefix><el-icon color="#409EFF"><List /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="严重级别" :value="statistics.rules_by_severity?.['严重'] || 0">
            <template #prefix><el-icon color="#F56C6C"><Warning /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="中等级别" :value="statistics.rules_by_severity?.['中等'] || 0">
            <template #prefix><el-icon color="#E6A23C"><InfoFilled /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="轻微级别" :value="statistics.rules_by_severity?.['轻微'] || 0">
            <template #prefix><el-icon color="#67C23A"><SuccessFilled /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 列表卡片 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>对比规则列表</span>
          <el-space>
            <el-button type="primary" :disabled="selectedRules.length === 0" @click="handleBatchPreviewPrompt">
              <el-icon><View /></el-icon>预览提示词
            </el-button>
            <el-button type="warning" :disabled="selectedRules.length === 0" @click="handleBatchToggle(false)">
              <el-icon><SwitchButton /></el-icon>批量禁用
            </el-button>
            <el-button type="success" :disabled="selectedRules.length === 0" @click="handleBatchToggle(true)">
              <el-icon><SwitchButton /></el-icon>批量启用
            </el-button>
            <el-button type="info" @click="handleImport">
              <el-icon><Upload /></el-icon>导入
            </el-button>
            <el-button type="primary" :disabled="!searchForm.stage" @click="handleExport">
              <el-icon><Download /></el-icon>导出
            </el-button>
            <el-button type="success" @click="handleAdd">
              <el-icon><Plus /></el-icon>添加规则
            </el-button>
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="对比阶段">
          <el-select v-model="searchForm.stage" placeholder="请选择" clearable style="width: 220px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option v-for="s in stages" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="searchForm.severity" placeholder="请选择" clearable style="width: 130px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="严重" value="严重" />
            <el-option label="中等" value="中等" />
            <el-option label="轻微" value="轻微" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则类别">
          <el-select v-model="searchForm.category" placeholder="请选择" clearable style="width: 160px" @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索编号/名称/描述" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="pagedRules" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="规则编号" width="160" />
        <el-table-column prop="name" label="规则名称" width="200" />
        <el-table-column prop="stage" label="对比阶段" width="160">
          <template #default="{ row }">
            <el-tag type="info">{{ getStageName(row.stage) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="规则类别" width="130">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled === false ? 'info' : 'success'">
              {{ row.enabled === false ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="规则描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link :type="row.enabled === false ? 'success' : 'info'" size="small" @click="handleToggle(row)">
              {{ row.enabled === false ? '启用' : '禁用' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handlePreviewPrompt(row)">预览提示词</el-button>
            <el-button link type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="val => { pageSize = val; currentPage = 1 }"
          @current-change="val => currentPage = val"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="规则详情" width="800px" :close-on-click-modal="false">
      <el-descriptions v-if="currentRule" :column="2" border>
        <el-descriptions-item label="规则编号">{{ currentRule.code }}</el-descriptions-item>
        <el-descriptions-item label="规则名称">{{ currentRule.name }}</el-descriptions-item>
        <el-descriptions-item label="对比阶段">{{ getStageName(currentRule.stage) }}</el-descriptions-item>
        <el-descriptions-item label="规则类别"><el-tag>{{ currentRule.category }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityType(currentRule.severity)">{{ currentRule.severity }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRule.enabled === false ? 'info' : 'success'">
            {{ currentRule.enabled === false ? '禁用' : '启用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="法律依据" :span="2">{{ currentRule.legal_basis || '-' }}</el-descriptions-item>
        <el-descriptions-item label="规则描述" :span="2">{{ currentRule.description }}</el-descriptions-item>
        <el-descriptions-item label="检查点" :span="2">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(p, i) in currentRule.check_points" :key="i">{{ p }}</li>
          </ul>
        </el-descriptions-item>
        <el-descriptions-item label="LLM审查指令" :span="2">{{ currentRule.rule_for_llm }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="isEditMode ? '编辑规则' : '添加规则'" width="800px" :close-on-click-modal="false">
      <el-form :model="editForm" :rules="formRules" ref="editFormRef" label-width="120px">
        <el-form-item label="对比阶段" prop="stage">
          <el-select v-model="editForm.stage" placeholder="请选择对比阶段" :disabled="isEditMode" style="width: 100%">
            <el-option v-for="s in stages" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则编号" prop="code">
          <el-input v-model="editForm.code" placeholder="如: PROS-CMP-016" :disabled="isEditMode" />
        </el-form-item>
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类别" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择类别" allow-create filterable style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-radio-group v-model="editForm.severity">
            <el-radio label="严重">严重</el-radio>
            <el-radio label="中等">中等</el-radio>
            <el-radio label="轻微">轻微</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="LLM审查指令" prop="rule_for_llm">
          <el-input v-model="editForm.rule_for_llm" type="textarea" :rows="3" placeholder="给LLM的审查指令" />
        </el-form-item>
        <el-form-item label="检查点">
          <el-input v-model="checkPointInput" placeholder="输入检查点后按回车添加" @keyup.enter="addCheckPoint">
            <template #append><el-button @click="addCheckPoint">添加</el-button></template>
          </el-input>
          <el-tag v-for="(p, i) in editForm.check_points" :key="i" closable @close="editForm.check_points.splice(i, 1)" style="margin: 5px 5px 0 0">{{ p }}</el-tag>
        </el-form-item>
        <el-form-item label="法律依据">
          <el-input v-model="editForm.legal_basis" type="textarea" :rows="2" placeholder="如: 《刑事诉讼法》第176条" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 提示词预览对话框 -->
    <el-dialog v-model="promptVisible" title="提示词预览" width="900px" :close-on-click-modal="false">
      <div v-loading="loadingPrompt">
        <el-alert
          v-if="promptTitle"
          :title="promptTitle"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <div v-if="promptData">
          <el-card shadow="never" style="margin-bottom: 16px">
            <div class="prompt-stats">
              <el-statistic title="系统提示词" :value="promptData.statistics.system_length"><template #suffix>字符</template></el-statistic>
              <el-statistic title="用户提示词" :value="promptData.statistics.user_length"><template #suffix>字符</template></el-statistic>
              <el-statistic title="总长度" :value="promptData.statistics.total_length"><template #suffix>字符</template></el-statistic>
              <el-statistic title="规则数量" :value="promptData.statistics.rules_count" />
              <el-statistic title="预估Token" :value="promptData.statistics.estimated_tokens" />
            </div>
          </el-card>
          <el-tabs v-model="activePromptTab" type="card">
            <el-tab-pane label="系统提示词" name="system">
              <el-card shadow="never" class="prompt-card">
                <template #header>
                  <div class="prompt-header">
                    <span>System Prompt</span>
                    <el-button size="small" @click="handleCopyPrompt('system')"><el-icon><CopyDocument /></el-icon>复制</el-button>
                  </div>
                </template>
                <div class="prompt-content"><pre>{{ promptData.system_prompt }}</pre></div>
              </el-card>
            </el-tab-pane>
            <el-tab-pane label="用户提示词" name="user">
              <el-card shadow="never" class="prompt-card">
                <template #header>
                  <div class="prompt-header">
                    <span>User Prompt</span>
                    <el-button size="small" @click="handleCopyPrompt('user')"><el-icon><CopyDocument /></el-icon>复制</el-button>
                  </div>
                </template>
                <div class="prompt-content"><pre>{{ promptData.user_prompt }}</pre></div>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </div>
        <el-empty v-else description="暂无提示词" />
      </div>
      <template #footer>
        <el-button @click="promptVisible = false">关闭</el-button>
        <el-button v-if="promptData" type="primary" @click="handleCopyPrompt('all')">
          <el-icon><CopyDocument /></el-icon>复制全部
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importVisible" title="导入规则库" width="560px" :close-on-click-modal="false">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        <template #default>
          <p style="margin: 0">支持 .xlsx 格式，导入将覆盖所选阶段的全部规则，请谨慎操作。</p>
        </template>
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="对比阶段">
          <el-select v-model="importStage" placeholder="请选择对比阶段" style="width: 100%">
            <el-option v-for="s in stages" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx"
            drag
            :on-change="(f: any) => importFile = f.raw"
            :on-exceed="() => ElMessage.warning('只能上传一个文件')"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
            <template #tip><div class="el-upload__tip">仅支持 .xlsx 格式</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importStage || !importFile" @click="handleConfirmImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Warning, InfoFilled, SuccessFilled, Refresh, Search, Plus, CopyDocument, View, SwitchButton, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import {
  fetchComparisonStages,
  fetchComparisonRuleStatistics,
  searchComparisonRules,
  addComparisonRule,
  updateComparisonRule,
  deleteComparisonRule,
  previewComparisonPrompt,
  exportComparisonRulesExcel,
  importComparisonRulesExcel,
  toggleComparisonRule,
  batchToggleComparisonRules
} from '@/api/documents'

const stages = ref<Api.Documents.ComparisonStage[]>([])
const statistics = ref<Api.Documents.ComparisonRuleStatistics | null>(null)
const loading = ref(false)
const allRules = ref<Api.Documents.ComparisonRule[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedRules = ref<Api.Documents.ComparisonRule[]>([])

const pagedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return allRules.value.slice(start, start + pageSize.value)
})

const searchForm = ref({ stage: '', severity: '', category: '', keyword: '' })

const categories = computed(() => {
  const set = new Set(allRules.value.map(r => r.category).filter(Boolean))
  return Array.from(set)
})

// Detail dialog
const detailVisible = ref(false)
const currentRule = ref<Api.Documents.ComparisonRule | null>(null)

// Edit dialog
const editDialogVisible = ref(false)
const isEditMode = ref(false)
const saving = ref(false)
const editFormRef = ref()
const checkPointInput = ref('')
const editForm = ref<Api.Documents.ComparisonRule>({
  code: '', name: '', category: '', severity: '严重',
  description: '', check_points: [], rule_for_llm: '', legal_basis: '', stage: ''
})

const formRules = {
  stage: [{ required: true, message: '请选择对比阶段', trigger: 'change' }],
  code: [{ required: true, message: '请输入规则编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择规则类别', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }],
  rule_for_llm: [{ required: true, message: '请输入LLM审查指令', trigger: 'blur' }]
}

// Prompt preview
type PromptData = { system_prompt: string; user_prompt: string; statistics: { system_length: number; user_length: number; total_length: number; rules_count: number; estimated_tokens: number } }
const promptVisible = ref(false)
const loadingPrompt = ref(false)
const promptData = ref<PromptData | null>(null)
const promptTitle = ref('')
const activePromptTab = ref('system')

// Import dialog
const importVisible = ref(false)
const importStage = ref('')
const importFile = ref<File | null>(null)
const importing = ref(false)
const uploadRef = ref()

const getStageName = (stageId?: string) => {
  if (!stageId) return '-'
  return stages.value.find(s => s.id === stageId)?.name || stageId
}

const getSeverityType = (severity: string) => {
  if (severity === '严重') return 'danger'
  if (severity === '中等') return 'warning'
  return 'success'
}

const loadStages = async () => {
  try {
    const res = await fetchComparisonStages()
    stages.value = res.stages || []
  } catch {
    ElMessage.error('获取对比阶段失败')
  }
}

const loadStatistics = async () => {
  try {
    statistics.value = await fetchComparisonRuleStatistics()
  } catch {
    console.error('获取统计信息失败')
  }
}

const loadRules = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (searchForm.value.stage) params.stage = searchForm.value.stage
    if (searchForm.value.severity) params.severity = searchForm.value.severity
    if (searchForm.value.category) params.category = searchForm.value.category
    if (searchForm.value.keyword) params.keyword = searchForm.value.keyword
    const res = await searchComparisonRules(params)
    allRules.value = res?.results || []
    total.value = allRules.value.length
  } catch {
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { currentPage.value = 1; loadRules() }
const handleReset = () => { searchForm.value = { stage: '', severity: '', category: '', keyword: '' }; currentPage.value = 1; loadRules() }
const handleRefresh = () => { loadStages(); loadStatistics(); loadRules() }
const handleSelectionChange = (rows: Api.Documents.ComparisonRule[]) => { selectedRules.value = rows }

const handleViewDetail = (row: Api.Documents.ComparisonRule) => { currentRule.value = row; detailVisible.value = true }

const handleAdd = () => {
  isEditMode.value = false
  editForm.value = { code: '', name: '', category: '', severity: '严重', description: '', check_points: [], rule_for_llm: '', legal_basis: '', stage: '' }
  checkPointInput.value = ''
  editDialogVisible.value = true
}

const handleEdit = (row: Api.Documents.ComparisonRule) => {
  isEditMode.value = true
  editForm.value = { ...row, check_points: [...(row.check_points || [])] }
  checkPointInput.value = ''
  editDialogVisible.value = true
}

const addCheckPoint = () => {
  const val = checkPointInput.value.trim()
  if (val) { editForm.value.check_points.push(val); checkPointInput.value = '' }
}

const handleSave = async () => {
  await editFormRef.value?.validate()
  saving.value = true
  try {
    const { stage, ...rule } = editForm.value
    if (isEditMode.value) {
      await updateComparisonRule(stage!, editForm.value.code, rule)
      ElMessage.success('规则更新成功')
    } else {
      await addComparisonRule(stage!, rule)
      ElMessage.success('规则添加成功')
    }
    editDialogVisible.value = false
    loadRules(); loadStatistics()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: Api.Documents.ComparisonRule) => {
  await ElMessageBox.confirm(`确定删除规则 "${row.name}" (${row.code})？`, '删除确认', { type: 'warning' })
  try {
    await deleteComparisonRule(row.stage!, row.code)
    ElMessage.success('规则删除成功')
    loadRules(); loadStatistics()
  } catch {
    ElMessage.error('删除失败')
  }
}

// Toggle single rule
const handleToggle = async (row: Api.Documents.ComparisonRule) => {
  try {
    const res = await toggleComparisonRule(row.stage!, row.code)
    row.enabled = res.enabled
    ElMessage.success(`规则已${res.status_text}`)
  } catch {
    ElMessage.error('操作失败')
  }
}

// Batch toggle
const handleBatchToggle = async (enabled: boolean) => {
  if (selectedRules.value.length === 0) return
  const stages = [...new Set(selectedRules.value.map(r => r.stage).filter(Boolean))] as string[]
  if (stages.length > 1) {
    ElMessage.warning('批量操作只支持同一对比阶段的规则')
    return
  }
  try {
    const res = await batchToggleComparisonRules(stages[0], {
      rule_codes: selectedRules.value.map(r => r.code),
      enabled
    })
    ElMessage.success(`已${res.status_text} ${res.count} 条规则`)
    loadRules()
  } catch {
    ElMessage.error('批量操作失败')
  }
}

// Prompt preview (single rule)
const handlePreviewPrompt = async (row: Api.Documents.ComparisonRule) => {
  promptTitle.value = `规则: ${row.name} (${row.code})`
  promptVisible.value = true
  loadingPrompt.value = true
  promptData.value = null
  activePromptTab.value = 'system'
  try {
    promptData.value = await previewComparisonPrompt({ stage: row.stage!, selected_rules: [row.code] })
  } catch {
    ElMessage.error('加载提示词失败')
  } finally {
    loadingPrompt.value = false
  }
}

// Prompt preview (batch)
const handleBatchPreviewPrompt = async () => {
  if (selectedRules.value.length === 0) return
  const stageIds = [...new Set(selectedRules.value.map(r => r.stage).filter(Boolean))] as string[]
  if (stageIds.length > 1) {
    ElMessage.warning('批量预览只支持同一对比阶段的规则')
    return
  }
  promptTitle.value = `批量预览：${selectedRules.value.length} 条规则（${getStageName(stageIds[0])}）`
  promptVisible.value = true
  loadingPrompt.value = true
  promptData.value = null
  activePromptTab.value = 'system'
  try {
    promptData.value = await previewComparisonPrompt({
      stage: stageIds[0],
      selected_rules: selectedRules.value.map(r => r.code)
    })
  } catch {
    ElMessage.error('加载提示词失败')
  } finally {
    loadingPrompt.value = false
  }
}

const handleCopyPrompt = async (type: 'system' | 'user' | 'all') => {
  if (!promptData.value) return
  let text = ''
  if (type === 'system') text = promptData.value.system_prompt
  else if (type === 'user') text = promptData.value.user_prompt
  else text = `=== System Prompt ===\n\n${promptData.value.system_prompt}\n\n=== User Prompt ===\n\n${promptData.value.user_prompt}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// Export
const handleExport = () => {
  if (!searchForm.value.stage) {
    ElMessage.warning('请先选择对比阶段再导出')
    return
  }
  const url = exportComparisonRulesExcel(searchForm.value.stage)
  const link = document.createElement('a')
  link.href = url
  link.download = `对比规则_${getStageName(searchForm.value.stage)}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Import
const handleImport = () => {
  importStage.value = searchForm.value.stage || ''
  importFile.value = null
  uploadRef.value?.clearFiles()
  importVisible.value = true
}

const handleConfirmImport = async () => {
  if (!importStage.value || !importFile.value) return
  importing.value = true
  try {
    const res = await importComparisonRulesExcel(importStage.value, importFile.value)
    ElMessage.success(`导入成功，共 ${res.total_rules} 条规则`)
    importVisible.value = false
    loadRules(); loadStatistics()
  } catch (e: any) {
    ElMessage.error(e?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadStages()
  loadStatistics()
  loadRules()
})
</script>

<style scoped>
.comparison-rules-container { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 16px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 16px; }
.prompt-stats { display: flex; gap: 32px; }
.prompt-card .prompt-content { max-height: 420px; overflow-y: auto; }
.prompt-card pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.6; margin: 0; }
.prompt-header { display: flex; justify-content: space-between; align-items: center; }
</style>
