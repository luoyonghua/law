<template>
  <el-dialog
    v-model="visible"
    title="文书比对"
    width="95%"
    :close-on-click-modal="false"
    fullscreen
    @close="handleClose"
  >
    <div class="compare-container">
      <!-- 比对配置 -->
      <el-card v-if="!compareResult" shadow="never" class="config-card">
        <el-alert
          title="提示：文书比对可能需要较长时间，请耐心等待"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #default>
            <p>• 比对时间取决于文书数量和复杂度</p>
            <p>• 基于 AI 的智能比对需要一定时间</p>
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

        <el-divider />

        <div class="config-section">
          <h3>比对类型</h3>
          <el-radio-group v-model="comparisonType">
            <el-radio value="custom">自定义比对</el-radio>
            <el-radio value="preset1">预设组合1</el-radio>
            <el-radio value="preset2">预设组合2</el-radio>
          </el-radio-group>
        </div>
      </el-card>

      <!-- 三栏布局：左中显示原始文档，右侧显示对比结果 -->
      <div v-if="compareResult" class="three-column-layout">
        <!-- 左栏：文档A -->
        <div class="column left-column">
          <div class="column-header">
            <h3>{{ selectedDocs[0]?.file_name || '文档A' }}</h3>
            <div class="header-actions">
              <el-button size="small" @click="handleDownloadDoc(selectedDocs[0])">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
          <div class="document-preview">
            <!-- DOCX 预览 -->
            <div v-if="isDocx(selectedDocs[0])" v-loading="isLoadingDocA" class="docx-preview-wrapper">
              <div ref="docAPreviewContainer" class="docx-container"></div>
            </div>
            <!-- PDF 预览 -->
            <iframe
              v-else-if="isPdf(selectedDocs[0])"
              :src="getPreviewUrl(selectedDocs[0])"
              frameborder="0"
              class="preview-iframe"
            />
            <!-- 图片预览 -->
            <div v-else-if="isImage(selectedDocs[0])" class="image-preview">
              <img :src="getPreviewUrl(selectedDocs[0])" alt="文档预览" />
            </div>
            <!-- 不支持预览 -->
            <div v-else class="no-preview">
              <el-icon :size="64"><Document /></el-icon>
              <p>该文件类型不支持在线预览</p>
            </div>
          </div>
        </div>

        <!-- 中栏：文档B -->
        <div class="column middle-column">
          <div class="column-header">
            <h3>{{ selectedDocs[1]?.file_name || '文档B' }}</h3>
            <div class="header-actions">
              <el-button size="small" @click="handleDownloadDoc(selectedDocs[1])">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
          <div class="document-preview">
            <!-- DOCX 预览 -->
            <div v-if="isDocx(selectedDocs[1])" v-loading="isLoadingDocB" class="docx-preview-wrapper">
              <div ref="docBPreviewContainer" class="docx-container"></div>
            </div>
            <!-- PDF 预览 -->
            <iframe
              v-else-if="isPdf(selectedDocs[1])"
              :src="getPreviewUrl(selectedDocs[1])"
              frameborder="0"
              class="preview-iframe"
            />
            <!-- 图片预览 -->
            <div v-else-if="isImage(selectedDocs[1])" class="image-preview">
              <img :src="getPreviewUrl(selectedDocs[1])" alt="文档预览" />
            </div>
            <!-- 不支持预览 -->
            <div v-else class="no-preview">
              <el-icon :size="64"><Document /></el-icon>
              <p>该文件类型不支持在线预览</p>
            </div>
          </div>
        </div>

        <!-- 右栏：对比结果 -->
        <div class="column right-column">
          <div class="column-header">
            <h3>对比结果</h3>
            <div class="header-actions">
              <el-button size="small" type="primary" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出报告
              </el-button>
            </div>
          </div>
          <div class="comparison-results">
            <el-scrollbar height="calc(100vh - 180px)">
              <div class="results-inner">
                <!-- 概览信息 -->
                <el-card shadow="never" class="summary-card">
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-statistic title="相似度" :value="compareResult.match_rate * 100" suffix="%" />
                    </el-col>
                    <el-col :span="12">
                      <el-statistic title="差异项" :value="compareResult.differences.length" />
                    </el-col>
                    <el-col :span="12">
                      <el-statistic
                        title="高危差异"
                        :value="compareResult.detailed_result.summary.high_severity_count"
                      />
                    </el-col>
                    <el-col :span="12">
                      <el-statistic
                        title="中危差异"
                        :value="compareResult.detailed_result.summary.medium_severity_count"
                      />
                    </el-col>
                  </el-row>
                </el-card>

                <!-- 总结 -->
                <el-card shadow="never" class="summary-text-card">
                  <template #header>
                    <span class="card-title">比对总结</span>
                  </template>
                  <el-alert
                    :title="compareResult.detailed_result.summary.overall_consistency"
                    :type="getSummaryType(compareResult.detailed_result.summary.overall_consistency)"
                    :closable="false"
                  >
                    <p>{{ compareResult.detailed_result.summary.conclusion }}</p>
                  </el-alert>
                </el-card>

                <!-- 主要风险 -->
                <el-card shadow="never" class="risks-card">
                  <template #header>
                    <span class="card-title">主要风险</span>
                  </template>
                  <ul class="risk-list">
                    <li
                      v-for="(risk, index) in compareResult.detailed_result.summary.main_risks"
                      :key="index"
                    >
                      <el-icon color="#f56c6c"><Warning /></el-icon>
                      {{ risk }}
                    </li>
                  </ul>
                </el-card>

                <!-- 差异详情 -->
                <el-card shadow="never" class="differences-card">
                  <template #header>
                    <span class="card-title">差异详情</span>
                  </template>
                  <el-collapse v-model="activeDifferences">
                    <el-collapse-item
                      v-for="(diff, index) in compareResult.detailed_result.fact_differences"
                      :key="index"
                      :name="index"
                    >
                      <template #title>
                        <div class="diff-title">
                          <el-tag :type="getSeverityType(diff.severity)" size="small">
                            {{ diff.severity }}
                          </el-tag>
                          <span class="diff-category">{{ diff.category }}</span>
                        </div>
                      </template>

                      <div class="diff-content">
                        <div class="diff-section">
                          <h4>文档A内容：</h4>
                          <div class="diff-text doc-a clickable-text" @click="highlightInDoc('A', diff.text_in_doc_A)">
                            {{ diff.text_in_doc_A }}
                          </div>
                        </div>

                        <div class="diff-section">
                          <h4>文档B内容：</h4>
                          <div class="diff-text doc-b clickable-text" @click="highlightInDoc('B', diff.text_in_doc_B)">
                            {{ diff.text_in_doc_B }}
                          </div>
                        </div>

                        <el-divider />

                        <div class="diff-section">
                          <h4>差异分析：</h4>
                          <p>{{ diff.analysis }}</p>
                        </div>

                        <div class="diff-section">
                          <h4>可能原因：</h4>
                          <p>{{ diff.possible_reason }}</p>
                        </div>

                        <div class="diff-section">
                          <h4>风险评估：</h4>
                          <el-alert :type="getSeverityType(diff.severity)" :closable="false">
                            {{ diff.risk_assessment }}
                          </el-alert>
                        </div>

                        <div class="diff-section">
                          <h4>处理建议：</h4>
                          <p class="suggestion">{{ diff.suggestion }}</p>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </el-card>

                <!-- 处理建议 -->
                <el-card shadow="never" class="recommendations-card">
                  <template #header>
                    <span class="card-title">处理建议</span>
                  </template>
                  <ol class="recommendation-list">
                    <li
                      v-for="(rec, index) in compareResult.detailed_result.summary.recommendations"
                      :key="index"
                    >
                      {{ rec }}
                    </li>
                  </ol>
                </el-card>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Download, Document } from '@element-plus/icons-vue'
import { downloadDocument, previewDocument } from '@/api/documents'
import { renderAsync } from 'docx-preview'
import { useUserStore } from '@/store/modules/user'

interface Props {
  modelValue: boolean
  selectedDocs: Api.Documents.DocumentInfo[]
  compareResult: Api.Documents.ComparisonResponse | null
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

const comparisonType = ref('custom')
const activeDifferences = ref<number[]>([0])

// 文档预览相关
const docAPreviewContainer = ref<HTMLElement | null>(null)
const docBPreviewContainer = ref<HTMLElement | null>(null)
const isLoadingDocA = ref(false)
const isLoadingDocB = ref(false)
const currentHighlightedElementA = ref<HTMLElement | null>(null)
const currentHighlightedElementB = ref<HTMLElement | null>(null)

// 判断文件类型
const isDocx = (doc: Api.Documents.DocumentInfo | undefined) => {
  if (!doc) return false
  return doc.file_name.toLowerCase().endsWith('.docx')
}

const isPdf = (doc: Api.Documents.DocumentInfo | undefined) => {
  if (!doc) return false
  return doc.file_name.toLowerCase().endsWith('.pdf')
}

const isImage = (doc: Api.Documents.DocumentInfo | undefined) => {
  if (!doc) return false
  const fileName = doc.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.tiff')
}

const getPreviewUrl = (doc: Api.Documents.DocumentInfo | undefined) => {
  if (!doc) return ''
  return previewDocument(doc.doc_id)
}

// 加载 docx 预览
const loadDocxPreview = async (docId: string, container: HTMLElement, isDocA: boolean) => {
  const loadingRef = isDocA ? isLoadingDocA : isLoadingDocB
  loadingRef.value = true
  
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
      ignoreWidth: true,  // 忽略原始宽度，适应容器
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
    
    // 渲染完成后，强制调整内容宽度
    const docxWrapper = container.querySelector('.docx-wrapper') as HTMLElement
    if (docxWrapper) {
      docxWrapper.style.width = '100%'
      docxWrapper.style.maxWidth = '100%'
      docxWrapper.style.padding = '0'
    }
    
    // 调整所有 section 的宽度
    const sections = container.querySelectorAll('section')
    sections.forEach((section: Element) => {
      const sectionEl = section as HTMLElement
      sectionEl.style.width = '100%'
      sectionEl.style.maxWidth = '100%'
      sectionEl.style.padding = '20px 15px'
      sectionEl.style.boxSizing = 'border-box'
    })
  } catch (error) {
    console.error('加载 docx 预览失败:', error)
    ElMessage.error('文档预览加载失败')
  } finally {
    loadingRef.value = false
  }
}

// 在文档中高亮关键词
const highlightInDoc = (docType: 'A' | 'B', keyword: string) => {
  if (!keyword || keyword.length < 2) return
  
  const container = docType === 'A' ? docAPreviewContainer.value : docBPreviewContainer.value
  const currentHighlight = docType === 'A' ? currentHighlightedElementA : currentHighlightedElementB
  
  if (!container) return
  
  // 清除之前的高亮
  clearHighlight(docType)
  
  const contentElement = container.querySelector('.docx-preview-content')
  if (!contentElement) return
  
  const found = searchTextInElement(contentElement as HTMLElement, keyword, currentHighlight)
  
  if (!found) {
    ElMessage.warning(`未在文档${docType}中找到"${keyword}"`)
  }
}

// 搜索并高亮文本
const searchTextInElement = (element: HTMLElement, keyword: string, highlightRef: any): boolean => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  
  let found = false
  const textNodes: Text[] = []
  
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }
  
  for (const textNode of textNodes) {
    const text = textNode.textContent || ''
    const index = text.indexOf(keyword)
    
    if (index !== -1) {
      if (!found) {
        found = true
        highlightText(textNode, keyword, index, highlightRef, true)
        
        setTimeout(() => {
          if (highlightRef.value) {
            highlightRef.value.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 100)
      } else {
        highlightText(textNode, keyword, index, highlightRef, false)
      }
    }
  }
  
  return found
}

// 高亮文本
const highlightText = (textNode: Text, keyword: string, index: number, highlightRef: any, isPrimary: boolean = true) => {
  const text = textNode.textContent || ''
  const parent = textNode.parentNode
  if (!parent) return
  
  const fragment = document.createDocumentFragment()
  
  if (index > 0) {
    fragment.appendChild(document.createTextNode(text.substring(0, index)))
  }
  
  const highlight = document.createElement('span')
  highlight.className = isPrimary ? 'keyword-highlight primary' : 'keyword-highlight'
  highlight.textContent = keyword
  highlight.style.cssText = isPrimary 
    ? 'background-color: #ff0; padding: 2px 4px; border-radius: 2px; font-weight: bold; box-shadow: 0 0 8px rgba(255, 255, 0, 0.6);'
    : 'background-color: #ffeb3b; padding: 2px 4px; border-radius: 2px;'
  
  fragment.appendChild(highlight)
  
  if (isPrimary) {
    highlightRef.value = highlight
  }
  
  const remainingText = text.substring(index + keyword.length)
  if (remainingText) {
    fragment.appendChild(document.createTextNode(remainingText))
  }
  
  parent.replaceChild(fragment, textNode)
}

// 清除高亮
const clearHighlight = (docType: 'A' | 'B') => {
  const container = docType === 'A' ? docAPreviewContainer.value : docBPreviewContainer.value
  const highlightRef = docType === 'A' ? currentHighlightedElementA : currentHighlightedElementB
  
  if (!container) return
  
  const highlights = container.querySelectorAll('.keyword-highlight')
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode
    if (parent) {
      const textNode = document.createTextNode(highlight.textContent || '')
      parent.replaceChild(textNode, highlight)
      parent.normalize()
    }
  })
  
  highlightRef.value = null
}

// 监听对话框打开，加载文档预览
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.compareResult) {
    await nextTick()
    if (isDocx(props.selectedDocs[0]) && docAPreviewContainer.value) {
      await loadDocxPreview(props.selectedDocs[0].doc_id, docAPreviewContainer.value, true)
    }
    if (isDocx(props.selectedDocs[1]) && docBPreviewContainer.value) {
      await loadDocxPreview(props.selectedDocs[1].doc_id, docBPreviewContainer.value, false)
    }
  }
})

const handleRemoveDoc = (doc: Api.Documents.DocumentInfo) => {
  const index = props.selectedDocs.findIndex((d) => d.doc_id === doc.doc_id)
  if (index > -1) {
    props.selectedDocs.splice(index, 1)
  }
}

const handleDownloadDoc = (doc: Api.Documents.DocumentInfo | undefined) => {
  if (!doc) return
  const url = downloadDocument(doc.doc_id)
  window.open(url, '_blank')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleReset = () => {
  activeDifferences.value = [0]
}

const handleClose = () => {
  handleReset()
  visible.value = false
}

const getSeverityType = (severity: string) => {
  const typeMap: Record<string, any> = {
    高: 'danger',
    中: 'warning',
    低: 'info'
  }
  return typeMap[severity] || 'info'
}

const getSummaryType = (consistency: string) => {
  if (consistency.includes('严重')) return 'error'
  if (consistency.includes('不一致')) return 'warning'
  return 'success'
}
</script>

<style scoped lang="scss">
.compare-container {
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

  // 三栏布局
  .three-column-layout {
    display: flex;
    height: calc(100vh - 180px);
    gap: 1px;
    background-color: #e4e7ed;

    .column {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: white;
      overflow: hidden;

      &.left-column,
      &.middle-column {
        flex: 0 0 33%;
      }

      &.right-column {
        flex: 0 0 34%;
      }

      .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: #f5f7fa;
        border-bottom: 1px solid #ebeef5;

        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }
      }

      // 文档预览区域
      .document-preview {
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
          padding: 15px 8px;

          .docx-container {
            max-width: 100%;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            min-height: 100%;
            overflow: hidden;

            // docx-preview 生成的包装器
            :deep(.docx-wrapper) {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              
              section {
                width: 100% !important;
                max-width: 100% !important;
                padding: 20px 15px !important;
                box-sizing: border-box !important;
              }
            }

            :deep(.docx-preview-content) {
              padding: 20px 15px;
              box-sizing: border-box;
              overflow-wrap: break-word;
              word-wrap: break-word;
              word-break: break-word;
              width: 100%;
              
              p {
                margin: 0 0 10px 0;
                line-height: 1.6;
                text-align: justify;
                font-size: 12px;
                overflow-wrap: break-word;
                word-wrap: break-word;
                width: 100%;
              }

              h1, h2, h3, h4, h5, h6 {
                margin: 14px 0 10px 0;
                font-weight: bold;
                font-size: 14px;
                overflow-wrap: break-word;
                word-wrap: break-word;
                width: 100%;
              }

              table {
                border-collapse: collapse;
                width: 100% !important;
                margin: 10px 0;
                font-size: 11px;
                table-layout: fixed;
                display: table;

                td, th {
                  border: 1px solid #ddd;
                  padding: 4px 6px;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
              }

              ul, ol {
                margin: 10px 0;
                padding-left: 25px;
                font-size: 12px;
                width: 100%;
                
                li {
                  overflow-wrap: break-word;
                  word-wrap: break-word;
                  margin-bottom: 6px;
                }
              }

              // 确保所有内容不超出容器
              * {
                max-width: 100%;
                box-sizing: border-box;
              }

              // 图片自适应
              img {
                max-width: 100%;
                height: auto;
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

      // 对比结果区域
      .comparison-results {
        flex: 1;
        overflow: hidden;

        .results-inner {
          padding: 16px;

          .summary-card,
          .summary-text-card,
          .risks-card,
          .differences-card,
          .recommendations-card {
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .card-title {
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }

            :deep(.el-card__header) {
              padding: 10px 14px;
              background-color: #fafafa;
            }

            :deep(.el-card__body) {
              padding: 14px;
            }
          }

          .risk-list,
          .recommendation-list {
            padding-left: 20px;
            line-height: 1.8;
            margin: 0;

            li {
              margin-bottom: 10px;
              display: flex;
              align-items: flex-start;
              gap: 8px;
              font-size: 13px;
            }
          }

          .diff-title {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;

            .diff-category {
              font-size: 13px;
              font-weight: 500;
            }
          }

          .diff-content {
            padding: 12px;

            .diff-section {
              margin-bottom: 12px;

              h4 {
                margin-bottom: 6px;
                font-size: 13px;
                font-weight: 600;
                color: #303133;
              }

              p {
                line-height: 1.6;
                color: #606266;
                font-size: 13px;
              }

              .diff-text {
                padding: 10px;
                border-radius: 4px;
                line-height: 1.6;
                white-space: pre-wrap;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;

                &.doc-a {
                  background-color: #fef0f0;
                  border-left: 3px solid #f56c6c;
                }

                &.doc-b {
                  background-color: #f0f9ff;
                  border-left: 3px solid #409eff;
                }

                &:hover {
                  opacity: 0.8;
                  transform: translateX(2px);
                }
              }

              .suggestion {
                padding: 10px;
                background-color: #f4f4f5;
                border-radius: 4px;
                color: #409eff;
                font-size: 13px;
              }
            }
          }

          // 可点击文本样式
          .clickable-text {
            cursor: pointer;
            transition: all 0.2s;
            
            &:hover {
              color: #409eff;
            }
          }
        }
      }
    }
  }
}
</style>
