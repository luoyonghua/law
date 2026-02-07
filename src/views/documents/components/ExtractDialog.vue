<template>
  <el-dialog
    v-model="visible"
    title="结构化提取结果"
    width="95%"
    :close-on-click-modal="false"
    fullscreen
  >
    <div v-if="extractData" class="extract-container-split">
      <!-- 左侧：原始文档预览 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>原始文档</h3>
          <div class="header-actions">
            <el-button size="small" @click="handleDownload">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
        <div class="file-preview">
          <!-- 调试信息 -->
          <div v-if="false" style="padding: 10px; background: #fff; border: 1px solid #ccc; margin: 10px;">
            <p>Debug Info:</p>
            <p>extractData: {{ extractData ? 'exists' : 'null' }}</p>
            <p>file_name: {{ extractData?.file_name }}</p>
            <p>doc_id: {{ extractData?.doc_id }}</p>
            <p>isDocx: {{ isDocx }}</p>
            <p>isPdf: {{ isPdf }}</p>
            <p>isImage: {{ isImage }}</p>
            <p>previewUrl: {{ previewUrl }}</p>
          </div>
          
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
            <p style="font-size: 12px; color: #999;">文件名: {{ extractData?.file_name }}</p>
            <el-button type="primary" @click="handleDownload">
              <el-icon><Download /></el-icon>
              下载文件
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：提取的结构化要素 -->
      <div class="right-panel">
        <div class="panel-header">
          <h3>提取要素</h3>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出要素
            </el-button>
          </div>
        </div>
        <div class="extracted-content">
          <el-scrollbar height="calc(100vh - 180px)">
            <div class="content-inner">
              <!-- 基本信息 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">基本信息</span>
                </template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="案号">
                    {{ extractData.data.案号 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="案件名称">
                    {{ extractData.data.案件名称 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="文书类型">
                    <el-tag>{{ extractData.data.文书类型 }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="处理时间">
                    {{ extractData.processing_time.toFixed(2) }}秒
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>

              <!-- 被告人信息 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">被告人信息</span>
                </template>
                <el-table :data="extractData.data.被告人信息" border>
                  <el-table-column prop="姓名" label="姓名" width="100" />
                  <el-table-column prop="性别" label="性别" width="80" />
                  <el-table-column prop="出生日期" label="出生日期" width="150" />
                  <el-table-column prop="身份证号" label="身份证号" width="180" />
                  <el-table-column prop="住址" label="住址" show-overflow-tooltip />
                </el-table>
              </el-card>

              <!-- 指控罪名 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">指控罪名</span>
                </template>
                <div class="tag-list">
                  <el-tag
                    v-for="(crime, index) in extractData.data.指控罪名"
                    :key="index"
                    type="danger"
                    size="large"
                  >
                    {{ crime }}
                  </el-tag>
                </div>
              </el-card>

              <!-- 事实概要 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">事实概要</span>
                </template>
                <div class="content-box">
                  {{ extractData.data.事实概要 }}
                </div>
              </el-card>

              <!-- 证据列表 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">证据列表</span>
                </template>
                <ul class="evidence-list">
                  <li v-for="(evidence, index) in extractData.data.证据列表" :key="index">
                    {{ evidence }}
                  </li>
                </ul>
              </el-card>

              <!-- 法律依据 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">法律依据</span>
                </template>
                <div class="tag-list">
                  <el-tag
                    v-for="(law, index) in extractData.data.法律依据"
                    :key="index"
                    type="warning"
                  >
                    {{ law }}
                  </el-tag>
                </div>
              </el-card>

              <!-- 处理结果 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">处理结果</span>
                </template>
                <div class="content-box result">
                  {{ extractData.data.处理结果 }}
                </div>
              </el-card>

              <!-- 特定字段 -->
              <el-card shadow="never" class="info-card">
                <template #header>
                  <span class="card-title">特定字段</span>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item
                    v-for="(value, key) in extractData.data.特定字段"
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
              </el-card>
            </div>
          </el-scrollbar>
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
  extractData: Api.Documents.ExtractionResult | null
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
      // 关闭时清理预览
      isLoadingPreview.value = false
    }
    emit('update:modelValue', val)
  }
})

const docxPreviewContainer = ref<HTMLElement | null>(null)
const isLoadingPreview = ref(false)
const currentHighlightedElement = ref<HTMLElement | null>(null)

// 文件预览
const previewUrl = computed(() => {
  if (!props.extractData) return ''
  return previewDocument(props.extractData.doc_id)
})

// 判断文件类型
const isDocx = computed(() => {
  if (!props.extractData || !props.extractData.file_name) {
    console.warn('No extractData or file_name available')
    return false
  }
  const fileName = props.extractData.file_name.toLowerCase()
  const result = fileName.endsWith('.docx')
  console.log('isDocx check:', fileName, result)
  return result
})

const isPdf = computed(() => {
  if (!props.extractData || !props.extractData.file_name) return false
  const fileName = props.extractData.file_name.toLowerCase()
  const result = fileName.endsWith('.pdf')
  console.log('isPdf check:', fileName, result)
  return result
})

const isImage = computed(() => {
  if (!props.extractData || !props.extractData.file_name) return false
  const fileName = props.extractData.file_name.toLowerCase()
  const result = fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.tiff')
  console.log('isImage check:', fileName, result)
  return result
})

// 监听对话框打开，加载文档预览
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.extractData) {
    console.log('ExtractDialog opened with data:', props.extractData)
    console.log('File type - isDocx:', isDocx.value, 'isPdf:', isPdf.value, 'isImage:', isImage.value)
    
    if (isDocx.value) {
      await nextTick()
      await loadDocxPreview(props.extractData.doc_id)
    }
  }
})

// 加载 docx 预览
const loadDocxPreview = async (docId: string) => {
  if (!docxPreviewContainer.value) {
    console.error('DOCX preview container not found')
    return
  }
  
  console.log('Loading DOCX preview for doc_id:', docId)
  isLoadingPreview.value = true
  
  try {
    const { VITE_DOCUMENT_API_URL } = import.meta.env
    const userStore = useUserStore()
    
    const url = `${VITE_DOCUMENT_API_URL}/api/documents/${docId}/download`
    console.log('Fetching document from:', url)
    
    // 获取文档 blob
    const response = await fetch(url, {
      headers: {
        'Authorization': userStore.accessToken || ''
      }
    })
    
    if (!response.ok) {
      throw new Error(`文档加载失败: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    console.log('Document blob loaded, size:', blob.size)
    
    // 清空容器
    docxPreviewContainer.value.innerHTML = ''
    
    // 渲染 docx
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
    
    console.log('DOCX rendered successfully')
    
    // 渲染完成后，强制调整内容宽度
    const docxWrapper = docxPreviewContainer.value.querySelector('.docx-wrapper') as HTMLElement
    if (docxWrapper) {
      docxWrapper.style.width = '100%'
      docxWrapper.style.maxWidth = '100%'
      docxWrapper.style.padding = '0'
    }
    
    // 调整所有 section 的宽度
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

const handleDownload = () => {
  if (!props.extractData) return
  const url = downloadDocument(props.extractData.doc_id)
  window.open(url, '_blank')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}
</script>

<style scoped lang="scss">
.extract-container-split {
  display: flex;
  height: calc(100vh - 120px);
  gap: 16px;

  .left-panel,
  .right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
  }

  .left-panel {
    flex: 0 0 50%;
  }

  .right-panel {
    flex: 0 0 50%;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  // 文件预览区域
  .file-preview {
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
        max-width: 100%;
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
    }
  }

  // 提取内容区域
  .extracted-content {
    flex: 1;
    overflow: hidden;

    .content-inner {
      padding: 16px;

      .info-card {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        :deep(.el-card__header) {
          padding: 12px 16px;
          background-color: #fafafa;
        }

        :deep(.el-card__body) {
          padding: 16px;
        }
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
        white-space: pre-wrap;

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
        margin: 0;

        li {
          margin-bottom: 8px;
        }
      }

      .empty-text {
        color: #909399;
        font-style: italic;
      }
    }
  }
}
</style>
