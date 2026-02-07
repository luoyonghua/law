# 文书比对和审查 Loading 优化实现说明

## 概述
优化了文书比对和审查功能的用户体验，在点击按钮后先显示全屏 loading，等后端接口返回数据后再展示对话框。

## 实现方案

### 架构调整
**之前的流程**：
1. 点击按钮 → 打开对话框
2. 在对话框内点击"开始比对/审查" → 调用 API
3. API 返回后显示结果

**优化后的流程**：
1. 点击按钮 → 显示全屏 loading
2. 调用 API
3. API 返回后 → 关闭 loading → 打开对话框并显示结果

### 优势
- ✅ 用户体验更流畅，无需等待对话框打开
- ✅ 减少用户操作步骤（无需在对话框内再次点击）
- ✅ 全屏 loading 提供更清晰的反馈
- ✅ 避免对话框内的复杂状态管理

## 代码改动

### 1. list/index.vue（主要逻辑）

#### 导入 ElLoading 和 API
```typescript
import { ElMessage, ElLoading } from 'element-plus'
import { 
  fetchDocumentList, 
  batchStructuredExtract, 
  compareDocuments,      // 新增
  batchReviewDocuments   // 新增
} from '@/api/documents'
```

#### 添加数据存储
```typescript
const compareResult = ref<Api.Documents.ComparisonResponse | null>(null)
const reviewResult = ref<Api.Documents.BatchReviewResponse | null>(null)
```

#### 修改比对逻辑
```typescript
const handleCompare = async () => {
  if (selectedDocs.value.length < 2) {
    ElMessage.warning('请至少选择2份文书进行比对')
    return
  }
  
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书比对，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const docIds = selectedDocs.value.map((doc) => doc.doc_id)
    const result = await compareDocuments(docIds, 'custom')
    compareResult.value = result
    compareVisible.value = true  // API 返回后才打开对话框
    ElMessage.success('比对完成')
  } catch (error) {
    ElMessage.error('比对失败')
  } finally {
    loading.close()
  }
}
```

#### 修改审查逻辑
```typescript
const handleReview = async () => {
  if (selectedDocs.value.length === 0) {
    ElMessage.warning('请至少选择1份文书进行审查')
    return
  }
  
  // 显示全屏 loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书审查，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    const docIds = selectedDocs.value.map((doc) => doc.doc_id)
    const result = await batchReviewDocuments(docIds, true)
    reviewResult.value = result
    reviewVisible.value = true  // API 返回后才打开对话框
    ElMessage.success('审查完成')
  } catch (error) {
    ElMessage.error('审查失败')
  } finally {
    loading.close()
  }
}
```

#### 传递数据给对话框
```vue
<!-- 比对对话框 -->
<CompareDialog
  v-model="compareVisible"
  :selected-docs="selectedDocs"
  :compare-result="compareResult"  <!-- 传递结果数据 -->
  @success="handleCompareSuccess"
/>

<!-- 审查对话框 -->
<ReviewDialog
  v-model="reviewVisible"
  :selected-docs="selectedDocs"
  :review-result="reviewResult"  <!-- 传递结果数据 -->
  @success="handleReviewSuccess"
/>
```

### 2. CompareDialog.vue（对话框组件）

#### 修改 Props 接口
```typescript
interface Props {
  modelValue: boolean
  selectedDocs: Api.Documents.DocumentInfo[]
  compareResult: Api.Documents.ComparisonResponse | null  // 新增
}
```

#### 移除内部 API 调用
- 删除 `comparing` 状态
- 删除 `compareResult` 内部状态
- 删除 `handleCompare` 函数
- 删除 `ElLoading` 导入
- 删除 `compareDocuments` API 导入

#### 添加 watch 监听
```typescript
// 监听对话框打开，加载文档预览
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.compareResult) {
    await nextTick()
    // 加载文档预览
    if (isDocx(props.selectedDocs[0]) && docAPreviewContainer.value) {
      await loadDocxPreview(props.selectedDocs[0].doc_id, docAPreviewContainer.value, true)
    }
    if (isDocx(props.selectedDocs[1]) && docBPreviewContainer.value) {
      await loadDocxPreview(props.selectedDocs[1].doc_id, docBPreviewContainer.value, false)
    }
  }
})
```

#### 简化模板
```vue
<!-- 移除配置界面，直接显示结果 -->
<div v-if="compareResult" class="three-column-layout">
  <!-- 三栏布局内容 -->
</div>

<!-- 简化 footer -->
<template #footer>
  <el-button @click="handleClose">关闭</el-button>
</template>
```

### 3. ReviewDialog.vue（对话框组件）

#### 修改 Props 接口
```typescript
interface Props {
  modelValue: boolean
  selectedDocs: Api.Documents.DocumentInfo[]
  reviewResult: Api.Documents.BatchReviewResponse | null  // 新增
}
```

#### 移除内部 API 调用
- 删除 `reviewing` 状态
- 删除 `reviewResult` 内部状态
- 删除 `handleReview` 函数
- 删除 `ElLoading` 导入
- 删除 `batchReviewDocuments` API 导入

#### 添加 watch 监听
```typescript
// 监听对话框打开，加载文档预览
watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.reviewResult && currentDoc.value) {
    await nextTick()
    if (isDocx(currentDoc.value) && docPreviewContainer.value) {
      await loadDocxPreview(currentDoc.value.doc_id)
    }
  }
})
```

#### 简化模板
```vue
<!-- 移除配置界面，直接显示结果 -->
<div v-if="reviewResult && currentDoc" class="two-column-layout">
  <!-- 两栏布局内容 -->
</div>

<!-- 简化 footer -->
<template #footer>
  <el-button @click="handleClose">关闭</el-button>
</template>
```

## 用户体验流程

### 文书比对
1. 用户选择 2 个或多个文档
2. 点击"文书比对"按钮
3. **立即显示全屏 loading**："正在进行文书比对，请稍候..."
4. 后端处理比对请求（可能需要 10-60 秒）
5. 比对完成后：
   - 关闭 loading
   - 显示成功提示
   - 打开对话框，直接展示比对结果
   - 自动加载文档预览

### 文书审查
1. 用户选择 1 个或多个文档
2. 点击"文书审查"按钮
3. **立即显示全屏 loading**："正在进行文书审查，请稍候..."
4. 后端处理审查请求（可能需要 10-60 秒）
5. 审查完成后：
   - 关闭 loading
   - 显示成功提示
   - 打开对话框，直接展示审查结果
   - 自动加载文档预览

## 错误处理

### API 调用失败
```typescript
try {
  // API 调用
} catch (error) {
  ElMessage.error('比对失败')  // 或 '审查失败'
} finally {
  loading.close()  // 确保 loading 关闭
}
```

### 特点
- ✅ 即使 API 失败，loading 也会正确关闭
- ✅ 显示友好的错误提示
- ✅ 不会打开对话框（因为没有数据）
- ✅ 用户可以重新尝试

## 性能优化

### 文档预览延迟加载
- 对话框打开后才加载文档预览
- 使用 `watch` 监听对话框打开事件
- 使用 `nextTick` 确保 DOM 已渲染

### 避免重复加载
- 使用 `v-if` 条件渲染，关闭对话框时清理资源
- 每次打开对话框时重新加载预览

## 测试建议

### 功能测试
- [ ] 测试批量比对（2个文档）
- [ ] 测试批量比对（多个文档）
- [ ] 测试单个文档比对
- [ ] 测试批量审查（1个文档）
- [ ] 测试批量审查（多个文档）
- [ ] 测试单个文档审查

### 异常测试
- [ ] 测试 API 超时
- [ ] 测试 API 返回错误
- [ ] 测试网络断开
- [ ] 测试快速重复点击
- [ ] 测试在 loading 期间刷新页面

### 用户体验测试
- [ ] 验证 loading 文本清晰
- [ ] 验证 loading 期间页面锁定
- [ ] 验证 loading 关闭时机正确
- [ ] 验证对话框打开时机正确
- [ ] 验证文档预览加载正常

## 相关文件

- ✅ `src/views/documents/list/index.vue` - 主要逻辑和 loading 控制
- ✅ `src/views/documents/components/CompareDialog.vue` - 比对对话框
- ✅ `src/views/documents/components/ReviewDialog.vue` - 审查对话框

## 后续优化建议

1. **进度显示**：如果后端支持 WebSocket 或轮询，可以显示实时进度
2. **可取消操作**：添加取消按钮，允许用户中断长时间操作
3. **结果缓存**：缓存最近的比对/审查结果，避免重复请求
4. **批量操作优化**：对于多文档审查，可以显示每个文档的处理进度
