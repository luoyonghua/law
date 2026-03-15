<template>
  <div class="rules-list-container">
    <!-- 统计信息卡片 -->
    <el-row v-if="statistics" :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="文书类型总数" :value="statistics.total_documents || 0">
            <template #prefix>
              <el-icon color="#409EFF"><Document /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="规则总数" :value="statistics.total_rules || 0">
            <template #prefix>
              <el-icon color="#67C23A"><List /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="严重级别规则" :value="statistics.rules_by_severity?.critical || 0">
            <template #prefix>
              <el-icon color="#F56C6C"><Warning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="中等级别规则" :value="statistics.rules_by_severity?.moderate || 0">
            <template #prefix>
              <el-icon color="#E6A23C"><InfoFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>规则列表</span>
          <el-space>
            <el-button type="primary" :disabled="selectedRules.length === 0" @click="handleBatchPreviewPrompt">
              <el-icon><View /></el-icon>
              预览提示词
            </el-button>
            <el-button type="warning" :disabled="selectedRules.length === 0" @click="handleBatchToggle">
              <el-icon><Switch /></el-icon>
              批量{{ allSelectedEnabled ? '禁用' : '启用' }}
            </el-button>
            <el-button type="info" @click="handleImport">
              <el-icon><Upload /></el-icon>
              导入规则
            </el-button>
            <el-button type="primary" :disabled="selectedRules.length === 0" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-button type="success" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加规则
            </el-button>
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </el-space>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="文书类型">
          <el-select
            v-model="searchForm.doc_type"
            placeholder="请选择"
            clearable
            style="width: 200px"
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select
            v-model="searchForm.severity"
            placeholder="请选择"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="严重" value="严重" />
            <el-option label="中等" value="中等" />
            <el-option label="轻微" value="轻微" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索规则名称或描述"
            clearable
            style="width: 250px"
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

      <!-- 规则列表 -->
      <el-table 
        v-loading="loading" 
        :data="rules" 
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="规则编号" width="150" />
        <el-table-column prop="name" label="规则名称" width="200" />
        <el-table-column prop="document_type" label="文书类型" width="150">
          <template #default="{ row }">
            <el-tag>{{ row.document_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="规则类别" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ formatCategory(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)">
              {{ row.severity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled === false ? 'info' : 'success'">
              {{ row.enabled === false ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="规则描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="scope" label="适用范围" width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              :type="row.enabled === false ? 'success' : 'info'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.enabled === false ? '启用' : '禁用' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button link type="success" size="small" @click="handlePreviewPrompt(row)">
              预览提示词
            </el-button>
            <el-button link type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
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
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 规则详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="规则详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentRule" :column="2" border>
        <el-descriptions-item label="规则编号">{{ currentRule.code }}</el-descriptions-item>
        <el-descriptions-item label="规则名称">{{ currentRule.name }}</el-descriptions-item>
        <el-descriptions-item label="文书类型">{{ currentRule.document_type }}</el-descriptions-item>
        <el-descriptions-item label="规则类别">
          <el-tag :type="getCategoryType(currentRule.category)">
            {{ formatCategory(currentRule.category) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityType(currentRule.severity)">
            {{ currentRule.severity }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="适用范围">{{ currentRule.scope }}</el-descriptions-item>
        <el-descriptions-item label="规则描述" :span="2">
          {{ currentRule.description }}
        </el-descriptions-item>
        <el-descriptions-item label="检查点" :span="2">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(point, index) in currentRule.check_points" :key="index">
              {{ point }}
            </li>
          </ul>
        </el-descriptions-item>
        <el-descriptions-item label="错误示例" :span="2">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(example, index) in currentRule.error_examples" :key="index">
              {{ example }}
            </li>
          </ul>
        </el-descriptions-item>
        <el-descriptions-item label="正确示例" :span="2">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(example, index) in currentRule.correct_examples" :key="index">
              {{ example }}
            </li>
          </ul>
        </el-descriptions-item>
        <el-descriptions-item label="法律依据" :span="2">
          {{ currentRule.legal_basis }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 添加/编辑规则对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditMode ? '编辑规则' : '添加规则'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
        <el-form-item label="文书类型" prop="document_type">
          <el-select
            v-model="editForm.document_type"
            placeholder="请选择文书类型"
            :disabled="isEditMode"
            style="width: 100%"
          >
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则编号" prop="code">
          <el-input
            v-model="editForm.code"
            placeholder="如: ARR-STR-001"
            :disabled="isEditMode"
          />
        </el-form-item>
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类别" prop="category">
          <el-select v-model="editForm.category" placeholder="请选择类别" style="width: 100%">
            <el-option label="结构完整性" value="结构完整性" />
            <el-option label="事实认定" value="事实认定" />
            <el-option label="证据分析" value="证据分析" />
            <el-option label="逮捕必要性" value="逮捕必要性" />
            <el-option label="内容规范" value="内容规范" />
            <el-option label="语言规范" value="语言规范" />
            <el-option label="逻辑一致性" value="逻辑一致性" />
            <el-option label="特殊场景" value="特殊场景" />
            <el-option label="法律适用" value="法律适用" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-radio-group v-model="editForm.severity">
            <el-radio label="严重">严重</el-radio>
            <el-radio label="中等">中等</el-radio>
            <el-radio label="轻微">轻微</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="适用范围" prop="scope">
          <el-input v-model="editForm.scope" placeholder="如: 全文、首部、主体等" />
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描述"
          />
        </el-form-item>
        <el-form-item label="LLM审查指令" prop="rule_for_llm">
          <el-input
            v-model="editForm.rule_for_llm"
            type="textarea"
            :rows="3"
            placeholder="给LLM的审查指令"
          />
        </el-form-item>
        <el-form-item label="检查点">
          <el-input
            v-model="checkPointInput"
            placeholder="输入检查点后按回车添加"
            @keyup.enter="addCheckPoint"
          >
            <template #append>
              <el-button @click="addCheckPoint">添加</el-button>
            </template>
          </el-input>
          <el-tag
            v-for="(point, index) in editForm.check_points"
            :key="index"
            closable
            @close="removeCheckPoint(index)"
            style="margin: 5px 5px 0 0"
          >
            {{ point }}
          </el-tag>
        </el-form-item>
        <el-form-item label="错误示例">
          <el-input
            v-model="errorExampleInput"
            placeholder="输入错误示例后按回车添加"
            @keyup.enter="addErrorExample"
          >
            <template #append>
              <el-button @click="addErrorExample">添加</el-button>
            </template>
          </el-input>
          <el-tag
            v-for="(example, index) in editForm.error_examples"
            :key="index"
            closable
            type="danger"
            @close="removeErrorExample(index)"
            style="margin: 5px 5px 0 0"
          >
            {{ example }}
          </el-tag>
        </el-form-item>
        <el-form-item label="正确示例">
          <el-input
            v-model="correctExampleInput"
            placeholder="输入正确示例后按回车添加"
            @keyup.enter="addCorrectExample"
          >
            <template #append>
              <el-button @click="addCorrectExample">添加</el-button>
            </template>
          </el-input>
          <el-tag
            v-for="(example, index) in editForm.correct_examples"
            :key="index"
            closable
            type="success"
            @close="removeCorrectExample(index)"
            style="margin: 5px 5px 0 0"
          >
            {{ example }}
          </el-tag>
        </el-form-item>
        <el-form-item label="法律依据" prop="legal_basis">
          <el-input
            v-model="editForm.legal_basis"
            type="textarea"
            :rows="2"
            placeholder="请输入法律依据"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 提示词预览对话框 -->
    <el-dialog
      v-model="promptPreviewVisible"
      title="提示词预览"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-loading="loadingPrompt" class="prompt-preview-container">
        <el-alert
          v-if="currentRule"
          :title="activePromptRuleCodes.length > 1 ? `批量预览：${activePromptRuleCodes.length} 条规则（${currentRule.document_type}）` : `规则: ${currentRule.name} (${currentRule.code})`"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        
        <el-form :inline="true" style="margin-bottom: 16px">
          <el-form-item label="包含示例">
            <el-switch v-model="promptOptions.include_examples" @change="() => loadPromptPreview()" />
          </el-form-item>
        </el-form>

        <div v-if="promptPreview">
          <!-- 统计信息 -->
          <el-card shadow="never" style="margin-bottom: 16px">
            <div class="prompt-stats">
              <el-statistic title="系统提示词" :value="promptPreview.statistics.system_length">
                <template #suffix>字符</template>
              </el-statistic>
              <el-statistic title="用户提示词" :value="promptPreview.statistics.user_length">
                <template #suffix>字符</template>
              </el-statistic>
              <el-statistic title="总长度" :value="promptPreview.statistics.total_length">
                <template #suffix>字符</template>
              </el-statistic>
              <el-statistic title="规则数量" :value="promptPreview.statistics.rules_count" />
              <el-statistic title="预估Token" :value="promptPreview.statistics.estimated_tokens" />
            </div>
          </el-card>

          <!-- Tabs 切换 -->
          <el-tabs v-model="activePromptTab" type="card">
            <el-tab-pane label="系统提示词" name="system">
              <template #label>
                <span>
                  <el-icon><Setting /></el-icon>
                  系统提示词
                </span>
              </template>
              <el-card shadow="never" class="prompt-card">
                <template #header>
                  <div class="prompt-header">
                    <span>System Prompt</span>
                    <el-button size="small" @click="handleCopySystemPrompt">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-button>
                  </div>
                </template>
                <div class="prompt-content">
                  <pre>{{ promptPreview.system_prompt }}</pre>
                </div>
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="用户提示词" name="user">
              <template #label>
                <span>
                  <el-icon><User /></el-icon>
                  用户提示词
                </span>
              </template>
              <el-card shadow="never" class="prompt-card">
                <template #header>
                  <div class="prompt-header">
                    <span>User Prompt</span>
                    <el-button size="small" @click="handleCopyUserPrompt">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-button>
                  </div>
                </template>
                <div class="prompt-content">
                  <pre>{{ promptPreview.user_prompt }}</pre>
                </div>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </div>

        <el-empty v-else description="暂无提示词" />
      </div>

      <template #footer>
        <el-button @click="promptPreviewVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyAllPrompts">
          <el-icon><CopyDocument /></el-icon>
          复制全部提示词
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入规则对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入规则"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #default>
          <div style="line-height: 1.8">
            <p style="margin: 0 0 8px 0">1. 支持 Excel (.xlsx, .xls) 和 JSON (.json) 格式</p>
            <p style="margin: 0 0 8px 0">2. 文件大小不超过 10MB</p>
            <p style="margin: 0 0 8px 0">3. 必填字段：规则编号、规则名称、类别、严重程度、适用范围、规则描述</p>
            <p style="margin: 0">4. 建议先导出现有规则作为模板参考</p>
          </div>
        </template>
      </el-alert>

      <el-form label-width="120px">
        <el-form-item label="目标文书类型">
          <el-select
            v-model="importDocType"
            placeholder="请选择文书类型"
            style="width: 100%"
          >
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板下载">
          <el-button type="success" plain @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
          <el-text type="info" size="small" style="margin-left: 12px">
            下载包含示例数据的 Excel 模板
          </el-text>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".xlsx,.xls,.json"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 Excel (.xlsx, .xls) 或 JSON (.json) 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="importing" 
          :disabled="!importFile || !importDocType"
          @click="handleConfirmImport"
        >
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 导出格式选择对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出规则"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="文书类型">
          <el-text>{{ exportDocType || '全部选中规则' }}</el-text>
        </el-form-item>
        <el-form-item label="导出数量">
          <el-text>{{ selectedRules.length }} 条规则</el-text>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="excel">Excel 格式 (.xlsx)</el-radio>
            <el-radio label="json">JSON 格式 (.json)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="exporting" 
          @click="handleConfirmExport"
        >
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadInstance, UploadRawFile, UploadFile } from 'element-plus'
import { Document, List, Warning, InfoFilled, Refresh, Search, Plus, CopyDocument, Setting, User, Download, Upload, Switch, UploadFilled, View } from '@element-plus/icons-vue'
import { 
  fetchRuleStatistics, 
  fetchDocumentTypes, 
  searchRules, 
  addRule, 
  updateRule, 
  deleteRule,
  previewPrompt,
  exportRules,
  importRules,
  toggleRuleStatus,
  batchToggleRules
} from '@/api/documents'

// 统计信息
const statistics = ref<Api.Documents.RuleStatistics>({
  total_documents: 0,
  completed_documents: 0,
  total_rules: 0,
  rules_by_category: {},
  rules_by_severity: {
    critical: 0,
    moderate: 0,
    minor: 0
  }
})

// 文书类型列表
const documentTypes = ref<string[]>([])

// 搜索表单
const searchForm = ref({
  doc_type: '',
  severity: '',
  keyword: ''
})

// 规则列表（全部数据）
const loading = ref(false)
const allRules = ref<Api.Documents.RuleDetail[]>([])

// 分页 - 使用独立的 ref
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 当前页显示的规则（计算属性）
const rules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allRules.value.slice(start, end)
})

// 详情对话框
const detailVisible = ref(false)
const currentRule = ref<Api.Documents.RuleDetail | null>(null)

// 编辑对话框
const editDialogVisible = ref(false)
const isEditMode = ref(false)
const saving = ref(false)
const editFormRef = ref()
const editForm = ref<Api.Documents.RuleDetail>({
  code: '',
  name: '',
  category: '',
  severity: '',
  scope: '',
  description: '',
  check_points: [],
  rule_for_llm: '',
  error_examples: [],
  correct_examples: [],
  legal_basis: '',
  document_type: ''
})

// 表单验证规则
const editRules = {
  document_type: [{ required: true, message: '请选择文书类型', trigger: 'change' }],
  code: [{ required: true, message: '请输入规则编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择规则类别', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  scope: [{ required: true, message: '请输入适用范围', trigger: 'blur' }],
  description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }]
}

// 输入框
const checkPointInput = ref('')
const errorExampleInput = ref('')
const correctExampleInput = ref('')

// 提示词预览对话框
const promptPreviewVisible = ref(false)
const loadingPrompt = ref(false)
const promptPreview = ref<Api.Documents.PromptPreviewResponse | null>(null)
const promptOptions = ref({
  include_examples: true
})
const activePromptTab = ref('system')
const activePromptRuleCodes = ref<string[]>([])

// 选中的规则
const selectedRules = ref<Api.Documents.RuleDetail[]>([])

// 导入对话框
const importDialogVisible = ref(false)
const importDocType = ref('')
const importFile = ref<File | null>(null)
const importing = ref(false)
const uploadRef = ref<UploadInstance>()

// 导出对话框
const exportDialogVisible = ref(false)
const exportDocType = ref('')
const exportFormat = ref<'excel' | 'json'>('excel')
const exporting = ref(false)

// 计算所有选中规则是否都是启用状态
const allSelectedEnabled = computed(() => {
  if (selectedRules.value.length === 0) return false
  return selectedRules.value.every(rule => rule.enabled !== false)
})

// 获取统计信息
const getStatistics = async () => {
  try {
    const data = await fetchRuleStatistics()
    console.log('统计信息响应:', data)
    statistics.value = data
    console.log('赋值后 statistics:', statistics.value)
  } catch (error) {
    console.error('获取统计信息失败:', error)
    ElMessage.error('获取统计信息失败')
  }
}

// 获取文书类型列表
const getDocumentTypes = async () => {
  try {
    const data = await fetchDocumentTypes()
    console.log('文书类型响应:', data)
    documentTypes.value = data.document_types
  } catch (error) {
    console.error('获取文书类型失败:', error)
    ElMessage.error('获取文书类型失败')
  }
}

// 搜索规则
const getRules = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchForm.value.doc_type) params.doc_type = searchForm.value.doc_type
    if (searchForm.value.severity) params.severity = searchForm.value.severity
    if (searchForm.value.keyword) params.keyword = searchForm.value.keyword

    const data = await searchRules(params)
    console.log('规则列表响应:', data)
    allRules.value = data.results
    // 前端分页，total 应该是所有数据的长度
    total.value = data.results.length
    
    // 确保分页数据正确
    console.log('分页信息:', {
      total: total.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      rulesLength: allRules.value.length
    })
  } catch (error) {
    console.error('获取规则列表失败:', error)
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
  getRules()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    doc_type: '',
    severity: '',
    keyword: ''
  }
  currentPage.value = 1 // 重置到第一页
  getRules()
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

// 刷新
const handleRefresh = () => {
  getStatistics()
  getDocumentTypes()
  getRules()
}

// 查看详情
const handleViewDetail = (row: Api.Documents.RuleDetail) => {
  currentRule.value = row
  detailVisible.value = true
}

// 预览提示词（单条规则）
const handlePreviewPrompt = async (row: Api.Documents.RuleDetail) => {
  currentRule.value = row
  activePromptRuleCodes.value = [row.code]
  promptPreviewVisible.value = true
  await loadPromptPreview(activePromptRuleCodes.value)
}

// 批量预览提示词（多条规则）
const handleBatchPreviewPrompt = async () => {
  if (selectedRules.value.length === 0) return
  const docTypes = [...new Set(selectedRules.value.map(r => r.document_type))]
  if (docTypes.length > 1) {
    ElMessage.warning('批量预览提示词只支持同一文书类型的规则，请重新选择')
    return
  }
  currentRule.value = { ...selectedRules.value[0] }
  activePromptRuleCodes.value = selectedRules.value.map(r => r.code)
  promptPreviewVisible.value = true
  await loadPromptPreview(activePromptRuleCodes.value)
}

// 加载提示词预览
const loadPromptPreview = async (ruleCodes?: string[]) => {
  if (!currentRule.value) return

  loadingPrompt.value = true
  try {
    const data = await previewPrompt({
      doc_type: currentRule.value.document_type,
      include_examples: promptOptions.value.include_examples,
      selected_rules: ruleCodes ?? activePromptRuleCodes.value
    })
    promptPreview.value = data
  } catch (error) {
    ElMessage.error('加载提示词失败')
  } finally {
    loadingPrompt.value = false
  }
}

// 复制系统提示词
const handleCopySystemPrompt = async () => {
  if (!promptPreview.value) return

  try {
    await navigator.clipboard.writeText(promptPreview.value.system_prompt)
    ElMessage.success('系统提示词已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 复制用户提示词
const handleCopyUserPrompt = async () => {
  if (!promptPreview.value) return

  try {
    await navigator.clipboard.writeText(promptPreview.value.user_prompt)
    ElMessage.success('用户提示词已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 复制全部提示词
const handleCopyAllPrompts = async () => {
  if (!promptPreview.value) return

  try {
    const allPrompts = `=== 系统提示词 (System Prompt) ===\n\n${promptPreview.value.system_prompt}\n\n=== 用户提示词 (User Prompt) ===\n\n${promptPreview.value.user_prompt}`
    await navigator.clipboard.writeText(allPrompts)
    ElMessage.success('全部提示词已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 添加规则
const handleAdd = () => {
  isEditMode.value = false
  editForm.value = {
    code: '',
    name: '',
    category: '',
    severity: '严重',
    scope: '',
    description: '',
    check_points: [],
    rule_for_llm: '',
    error_examples: [],
    correct_examples: [],
    legal_basis: '',
    document_type: ''
  }
  checkPointInput.value = ''
  errorExampleInput.value = ''
  correctExampleInput.value = ''
  editDialogVisible.value = true
}

// 编辑规则
const handleEdit = (row: Api.Documents.RuleDetail) => {
  isEditMode.value = true
  editForm.value = { ...row }
  checkPointInput.value = ''
  errorExampleInput.value = ''
  correctExampleInput.value = ''
  editDialogVisible.value = true
}

// 删除规则
const handleDelete = async (row: Api.Documents.RuleDetail) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则"${row.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteRule(row.document_type, row.code)
    ElMessage.success('删除成功')
    getRules()
    getStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}

// 保存规则
const handleSave = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    saving.value = true

    if (isEditMode.value) {
      // 更新规则
      await updateRule(editForm.value.document_type, editForm.value.code, editForm.value)
      ElMessage.success('更新成功')
    } else {
      // 添加规则
      await addRule(editForm.value.document_type, editForm.value)
      ElMessage.success('添加成功')
    }

    editDialogVisible.value = false
    getRules()
    getStatistics()
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
  } finally {
    saving.value = false
  }
}

// 添加检查点
const addCheckPoint = () => {
  if (checkPointInput.value.trim()) {
    editForm.value.check_points.push(checkPointInput.value.trim())
    checkPointInput.value = ''
  }
}

// 移除检查点
const removeCheckPoint = (index: number) => {
  editForm.value.check_points.splice(index, 1)
}

// 添加错误示例
const addErrorExample = () => {
  if (errorExampleInput.value.trim()) {
    editForm.value.error_examples.push(errorExampleInput.value.trim())
    errorExampleInput.value = ''
  }
}

// 移除错误示例
const removeErrorExample = (index: number) => {
  editForm.value.error_examples.splice(index, 1)
}

// 添加正确示例
const addCorrectExample = () => {
  if (correctExampleInput.value.trim()) {
    editForm.value.correct_examples.push(correctExampleInput.value.trim())
    correctExampleInput.value = ''
  }
}

// 移除正确示例
const removeCorrectExample = (index: number) => {
  editForm.value.correct_examples.splice(index, 1)
}

// 格式化类别
const formatCategory = (category: string) => {
  const categoryMap: Record<string, string> = {
    structure: '结构完整性',
    fact: '事实认定',
    evidence: '证据分析',
    necessity: '逮捕必要性',
    content: '内容规范',
    language: '语言规范',
    logic: '逻辑一致性',
    special: '特殊场景',
    law: '法律适用'
  }
  return categoryMap[category] || category
}

// 获取类别标签类型
const getCategoryType = (category: string) => {
  const typeMap: Record<string, any> = {
    structure: 'primary',
    fact: 'success',
    evidence: 'warning',
    necessity: 'danger',
    content: 'info',
    language: 'info',
    logic: 'primary',
    special: 'warning',
    law: 'success',
    结构完整性: 'primary',
    事实认定: 'success',
    证据分析: 'warning',
    逮捕必要性: 'danger',
    内容规范: 'info',
    语言规范: 'info',
    逻辑一致性: 'primary',
    特殊场景: 'warning',
    法律适用: 'success'
  }
  return typeMap[category] || 'info'
}

// 获取严重程度标签类型
const getSeverityType = (severity: string) => {
  if (severity === '严重') return 'danger'
  if (severity === '中等') return 'warning'
  return 'info'
}

// 表格选择变化
const handleSelectionChange = (selection: Api.Documents.RuleDetail[]) => {
  selectedRules.value = selection
}

// 切换单个规则状态
const handleToggleStatus = async (row: Api.Documents.RuleDetail) => {
  try {
    const action = row.enabled === false ? '启用' : '禁用'
    await ElMessageBox.confirm(
      `确定要${action}规则"${row.name}"吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const data = await toggleRuleStatus(row.document_type, row.code)
    ElMessage.success(data.status_text === '启用' ? '规则已启用' : '规则已禁用')
    getRules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  }
}

// 批量切换规则状态
const handleBatchToggle = async () => {
  if (selectedRules.value.length === 0) {
    ElMessage.warning('请先选择要操作的规则')
    return
  }

  const targetEnabled = !allSelectedEnabled.value
  const action = targetEnabled ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确定要${action}选中的 ${selectedRules.value.length} 条规则吗？`,
      `批量${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 按文书类型分组
    const rulesByDocType = new Map<string, string[]>()
    selectedRules.value.forEach(rule => {
      const codes = rulesByDocType.get(rule.document_type) || []
      codes.push(rule.code)
      rulesByDocType.set(rule.document_type, codes)
    })

    // 批量处理每个文书类型
    let totalSuccess = 0
    let totalFailed = 0
    const failedRules: string[] = []

    for (const [docType, codes] of rulesByDocType) {
      try {
        const data = await batchToggleRules(docType, {
          rule_codes: codes,
          enabled: targetEnabled
        })
        totalSuccess += data.success_count
        totalFailed += data.failed_rules.length
        failedRules.push(...data.failed_rules.map(r => r.rule_code))
      } catch (error) {
        totalFailed += codes.length
        failedRules.push(...codes)
      }
    }

    if (totalFailed === 0) {
      ElMessage.success(`批量${action}完成: 成功 ${totalSuccess} 条规则`)
    } else {
      ElMessage.warning(`批量${action}完成: 成功 ${totalSuccess} 条，失败 ${totalFailed} 条`)
    }

    getRules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '操作失败')
    }
  }
}

// 打开导入对话框
const handleImport = () => {
  importDocType.value = searchForm.value.doc_type || ''
  importFile.value = null
  importDialogVisible.value = true
  // 清空上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 文件选择变化
const handleFileChange = (file: UploadFile) => {
  importFile.value = file.raw || null
}

// 文件超出限制
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

// 确认导入
const handleConfirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  if (!importDocType.value) {
    ElMessage.warning('请选择目标文书类型')
    return
  }

  // 检查文件大小
  if (importFile.value.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  importing.value = true
  try {
    const data = await importRules(importDocType.value, importFile.value)
    
    if (data.failed_rules.length === 0) {
      ElMessage.success(`导入完成: 成功导入 ${data.success_count} 条规则`)
    } else {
      ElMessage.warning(
        `导入完成: 成功 ${data.success_count}/${data.total_count} 条规则，${data.failed_rules.length} 条失败`
      )
      
      // 显示失败详情
      const failedDetails = data.failed_rules.map(r => 
        `行 ${r.row}: ${r.rule_code} - ${r.reason}`
      ).join('\n')
      
      ElMessageBox.alert(failedDetails, '导入失败详情', {
        confirmButtonText: '确定',
        type: 'warning'
      })
    }

    importDialogVisible.value = false
    getRules()
    getStatistics()
  } catch (error: any) {
    ElMessage.error(error?.message || '导入失败')
  } finally {
    importing.value = false
  }
}

// 打开导出对话框
const handleExport = () => {
  if (selectedRules.value.length === 0) {
    ElMessage.warning('请先选择要导出的规则')
    return
  }

  // 检查是否都是同一个文书类型
  const docTypes = new Set(selectedRules.value.map(r => r.document_type))
  exportDocType.value = docTypes.size === 1 ? Array.from(docTypes)[0] : ''
  
  exportFormat.value = 'excel'
  exportDialogVisible.value = true
}

// 确认导出
const handleConfirmExport = async () => {
  if (selectedRules.value.length === 0) {
    ElMessage.warning('请先选择要导出的规则')
    return
  }

  exporting.value = true
  try {
    // 按文书类型分组导出
    const rulesByDocType = new Map<string, string[]>()
    selectedRules.value.forEach(rule => {
      const codes = rulesByDocType.get(rule.document_type) || []
      codes.push(rule.code)
      rulesByDocType.set(rule.document_type, codes)
    })

    // 如果只有一个文书类型，直接导出
    if (rulesByDocType.size === 1) {
      const [docType, codes] = Array.from(rulesByDocType)[0]
      const blob = await exportRules(docType, {
        format: exportFormat.value,
        rule_codes: codes
      })

      // 下载文件
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const ext = exportFormat.value === 'excel' ? 'xlsx' : 'json'
      link.download = `${docType}_规则库_${timestamp}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
    } else {
      // 多个文书类型，分别导出
      for (const [docType, codes] of rulesByDocType) {
        const blob = await exportRules(docType, {
          format: exportFormat.value,
          rule_codes: codes
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const ext = exportFormat.value === 'excel' ? 'xlsx' : 'json'
        link.download = `${docType}_规则库_${timestamp}.${ext}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      ElMessage.success(`导出成功: ${rulesByDocType.size} 个文件`)
    }

    exportDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

// 下载导入模板
const handleDownloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    {
      '规则编号': 'ARR-STR-001',
      '规则名称': '标题格式规范',
      '类别': '结构完整性',
      '严重程度': '严重',
      '适用范围': '审查逮捕报告-首部-标题',
      '规则描述': '审查逮捕报告的标题必须符合规定格式',
      'LLM审查指令': '检查标题是否符合格式要求。标准格式：×××（姓名）×××（罪名）案审查报告。如果涉及3人以上，必须写成：×××等×人×××罪案审查报告。标题必须居中显示。',
      '检查点': '标题格式必须为：×××（姓名）×××（罪名）案审查报告\n3人以上必须写：×××等×人×××罪案审查报告\n标题必须居中',
      '错误示例': '❌ 张三案件审查报告（缺少罪名）\n❌ 张三、李四、王五盗窃案审查报告（3人以上未使用\'等×人\'格式）\n❌ 审查报告（标题不完整）',
      '正确示例': '✅ 张三盗窃案审查报告\n✅ 张三等3人盗窃罪案审查报告',
      '法律依据': '《刑事检察文书写作规范与指导》2.1.20：审查逮捕报告标题格式为\'×××（姓名）×××（罪名）案审查报告\'',
      '启用状态': '启用'
    },
    {
      '规则编号': 'ARR-FAC-001',
      '规则名称': '犯罪事实完整性',
      '类别': '事实认定',
      '严重程度': '严重',
      '适用范围': '审查逮捕报告-主体-犯罪事实',
      '规则描述': '犯罪事实必须包含时间、地点、手段、后果等要素',
      'LLM审查指令': '检查犯罪事实是否完整。必须包含：1.犯罪时间（具体到年月日）2.犯罪地点（具体地址）3.犯罪手段（详细描述）4.犯罪后果（损失金额、伤害程度等）',
      '检查点': '必须包含犯罪时间\n必须包含犯罪地点\n必须包含犯罪手段\n必须包含犯罪后果',
      '错误示例': '❌ 被告人张三盗窃他人财物（缺少时间、地点、金额）\n❌ 2023年某日，张三在某地盗窃（时间地点不具体）',
      '正确示例': '✅ 2023年3月15日晚8时许，被告人张三在北京市朝阳区某小区，采用技术开锁方式进入被害人李四家中，盗窃现金人民币5000元及手机一部（价值3000元），共计价值8000元',
      '法律依据': '《人民检察院刑事诉讼规则》第三百六十条',
      '启用状态': '启用'
    },
    {
      '规则编号': 'ARR-NEC-001',
      '规则名称': '社会危险性论证',
      '类别': '逮捕必要性',
      '严重程度': '严重',
      '适用范围': '审查逮捕报告-主体-逮捕必要性',
      '规则描述': '必须充分论证犯罪嫌疑人的社会危险性',
      'LLM审查指令': '检查是否论证了以下社会危险性：1.可能实施新的犯罪 2.有危害国家安全、公共安全或者社会秩序的现实危险 3.可能毁灭、伪造证据，干扰证人作证或者串供 4.可能对被害人、举报人、控告人实施打击报复 5.企图自杀或者逃跑',
      '检查点': '是否论证可能实施新的犯罪\n是否论证有危害社会的现实危险\n是否论证可能毁灭证据\n是否论证可能打击报复\n是否论证可能逃跑',
      '错误示例': '❌ 犯罪嫌疑人有社会危险性，应予逮捕（未具体说明）\n❌ 犯罪嫌疑人可能逃跑（仅提及一项，不充分）',
      '正确示例': '✅ 犯罪嫌疑人张三系累犯，有再次犯罪的可能；且其在侦查阶段多次威胁被害人，有打击报复的现实危险；同时，张三无固定住所，有逃跑的可能。综合以上情况，对其采取取保候审等非羁押措施不足以防止发生社会危险性，有逮捕必要',
      '法律依据': '《刑事诉讼法》第八十一条、《人民检察院审查逮捕质量标准》',
      '启用状态': '启用'
    }
  ]

  // 转换为 CSV 格式（简单实现，兼容性好）
  const headers = Object.keys(templateData[0])
  const csvContent = [
    headers.join(','),
    ...templateData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row] || ''
        // 处理包含逗号、换行符或引号的值
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 下载文件
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  link.download = `规则导入模板_${timestamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  ElMessage.success('模板下载成功，请使用 Excel 打开 CSV 文件')
}

onMounted(() => {
  console.log('规则列表页面 mounted')
  console.log('初始 statistics:', statistics.value)
  getStatistics()
  getDocumentTypes()
  getRules()
})
</script>

<style scoped lang="scss">
.rules-list-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 16px;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding: 16px 0;
  }
}

.prompt-preview-container {
  min-height: 200px;
}

.prompt-stats {
  display: flex;
  gap: 24px;
  justify-content: space-around;
}

.prompt-card {
  border: none;
  
  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .prompt-content {
    max-height: 500px;
    overflow-y: auto;
    background: #f5f7fa;
    padding: 16px;
    border-radius: 4px;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #303133;
    }
  }
}

:deep(.el-tabs__item) {
  .el-icon {
    margin-right: 4px;
  }
}
</style>
