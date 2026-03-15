<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传文档"
    width="700px"
    :close-on-click-modal="false"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
  >
    <el-form
      ref="formRef"
      :model="formData"
      label-width="80px"
    >
      <el-form-item label="上传人" prop="uploader_name">
        <el-input 
          v-model="formData.uploader_name" 
          placeholder="留空则使用当前用户名称" 
          :disabled="uploading"
        />
      </el-form-item>

      <el-form-item label="选择文件" prop="files">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :disabled="uploading"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        >
          <template #trigger>
            <el-button :icon="Upload" :disabled="uploading">选择文件</el-button>
          </template>
          <template #tip>
            <div style="color: #999; font-size: 12px; margin-top: 8px">
              支持格式：PDF、Word、文本、图片（JPG、PNG），最大 50MB，可选择多个文件
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 上传进度 -->
      <el-form-item v-if="uploading || uploadComplete" label="上传进度">
        <div class="upload-progress">
          <div class="progress-header">
            <span>{{ uploadStatus }}</span>
            <span class="progress-count">{{ completedCount }} / {{ totalCount }}</span>
          </div>
          <el-progress 
            :percentage="uploadProgress" 
            :status="uploadComplete ? 'success' : undefined"
          />
          
          <!-- 详细进度列表 -->
          <div v-if="batchStatus" class="progress-details">
            <div class="detail-stats">
              <el-tag type="success" size="small">已完成: {{ batchStatus.completed_files }}</el-tag>
              <el-tag type="warning" size="small">处理中: {{ batchStatus.processing_files }}</el-tag>
              <el-tag type="info" size="small">待处理: {{ batchStatus.pending_files }}</el-tag>
              <el-tag v-if="batchStatus.failed_files > 0" type="danger" size="small">
                失败: {{ batchStatus.failed_files }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel" :disabled="uploading">取消</el-button>
      <el-button 
        v-if="!uploadComplete"
        type="primary" 
        :loading="uploading" 
        :disabled="fileList.length === 0"
        @click="handleSubmit"
      >
        {{ uploading ? '上传中...' : '开始上传' }}
      </el-button>
      <el-button 
        v-else
        type="success" 
        @click="handleComplete"
      >
        完成
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { uploadDocumentsToCase } from '@/api/cases'
import { fetchBatchStatus } from '@/api/documents'

interface Props {
  visible: boolean
  caseId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:visible', 'success'])

const formRef = ref()
const uploadRef = ref<UploadInstance>()
const dialogVisible = ref(false)
const uploading = ref(false)
const uploadComplete = ref(false)
const fileList = ref<UploadFile[]>([])

const formData = reactive({
  uploader_name: ''
})

// 上传进度相关
const batchId = ref<string>()
const batchStatus = ref<Api.Documents.BatchStatusResponse>()
const uploadProgress = ref(0)
const totalCount = ref(0)
const completedCount = ref(0)
const uploadStatus = ref('准备上传...')
let statusCheckTimer: number | null = null

// 文件变化
const handleFileChange = (file: UploadFile, files: UploadFile[]) => {
  const rawFile = file.raw
  if (!rawFile) return

  const isValidType = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ].includes(rawFile.type)

  if (!isValidType) {
    ElMessage.error('只能上传 PDF、Word、文本或图片文件')
    files.splice(files.indexOf(file), 1)
    return
  }

  const isLt50M = rawFile.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
    files.splice(files.indexOf(file), 1)
    return
  }

  fileList.value = files
}

// 移除文件
const handleFileRemove = (file: UploadFile, files: UploadFile[]) => {
  fileList.value = files
}

// 提交上传
const handleSubmit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.error('请选择要上传的文件')
    return
  }

  uploading.value = true
  uploadComplete.value = false
  uploadProgress.value = 0
  totalCount.value = fileList.value.length
  completedCount.value = 0
  uploadStatus.value = '正在上传文件...'

  try {
    // 获取所有文件
    const files = fileList.value.map(f => f.raw).filter(Boolean) as File[]
    
    // 调用批量上传接口
    const response = await uploadDocumentsToCase(files, {
      case_id: props.caseId,
      uploader_name: formData.uploader_name || undefined
    })

    batchId.value = response.batch_id
    uploadStatus.value = '文件上传成功，正在处理...'
    
    // 开始轮询状态
    startStatusCheck()
  } catch (error) {
    ElMessage.error('上传失败')
    uploading.value = false
  }
}

// 开始检查状态
const startStatusCheck = () => {
  if (!batchId.value) return

  statusCheckTimer = window.setInterval(async () => {
    try {
      const status = await fetchBatchStatus(batchId.value!)
      batchStatus.value = status
      
      // 更新进度
      completedCount.value = status.completed_files
      uploadProgress.value = Math.round((status.completed_files / status.total_files) * 100)
      
      // 更新状态文本
      if (status.processing_files > 0) {
        uploadStatus.value = `正在处理文件 (${status.processing_files} 个处理中)...`
      } else if (status.pending_files > 0) {
        uploadStatus.value = `等待处理 (${status.pending_files} 个待处理)...`
      }
      
      // 检查是否完成
      if (status.completed_files + status.failed_files >= status.total_files) {
        stopStatusCheck()
        uploading.value = false
        uploadComplete.value = true
        
        if (status.failed_files > 0) {
          uploadStatus.value = `上传完成，${status.failed_files} 个文件失败`
          ElMessage.warning(`上传完成，但有 ${status.failed_files} 个文件处理失败`)
        } else {
          uploadStatus.value = '所有文件上传成功！'
          ElMessage.success('所有文件上传成功')
        }
      }
    } catch (error) {
      console.error('获取上传状态失败:', error)
    }
  }, 1000) // 每秒检查一次
}

// 停止检查状态
const stopStatusCheck = () => {
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }
}

// 完成
const handleComplete = () => {
  emit('success')
  dialogVisible.value = false
}

// 取消
const handleCancel = () => {
  if (uploading.value) {
    ElMessage.warning('文件正在上传中，请等待完成')
    return
  }
  dialogVisible.value = false
}

// 重置表单
const resetForm = () => {
  formData.uploader_name = ''
  fileList.value = []
  uploadRef.value?.clearFiles()
  uploading.value = false
  uploadComplete.value = false
  uploadProgress.value = 0
  totalCount.value = 0
  completedCount.value = 0
  uploadStatus.value = '准备上传...'
  batchId.value = undefined
  batchStatus.value = undefined
  stopStatusCheck()
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    resetForm()
  } else {
    stopStatusCheck()
  }
})

watch(dialogVisible, (val) => {
  if (!val) {
    emit('update:visible', false)
    stopStatusCheck()
  }
})
</script>

<style scoped>
.upload-progress {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.progress-count {
  font-weight: 600;
  color: #409eff;
}

.progress-details {
  margin-top: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.detail-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
