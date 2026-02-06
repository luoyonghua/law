# 新增页面开发指南 📖

本文档详细说明如何在 Art Design Pro 项目中新增页面，包括需要修改的文件和具体步骤。

## 📋 目录

- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [文件结构说明](#文件结构说明)
- [示例：新增商品管理页面](#示例新增商品管理页面)
- [权限控制](#权限控制)
- [国际化配置](#国际化配置)
- [Mock 数据](#mock-数据)
- [最佳实践](#最佳实践)

## 🚀 快速开始

新增一个页面需要修改以下文件：

1. **创建页面组件** - `src/views/[模块]/[页面]/index.vue`
2. **配置路由** - `src/router/modules/[模块].ts`
3. **注册路由模块** - `src/router/modules/index.ts`
4. **添加国际化** - `src/locales/langs/zh.json` 和 `src/locales/langs/en.json`
5. **创建 API 接口** - `src/api/[模块].ts`
6. **添加 Mock 数据** - `src/mock/[模块].ts`
7. **类型定义** - `src/types/api/api.d.ts`

## 📝 详细步骤

### 步骤 1：创建页面组件

在 `src/views/` 目录下创建页面组件：

```
src/views/
├── [模块名]/
│   ├── [页面名]/
│   │   ├── index.vue          # 主页面组件
│   │   ├── modules/           # 子组件目录（可选）
│   │   │   ├── [组件名].vue
│   │   │   └── ...
│   │   └── style.scss         # 页面样式（可选）
```

**页面组件模板**：

```vue
<template>
  <div class="page-container">
    <ArtPageContent>
      <!-- 搜索栏 -->
      <ArtSearchBar
        v-model="searchForm"
        :config="searchConfig"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 表格 -->
      <ArtTable
        :data="tableData"
        :columns="tableColumns"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      />
    </ArtPageContent>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'YourPageName' })

  // 页面逻辑
  const loading = ref(false)
  const tableData = ref([])
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  // 搜索表单
  const searchForm = ref({})
  const searchConfig = []

  // 表格列配置
  const tableColumns = []

  // 方法
  const handleSearch = () => {
    // 搜索逻辑
  }

  const handleReset = () => {
    // 重置逻辑
  }

  const handlePageChange = (page: number, size: number) => {
    // 分页逻辑
  }

  // 初始化
  onMounted(() => {
    handleSearch()
  })
</script>
```

### 步骤 2：配置路由模块

在 `src/router/modules/` 目录下创建或修改路由模块：

```typescript
// src/router/modules/product.ts
import { AppRouteRecord } from '@/types/router'

export const productRoutes: AppRouteRecord = {
  path: '/product',
  name: 'Product',
  component: '/index/index',
  meta: {
    title: 'menus.product.title',
    icon: 'ri:shopping-bag-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'ProductList',
      component: '/product/list',
      meta: {
        title: 'menus.product.list',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'category',
      name: 'ProductCategory',
      component: '/product/category',
      meta: {
        title: 'menus.product.category',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    }
  ]
}
```

### 步骤 3：注册路由模块

在 `src/router/modules/index.ts` 中导入并注册新的路由模块：

```typescript
import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { productRoutes } from './product' // 新增
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  productRoutes, // 新增
  resultRoutes,
  exceptionRoutes
]
```

### 步骤 4：添加国际化配置

在 `src/locales/langs/zh.json` 中添加菜单标题：

```json
{
  "menus": {
    "product": {
      "title": "商品管理",
      "list": "商品列表",
      "category": "商品分类"
    }
  }
}
```

在 `src/locales/langs/en.json` 中添加英文翻译：

```json
{
  "menus": {
    "product": {
      "title": "Product Management",
      "list": "Product List",
      "category": "Product Category"
    }
  }
}
```

### 步骤 5：创建 API 接口

在 `src/api/` 目录下创建 API 文件：

```typescript
// src/api/product.ts
import request from '@/utils/http'

/**
 * 获取商品列表
 */
export function fetchGetProductList(params: Api.Product.ProductSearchParams) {
  return request.get<Api.Product.ProductList>({
    url: '/api/product/list',
    params
  })
}

/**
 * 创建商品
 */
export function fetchCreateProduct(data: Api.Product.CreateProductParams) {
  return request.post<boolean>({
    url: '/api/product/create',
    data
  })
}

/**
 * 更新商品
 */
export function fetchUpdateProduct(data: Api.Product.UpdateProductParams) {
  return request.put<boolean>({
    url: '/api/product/update',
    data
  })
}

/**
 * 删除商品
 */
export function fetchDeleteProduct(id: number) {
  return request.del<boolean>({
    url: `/api/product/delete/${id}`
  })
}
```

### 步骤 6：添加类型定义

在 `src/types/api/api.d.ts` 中添加类型定义：

```typescript
declare namespace Api {
  /** 商品管理类型 */
  namespace Product {
    /** 商品列表 */
    type ProductList = Api.Common.PaginatedResponse<ProductListItem>

    /** 商品列表项 */
    interface ProductListItem {
      id: number
      name: string
      price: number
      category: string
      status: string
      stock: number
      description: string
      images: string[]
      createTime: string
      updateTime: string
    }

    /** 商品搜索参数 */
    type ProductSearchParams = Partial<
      Pick<ProductListItem, 'name' | 'category' | 'status'> & Api.Common.CommonSearchParams
    >

    /** 创建商品参数 */
    interface CreateProductParams {
      name: string
      price: number
      category: string
      stock: number
      description: string
      images: string[]
    }

    /** 更新商品参数 */
    interface UpdateProductParams extends CreateProductParams {
      id: number
    }
  }
}
```

### 步骤 7：添加 Mock 数据

在 `src/mock/` 目录下创建 Mock 文件：

```typescript
// src/mock/product.ts
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { generatePaginatedData } from './utils'

const { Random } = Mock

// 生成商品列表数据
function generateProductList(count: number = 50): Api.Product.ProductListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: Random.ctitle(5, 15),
    price: Random.float(10, 1000, 2, 2),
    category: Random.pick(['电子产品', '服装', '食品', '家居', '运动']),
    status: Random.pick(['1', '2']), // 1: 上架, 2: 下架
    stock: Random.integer(0, 1000),
    description: Random.cparagraph(1, 3),
    images: Array.from({ length: Random.integer(1, 5) }, () =>
      Random.image('300x300', Random.color(), '#FFF', 'Product')
    ),
    createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
  }))
}

const mockProductList = generateProductList(100)

export default [
  // 获取商品列表
  {
    url: '/api/product/list',
    method: 'get',
    response: ({ query }: { query: Api.Product.ProductSearchParams }) => {
      const { current = 1, size = 10, name, category, status } = query

      // 过滤数据
      let filteredList = mockProductList

      if (name) {
        filteredList = filteredList.filter((product) => product.name.includes(name))
      }

      if (category) {
        filteredList = filteredList.filter((product) => product.category === category)
      }

      if (status) {
        filteredList = filteredList.filter((product) => product.status === status)
      }

      // 分页
      const paginatedData = generatePaginatedData(filteredList, current, size)

      return {
        code: 200,
        msg: '获取商品列表成功',
        data: paginatedData
      }
    }
  },

  // 创建商品
  {
    url: '/api/product/create',
    method: 'post',
    response: ({ body }: { body: Api.Product.CreateProductParams }) => {
      const newProduct = {
        id: mockProductList.length + 1,
        ...body,
        status: '1',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }

      mockProductList.push(newProduct)

      return {
        code: 200,
        msg: '创建商品成功',
        data: true
      }
    }
  }
] as MockMethod[]
```

然后在 `src/mock/index.ts` 中导入：

```typescript
import productMock from './product'

export default [
  ...authMock,
  ...systemManageMock,
  ...dashboardMock,
  ...productMock // 新增
]
```

## 🎯 示例：新增商品管理页面

让我们通过一个完整的示例来演示如何新增商品管理页面：

### 1. 创建页面组件

```bash
mkdir -p src/views/product/list
```

```vue
<!-- src/views/product/list/index.vue -->
<template>
  <div class="product-list-page">
    <ArtPageContent>
      <!-- 搜索栏 -->
      <ArtSearchBar
        v-model="searchForm"
        :config="searchConfig"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 操作按钮 -->
      <div class="mb-4">
        <ElButton type="primary" @click="handleAdd">
          <ArtSvgIcon name="ri:add-line" class="mr-1" />
          新增商品
        </ElButton>
      </div>

      <!-- 表格 -->
      <ArtTable
        :data="tableData"
        :columns="tableColumns"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      />
    </ArtPageContent>
  </div>
</template>

<script setup lang="ts">
  import { fetchGetProductList } from '@/api/product'

  defineOptions({ name: 'ProductList' })

  // 响应式数据
  const loading = ref(false)
  const tableData = ref<Api.Product.ProductListItem[]>([])
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0
  })

  // 搜索表单
  const searchForm = ref<Api.Product.ProductSearchParams>({})

  // 搜索配置
  const searchConfig = [
    {
      type: 'input',
      prop: 'name',
      label: '商品名称',
      placeholder: '请输入商品名称'
    },
    {
      type: 'select',
      prop: 'category',
      label: '商品分类',
      placeholder: '请选择商品分类',
      options: [
        { label: '电子产品', value: '电子产品' },
        { label: '服装', value: '服装' },
        { label: '食品', value: '食品' }
      ]
    }
  ]

  // 表格列配置
  const tableColumns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '商品名称', minWidth: 150 },
    { prop: 'price', label: '价格', width: 100 },
    { prop: 'category', label: '分类', width: 120 },
    { prop: 'stock', label: '库存', width: 100 },
    { prop: 'status', label: '状态', width: 100 },
    { prop: 'createTime', label: '创建时间', width: 180 }
  ]

  // 方法
  const handleSearch = async () => {
    loading.value = true
    try {
      const params = {
        ...searchForm.value,
        current: pagination.current,
        size: pagination.size
      }

      const data = await fetchGetProductList(params)
      tableData.value = data.records
      pagination.total = data.total
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleReset = () => {
    searchForm.value = {}
    pagination.current = 1
    handleSearch()
  }

  const handlePageChange = (page: number, size: number) => {
    pagination.current = page
    pagination.size = size
    handleSearch()
  }

  const handleAdd = () => {
    // 新增商品逻辑
  }

  // 初始化
  onMounted(() => {
    handleSearch()
  })
</script>
```

### 2. 配置路由

```typescript
// src/router/modules/product.ts
import { AppRouteRecord } from '@/types/router'

export const productRoutes: AppRouteRecord = {
  path: '/product',
  name: 'Product',
  component: '/index/index',
  meta: {
    title: 'menus.product.title',
    icon: 'ri:shopping-bag-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'ProductList',
      component: '/product/list',
      meta: {
        title: 'menus.product.list',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
```

### 3. 注册路由模块

```typescript
// src/router/modules/index.ts
import { productRoutes } from './product'

export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  productRoutes, // 新增
  resultRoutes,
  exceptionRoutes
]
```

## 🔐 权限控制

### 路由级权限

在路由配置中使用 `roles` 字段：

```typescript
meta: {
  title: 'menus.product.list',
  roles: ['R_SUPER', 'R_ADMIN'] // 只有超级管理员和管理员可访问
}
```

### 按钮级权限

使用 `v-auth` 指令：

```vue
<template>
  <ElButton v-auth="'product:add'" type="primary">新增</ElButton>
  <ElButton v-auth="'product:edit'" type="warning">编辑</ElButton>
  <ElButton v-auth="'product:delete'" type="danger">删除</ElButton>
</template>
```

在路由配置中定义权限：

```typescript
meta: {
  title: 'menus.product.list',
  authList: [
    { title: '新增', authMark: 'add' },
    { title: '编辑', authMark: 'edit' },
    { title: '删除', authMark: 'delete' }
  ]
}
```

## 🌍 国际化配置

### 中文配置

```json
// src/locales/langs/zh.json
{
  "menus": {
    "product": {
      "title": "商品管理",
      "list": "商品列表",
      "category": "商品分类"
    }
  },
  "product": {
    "name": "商品名称",
    "price": "价格",
    "category": "分类",
    "stock": "库存",
    "status": "状态",
    "description": "描述",
    "createTime": "创建时间"
  }
}
```

### 英文配置

```json
// src/locales/langs/en.json
{
  "menus": {
    "product": {
      "title": "Product Management",
      "list": "Product List",
      "category": "Product Category"
    }
  },
  "product": {
    "name": "Product Name",
    "price": "Price",
    "category": "Category",
    "stock": "Stock",
    "status": "Status",
    "description": "Description",
    "createTime": "Create Time"
  }
}
```

## 📊 Mock 数据

### 基础 Mock 配置

```typescript
// src/mock/product.ts
export default [
  {
    url: '/api/product/list',
    method: 'get',
    response: ({ query }) => {
      // Mock 逻辑
      return {
        code: 200,
        msg: '获取商品列表成功',
        data: {
          records: [],
          current: 1,
          size: 10,
          total: 0
        }
      }
    }
  }
] as MockMethod[]
```

### 注册 Mock

```typescript
// src/mock/index.ts
import productMock from './product'

export default [...authMock, ...systemManageMock, ...dashboardMock, ...productMock]
```

## 📁 文件结构说明

```
src/
├── views/                    # 页面组件
│   └── [模块]/
│       └── [页面]/
│           ├── index.vue     # 主页面
│           ├── modules/      # 子组件
│           └── style.scss    # 样式文件
├── router/                   # 路由配置
│   └── modules/
│       ├── [模块].ts        # 路由模块
│       └── index.ts         # 路由注册
├── api/                     # API 接口
│   └── [模块].ts
├── mock/                    # Mock 数据
│   ├── [模块].ts
│   └── index.ts
├── types/                   # 类型定义
│   └── api/
│       └── api.d.ts
└── locales/                 # 国际化
    └── langs/
        ├── zh.json
        └── en.json
```

## ✨ 最佳实践

### 1. 命名规范

- **文件夹**：使用 kebab-case（如：`product-list`）
- **组件名**：使用 PascalCase（如：`ProductList`）
- **路由名**：使用 PascalCase（如：`ProductList`）
- **API 函数**：使用 camelCase，以 `fetch` 开头（如：`fetchGetProductList`）

### 2. 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
  // 1. 导入
  import { ... } from '...'

  // 2. 组件选项
  defineOptions({ name: 'ComponentName' })

  // 3. Props 和 Emits
  const props = defineProps<{...}>()
  const emit = defineEmits<{...}>()

  // 4. 响应式数据
  const data = ref()

  // 5. 计算属性
  const computed = computed(() => {})

  // 6. 方法
  const method = () => {}

  // 7. 生命周期
  onMounted(() => {})
</script>

<style scoped>
  /* 样式 */
</style>
```

### 3. 错误处理

```typescript
const handleSearch = async () => {
  loading.value = true
  try {
    const data = await fetchGetProductList(params)
    tableData.value = data.records
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
```

### 4. 类型安全

```typescript
// 使用明确的类型定义
const tableData = ref<Api.Product.ProductListItem[]>([])
const searchForm = ref<Api.Product.ProductSearchParams>({})

// API 调用时指定返回类型
const data = await fetchGetProductList(params)
```

## 🔧 常见问题

### Q1: 页面不显示在侧边栏？

**A**: 检查路由配置中的 `roles` 权限是否匹配当前用户角色。

### Q2: 国际化不生效？

**A**: 确保在 `zh.json` 和 `en.json` 中都添加了对应的翻译。

### Q3: Mock 数据不返回？

**A**: 检查 Mock 文件是否在 `src/mock/index.ts` 中正确导入。

### Q4: 路由跳转 404？

**A**: 确保路由模块已在 `src/router/modules/index.ts` 中注册。

## 📚 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [Element Plus 组件库](https://element-plus.org/)
- [Vue Router 路由](https://router.vuejs.org/)
- [Pinia 状态管理](https://pinia.vuejs.org/)

---

🎉 **恭喜！** 现在你已经掌握了如何在 Art Design Pro 中新增页面。按照这个指南，你可以快速创建功能完整的页面。
