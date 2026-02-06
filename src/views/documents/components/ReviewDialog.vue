<template>
  <el-dialog
    v-model="visible"
    title="文书审查"
    width="95%"
    :close-on-click-modal="false"
    fullscreen
    @close="handleClose"
  >
    <div class="review-container">
      <!-- 审查配置 -->
      <el-card v-if="!reviewResult" shadow="never" class="config-card">
        <el-alert
          title="提示：文书审查可能需要较长时间，请耐心等待"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #default>
            <p>• 审查时间取决于文书数量和复杂度</p>
            <p>• 基于 AI 的智能审查需要一定时间</p>
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
          <h3>审查选项</h3>
          <el-checkbox v-model="includeElements" label="包含要素提取" />
        </div>
      </el-card>

      <!-- 审查结果 - 左右分栏 -->
      <div v-if="reviewResult && currentDoc" class="two-column-layout">
        <!-- 左栏：原始文档 -->
        <div class="column left-column">
          <div class="column-header">
            <h3>{{ currentDoc.file_name }}</h3>
            <div class="header-actions">
              <el-button size="small" @click="handleDownloadDoc(currentDoc)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
          <div class="document-preview">
            <!-- DOCX 预览 -->
            <div v-if="isDocx(currentDoc)" v-loading="isLoadingDoc" class="docx-preview-wrapper">
              <div ref="docPreviewContainer" class="docx-container"></div>
            </div>
            <!-- PDF 预览 -->
            <iframe
              v-else-if="isPdf(currentDoc)"
              :src="getPreviewUrl(currentDoc)"
              frameborder="0"
              class="preview-iframe"
            />
            <!-- 图片预览 -->
            <div v-else-if="isImage(currentDoc)" class="image-preview">
              <img :src="getPreviewUrl(currentDoc)" alt="文档预览" />
            </div>
            <!-- 不支持预览 -->
            <div v-else class="no-preview">
              <el-icon :size="64"><Document /></el-icon>
              <p>该文件类型不支持在线预览</p>
            </div>
          </div>
        </div>

        <!-- 右栏：审查结果 -->
        <div class="column right-column">
          <div class="column-header">
            <h3>审查结果</h3>
            <div class="header-actions">
              <el-select
                v-if="reviewResult.results.length > 1"
                v-model="currentDocIndex"
                size="small"
                style="width: 200px; margin-right: 8px"
                @change="handleDocChange"
              >
                <el-option
                  v-for="(result, index) in reviewResult.results"
                  :key="index"
                  :label="result.file_name"
                  :value="index"
                />
              </el-select>
              <el-button size="small" type="primary" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出报告
              </el-button>
            </div>
          </div>
          <div class="review-results">
            <el-scrollbar height="calc(100vh - 180px)">
              <div class="results-inner">
                <!-- 概览信息 -->
                <el-card shadow="never" class="summary-card">
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <el-statistic title="合规评分" :value="currentDocResult?.compliance_score || 0" suffix="%" />
                    </el-col>
                    <el-col :span="8">
                      <el-statistic title="问题总数" :value="currentDocResult?.total_issues || 0" />
                    </el-col>
                    <el-col :span="8">
                      <el-statistic 
                        title="严重问题" 
                        :value="getSeverityCount('严重')"
                        :value-style="{ color: '#f56c6c' }"
                      />
                    </el-col>
                  </el-row>
                </el-card>

                <!-- 问题列表 -->
                <el-card shadow="never" class="issues-card">
                  <template #header>
                    <div class="card-header-content">
                      <span class="card-title">问题详情</span>
                      <el-radio-group v-model="severityFilter" size="small">
                        <el-radio-button value="all">全部</el-radio-button>
                        <el-radio-button value="严重">严重</el-radio-button>
                        <el-radio-button value="中等">中等</el-radio-button>
                        <el-radio-button value="轻微">轻微</el-radio-button>
                      </el-radio-group>
                    </div>
                  </template>
                  <el-collapse v-model="activeIssues">
                    <el-collapse-item
                      v-for="(issue, index) in filteredIssues"
                      :key="index"
                      :name="index"
                    >
                      <template #title>
                        <div class="issue-title">
                          <el-tag :type="getSeverityType(issue.severity)" size="small">
                            {{ issue.severity }}
                          </el-tag>
                          <span class="issue-category">{{ issue.category }}</span>
                        </div>
                      </template>

                      <div class="issue-content">
                        <div class="issue-section">
                          <h4>问题描述：</h4>
                          <p>{{ issue.description }}</p>
                        </div>

                        <div class="issue-section">
                          <h4>位置：</h4>
                          <div 
                            class="issue-location clickable-text" 
                            @click="highlightInDoc(issue.location)"
                          >
                            {{ issue.location }}
                          </div>
                        </div>

                        <el-divider />

                        <div class="issue-section">
                          <h4>修改建议：</h4>
                          <div class="suggestion-box">
                            {{ issue.suggestion }}
                          </div>
                        </div>

                        <div class="issue-section">
                          <h4>法律依据：</h4>
                          <el-alert type="info" :closable="false">
                            {{ issue.legal_basis }}
                          </el-alert>
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </el-card>

                <!-- 处理建议 -->
                <el-card shadow="never" class="recommendations-card">
                  <template #header>
                    <span class="card-title">处理建议（按优先级排序）</span>
                  </template>
                  <div class="recommendation-list">
                    <div
                      v-for="(rec, index) in (currentDocResult?.recommendations || [])"
                      :key="index"
                      class="recommendation-item"
                      :class="`urgency-${rec.urgency}`"
                    >
                      <div class="rec-header">
                        <el-tag :type="getSeverityType(rec.severity)" size="small">
                          优先级 {{ rec.priority }}
                        </el-tag>
                        <el-tag type="warning" size="small">{{ rec.urgency }}</el-tag>
                      </div>
                      <div class="rec-content">
                        <h4>{{ rec.category }}</h4>
                        <p>{{ rec.recommendation }}</p>
                        <div class="rec-legal">
                          <el-icon><InfoFilled /></el-icon>
                          <span>{{ rec.legal_basis }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="!reviewResult">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="reviewing"
          :disabled="selectedDocs.length === 0"
          @click="handleReview"
        >
          开始审查
        </el-button>
      </div>
      <div v-else>
        <el-button @click="handleReset">重新审查</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Document, InfoFilled } from '@element-plus/icons-vue'
import { batchReviewDocuments, downloadDocument, previewDocument } from '@/api/documents'
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

const includeElements = ref(true)
const reviewing = ref(false)
const reviewResult = ref<Api.Documents.BatchReviewResponse | null>(null)
const currentDocIndex = ref(0)
const activeIssues = ref<number[]>([0])
const severityFilter = ref('all')

// 文档预览相关
const docPreviewContainer = ref<HTMLElement | null>(null)
const isLoadingDoc = ref(false)
const currentHighlightedElement = ref<HTMLElement | null>(null)

// 当前文档
const currentDoc = computed(() => {
  if (!reviewResult.value || !props.selectedDocs.length) return null
  return props.selectedDocs[currentDocIndex.value]
})

// 当前文档审查结果
const currentDocResult = computed(() => {
  if (!reviewResult.value) return null
  return reviewResult.value.results[currentDocIndex.value]
})

// 过滤后的问题
const filteredIssues = computed(() => {
  if (!currentDocResult.value) return []
  if (severityFilter.value === 'all') return currentDocResult.value.issues
  return currentDocResult.value.issues.filter(issue => issue.severity === severityFilter.value)
})

// 统计严重程度数量
const getSeverityCount = (severity: string) => {
  if (!currentDocResult.value) return 0
  return currentDocResult.value.issues.filter(issue => issue.severity === severity).length
}

// 判断文件类型
const isDocx = (doc: Api.Documents.DocumentInfo | null) => {
  if (!doc) return false
  return doc.file_name.toLowerCase().endsWith('.docx')
}

const isPdf = (doc: Api.Documents.DocumentInfo | null) => {
  if (!doc) return false
  return doc.file_name.toLowerCase().endsWith('.pdf')
}

const isImage = (doc: Api.Documents.DocumentInfo | null) => {
  if (!doc) return false
  const fileName = doc.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.tiff')
}

const getPreviewUrl = (doc: Api.Documents.DocumentInfo | null) => {
  if (!doc) return ''
  return previewDocument(doc.doc_id)
}

// 加载 docx 预览
const loadDocxPreview = async (docId: string) => {
  if (!docPreviewContainer.value) return
  
  isLoadingDoc.value = true
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
    docPreviewContainer.value.innerHTML = ''
    
    await renderAsync(blob, docPreviewContainer.value, undefined, {
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
    const docxWrapper = docPreviewContainer.value.querySelector('.docx-wrapper') as HTMLElement
    if (docxWrapper) {
      docxWrapper.style.width = '100%'
      docxWrapper.style.maxWidth = '100%'
      docxWrapper.style.padding = '0'
    }
    
    const sections = docPreviewContainer.value.querySelectorAll('section')
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
    isLoadingDoc.value = false
  }
}

// 在文档中高亮关键词
const highlightInDoc = (keyword: string) => {
  if (!keyword || keyword.length < 2 || !docPreviewContainer.value) return
  
  clearHighlight()
  
  const contentElement = docPreviewContainer.value.querySelector('.docx-preview-content')
  if (!contentElement) return
  
  const found = searchTextInElement(contentElement as HTMLElement, keyword)
  
  if (!found) {
    ElMessage.warning(`未在文档中找到"${keyword}"`)
  }
}

// 搜索并高亮文本
const searchTextInElement = (element: HTMLElement, keyword: string): boolean => {
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
        highlightText(textNode, keyword, index, true)
        
        setTimeout(() => {
          if (currentHighlightedElement.value) {
            currentHighlightedElement.value.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 100)
      } else {
        highlightText(textNode, keyword, index, false)
      }
    }
  }
  
  return found
}

// 高亮文本
const highlightText = (textNode: Text, keyword: string, index: number, isPrimary: boolean = true) => {
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
    currentHighlightedElement.value = highlight
  }
  
  const remainingText = text.substring(index + keyword.length)
  if (remainingText) {
    fragment.appendChild(document.createTextNode(remainingText))
  }
  
  parent.replaceChild(fragment, textNode)
}

// 清除高亮
const clearHighlight = () => {
  if (!docPreviewContainer.value) return
  
  const highlights = docPreviewContainer.value.querySelectorAll('.keyword-highlight')
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode
    if (parent) {
      const textNode = document.createTextNode(highlight.textContent || '')
      parent.replaceChild(textNode, highlight)
      parent.normalize()
    }
  })
  
  currentHighlightedElement.value = null
}

const handleRemoveDoc = (doc: Api.Documents.DocumentInfo) => {
  const index = props.selectedDocs.findIndex((d) => d.doc_id === doc.doc_id)
  if (index > -1) {
    props.selectedDocs.splice(index, 1)
  }
}

const handleReview = async () => {
  if (props.selectedDocs.length === 0) {
    ElMessage.warning('请至少选择1份文书进行审查')
    return
  }

  reviewing.value = true
  try {
    const docIds = props.selectedDocs.map((doc) => doc.doc_id)
    const result = await batchReviewDocuments(docIds, includeElements.value)
    reviewResult.value = result
    currentDocIndex.value = 0
    ElMessage.success('审查完成')
    emit('success')
    
    // 加载文档预览
    await nextTick()
    if (currentDoc.value && isDocx(currentDoc.value) && docPreviewContainer.value) {
      await loadDocxPreview(currentDoc.value.doc_id)
    }
  } catch (error) {
    ElMessage.error('审查失败')
  } finally {
    reviewing.value = false
  }
}

const handleDocChange = async () => {
  activeIssues.value = [0]
  severityFilter.value = 'all'
  
  await nextTick()
  if (currentDoc.value && isDocx(currentDoc.value) && docPreviewContainer.value) {
    await loadDocxPreview(currentDoc.value.doc_id)
  }
}

const handleDownloadDoc = (doc: Api.Documents.DocumentInfo | null) => {
  if (!doc) return
  const url = downloadDocument(doc.doc_id)
  window.open(url, '_blank')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleReset = () => {
  reviewResult.value = null
  currentDocIndex.value = 0
  activeIssues.value = [0]
  severityFilter.value = 'all'
}

const handleClose = () => {
  if (!reviewing.value) {
    handleReset()
    visible.value = false
  }
}

const getSeverityType = (severity: string) => {
  const typeMap: Record<string, any> = {
    严重: 'danger',
    中等: 'warning',
    轻微: 'info'
  }
  return typeMap[severity] || 'info'
}
</script>

<style scoped lang="scss">
.review-container {
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

  // 两栏布局
  .two-column-layout {
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

      &.left-column {
        flex: 0 0 45%;
      }

      &.right-column {
        flex: 0 0 55%;
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
          align-items: center;
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
              width: 100%;
              
              * {
                max-width: 100%;
                box-sizing: border-box;
                overflow-wrap: break-word;
                word-wrap: break-word;
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

      // 审查结果区域
      .review-results {
        flex: 1;
        overflow: hidden;

        .results-inner {
          padding: 16px;

          .summary-card,
          .issues-card,
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

            .card-header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            :deep(.el-card__header) {
              padding: 10px 14px;
              background-color: #fafafa;
            }

            :deep(.el-card__body) {
              padding: 14px;
            }
          }

          .issue-title {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;

            .issue-category {
              font-size: 13px;
              font-weight: 500;
            }
          }

          .issue-content {
            padding: 12px;

            .issue-section {
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

              .issue-location {
                padding: 10px;
                background-color: #f0f9ff;
                border-left: 3px solid #409eff;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                  opacity: 0.8;
                  transform: translateX(2px);
                }
              }

              .suggestion-box {
                padding: 10px;
                background-color: #f4f4f5;
                border-radius: 4px;
                color: #409eff;
                font-size: 13px;
                line-height: 1.6;
              }
            }
          }

          .recommendation-list {
            .recommendation-item {
              padding: 12px;
              margin-bottom: 12px;
              border-radius: 4px;
              border: 1px solid #ebeef5;
              transition: all 0.2s;

              &:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              &.urgency-紧急 {
                border-left: 3px solid #f56c6c;
              }

              &.urgency-重要 {
                border-left: 3px solid #e6a23c;
              }

              .rec-header {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
              }

              .rec-content {
                h4 {
                  margin: 0 0 8px 0;
                  font-size: 14px;
                  font-weight: 600;
                  color: #303133;
                }

                p {
                  margin: 0 0 8px 0;
                  line-height: 1.6;
                  color: #606266;
                  font-size: 13px;
                }

                .rec-legal {
                  display: flex;
                  align-items: flex-start;
                  gap: 6px;
                  padding: 8px;
                  background-color: #f0f9ff;
                  border-radius: 4px;
                  font-size: 12px;
                  color: #409eff;

                  span {
                    flex: 1;
                  }
                }
              }
            }
          }

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
