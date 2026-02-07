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

            <!-- 成功提取 - 两栏布局 -->
            <div v-if="result.success" class="result-container-split">
              <!-- 左侧：原始文档预览 -->
              <div class="left-panel">
                <div class="panel-header">
                  <h3>原始文档</h3>
                  <div class="header-actions">
                    <el-button size="small" @click="handleDownloadDoc(result)">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                  </div>
                </div>
                <div class="file-preview">
                  <!-- DOCX 预览 -->
                  <div v-if="isDocxFile(result.file_name)" v-loading="loadingPreview[result.doc_id]" class="docx-preview-wrapper">
                    <div :ref="el => setDocxRef(result.doc_id, el)" class="docx-container"></div>
                  </div>
                  <!-- PDF 预览 -->
                  <iframe
                    v-else-if="isPdfFile(result.file_name)"
                    :src="getPreviewUrl(result.doc_id)"
                    frameborder="0"
                    class="preview-iframe"
                  />
                  <!-- 图片预览 -->
                  <div v-else-if="isImageFile(result.file_name)" class="image-preview">
                    <img :src="getPreviewUrl(result.doc_id)" alt="文档预览" />
                  </div>
                  <!-- 不支持预览 -->
                  <div v-else class="no-preview">
                    <el-icon :size="64"><Document /></el-icon>
                    <p>该文件类型不支持在线预览</p>
                    <el-button type="primary" @click="handleDownloadDoc(result)">
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
                    <el-button size="small" type="primary" @click="handleExportSingle(result)">
                      <el-icon><Download /></el-icon>
                      导出要素
                    </el-button>
                  </div>
                </div>
                <div class="extracted-content">
                  <el-scrollbar height="calc(100vh - 280px)">
                    <div class="content-inner">
                      <!-- 基本信息 -->
                      <el-card shadow="never" class="info-card">
                        <template #header>
                          <span class="card-title">基本信息</span>
                        </template>
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
                      </el-card>

                      <!-- 被告人信息 -->
                      <el-card shadow="never" class="info-card">
                        <template #header>
                          <span class="card-title">被告人信息</span>
                        </template>
                        <el-table :data="result.data.被告人信息" border>
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
                            v-for="(crime, idx) in result.data.指控罪名"
                            :key="idx"
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
                          {{ result.data.事实概要 }}
                        </div>
                      </el-card>

                      <!-- 证据列表 -->
                      <el-card shadow="never" class="info-card">
                        <template #header>
                          <span class="card-title">证据列表</span>
                        </template>
                        <ul class="evidence-list">
                          <li v-for="(evidence, idx) in result.data.证据列表" :key="idx">
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
                            v-for="(law, idx) in result.data.法律依据"
                            :key="idx"
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
                          {{ result.data.处理结果 }}
                        </div>
                      </el-card>

                      <!-- 特定字段 -->
                      <el-card shadow="never" class="info-card">
                        <template #header>
                          <span class="card-title">特定字段</span>
                        </template>
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
                      </el-card>
                    </div>
                  </el-scrollbar>
                </div>
              </div>
            </div>

            <!-- 失败提取 -->
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
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleClose, Download, Document } from '@element-plus/icons-vue'
import { batchStructuredExtract, downloadDocument, previewDocument } from '@/api/documents'
import { renderAsync } from 'docx-preview'
import { useUserStore } from '@/store/modules/user'

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
const docxRefs = ref<Record<string, HTMLElement>>({})
const loadingPreview = ref<Record<string, boolean>>({})

const successCount = computed(() => results.value.filter((r) => r.success).length)
const failCount = computed(() => results.value.filter((r) => !r.success).length)

// 设置 docx 容器引用
const setDocxRef = (docId: string, el: any) => {
  if (el) {
    docxRefs.value[docId] = el as HTMLElement
  }
}

// 判断文件类型
const isDocxFile = (fileName: string) => {
  return fileName.toLowerCase().endsWith('.docx')
}

const isPdfFile = (fileName: string) => {
  return fileName.toLowerCase().endsWith('.pdf')
}

const isImageFile = (fileName: string) => {
  const lower = fileName.toLowerCase()
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || 
         lower.endsWith('.png') || lower.endsWith('.tiff')
}

// 获取预览 URL
const getPreviewUrl = (docId: string) => {
  return previewDocument(docId)
}

// 加载 docx 预览
const loadDocxPreview = async (docId: string) => {
  const container = docxRefs.value[docId]
  if (!container) return
  
  loadingPreview.value[docId] = true
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
    container.innerHTML = ''
    
    await renderAsync(blob, container, undefined, {
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
    
    const docxWrapper = container.querySelector('.docx-wrapper') as HTMLElement
    if (docxWrapper) {
      docxWrapper.style.width = '100%'
      docxWrapper.style.maxWidth = '100%'
      docxWrapper.style.padding = '0'
    }
    
    const sections = container.querySelectorAll('section')
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
    loadingPreview.value[docId] = false
  }
}

// 监听 activeTab 变化，加载对应的文档预览
watch(activeTab, async (newTab) => {
  const index = parseInt(newTab)
  const result = results.value[index]
  
  if (result && result.success && isDocxFile(result.file_name)) {
    await nextTick()
    if (docxRefs.value[result.doc_id] && !docxRefs.value[result.doc_id].innerHTML) {
      await loadDocxPreview(result.doc_id)
    }
  }
})

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
    
    // 加载第一个成功结果的预览
    await nextTick()
    const firstSuccess = results.value.find(r => r.success)
    if (firstSuccess && isDocxFile(firstSuccess.file_name)) {
      await loadDocxPreview(firstSuccess.doc_id)
    }
  } catch (error) {
    progressStatus.value = 'exception'
    ElMessage.error('提取失败')
  } finally {
    extracting.value = false
  }
}

const handleDownloadDoc = (result: Api.Documents.ExtractionResult) => {
  const url = downloadDocument(result.doc_id)
  window.open(url, '_blank')
}

const handleExportSingle = (result: Api.Documents.ExtractionResult) => {
  ElMessage.info('导出功能开发中')
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
  docxRefs.value = {}
  loadingPreview.value = {}
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
    // 两栏布局
    .result-container-split {
      display: flex;
      height: calc(100vh - 280px);
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

    .error-content {
      padding: 16px;
    }
  }
}
</style>
