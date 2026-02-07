<template>
  <el-dialog
    v-model="visible"
    :title="documentInfo?.file_name || '文档预览'"
    width="90%"
    :close-on-click-modal="false"
    fullscreen
  >
    <div v-if="documentInfo" class="preview-container">
      <div class="preview-header">
        <div class="doc-info">
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="案件编号">
              {{ documentInfo.case_id }}
            </el-descriptions-item>
            <el-descriptions-item label="文书类型">
              <el-tag>{{ documentInfo.doc_type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(documentInfo.file_size) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ documentInfo.created_at }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="preview-actions">
          <el-button type="primary" @click="handleDownload">
            <el-icon><Download /></el-icon>
            下载文档
          </el-button>
        </div>
      </div>

      <div class="preview-content">
        <!-- DOCX 预览 -->
        <div v-if="isDocx" v-loading="isLoadingPreview" class="docx-preview-wrapper">
          <div ref="docxPreviewContainer" class="docx-container"></div>
        </div>
        <!-- PDF 预览 -->
        <iframe
          v-else-if="isPdf"
          :src="previewUrl"
          frameborder="0"
          class="preview-iframe"
        />
        <!-- 图片预览 -->
        <div v-else-if="isImage" class="image-preview">
          <img :src="previewUrl" alt="文档预览" />
        </div>
        <!-- 不支持预览 -->
        <div v-else class="no-preview">
          <el-icon :size="64"><Document /></el-icon>
          <p>该文件类型不支持在线预览</p>
          <p class="file-info">文件名: {{ documentInfo.file_name }}</p>
          <el-button type="primary" @click="handleDownload">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Document } from '@element-plus/icons-vue'
import { downloadDocument, previewDocument } from '@/api/documents'
import { renderAsync } from 'docx-preview'
import { useUserStore } from '@/store/modules/user'

interface Props {
  modelValue: boolean
  documentInfo: Api.Documents.DocumentInfo | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (!val) {
      isLoadingPreview.value = false
    }
    emit('update:modelValue', val)
  }
})

const docxPreviewContainer = ref<HTMLElement | null>(null)
const isLoadingPreview = ref(false)

// 文件预览 URL
const previewUrl = computed(() => {
  if (!props.documentInfo) return ''
  return previewDocument(props.documentInfo.doc_id)
})

// 判断文件类型
const isDocx = computed(() => {
  if (!props.documentInfo) return false
  const fileName = props.documentInfo.file_name.toLowerCase()
  return fileName.endsWith('.docx')
})

const isPdf = computed(() => {
  if (!props.documentInfo) return false
  const fileName = props.documentInfo.file_name.toLowerCase()
  return fileName.endsWith('.pdf')
})

const isImage = computed(() => {
  if (!props.documentInfo) return false
  const fileName = props.documentInfo.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.tiff')
})

// 监听对话框打开，加载文档预览
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.documentInfo) {
    if (isDocx.value) {
      await nextTick()
      await loadDocxPreview(props.documentInfo.doc_id)
    }
  }
})

// 加载 docx 预览
const loadDocxPreview = async (docId: string) => {
  if (!docxPreviewContainer.value) return
  
  isLoadingPreview.value = true
  try {
    const { VITE_DOCUMENT_API_URL } = import.meta.env
    const userStore = useUserStore()
    
    const response = await fetch(`${VITE_DOCUMENT_API_URL}/api/documents/${docId}/download`, {
      headers: {
        'Authorization': userStore.accessToken || ''
      }
    })
    
    if (!response.ok) {
      throw new Error('文档加载失败')
    }
    
    const blob = await response.blob()
    docxPreviewContainer.value.innerHTML = ''
    
    await renderAsync(blob, docxPreviewContainer.value, undefined, {
      className: 'docx-preview-content',
      inWrapper: true,
      ignoreWidth: true,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
    
    // 调整宽度
    const docxWrapper = docxPreviewContainer.value.querySelector('.docx-wrapper') as HTMLElement
    if (docxWrapper) {
      docxWrapper.style.width = '100%'
      docxWrapper.style.maxWidth = '100%'
      docxWrapper.style.padding = '0'
    }
    
    const sections = docxPreviewContainer.value.querySelectorAll('section')
    sections.forEach((section: Element) => {
      const sectionEl = section as HTMLElement
      sectionEl.style.width = '100%'
      sectionEl.style.maxWidth = '100%'
      sectionEl.style.padding = '30px 20px'
      sectionEl.style.boxSizing = 'border-box'
    })
  } catch (error) {
    console.error('加载 docx 预览失败:', error)
    ElMessage.error('文档预览加载失败')
  } finally {
    isLoadingPreview.value = false
  }
}

// 下载文档
const handleDownload = () => {
  if (!props.documentInfo) return
  const url = downloadDocument(props.documentInfo.doc_id)
  window.open(url, '_blank')
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>

<style scoped lang="scss">
.preview-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);

  .preview-header {
    padding: 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    .doc-info {
      margin-bottom: 12px;
    }

    .preview-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .preview-content {
    flex: 1;
    overflow: hidden;
    background-color: #f5f7fa;

    .preview-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    // DOCX 预览样式
    .docx-preview-wrapper {
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: #525659;
      padding: 20px 10px;

      .docx-container {
        max-width: 900px;
        margin: 0 auto;
        background-color: white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        min-height: 100%;
        overflow: hidden;

        :deep(.docx-wrapper) {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          
          section {
            width: 100% !important;
            max-width: 100% !important;
            padding: 30px 20px !important;
            box-sizing: border-box !important;
          }
        }

        :deep(.docx-preview-content) {
          padding: 30px 20px;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          width: 100%;
          
          p {
            margin: 0 0 12px 0;
            line-height: 1.8;
            text-align: justify;
            overflow-wrap: break-word;
            word-wrap: break-word;
            width: 100%;
          }

          h1, h2, h3, h4, h5, h6 {
            margin: 16px 0 12px 0;
            font-weight: bold;
            overflow-wrap: break-word;
            word-wrap: break-word;
            width: 100%;
          }

          table {
            border-collapse: collapse;
            width: 100% !important;
            margin: 12px 0;
            table-layout: fixed;
            display: table;

            td, th {
              border: 1px solid #ddd;
              padding: 8px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
          }

          ul, ol {
            margin: 12px 0;
            padding-left: 30px;
            width: 100%;
            
            li {
              overflow-wrap: break-word;
              word-wrap: break-word;
            }
          }

          * {
            max-width: 100%;
            box-sizing: border-box;
          }
        }
      }
    }

    .image-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      padding: 16px;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .no-preview {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      p {
        margin: 16px 0;
        font-size: 14px;
      }

      .file-info {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
