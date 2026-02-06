# API 配置说明

## 概述

本项目使用了**双 API 配置**方案：
- **用户认证 API**：使用 Mock 接口（登录、注册、用户信息等）
- **文书管理 API**：使用真实后端接口（文书上传、提取、比对等）

## 配置方案

### 1. 环境变量配置

#### 开发环境 (`.env.development`)

```env
# 用户认证等使用本地 Mock
VITE_API_URL = /

# 文书管理使用真实后端
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu

# 启用本地 Mock
VITE_USE_MOCK = true
```

#### 生产环境 (`.env.production`)

```env
# 用户认证等使用 Mock（或配置为真实的用户服务）
VITE_API_URL = https://m1.apifoxmock.com/m1/6400575-6097373-default

# 文书管理使用真实后端
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu
```

### 2. HTTP 请求实例

项目中有两个独立的 HTTP 请求实例：

#### 默认请求实例 (`src/utils/http/index.ts`)
- **用途**：用户认证、系统管理等
- **baseURL**：`VITE_API_URL`（使用 Mock）
- **使用示例**：
  ```typescript
  import request from '@/utils/http'
  
  // 登录接口（使用 Mock）
  export function fetchLogin(params: Api.Auth.LoginParams) {
    return request.post<Api.Auth.LoginResponse>({
      url: '/api/auth/login',
      params
    })
  }
  ```

#### 文书管理请求实例 (`src/utils/http/documentRequest.ts`)
- **用途**：文书管理相关功能
- **baseURL**：`VITE_DOCUMENT_API_URL`（使用真实后端）
- **超时时间**：
  - 默认：30 秒（文档列表、上传等）
  - 批量提取：5 分钟（AI 处理耗时）
  - 文书比对：5 分钟（LLM 分析耗时）
- **使用示例**：
  ```typescript
  import documentRequest from '@/utils/http/documentRequest'
  
  // 获取文档列表（使用真实后端）
  export function fetchDocumentList() {
    return documentRequest.get<Api.Documents.DocumentInfo[]>({
      url: '/api/documents/'
    })
  }
  
  // 批量提取（自定义超时）
  export function batchStructuredExtract(docIds: string[]) {
    return documentRequest.post({
      url: '/api/elements/batch-structured-extract',
      data: { doc_ids: docIds },
      timeout: 300000 // 5 分钟
    })
  }
  ```

## API 路由分配

### 使用 Mock 的接口（默认请求实例）

| 功能 | 接口路径 | 文件位置 |
|------|---------|---------|
| 用户登录 | `/api/auth/login` | `src/api/auth.ts` |
| 获取用户信息 | `/api/user/info` | `src/api/auth.ts` |
| 用户管理 | `/api/system/user/*` | `src/api/system-manage.ts` |
| 角色管理 | `/api/system/role/*` | `src/api/system-manage.ts` |
| 菜单管理 | `/api/system/menu/*` | `src/api/system-manage.ts` |

### 使用真实后端的接口（文书管理请求实例）

| 功能 | 接口路径 | 文件位置 |
|------|---------|---------|
| 获取文档列表 | `/api/documents/` | `src/api/documents.ts` |
| 批量上传 | `/api/documents/batch-upload` | `src/api/documents.ts` |
| 查询上传进度 | `/api/documents/batch-status/{batch_id}` | `src/api/documents.ts` |
| 批量结构化提取 | `/api/elements/batch-structured-extract` | `src/api/documents.ts` |
| 文书对比 | `/api/comparison/compare` | `src/api/documents.ts` |

## 实际请求地址

### 开发环境

**用户登录**：
```
请求：POST http://localhost:3006/api/auth/login
实际：使用本地 Mock 数据
```

**获取文档列表**：
```
请求：GET https://law_cwd.app.xdo.icu/api/documents/
实际：真实后端 API
```

### 生产环境

**用户登录**：
```
请求：POST https://m1.apifoxmock.com/m1/6400575-6097373-default/api/auth/login
实际：使用 Apifox Mock 数据
```

**获取文档列表**：
```
请求：GET https://law_cwd.app.xdo.icu/api/documents/
实际：真实后端 API
```

## 如何添加新的 API

### 添加 Mock 接口（用户认证、系统管理等）

1. 在 `src/api/` 目录下创建或编辑 API 文件
2. 使用默认的 `request` 实例：
   ```typescript
   import request from '@/utils/http'
   
   export function yourApiFunction() {
     return request.get({
       url: '/api/your-endpoint'
     })
   }
   ```

### 添加文书管理接口（使用真实后端）

1. 在 `src/api/documents.ts` 中添加接口
2. 使用 `documentRequest` 实例：
   ```typescript
   import documentRequest from '@/utils/http/documentRequest'
   
   export function yourDocumentApiFunction() {
     return documentRequest.get({
       url: '/api/documents/your-endpoint'
     })
   }
   ```

## 跨域配置

### 开发环境

文书管理 API 使用完整的 URL（`https://law_cwd.app.xdo.icu`），需要后端配置 CORS：

```
Access-Control-Allow-Origin: http://localhost:3006
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### 生产环境

需要后端配置允许生产环境域名的跨域访问。

## 常见问题

### Q1: 为什么要使用两个请求实例？

**A**: 因为用户认证等功能使用 Mock 数据（方便开发和演示），而文书管理功能需要连接真实的后端 API 进行实际的文件处理和 AI 分析。

### Q2: 如何切换到完全使用真实后端？

**A**: 修改 `.env.development` 文件：
```env
# 将用户认证也指向真实后端
VITE_API_URL = https://your-real-backend.com

# 关闭 Mock
VITE_USE_MOCK = false
```

### Q3: 遇到跨域错误怎么办？

**A**: 
1. 确认后端已配置 CORS
2. 检查请求头中的 Origin
3. 确认后端允许的域名列表包含前端地址

### Q4: 如何调试 API 请求？

**A**: 
1. 打开浏览器开发者工具 → Network 标签
2. 查看请求的 URL、Headers、Response
3. 检查 Console 中的错误信息

## 配置检查清单

- [x] `.env.development` 配置了 `VITE_DOCUMENT_API_URL`
- [x] `.env.production` 配置了 `VITE_DOCUMENT_API_URL`
- [x] 创建了 `src/utils/http/documentRequest.ts`
- [x] `src/api/documents.ts` 使用 `documentRequest`
- [x] 其他 API 文件继续使用默认 `request`
- [x] 后端配置了 CORS（需要后端开发确认）

## 技术支持

如有问题，请检查：
1. 环境变量是否正确配置
2. 网络连接是否正常
3. 后端服务是否运行
4. 浏览器控制台的错误信息

---

**配置完成！** ✅

现在用户认证使用 Mock，文书管理使用真实后端 API。
