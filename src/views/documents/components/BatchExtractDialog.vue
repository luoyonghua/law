<template>
  <!-- 进度卡片 -->
  <BatchExtractProgressCard
    v-model:visible="progressCardVisible"
    :total-count="totalDocs"
    :completed-count="currentIndex"
    :success-count="successCount"
    :fail-count="failCount"
    :is-extracting="extracting"
    @minimize="progressCardVisible = false"
  />

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
            <p>• 提取过程中可以关闭此窗口，进度会在右下角显示</p>
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
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { submitBatchExtract, getBatchExtractStatus } from '@/api/documents'
import BatchExtractProgressCard from './BatchExtractProgressCard.vue'

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
const progressCardVisible = ref(false)
const progress = ref(0)
const progressStatus = ref<'' | 'success' | 'exception' | 'warning'>('')
const currentIndex = ref(0)
const totalDocs = ref(0)
const results = ref<Api.Documents.ExtractionResult[]>([])

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
  progressCardVisible.value = true
  totalDocs.value = props.selectedDocs.length
  currentIndex.value = 0
  progress.value = 0

  // 可以关闭对话框，进度在卡片中显示
  visible.value = false

  try {
    const docIds = props.selectedDocs.map((doc) => doc.doc_id)
    
    // 1. 提交批量任务
    console.log('[批量提取] 提交任务，文档数量:', docIds.length)
    const submitResponse = await submitBatchExtract(docIds)
    const { batch_id } = submitResponse
    
    console.log('[批量提取] 任务已提交，batch_id:', batch_id)
    ElMessage.info(`批量提取任务已提交，可在右下角查看进度`)
    
    // 2. 轮询批次状态，直到完成
    let batchStatus = 'pending'
    const maxAttempts = 180 // 最多轮询 6 分钟
    let attempt = 0
    
    console.log('[批量提取] 开始轮询批次状态')
    while ((batchStatus === 'pending' || batchStatus === 'processing') && attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 每 2 秒查询一次
      
      const statusResponse = await getBatchExtractStatus(batch_id)
      batchStatus = statusResponse.status
      
      // 更新进度
      if (statusResponse.total > 0) {
        currentIndex.value = statusResponse.completed_count
        progress.value = (statusResponse.completed_count / statusResponse.total) * 100
      }
      
      console.log(`[批量提取] 状态: ${batchStatus}, 进度: ${statusResponse.completed_count}/${statusResponse.total}`)
      
      // 检查是否完成
      if (batchStatus === 'completed') {
        // 获取所有结果
        if (statusResponse.results && statusResponse.results.length > 0) {
          results.value = statusResponse.results
          
          const successCount = statusResponse.success_count
          const failCount = statusResponse.fail_count
          
          console.log('[批量提取] 全部完成，成功:', successCount, '失败:', failCount)
          
          progressStatus.value = failCount > 0 ? 'warning' : 'success'
          ElMessage.success(`提取完成，成功 ${successCount} 个，失败 ${failCount} 个`)
        } else {
          throw new Error('未获取到提取结果')
        }
        break
      } else if (batchStatus === 'failed') {
        throw new Error(statusResponse.message || '批量提取任务失败')
      }
      
      attempt++
    }
    
    if (attempt >= maxAttempts) {
      throw new Error('提取超时，请稍后查看提取历史')
    }
    
    emit('success')
  } catch (error: any) {
    console.error('[批量提取] 批量提取失败:', error)
    progressStatus.value = 'exception'
    ElMessage.error(error.message || '提取失败')
  } finally {
    extracting.value = false
  }
}

const handleClose = () => {
  if (!extracting.value) {
    // 重置状态
    results.value = []
    progress.value = 0
    progressStatus.value = ''
    currentIndex.value = 0
    totalDocs.value = 0
    progressCardVisible.value = false
    visible.value = false
  } else {
    // 如果正在提取，只关闭对话框，不重置状态
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
}
</style>
