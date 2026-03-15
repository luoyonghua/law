<template>
  <div class="test-document-container">
    <el-card shadow="never">
      <template #header>
        <span>文档测试规则</span>
      </template>

      <el-form :model="form" label-width="120px">
        <el-form-item label="选择文档" required>
          <el-select
            v-model="form.doc_id"
            placeholder="请选择文档"
            filterable
            style="width: 500px"
            @change="handleDocChange"
          >
            <el-option
              v-for="doc in documents"
              :key="doc.doc_id"
              :label="`${doc.file_name} (${doc.doc_type})`"
              :value="doc.doc_id"
            >
              <div style="display: flex; justify-content: space-between">
                <span>{{ doc.file_name }}</span>
                <el-tag size="small">{{ doc.doc_type }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <el-button
            type="primary"
            style="margin-left: 10px"
            @click="handleRefreshDocuments"
          >
            刷新列表
          </el-button>
        </el-form-item>

        <el-form-item label="文书类型" required>
          <el-select
            v-model="form.doc_type"
            placeholder="请选择文书类型"
            style="width: 300px"
            @change="handleDocTypeChange"
          >
            <el-option
              v-for="type in documentTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择规则" required>
          <el-button
            type="primary"
            :disabled="!form.doc_type"
            @click="handleSelectRules"
          >
            选择规则 (已选 {{ selectedRules.length }} 条)
          </el-button>
          <el-button
            :disabled="!form.doc_type"
            @click="handlePreviewPrompt"
          >
            预览提示词
          </el-button>
        </el-form-item>

        <el-form-item label="包含示例">
          <el-switch v-model="form.include_examples" />
          <span style="margin-left: 10px; color: #909399">
            开启后将在提示词中包含错误和正确示例
          </span>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="testing"
            :disabled="!canTest"
            @click="handleTest"
          >
            开始测试
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 测试结果对话框 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="测试结果"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="testResult" class="test-result-dialog">
        <!-- 调试信息 -->
        <el-alert v-if="!testResult.summary" title="数据结构异常" type="error" style="margin-bottom: 20px">
          <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
        </el-alert>
        
        <el-divider content-position="left">
          <el-icon><DocumentChecked /></el-icon>
          测试结果
        </el-divider>
        
        <!-- 基本信息 -->
        <el-alert
          :title="`审查完成：${testResult.summary.compliance_status}`"
          :type="testResult.summary.compliance_status === '合规' ? 'success' : 'error'"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <div style="margin-top: 8px">
              <div>文件名：{{ testResult.file_name }}</div>
              <div>审查ID：{{ testResult.review_id }}</div>
              <div>审查时间：{{ testResult.review_time }}</div>
            </div>
          </template>
        </el-alert>

        <el-descriptions :column="3" border style="margin-bottom: 20px">
          <el-descriptions-item label="文档ID">{{ testResult.doc_id }}</el-descriptions-item>
          <el-descriptions-item label="文书类型">
            <el-tag>{{ testResult.doc_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审查方法">
            <el-tag type="success">{{ testResult.review_method === 'rule_engine' ? '规则引擎' : testResult.review_method }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="使用规则数">{{ testResult.rules_used }} 条</el-descriptions-item>
          <el-descriptions-item label="合规评分">
            <el-tag :type="getScoreType(testResult.compliance_score)" size="large">
              {{ testResult.compliance_score }}分 ({{ testResult.score_grade }})
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskType(testResult.summary.risk_level)" size="large">
              {{ testResult.summary.risk_level }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="16" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-statistic title="问题总数" :value="testResult.summary.total_issues">
              <template #prefix>
                <el-icon color="#909399"><Warning /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="严重问题" :value="testResult.summary.severe_issues">
              <template #prefix>
                <el-icon color="#F56C6C"><CircleCloseFilled /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="中等问题" :value="testResult.summary.moderate_issues">
              <template #prefix>
                <el-icon color="#E6A23C"><WarningFilled /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="轻微问题" :value="testResult.summary.minor_issues">
              <template #prefix>
                <el-icon color="#409EFF"><InfoFilled /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>

        <!-- 规则检查状态 -->
        <el-card shadow="never" style="margin-bottom: 20px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>
                <el-icon><List /></el-icon>
                规则检查状态
              </span>
              <el-space>
                <el-tag type="success">通过: {{ testResult.checked_rules.filter(r => r.status === 'passed').length }}</el-tag>
                <el-tag type="danger">未通过: {{ testResult.checked_rules.filter(r => r.status === 'failed').length }}</el-tag>
              </el-space>
            </div>
          </template>
          <el-table :data="testResult.checked_rules" stripe border>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="code" label="规则编号" width="150" />
            <el-table-column prop="name" label="规则名称" width="200" />
            <el-table-column prop="category" label="类别" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getSeverityType(row.severity)">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="检查结果" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'passed' ? 'success' : 'danger'" effect="dark">
                  <el-icon v-if="row.status === 'passed'"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ row.status === 'passed' ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 问题详情 -->
        <el-card v-if="testResult.issues.length > 0" shadow="never" style="margin-bottom: 20px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>
                <el-icon><Warning /></el-icon>
                问题详情 (共 {{ testResult.issues.length }} 个问题)
              </span>
              <el-space>
                <el-tag v-if="testResult.summary.severe_issues > 0" type="danger">
                  严重: {{ testResult.summary.severe_issues }}
                </el-tag>
                <el-tag v-if="testResult.summary.moderate_issues > 0" type="warning">
                  中等: {{ testResult.summary.moderate_issues }}
                </el-tag>
                <el-tag v-if="testResult.summary.minor_issues > 0" type="info">
                  轻微: {{ testResult.summary.minor_issues }}
                </el-tag>
              </el-space>
            </div>
          </template>
          <el-collapse accordion>
            <el-collapse-item
              v-for="(issue, index) in testResult.issues"
              :key="index"
              :name="index"
            >
              <template #title>
                <div style="display: flex; align-items: center; width: 100%">
                  <el-tag :type="getSeverityType(issue.severity)" style="margin-right: 10px">
                    {{ issue.severity }}
                  </el-tag>
                  <el-tag style="margin-right: 10px">{{ issue.rule_code }}</el-tag>
                  <span style="flex: 1">{{ issue.description }}</span>
                </div>
              </template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="规则编号">
                  <el-tag>{{ issue.rule_code }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="规则名称">
                  {{ issue.rule_name || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="类别">
                  <el-tag>{{ issue.category }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="严重程度">
                  <el-tag :type="getSeverityType(issue.severity)">{{ issue.severity }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="位置">
                  <el-text type="primary">{{ issue.location }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="问题描述">
                  <el-text>{{ issue.description }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="修改建议">
                  <el-text type="success">{{ issue.suggestion }}</el-text>
                </el-descriptions-item>
                <el-descriptions-item label="法律依据">
                  <el-text type="info">{{ issue.legal_basis }}</el-text>
                </el-descriptions-item>
              </el-descriptions>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <!-- 无问题提示 -->
        <el-result
          v-else
          icon="success"
          title="恭喜！文书审查通过"
          sub-title="该文书符合所有选定的规则要求，未发现问题"
        >
          <template #extra>
            <el-button type="primary" @click="resultDialogVisible = false">关闭</el-button>
          </template>
        </el-result>

        <!-- 修改建议 -->
        <el-card v-if="testResult.recommendations && testResult.recommendations.length > 0" shadow="never">
          <template #header>
            <span>
              <el-icon><Edit /></el-icon>
              修改建议 (按优先级排序)
            </span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(rec, index) in testResult.recommendations"
              :key="index"
              :type="rec.urgency === '紧急' ? 'danger' : 'primary'"
              :hollow="rec.urgency !== '紧急'"
            >
              <el-card shadow="hover">
                <template #header>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>
                      <el-tag type="info" size="small">优先级 {{ rec.priority }}</el-tag>
                      <el-tag :type="getSeverityType(rec.severity)" size="small" style="margin-left: 8px">
                        {{ rec.severity }}
                      </el-tag>
                      <el-tag type="warning" size="small" style="margin-left: 8px">
                        {{ rec.urgency }}
                      </el-tag>
                    </span>
                    <el-tag size="small">{{ rec.category }}</el-tag>
                  </div>
                </template>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="位置">{{ rec.location }}</el-descriptions-item>
                  <el-descriptions-item label="问题">{{ rec.description }}</el-descriptions-item>
                  <el-descriptions-item label="建议">
                    <el-text type="success">{{ rec.recommendation }}</el-text>
                  </el-descriptions-item>
                  <el-descriptions-item label="法律依据">
                    <el-text type="info">{{ rec.legal_basis }}</el-text>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-dialog>

    <!-- 选择规则对话框 -->
    <el-dialog
      v-model="rulesDialogVisible"
      title="选择规则"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-table
        ref="rulesTableRef"
        v-loading="loadingRules"
        :data="availableRules"
        @selection-change="handleRulesSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="规则编号" width="150" />
        <el-table-column prop="name" label="规则名称" width="180" />
        <el-table-column prop="category" label="类别" width="120">
          <template #default="{ row }">
            <el-tag>{{ formatCategory(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="rulesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmRules">
          确定 (已选 {{ tempSelectedRules.length }} 条)
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览提示词对话框 -->
    <el-dialog
      v-model="promptDialogVisible"
      title="提示词预览"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border style="margin-bottom: 16px">
        <el-descriptions-item label="文书类型">{{ promptPreview.doc_type }}</el-descriptions-item>
        <el-descriptions-item label="规则数量">{{ promptPreview.rules_count }}</el-descriptions-item>
        <el-descriptions-item label="提示词长度">{{ promptPreview.length }} 字符</el-descriptions-item>
        <el-descriptions-item label="预估Token">{{ promptPreview.estimated_tokens }}</el-descriptions-item>
      </el-descriptions>
      <el-input
        v-model="promptContent"
        type="textarea"
        :rows="20"
        readonly
        style="font-family: monospace"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Warning,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled,
  DocumentChecked,
  List,
  CircleCheck,
  CircleClose,
  Edit
} from '@element-plus/icons-vue'
import {
  fetchDocumentList,
  fetchDocumentTypes,
  fetchRulesByDocType,
  previewPrompt,
  testRulesWithDocument
} from '@/api/documents'

// 文档列表
const documents = ref<Api.Documents.DocumentInfo[]>([])

// 文书类型列表
const documentTypes = ref<string[]>([])

// 表单
const form = ref({
  doc_id: '',
  doc_type: '',
  include_examples: true
})

// 可用规则
const availableRules = ref<Api.Documents.RuleDetail[]>([])
const loadingRules = ref(false)

// 选中的规则
const selectedRules = ref<string[]>([])
const tempSelectedRules = ref<string[]>([])

// 规则选择对话框
const rulesDialogVisible = ref(false)
const rulesTableRef = ref()

// 提示词预览
const promptDialogVisible = ref(false)
const promptContent = ref('')
const promptPreview = ref({
  doc_type: '',
  rules_count: 0,
  length: 0,
  estimated_tokens: 0
})

// 测试结果
const testing = ref(false)
const testResult = ref<(Api.Documents.RuleTestResult & { doc_id: string; file_name: string }) | null>(null)
const resultDialogVisible = ref(false)

// 是否可以测试
const canTest = computed(() => {
  return form.value.doc_id && form.value.doc_type && selectedRules.value.length > 0
})

// 获取文档列表
const getDocuments = async () => {
  try {
    const data = await fetchDocumentList()
    documents.value = data
  } catch (error) {
    ElMessage.error('获取文档列表失败')
  }
}

// 获取文书类型
const getDocumentTypes = async () => {
  try {
    const data = await fetchDocumentTypes()
    documentTypes.value = data.document_types
  } catch (error) {
    ElMessage.error('获取文书类型失败')
  }
}

// 文档变化
const handleDocChange = (docId: string) => {
  const doc = documents.value.find((d) => d.doc_id === docId)
  if (doc) {
    form.value.doc_type = doc.doc_type
  }
  testResult.value = null
}

// 文书类型变化
const handleDocTypeChange = () => {
  selectedRules.value = []
  testResult.value = null
}

// 刷新文档列表
const handleRefreshDocuments = () => {
  getDocuments()
}

// 选择规则
const handleSelectRules = async () => {
  if (!form.value.doc_type) {
    ElMessage.warning('请先选择文书类型')
    return
  }

  loadingRules.value = true
  rulesDialogVisible.value = true
  
  try {
    const data = await fetchRulesByDocType(form.value.doc_type)
    availableRules.value = data.rules
    tempSelectedRules.value = [...selectedRules.value]
    
    // 设置已选中的规则
    setTimeout(() => {
      if (rulesTableRef.value) {
        availableRules.value.forEach((rule) => {
          if (selectedRules.value.includes(rule.code)) {
            rulesTableRef.value.toggleRowSelection(rule, true)
          }
        })
      }
    }, 100)
  } catch (error) {
    ElMessage.error('获取规则列表失败')
  } finally {
    loadingRules.value = false
  }
}

// 规则选择变化
const handleRulesSelectionChange = (selection: Api.Documents.RuleDetail[]) => {
  tempSelectedRules.value = selection.map((item) => item.code)
}

// 确认选择规则
const handleConfirmRules = () => {
  selectedRules.value = [...tempSelectedRules.value]
  rulesDialogVisible.value = false
  ElMessage.success(`已选择 ${selectedRules.value.length} 条规则`)
}

// 预览提示词
const handlePreviewPrompt = async () => {
  if (!form.value.doc_type) {
    ElMessage.warning('请先选择文书类型')
    return
  }
  if (selectedRules.value.length === 0) {
    ElMessage.warning('请先选择规则')
    return
  }

  try {
    const data = await previewPrompt({
      doc_type: form.value.doc_type,
      include_examples: form.value.include_examples,
      selected_rules: selectedRules.value
    })
    promptContent.value = data.prompt
    promptPreview.value = {
      doc_type: data.statistics.doc_type,
      rules_count: data.statistics.rules_count,
      length: data.statistics.length,
      estimated_tokens: data.statistics.estimated_tokens
    }
    promptDialogVisible.value = true
  } catch (error) {
    ElMessage.error('预览提示词失败')
  }
}

// 开始测试
const handleTest = async () => {
  if (!canTest.value) {
    ElMessage.warning('请填写完整信息')
    return
  }

  testing.value = true

  try {
    const data = await testRulesWithDocument(form.value.doc_id, {
      include_examples: form.value.include_examples,
      doc_type: form.value.doc_type,
      selected_rules: selectedRules.value
    })
    console.log('测试结果:', data)
    testResult.value = data
    resultDialogVisible.value = true
    ElMessage.success('测试完成')
  } catch (error: any) {
    console.error('测试失败:', error)
    ElMessage.error(error?.message || '测试失败')
  } finally {
    testing.value = false
  }
}

// 重置
const handleReset = () => {
  form.value = {
    doc_id: '',
    doc_type: '',
    include_examples: true
  }
  selectedRules.value = []
  testResult.value = null
  resultDialogVisible.value = false
}

// 格式化类别
const formatCategory = (category: string) => {
  // 如果已经是中文，直接返回
  if (category && /[\u4e00-\u9fa5]/.test(category)) {
    return category
  }
  
  // 英文转中文
  const categoryMap: Record<string, string> = {
    structure: '结构',
    fact: '事实',
    evidence: '证据',
    necessity: '必要性',
    content: '内容',
    language: '语言',
    logic: '逻辑',
    special: '特殊',
    law: '法律'
  }
  return categoryMap[category] || category
}

// 获取严重程度标签类型
const getSeverityType = (severity: string) => {
  if (severity === '严重') return 'danger'
  if (severity === '中等') return 'warning'
  return 'info'
}

// 获取评分类型
const getScoreType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取风险等级类型
const getRiskType = (risk: string) => {
  if (risk === '高') return 'danger'
  if (risk === '中') return 'warning'
  return 'success'
}

// 初始化
onMounted(() => {
  getDocuments()
  getDocumentTypes()
})
</script>

<style scoped lang="scss">
.test-document-container {
  padding: 16px;
}

.test-result-dialog {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
