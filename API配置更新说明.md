# API 配置更新说明

## 问题

之前的配置将所有 API 请求都指向了真实后端 `https://law_cwd.app.xdo.icu`，导致用户登录等功能也尝试访问真实后端，而不是使用 Mock 数据。

## 解决方案

实现了**双 API 配置**方案：

### 1. 创建独立的文书管理请求实例

**文件**: `src/utils/http/documentRequest.ts`

- 专门用于文书管理功能
- 使用独立的 baseURL: `VITE_DOCUMENT_API_URL`
- 超时时间设置为 30 秒（文书处理需要更长时间）

### 2. 更新环境变量

**开发环境** (`.env.development`):
```env
# 用户认证使用 Mock
VITE_API_URL = /

# 文书管理使用真实后端
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu
```

**生产环境** (`.env.production`):
```env
# 用户认证使用 Mock
VITE_API_URL = https://m1.apifoxmock.com/m1/6400575-6097373-default

# 文书管理使用真实后端
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu
```

### 3. 更新文书管理 API

**文件**: `src/api/documents.ts`

将所有文书管理接口从 `request` 改为 `documentRequest`：

```typescript
// 之前
import request from '@/utils/http'

// 现在
import documentRequest from '@/utils/http/documentRequest'
```

## 效果

### 用户登录（使用 Mock）
```
请求: POST http://localhost:3006/api/auth/login
处理: 本地 Mock 数据
```

### 文书上传（使用真实后端）
```
请求: POST https://law_cwd.app.xdo.icu/api/documents/batch-upload
处理: 真实后端 API
```

## 验证方法

1. 启动项目：`pnpm dev`
2. 打开浏览器开发者工具 → Network
3. 登录系统，查看登录请求：
   - URL 应该是 `http://localhost:3006/api/auth/login`
   - 使用 Mock 数据
4. 进入文书管理，上传文件：
   - URL 应该是 `https://law_cwd.app.xdo.icu/api/documents/batch-upload`
   - 连接真实后端

## 文件变更

### 新增文件
- `src/utils/http/documentRequest.ts` - 文书管理专用请求实例
- `API配置说明.md` - 详细配置文档
- `API配置更新说明.md` - 本文档

### 修改文件
- `src/api/documents.ts` - 改用 `documentRequest`
- `.env.development` - 添加 `VITE_DOCUMENT_API_URL`
- `.env.production` - 添加 `VITE_DOCUMENT_API_URL`
- `项目交付清单.md` - 更新配置说明

## 注意事项

1. **跨域配置**：真实后端需要配置 CORS，允许前端域名访问
2. **超时时间**：文书管理请求超时时间为 30 秒，比默认的 15 秒更长
3. **错误处理**：两个请求实例都有完整的错误处理和重试机制
4. **Token 认证**：两个实例都会自动添加 Authorization 头

## 后续扩展

如果需要将用户认证也切换到真实后端：

1. 修改 `.env.development`:
   ```env
   VITE_API_URL = https://your-auth-backend.com
   ```

2. 关闭 Mock:
   ```env
   VITE_USE_MOCK = false
   ```

3. 确保后端提供对应的认证接口

---

**更新完成！** ✅

现在系统可以正确区分 Mock 接口和真实后端接口了。
