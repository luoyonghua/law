<template>
  <div class="extraction-history-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>提取历史记录</span>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="文件名">
          <el-input
            v-model="searchForm.fileName"
            placeholder="请输入文件名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="案件编号">
          <el-input
            v-model="searchForm.caseId"
            placeholder="请输入案件编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="文书类型">
          <el-select v-model="searchForm.docType" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="起诉书" value="起诉书" />
            <el-option label="判决书" value="判决书" />
            <el-option label="审查报告" value="审查报告" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 历史记录列表 -->
      <el-table v-loading="loading" :data="filteredRecords" stripe>
        <el-table-column prop="file_name" label="文件名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="case_id" label="案件编号" width="180" />
        <el-table-column prop="doc_type" label="文书类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.doc_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="extraction_method" label="提取方法" width="150">
          <template #default="{ row }">
            <el-tag type="success">{{ formatMethod(row.extraction_method) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="processing_time" label="处理时间" width="120">
          <template #default="{ row }">
            {{ row.processing_time.toFixed(2) }}秒
          </template>
        </el-table-column>
        <el-table-column prop="is_verified" label="验证状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_verified ? 'success' : 'info'">
              {{ row.is_verified ? '已验证' : '未验证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button link type="success" size="small" @click="handleExport(row)">
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="提取详情"
      width="95%"
      :close-on-click-modal="false"
      fullscreen
    >
      <div v-if="currentRecord" class="detail-container-split">
        <!-- 左侧：原始文件预览 -->
        <div class="left-panel">
          <div class="panel-header">
            <h3>原始文件</h3>
            <div class="header-actions">
              <el-button size="small" @click="handleDownload">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button size="small" @click="handleOpenNewTab">
                <el-icon><FullScreen /></el-icon>
                新窗口打开
              </el-button>
            </div>
          </div>
          <div class="file-preview">
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
              <el-button size="small" type="primary" @click="handleExport(currentRecord!)">
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
                    <el-descriptions-item label="记录ID">
                      {{ currentRecord.record_id }}
                    </el-descriptions-item>
                    <el-descriptions-item label="文件名">
                      <span class="clickable-text" @click="handleElementClick(currentRecord.file_name)">
                        {{ currentRecord.file_name }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="案件编号">
                      <span class="clickable-text" @click="handleElementClick(currentRecord.case_id)">
                        {{ currentRecord.case_id }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="文书类型">
                      <el-tag>{{ currentRecord.doc_type }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="提取方法">
                      <el-tag type="success">{{ formatMethod(currentRecord.extraction_method) }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="处理时间">
                      {{ currentRecord.processing_time.toFixed(2) }}秒
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                      {{ currentRecord.created_at }}
                    </el-descriptions-item>
                    <el-descriptions-item label="验证状态">
                      <el-tag :type="currentRecord.is_verified ? 'success' : 'info'">
                        {{ currentRecord.is_verified ? '已验证' : '未验证' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>

                <!-- 案件信息 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">案件信息</span>
                  </template>
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="案号">
                      <span class="clickable-text" @click="handleElementClick(currentRecord.structured_data.案号)">
                        {{ currentRecord.structured_data.案号 }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="案件名称">
                      <span class="clickable-text" @click="handleElementClick(currentRecord.structured_data.案件名称)">
                        {{ currentRecord.structured_data.案件名称 }}
                      </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="文书类型" :span="2">
                      <el-tag>{{ currentRecord.structured_data.文书类型 }}</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </el-card>

                <!-- 被告人信息 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">被告人信息</span>
                  </template>
                  <el-table :data="currentRecord.structured_data.被告人信息" border>
                    <el-table-column prop="姓名" label="姓名" width="100">
                      <template #default="{ row }">
                        <span class="clickable-text" @click="handleElementClick(row.姓名)">
                          {{ row.姓名 }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="性别" label="性别" width="80" />
                    <el-table-column prop="出生日期" label="出生日期" width="150">
                      <template #default="{ row }">
                        <span class="clickable-text" @click="handleElementClick(row.出生日期)">
                          {{ row.出生日期 }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="身份证号" label="身份证号" width="180">
                      <template #default="{ row }">
                        <span class="clickable-text" @click="handleElementClick(row.身份证号)">
                          {{ row.身份证号 }}
                        </span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="住址" label="住址" show-overflow-tooltip>
                      <template #default="{ row }">
                        <span class="clickable-text" @click="handleElementClick(row.住址)">
                          {{ row.住址 }}
                        </span>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>

                <!-- 指控罪名 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">指控罪名</span>
                  </template>
                  <div class="tag-list">
                    <el-tag
                      v-for="(crime, index) in currentRecord.structured_data.指控罪名"
                      :key="index"
                      type="danger"
                      size="large"
                      class="clickable-tag"
                      @click="handleElementClick(crime)"
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
                  <div class="content-box clickable-text" @click="handleElementClick(currentRecord.structured_data.事实概要)">
                    {{ currentRecord.structured_data.事实概要 }}
                  </div>
                </el-card>

                <!-- 证据列表 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">证据列表</span>
                  </template>
                  <ul class="evidence-list">
                    <li 
                      v-for="(evidence, index) in currentRecord.structured_data.证据列表" 
                      :key="index"
                      class="clickable-text"
                      @click="handleElementClick(evidence)"
                    >
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
                      v-for="(law, index) in currentRecord.structured_data.法律依据"
                      :key="index"
                      type="warning"
                      class="clickable-tag"
                      @click="handleElementClick(law)"
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
                  <div class="content-box result clickable-text" @click="handleElementClick(currentRecord.structured_data.处理结果)">
                    {{ currentRecord.structured_data.处理结果 }}
                  </div>
                </el-card>

                <!-- 特定字段 -->
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <span class="card-title">特定字段</span>
                  </template>
                  <el-descriptions :column="1" border>
                    <el-descriptions-item
                      v-for="(value, key) in currentRecord.structured_data.特定字段"
                      :key="key"
                      :label="key"
                    >
                      <template v-if="Array.isArray(value)">
                        <div v-if="value.length > 0">
                          <div 
                            v-for="(item, idx) in value" 
                            :key="idx"
                            class="clickable-text"
                            @click="handleElementClick(item)"
                          >
                            {{ item }}
                          </div>
                        </div>
                        <span v-else class="empty-text">无</span>
                      </template>
                      <template v-else>
                        <span class="clickable-text" @click="handleElementClick(value)">
                          {{ value || '无' }}
                        </span>
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
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, FullScreen, Document } from '@element-plus/icons-vue'
import { fetchExtractionHistory, downloadDocument, previewDocument } from '@/api/documents'
import { renderAsync } from 'docx-preview'
import { useUserStore } from '@/store/modules/user'

// 搜索表单
const searchForm = ref({
  fileName: '',
  caseId: '',
  docType: ''
})

// 数据
const loading = ref(false)
const records = ref<Api.Documents.ExtractionHistoryRecord[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 详情对话框
const detailVisible = ref(false)
const currentRecord = ref<Api.Documents.ExtractionHistoryRecord | null>(null)
const docxPreviewContainer = ref<HTMLElement | null>(null)
const isLoadingPreview = ref(false)
const currentHighlightedElement = ref<HTMLElement | null>(null)

// 文件预览
const previewUrl = computed(() => {
  if (!currentRecord.value) return ''
  return previewDocument(currentRecord.value.doc_id)
})

// 判断文件类型
const isDocx = computed(() => {
  if (!currentRecord.value) return false
  const fileName = currentRecord.value.file_name.toLowerCase()
  return fileName.endsWith('.docx')
})

const isPdf = computed(() => {
  if (!currentRecord.value) return false
  const fileName = currentRecord.value.file_name.toLowerCase()
  return fileName.endsWith('.pdf')
})

const isPdfOrOffice = computed(() => {
  if (!currentRecord.value) return false
  const fileName = currentRecord.value.file_name.toLowerCase()
  return fileName.endsWith('.pdf') || 
         fileName.endsWith('.doc') || 
         fileName.endsWith('.docx')
})

const isImage = computed(() => {
  if (!currentRecord.value) return false
  const fileName = currentRecord.value.file_name.toLowerCase()
  return fileName.endsWith('.jpg') || 
         fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || 
         fileName.endsWith('.tiff')
})

// 过滤后的记录
const filteredRecords = computed(() => {
  return records.value.filter((record) => {
    if (searchForm.value.fileName && !record.file_name.includes(searchForm.value.fileName)) {
      return false
    }
    if (searchForm.value.caseId && !record.case_id.includes(searchForm.value.caseId)) {
      return false
    }
    if (searchForm.value.docType && record.doc_type !== searchForm.value.docType) {
      return false
    }
    return true
  })
})

// 获取历史记录
const getHistoryRecords = async () => {
  loading.value = true
  try {
    const data = await fetchExtractionHistory(pagination.value.page, pagination.value.pageSize)
    records.value = data.records || []
    pagination.value.total = data.total
    pagination.value.totalPages = data.total_pages
  } catch (error) {
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  // 过滤逻辑已在 computed 中处理
}

// 重置
const handleReset = () => {
  searchForm.value = {
    fileName: '',
    caseId: '',
    docType: ''
  }
}

// 刷新
const handleRefresh = () => {
  getHistoryRecords()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
  getHistoryRecords()
}

// 每页数量变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  getHistoryRecords()
}

// 查看详情
const handleViewDetail = async (record: Api.Documents.ExtractionHistoryRecord) => {
  currentRecord.value = record
  detailVisible.value = true
  
  // 如果是 docx 文件，需要加载并渲染
  if (record.file_name.toLowerCase().endsWith('.docx')) {
    await nextTick()
    await loadDocxPreview(record.doc_id)
  }
}

// 加载 docx 预览
const loadDocxPreview = async (docId: string) => {
  if (!docxPreviewContainer.value) return
  
  isLoadingPreview.value = true
  try {
    const { VITE_DOCUMENT_API_URL } = import.meta.env
    const userStore = useUserStore()
    
    // 获取文档 blob
    const response = await fetch(`${VITE_DOCUMENT_API_URL}/api/documents/${docId}/download`, {
      headers: {
        'Authorization': userStore.accessToken || ''
      }
    })
    
    if (!response.ok) {
      throw new Error('文档加载失败')
    }
    
    const blob = await response.blob()
    
    // 清空容器
    docxPreviewContainer.value.innerHTML = ''
    
    // 渲染 docx
    await renderAsync(blob, docxPreviewContainer.value, undefined, {
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

// 在文档中搜索并高亮关键词
const searchAndHighlightInDocument = (keyword: string) => {
  if (!docxPreviewContainer.value || !keyword) return
  
  // 清除之前的高亮
  clearHighlight()
  
  // 获取文档内容容器
  const contentElement = docxPreviewContainer.value.querySelector('.docx-preview-content')
  if (!contentElement) return
  
  // 搜索关键词
  const found = searchTextInElement(contentElement as HTMLElement, keyword)
  
  if (!found) {
    ElMessage.warning(`未在文档中找到"${keyword}"`)
  }
}

// 在元素中搜索文本并高亮
const searchTextInElement = (element: HTMLElement, keyword: string): boolean => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  let found = false
  const textNodes: Text[] = []
  
  // 收集所有文本节点
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }
  
  // 在文本节点中搜索关键词
  for (const textNode of textNodes) {
    const text = textNode.textContent || ''
    const index = text.indexOf(keyword)
    
    if (index !== -1) {
      // 找到第一个匹配项
      if (!found) {
        found = true
        highlightText(textNode, keyword, index)
        
        // 滚动到高亮位置
        setTimeout(() => {
          if (currentHighlightedElement.value) {
            currentHighlightedElement.value.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 100)
      } else {
        // 其他匹配项也高亮，但不滚动
        highlightText(textNode, keyword, index, false)
      }
    }
  }
  
  return found
}

// 高亮文本节点中的关键词
const highlightText = (textNode: Text, keyword: string, index: number, isPrimary: boolean = true) => {
  const text = textNode.textContent || ''
  const parent = textNode.parentNode
  if (!parent) return
  
  // 创建文档片段
  const fragment = document.createDocumentFragment()
  
  // 前面的文本
  if (index > 0) {
    fragment.appendChild(document.createTextNode(text.substring(0, index)))
  }
  
  // 高亮的关键词
  const highlight = document.createElement('span')
  highlight.className = isPrimary ? 'keyword-highlight primary' : 'keyword-highlight'
  highlight.textContent = keyword
  highlight.style.cssText = isPrimary 
    ? 'background-color: #ff0; padding: 2px 4px; border-radius: 2px; font-weight: bold; box-shadow: 0 0 8px rgba(255, 255, 0, 0.6);'
    : 'background-color: #ffeb3b; padding: 2px 4px; border-radius: 2px;'
  
  fragment.appendChild(highlight)
  
  // 保存主要高亮元素的引用
  if (isPrimary) {
    currentHighlightedElement.value = highlight
  }
  
  // 后面的文本（继续搜索）
  const remainingText = text.substring(index + keyword.length)
  if (remainingText) {
    const remainingIndex = remainingText.indexOf(keyword)
    if (remainingIndex !== -1) {
      // 递归处理剩余文本中的关键词
      const beforeNext = remainingText.substring(0, remainingIndex)
      if (beforeNext) {
        fragment.appendChild(document.createTextNode(beforeNext))
      }
      
      const nextHighlight = document.createElement('span')
      nextHighlight.className = 'keyword-highlight'
      nextHighlight.textContent = keyword
      nextHighlight.style.cssText = 'background-color: #ffeb3b; padding: 2px 4px; border-radius: 2px;'
      fragment.appendChild(nextHighlight)
      
      const afterNext = remainingText.substring(remainingIndex + keyword.length)
      if (afterNext) {
        fragment.appendChild(document.createTextNode(afterNext))
      }
    } else {
      fragment.appendChild(document.createTextNode(remainingText))
    }
  }
  
  // 替换原文本节点
  parent.replaceChild(fragment, textNode)
}

// 清除高亮
const clearHighlight = () => {
  if (!docxPreviewContainer.value) return
  
  const highlights = docxPreviewContainer.value.querySelectorAll('.keyword-highlight')
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode
    if (parent) {
      const textNode = document.createTextNode(highlight.textContent || '')
      parent.replaceChild(textNode, highlight)
      // 合并相邻的文本节点
      parent.normalize()
    }
  })
  
  currentHighlightedElement.value = null
}

// 点击要素时高亮对应内容
const handleElementClick = (value: any) => {
  if (!value) return
  
  // 将值转换为字符串
  let keyword = ''
  if (typeof value === 'string') {
    keyword = value
  } else if (Array.isArray(value)) {
    keyword = value[0] || ''
  } else {
    keyword = String(value)
  }
  
  // 如果关键词太短或为空，不进行搜索
  if (!keyword || keyword.length < 2) {
    return
  }
  
  // 在文档中搜索并高亮
  searchAndHighlightInDocument(keyword)
}

// 下载文件
const handleDownload = () => {
  if (!currentRecord.value) return
  const url = downloadDocument(currentRecord.value.doc_id)
  window.open(url, '_blank')
}

// 新窗口打开
const handleOpenNewTab = () => {
  if (!currentRecord.value) return
  const url = previewDocument(currentRecord.value.doc_id)
  window.open(url, '_blank')
}

// 导出
const handleExport = (record: Api.Documents.ExtractionHistoryRecord) => {
  ElMessage.info('导出功能开发中')
}

// 格式化提取方法
const formatMethod = (method: string) => {
  const methodMap: Record<string, string> = {
    kimi_structured: 'Kimi AI',
    gpt_structured: 'GPT',
    claude_structured: 'Claude'
  }
  return methodMap[method] || method
}

onMounted(() => {
  getHistoryRecords()
})
</script>

<style scoped lang="scss">
.extraction-history-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 16px;
  }

  // 左右分栏布局
  .detail-container-split {
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

          // docx-preview 生成的包装器
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
            
            // 段落样式
            p {
              margin: 0 0 12px 0;
              line-height: 1.8;
              text-align: justify;
              overflow-wrap: break-word;
              word-wrap: break-word;
              width: 100%;
            }

            // 标题样式
            h1, h2, h3, h4, h5, h6 {
              margin: 16px 0 12px 0;
              font-weight: bold;
              overflow-wrap: break-word;
              word-wrap: break-word;
              width: 100%;
            }

            // 表格样式
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

            // 列表样式
            ul, ol {
              margin: 12px 0;
              padding-left: 30px;
              width: 100%;
              
              li {
                overflow-wrap: break-word;
                word-wrap: break-word;
              }
            }

            // 确保所有内容不超出容器
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

        // 可点击文本样式
        .clickable-text {
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            color: #409eff;
            text-decoration: underline;
          }
        }

        // 可点击标签样式
        .clickable-tag {
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            opacity: 0.8;
            transform: translateY(-1px);
          }
        }

        // 证据列表项可点击
        .evidence-list li {
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            color: #409eff;
            padding-left: 4px;
          }
        }
      }
    }
  }

  // 原有的详情容器样式（保留作为备用）
  .detail-container {
    max-height: 70vh;
    overflow-y: auto;

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
  }
}
</style>
