<template>
  <el-dialog
    v-model="visible"
    title="批量结构化提取"
    width="95%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-extract-container">
      <!-- 提取配置 -->
      <el-card v-if="!extracting && results.length === 0" shadow="never" class="config-card">
        <el-alert
          title="提示：批量提取可能需要较长时间，请耐心等待"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #default>
            <p>• 提取时间取决于文书数量和复杂度</p>
            <p>• 每个文书大约需要 10-30 秒</p>
            <p>• 请勿关闭此窗口或刷新页面</p>
          </template>
        </el-alert>

        <div class="config-section">
          <h3>已选择文书 ({{ selectedDocs.length }})</h3>
          <div class="selected-docs">
            <el-tag
              v-for="doc in selectedDocs"
              :key="doc.doc_id"
              closable
              @close="handleRemoveDoc(doc)"
            >
              {{ doc.file_name }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 提取进度 -->
      <div v-if="extracting" class="progress-section">
        <el-progress
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="20"
        />
        <p class="progress-text">
          正在提取：{{ currentIndex }}/{{ totalDocs }}
        </p>
      </div>

      <!-- 提取结果 -->
      <div v-if="results.length > 0" class="results-section">
        <el-alert
          :title="`提取完成，成功 ${successCount} 个，失败 ${failCount} 个`"
          :type="failCount > 0 ? 'warning' : 'success'"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane
            v-for="(result, index) in results"
            :key="result.doc_id"
            :name="String(index)"
          >
            <template #label>
              <span>
                <el-icon v-if="result.success" color="#67c23a"><CircleCheck /></el-icon>
                <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
                {{ result.file_name }}
              </span>
            </template>

            <div v-if="result.success" class="result-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="案号">
                  {{ result.data.案号 }}
                </el-descriptions-item>
                <el-descriptions-item label="案件名称">
                  {{ result.data.案件名称 }}
                </el-descriptions-item>
                <el-descriptions-item label="文书类型">
                  <el-tag>{{ result.data.文书类型 }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理时间">
                  {{ result.processing_time.toFixed(2) }}秒
                </el-descriptions-item>
              </el-descriptions>

              <el-divider content-position="left">被告人信息</el-divider>
              <el-table :data="result.data.被告人信息" border>
                <el-table-column prop="姓名" label="姓名" width="100" />
                <el-table-column prop="性别" label="性别" width="80" />
                <el-table-column prop="出生日期" label="出生日期" width="150" />
                <el-table-column prop="身份证号" label="身份证号" width="180" />
                <el-table-column prop="住址" label="住址" show-overflow-tooltip />
              </el-table>

              <el-divider content-position="left">指控罪名</el-divider>
              <div class="tag-list">
                <el-tag
                  v-for="(crime, idx) in result.data.指控罪名"
                  :key="idx"
                  type="danger"
                  size="large"
                >
                  {{ crime }}
                </el-tag>
              </div>

              <el-divider content-position="left">事实概要</el-divider>
              <div class="content-box">
                {{ result.data.事实概要 }}
              </div>

              <el-divider content-position="left">证据列表</el-divider>
              <ul class="evidence-list">
                <li v-for="(evidence, idx) in result.data.证据列表" :key="idx">
                  {{ evidence }}
                </li>
              </ul>

              <el-divider content-position="left">法律依据</el-divider>
              <div class="tag-list">
                <el-tag
                  v-for="(law, idx) in result.data.法律依据"
                  :key="idx"
                  type="warning"
                >
                  {{ law }}
                </el-tag>
              </div>

              <el-divider content-position="left">处理结果</el-divider>
              <div class="content-box result">
                {{ result.data.处理结果 }}
              </div>

              <el-divider content-position="left">特定字段</el-divider>
              <el-descriptions :column="1" border>
                <el-descriptions-item
                  v-for="(value, key) in result.data.特定字段"
                  :key="key"
                  :label="key"
                >
                  <template v-if="Array.isArray(value)">
                    <div v-if="value.length > 0">
                      <div v-for="(item, idx) in value" :key="idx">{{ item }}</div>
                    </div>
                    <span v-else class="empty-text">无</span>
                  </template>
                  <template v-else>
                    {{ value || '无' }}
                  </template>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-else class="error-content">
              <el-alert
                title="提取失败"
                type="error"
                :description="result.error || '未知错误'"
                :closable="false"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div v-if="!extracting && results.length === 0">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedDocs.length === 0"
          @click="handleExtract"
        >
          开始提取
        </el-button>
      </div>
      <div v-else-if="results.length > 0">
        <el-button type="primary" @click="handleExportAll">导出全部结果</el-button>
        <el-button @click="handleReset">重新提取</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { batchStructuredExtract } from '@/api/documents'

interface Props {
  modelValue: boolean
  selectedDocs: Api.Documents.DocumentInfo[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const extracting = ref(false)
const progress = ref(0)
const progressStatus = ref<'' | 'success' | 'exception' | 'warning'>('')
const currentIndex = ref(0)
const totalDocs = ref(0)
const results = ref<Api.Documents.ExtractionResult[]>([])
const activeTab = ref('0')

const successCount = computed(() => results.value.filter((r) => r.success).length)
const failCount = computed(() => results.value.filter((r) => !r.success).length)

const handleRemoveDoc = (doc: Api.Documents.DocumentInfo) => {
  const index = props.selectedDocs.findIndex((d) => d.doc_id === doc.doc_id)
  if (index > -1) {
    props.selectedDocs.splice(index, 1)
  }
}

const handleExtract = async () => {
  if (props.selectedDocs.length === 0) {
    ElMessage.warning('请选择要提取的文书')
    return
  }

  extracting.value = true
  totalDocs.value = props.selectedDocs.length
  currentIndex.value = 0
  progress.value = 0

  try {
    const docIds = props.selectedDocs.map((doc) => doc.doc_id)
    const response = await batchStructuredExtract(docIds)
    
    results.value = response.results
    progress.value = 100
    progressStatus.value = response.fail_count > 0 ? 'warning' : 'success'
    
    ElMessage.success(`提取完成，成功 ${response.success_count} 个`)
    emit('success')
  } catch (error) {
    progressStatus.value = 'exception'
    ElMessage.error('提取失败')
  } finally {
    extracting.value = false
  }
}

const handleExportAll = () => {
  ElMessage.info('导出功能开发中')
}

const handleReset = () => {
  results.value = []
  progress.value = 0
  progressStatus.value = ''
  currentIndex.value = 0
  totalDocs.value = 0
  activeTab.value = '0'
}

const handleClose = () => {
  if (!extracting.value) {
    handleReset()
    visible.value = false
  }
}
</script>

<style scoped lang="scss">
.batch-extract-container {
  .config-card {
    .config-section {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 12px;
        font-size: 16px;
        font-weight: 600;
      }

      .selected-docs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .progress-section {
    padding: 40px;

    .progress-text {
      margin-top: 16px;
      text-align: center;
      font-size: 14px;
      color: #606266;
    }
  }

  .results-section {
    .result-content {
      padding: 16px;

      .el-divider {
        margin: 24px 0 16px;
      }

      .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .content-box {
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
        line-height: 1.8;
        color: #606266;

        &.result {
          background-color: #ecf5ff;
          color: #409eff;
          font-weight: 500;
        }
      }

      .evidence-list {
        padding-left: 24px;
        line-height: 2;
        color: #606266;

        li {
          margin-bottom: 8px;
        }
      }

      .empty-text {
        color: #909399;
        font-style: italic;
      }
    }

    .error-content {
      padding: 16px;
    }
  }
}
</style>
