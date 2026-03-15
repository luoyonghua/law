<template>
  <el-dialog
    v-model="visible"
    title="对比详情"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-content">
      <template v-if="comparisonDetail">
        <!-- 基本信息 -->
        <el-card shadow="never" class="info-card">
          <template #header>
            <span class="card-title">基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="对比方式">
              <el-tag type="primary">{{ comparisonDetail.comparison_method }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="对比时间">
              {{ comparisonDetail.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="对比ID">
              {{ comparisonDetail.comparison_id }}
            </el-descriptions-item>
            <el-descriptions-item label="文档数量">
              {{ comparisonDetail.doc_ids.length }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 对比概览 -->
        <el-card shadow="never" class="info-card">
          <template #header>
            <div class="card-header-with-action">
              <span class="card-title">对比概览</span>
              <el-dropdown @command="handleExport">
                <el-button size="small" type="primary">
                  导出报告<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="docx">Word 格式</el-dropdown-item>
                    <el-dropdown-item command="pdf">PDF 格式</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="相符合度" :value="Math.round(comparisonDetail.match_rate * 100)" suffix="%" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总要素数" :value="comparisonDetail.total_elements" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="匹配数" :value="comparisonDetail.matched_count" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="差异数" :value="comparisonDetail.differences.length" />
            </el-col>
          </el-row>
        </el-card>

        <!-- 对比摘要 -->
        <el-card shadow="never" class="info-card">
          <template #header>
            <span class="card-title">对比摘要</span>
          </template>
          <div class="summary-content">
            <el-alert
              :title="comparisonDetail.summary"
              type="info"
              :closable="false"
              show-icon
            />
            
            <template v-if="comparisonDetail.detailed_result?.summary">
              <div class="summary-section">
                <div class="section-title">总体一致性</div>
                <el-tag :type="getConsistencyType((comparisonDetail.detailed_result.summary as any).overall_consistency)">
                  {{ (comparisonDetail.detailed_result.summary as any).overall_consistency }}
                </el-tag>
              </div>

              <div class="summary-section">
                <div class="section-title">严重程度统计</div>
                <div class="severity-stats">
                  <el-tag type="danger">高: {{ (comparisonDetail.detailed_result.summary as any).high_severity_count }}</el-tag>
                  <el-tag type="warning">中: {{ (comparisonDetail.detailed_result.summary as any).medium_severity_count }}</el-tag>
                  <el-tag type="info">低: {{ (comparisonDetail.detailed_result.summary as any).low_severity_count }}</el-tag>
                </div>
              </div>

              <div v-if="(comparisonDetail.detailed_result.summary as any).main_risks?.length" class="summary-section">
                <div class="section-title">主要风险</div>
                <ul class="risk-list">
                  <li v-for="(risk, index) in (comparisonDetail.detailed_result.summary as any).main_risks" :key="index">
                    {{ risk }}
                  </li>
                </ul>
              </div>

              <div v-if="(comparisonDetail.detailed_result.summary as any).recommendations?.length" class="summary-section">
                <div class="section-title">处理建议</div>
                <ul class="recommendation-list">
                  <li v-for="(rec, index) in (comparisonDetail.detailed_result.summary as any).recommendations" :key="index">
                    {{ rec }}
                  </li>
                </ul>
              </div>

              <div v-if="comparisonDetail.detailed_result.summary.conclusion" class="summary-section">
                <div class="section-title">结论</div>
                <el-alert
                  :title="comparisonDetail.detailed_result.summary.conclusion"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </div>
            </template>
          </div>
        </el-card>

        <!-- 差异列表 -->
        <el-card shadow="never" class="info-card">
          <template #header>
            <span class="card-title">差异详情 ({{ comparisonDetail.differences.length }})</span>
          </template>
          <div class="differences-list">
            <div
              v-for="(diff, index) in comparisonDetail.differences"
              :key="index"
              class="difference-item"
              :class="`severity-${getSeverityClass((diff as any).severity)}`"
            >
              <div class="diff-header">
                <div class="diff-title">
                  <span class="diff-category">{{ (diff as any).element || (diff as any).category }}</span>
                  <el-tag :type="getSeverityType((diff as any).severity)" size="small">
                    {{ (diff as any).severity }}
                  </el-tag>
                </div>
              </div>

              <div class="diff-content">
                <div class="diff-row">
                  <span class="label">描述：</span>
                  <span class="value">{{ (diff as any).description || (diff as any).analysis }}</span>
                </div>

                <div class="diff-comparison">
                  <div class="comparison-item">
                    <div class="comparison-label">文书A</div>
                    <div class="comparison-value doc1">{{ (diff as any).doc_a_value || (diff as any).doc_a_content }}</div>
                  </div>
                  <div class="comparison-item">
                    <div class="comparison-label">文书B</div>
                    <div class="comparison-value doc2">{{ (diff as any).doc_b_value || (diff as any).doc_b_content }}</div>
                  </div>
                </div>

                <div class="diff-row">
                  <span class="label">可能原因：</span>
                  <span class="value">{{ (diff as any).possible_reason || (diff as any).reason }}</span>
                </div>

                <div class="diff-row">
                  <span class="label">风险评估：</span>
                  <span class="value">{{ (diff as any).risk_assessment || (diff as any).suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 详细事实差异 -->
        <el-card
          v-if="comparisonDetail.detailed_result?.fact_differences?.length"
          shadow="never"
          class="info-card"
        >
          <template #header>
            <span class="card-title">详细事实差异 ({{ comparisonDetail.detailed_result.fact_differences.length }})</span>
          </template>
          <div class="differences-list">
            <div
              v-for="(fact, index) in comparisonDetail.detailed_result.fact_differences"
              :key="index"
              class="difference-item"
              :class="`severity-${getSeverityClass(fact.severity)}`"
            >
              <div class="diff-header">
                <div class="diff-title">
                  <span class="diff-category">{{ fact.category }}</span>
                  <el-tag :type="getSeverityType(fact.severity)" size="small">
                    {{ fact.severity }}
                  </el-tag>
                </div>
              </div>

              <div class="diff-content">
                <div class="diff-row">
                  <span class="label">分析：</span>
                  <span class="value">{{ fact.analysis }}</span>
                </div>

                <div class="diff-comparison">
                  <div class="comparison-item">
                    <div class="comparison-label">文书A</div>
                    <div class="comparison-value doc1">{{ fact.text_in_doc_A }}</div>
                  </div>
                  <div class="comparison-item">
                    <div class="comparison-label">文书B</div>
                    <div class="comparison-value doc2">{{ fact.text_in_doc_B }}</div>
                  </div>
                </div>

                <div class="diff-row">
                  <span class="label">可能原因：</span>
                  <span class="value">{{ fact.possible_reason }}</span>
                </div>

                <div class="diff-row">
                  <span class="label">风险评估：</span>
                  <span class="value">{{ fact.risk_assessment }}</span>
                </div>

                <div class="diff-row highlight">
                  <span class="label">处理建议：</span>
                  <span class="value">{{ fact.suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </template>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { fetchComparisonDetail, generateComparisonReport } from '@/api/documents'

interface Props {
  modelValue: boolean
  comparisonId: string
  docIds?: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(false)
const loading = ref(false)
const comparisonDetail = ref<Api.Documents.ComparisonResponse | null>(null)

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.comparisonId) {
    loadDetail()
  }
})

// 监听 visible 变化
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 加载详情
const loadDetail = async () => {
  loading.value = true
  try {
    const data = await fetchComparisonDetail(props.comparisonId)
    comparisonDetail.value = data
    console.log('对比详情数据:', data)
  } catch (error: any) {
    console.error('加载对比详情失败:', error)
    ElMessage.error(error?.message || '获取对比详情失败')
    handleClose()
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  comparisonDetail.value = null
}

// 导出报告
const handleExport = (format: 'docx' | 'pdf') => {
  if (!comparisonDetail.value || !comparisonDetail.value.doc_ids || comparisonDetail.value.doc_ids.length < 2) {
    ElMessage.error('文档信息不完整，无法导出')
    return
  }
  
  const url = generateComparisonReport(
    comparisonDetail.value.comparison_id,
    comparisonDetail.value.doc_ids[0],
    comparisonDetail.value.doc_ids[1],
    format
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `对比报告_${comparisonDetail.value.comparison_id}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success(`正在下载 ${format.toUpperCase()} 格式报告`)
}

// 获取一致性类型
const getConsistencyType = (consistency: string) => {
  if (consistency.includes('一致') || consistency.includes('良好')) return 'success'
  if (consistency.includes('不一致') || consistency.includes('严重')) return 'danger'
  return 'warning'
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const map: Record<string, any> = {
    '高': 'danger',
    '严重': 'danger',
    '中': 'warning',
    '中等': 'warning',
    '低': 'info',
    '轻微': 'info'
  }
  return map[severity] || 'info'
}

// 获取严重程度类名
const getSeverityClass = (severity: string) => {
  const map: Record<string, string> = {
    '高': 'high',
    '严重': 'high',
    '中': 'medium',
    '中等': 'medium',
    '低': 'low',
    '轻微': 'low'
  }
  return map[severity] || 'low'
}
</script>

<style scoped lang="scss">
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 75vh;
  overflow-y: auto;
  padding: 4px;
}

.info-card {
  border-radius: 8px;
  flex-shrink: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-section {
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }
}

.severity-stats {
  display: flex;
  gap: 8px;
}

.risk-list,
.recommendation-list {
  margin: 0;
  padding-left: 20px;
  
  li {
    margin-bottom: 8px;
    line-height: 1.6;
    color: #606266;
  }
}

.differences-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.difference-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f5f7fa;
}

.difference-item.severity-high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.difference-item.severity-medium {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.difference-item.severity-low {
  border-left-color: #909399;
  background: #f4f4f5;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.diff-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-category {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.diff-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-row {
  display: flex;
  font-size: 14px;
  line-height: 1.6;
}

.diff-row.highlight {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  margin: 8px 0;
}

.diff-row .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
  font-weight: 500;
}

.diff-row .value {
  color: #606266;
  flex: 1;
}

.diff-row.highlight .label {
  color: #303133;
  font-weight: 600;
}

.diff-row.highlight .value {
  color: #303133;
  font-weight: 500;
}

.diff-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 8px 0;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comparison-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.comparison-value {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  min-height: 60px;
}

.comparison-value.doc1 {
  background: #e8f4fd;
  border: 1px solid #b3d8ff;
  color: #409eff;
}

.comparison-value.doc2 {
  background: #f0f9ff;
  border: 1px solid #c6e2ff;
  color: #409eff;
}
</style>
