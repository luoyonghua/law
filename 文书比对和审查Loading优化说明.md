# 文书比对和审查 Loading 优化说明

## 概述
为文书比对（CompareDialog）和文书审查（ReviewDialog）功能添加了 Element Plus 的全屏 loading 遮罩，提升用户体验。

## 实现的功能

### 1. CompareDialog.vue（文书比对）
- **触发时机**：点击"开始比对"按钮后
- **Loading 文本**："正在进行文书比对，请稍候..."
- **背景遮罩**：半透明黑色背景（rgba(0, 0, 0, 0.7)）
- **锁定交互**：loading 期间锁定页面交互，防止用户误操作
- **自动关闭**：比对完成或失败后自动关闭 loading

### 2. ReviewDialog.vue（文书审查）
- **触发时机**：点击"开始审查"按钮后
- **Loading 文本**："正在进行文书审查，请稍候..."
- **背景遮罩**：半透明黑色背景（rgba(0, 0, 0, 0.7)）
- **锁定交互**：loading 期间锁定页面交互，防止用户误操作
- **自动关闭**：审查完成或失败后自动关闭 loading

## 技术实现

### 使用 ElLoading.service()
```typescript
const loading = ElLoading.service({
  lock: true,                          // 锁定屏幕滚动
  text: '正在进行文书比对，请稍候...',  // 加载文本
  background: 'rgba(0, 0, 0, 0.7)',    // 背景颜色
})

// 操作完成后关闭
loading.close()
```

### 错误处理
在 `finally` 块中确保 loading 一定会被关闭，即使发生错误也不会导致 loading 一直显示。

```typescript
try {
  // 执行操作
} catch (error) {
  ElMessage.error('操作失败')
} finally {
  loading.close()  // 确保关闭
}
```

## 代码改动

### CompareDialog.vue
```typescript
// 导入 ElLoading
import { ElMessage, ElLoading } from 'element-plus'

// 在 handleCompare 函数中添加 loading
const handleCompare = async () => {
  // ... 验证逻辑
  
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书比对，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    // ... 比对逻辑
  } finally {
    loading.close()
  }
}
```

### ReviewDialog.vue
```typescript
// 导入 ElLoading
import { ElMessage, ElLoading } from 'element-plus'

// 在 handleReview 函数中添加 loading
const handleReview = async () => {
  // ... 验证逻辑
  
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行文书审查，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  
  try {
    // ... 审查逻辑
  } finally {
    loading.close()
  }
}
```

## 用户体验改进

### 改进前
- 用户点击按钮后，只有按钮显示 loading 状态
- 用户可能不清楚操作是否在进行中
- 用户可能会重复点击或进行其他操作

### 改进后
- ✅ 全屏遮罩，清晰提示操作正在进行
- ✅ 显示具体的操作文本，用户知道系统在做什么
- ✅ 锁定页面交互，防止误操作
- ✅ 半透明背景，保持界面可见性
- ✅ 自动关闭，操作完成后立即恢复交互

## Loading 配置选项

Element Plus Loading 支持的配置项：

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| lock | 是否锁定屏幕滚动 | boolean | false |
| text | 显示在加载图标下方的文字 | string | - |
| background | 遮罩背景色 | string | rgba(0, 0, 0, 0.7) |
| customClass | Loading 的自定义类名 | string | - |
| fullscreen | 是否全屏 | boolean | true |
| target | Loading 需要覆盖的 DOM 节点 | string / HTMLElement | document.body |

## 注意事项

1. **必须关闭 Loading**：确保在 `finally` 块中调用 `loading.close()`，避免 loading 一直显示
2. **避免嵌套 Loading**：不要在一个 loading 中再创建新的 loading
3. **合理的文本提示**：loading 文本应该清晰说明正在进行的操作
4. **超时处理**：对于可能超时的操作，建议在 API 层面设置超时时间

## 测试建议

- [ ] 测试比对功能的 loading 显示和关闭
- [ ] 测试审查功能的 loading 显示和关闭
- [ ] 测试操作失败时 loading 是否正确关闭
- [ ] 测试 loading 期间是否锁定了页面交互
- [ ] 测试快速点击是否会创建多个 loading
- [ ] 测试网络慢的情况下的用户体验

## 后续优化建议

1. **进度显示**：如果后端支持，可以显示具体的进度百分比
2. **可取消操作**：添加取消按钮，允许用户中断长时间操作
3. **预估时间**：根据文档数量和历史数据，显示预估完成时间
4. **分步提示**：对于多步骤操作，显示当前进行到哪一步

## 相关文件

- ✅ `src/views/documents/components/CompareDialog.vue`
- ✅ `src/views/documents/components/ReviewDialog.vue`
