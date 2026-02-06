<template>
  <el-dialog
    v-model="visible"
    title="批量上传文书"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-container">
      <el-alert
        title="支持PDF、Word、扫描件、图片格式，单次最多上传100份"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :limit="100"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
      </el-upload>

      <!-- 上传进度 -->
      <div v-if="uploading" class="progress-container">
        <div class="progress-info">
          <span>上传进度：{{ uploadProgress.completed }}/{{ uploadProgress.total }}</span>
          <span>剩余时间：约 {{ estimatedTime }} 分钟</span>
        </div>
        <el-progress
          :percentage="uploadProgress.percentage"
          :status="uploadProgress.status"
        />
        <div class="progress-details">
          <div v-for="task in taskDetails" :key="task.task_id" class="task-item">
            <span>{{ task.task_id }}</span>
            <el-tag :type="getTaskStatusType(task.state)" size="small">
              {{ task.info.step }}
            </el-tag>
            <span>{{ task.info.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="uploading"
        :disabled="fileList.length === 0"
        @click="handleUpload"
      >
        {{ uploading ? '上传中...' : '开始上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { uploadDocuments, fetchBatchStatus } from '@/api/documents'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)
const batchId = ref('')
const uploadProgress = ref({
  total: 0,
  completed: 0,
  percentage: 0,
  status: '' as '' | 'success' | 'exception' | 'warning'
})
const taskDetails = ref<Api.Documents.TaskStatus[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const estimatedTime = computed(() => {
  if (uploadProgress.value.total === 0) return 0
  const remaining = uploadProgress.value.total - uploadProgress.value.completed
  return Math.ceil(remaining * 0.5) // 假设每个文件0.5分钟
})

const handleFileChange = (file: UploadFile, files: UploadFile[]) => {
  fileList.value = files
}

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true
  const formData = new FormData()
  fileList.value.forEach((file) => {
    if (file.raw) {
      formData.append('files', file.raw)
    }
  })

  try {
    const response = await uploadDocuments(formData)
    batchId.value = response.batch_id
    uploadProgress.value.total = response.total_files

    ElMessage.success('文件上传成功，开始解析...')

    // 轮询查询进度
    pollBatchStatus()
  } catch (error) {
    ElMessage.error('上传失败')
    uploading.value = false
  }
}

const pollBatchStatus = async () => {
  const timer = setInterval(async () => {
    try {
      const status = await fetchBatchStatus(batchId.value)
      uploadProgress.value.completed = status.completed_files
      uploadProgress.value.percentage = status.progress_percentage
      taskDetails.value = status.detailed_status

      if (status.status === 'completed') {
        clearInterval(timer)
        uploadProgress.value.status = 'success'
        ElMessage.success('所有文件解析完成')
        uploading.value = false
        emit('success')
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else if (status.status === 'failed') {
        clearInterval(timer)
        uploadProgress.value.status = 'exception'
        ElMessage.error('部分文件解析失败')
        uploading.value = false
      }
    } catch (error) {
      clearInterval(timer)
      ElMessage.error('查询进度失败')
      uploading.value = false
    }
  }, 2000)
}

const getTaskStatusType = (state: string) => {
  const typeMap: Record<string, any> = {
    SUCCESS: 'success',
    PENDING: 'info',
    PROCESSING: 'warning',
    FAILURE: 'danger'
  }
  return typeMap[state] || 'info'
}

const handleClose = () => {
  if (!uploading.value) {
    fileList.value = []
    uploadProgress.value = {
      total: 0,
      completed: 0,
      percentage: 0,
      status: ''
    }
    taskDetails.value = []
    visible.value = false
  }
}
</script>

<style scoped lang="scss">
.upload-container {
  .upload-area {
    width: 100%;
    margin-bottom: 16px;

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  .progress-container {
    margin-top: 24px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
    }

    .progress-details {
      margin-top: 16px;
      max-height: 200px;
      overflow-y: auto;

      .task-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        span {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
