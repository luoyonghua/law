# DOCX 预览功能实现说明

## 问题描述

提取历史记录页面点击"查看详情"时，docx 文件直接下载而不是预览。

## 解决方案

使用 `docx-preview` 库在前端直接渲染 docx 文件，实现左侧预览功能。

## 技术实现

### 1. 安装依赖

```bash
pnpm add docx-preview
```

### 2. 核心功能

#### 文件类型判断

```typescript
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
```

#### DOCX 加载与渲染

```typescript
const loadDocxPreview = async (docId: string) => {
  if (!docxPreviewContainer.value) return
  
  isLoadingPreview.value = true
  try {
    const { VITE_DOCUMENT_API_URL } = import.meta.env
    const userStore = useUserStore()
    
    // 获取文档 blob（携带认证信息）
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
    
    // 使用 docx-preview 渲染
    await renderAsync(blob, docxPreviewContainer.value, undefined, {
      className: 'docx-preview-content',
      inWrapper: true,
      ignoreWidth: false,
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
  } catch (error) {
    console.error('加载 docx 预览失败:', error)
    ElMessage.error('文档预览加载失败')
  } finally {
    isLoadingPreview.value = false
  }
}
```

#### 查看详情时触发预览

```typescript
const handleViewDetail = async (record: Api.Documents.ExtractionHistoryRecord) => {
  currentRecord.value = record
  detailVisible.value = true
  
  // 如果是 docx 文件，需要加载并渲染
  if (record.file_name.toLowerCase().endsWith('.docx')) {
    await nextTick()
    await loadDocxPreview(record.doc_id)
  }
}
```

### 3. 模板结构

```vue
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
```

### 4. 样式设计

```scss
.docx-preview-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #525659; // 深灰色背景，模拟 Word 界面
  padding: 20px;

  .docx-container {
    max-width: 900px;
    margin: 0 auto;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    min-height: 100%;

    :deep(.docx-preview-content) {
      padding: 40px 60px; // 模拟 Word 页边距
      
      // 段落、标题、表格、列表等样式优化
      p {
        margin: 0 0 12px 0;
        line-height: 1.8;
        text-align: justify;
      }
      
      // ... 其他样式
    }
  }
}
```

## 功能特点

1. **支持认证**: 使用 fetch API 携带 Authorization token，支持需要认证的文档下载接口
2. **加载状态**: 显示加载动画，提升用户体验
3. **样式优化**: 模拟 Word 界面，包括深色背景、白色文档区域、阴影效果
4. **完整渲染**: 支持段落、标题、表格、列表、页眉页脚、脚注等元素
5. **响应式布局**: 文档容器自适应，最大宽度 900px，居中显示
6. **错误处理**: 加载失败时显示错误提示

## 支持的文件类型

- **DOCX**: 使用 docx-preview 库渲染
- **PDF**: 使用 iframe 直接预览
- **图片**: JPG、JPEG、PNG、TIFF 等格式直接显示
- **其他**: 显示不支持预览提示，提供下载按钮

## 注意事项

1. **DOC 格式**: 旧版 .doc 格式不支持预览，建议转换为 .docx 或直接下载
2. **文件大小**: 大文件可能加载较慢，建议添加文件大小限制或分页加载
3. **浏览器兼容性**: docx-preview 依赖现代浏览器特性，建议使用 Chrome、Firefox、Edge 等
4. **样式还原**: 复杂格式可能无法完全还原，但基本内容和结构都能正确显示

## 后续优化建议

1. 添加文档缩放功能（放大/缩小）
2. 添加文档搜索功能
3. 支持文档打印
4. 添加文档页码导航
5. 优化大文件加载性能（懒加载、虚拟滚动）
6. 考虑添加 .doc 格式支持（需要后端转换）

## 测试验证

1. 上传 docx 文件到系统
2. 在提取历史记录页面点击"查看详情"
3. 验证左侧能正确预览 docx 文件内容
4. 测试下载功能是否正常
5. 测试新窗口打开功能

## 相关文件

- `src/views/documents/history/index.vue` - 提取历史记录页面
- `src/api/documents.ts` - 文档 API
- `package.json` - 依赖配置
