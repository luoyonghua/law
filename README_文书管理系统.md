# 文书管理系统 - 完整说明

## 📋 项目概述

基于 Vue 3 + TypeScript + Element Plus 开发的法律文书管理系统，实现了文书上传、智能解析、结构化提取和智能比对等核心功能。

## ✨ 核心功能

### 1. 文书上传与解析
- ✅ 支持 PDF、Word、扫描件、图片格式
- ✅ 批量上传（最多 100 份）
- ✅ 拖拽上传
- ✅ 实时进度显示
- ✅ 断点续传

### 2. 文书列表与检索
- ✅ 多条件筛选（案件编号、文书类型、解析状态）
- ✅ 批量操作
- ✅ 状态实时更新
- ✅ 快捷操作按钮

### 3. 结构化提取
- ✅ 批量提取核心要素
- ✅ 智能识别案号、被告人、罪名、事实、证据等
- ✅ 结构化展示
- ✅ 支持导出

### 4. 智能比对
- ✅ 基于 LLM 的智能比对
- ✅ 差异分析和标注
- ✅ 风险评估
- ✅ 处理建议
- ✅ 比对报告生成

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 访问系统
```
http://localhost:3006
```

### 登录账号
- 超级管理员: `super` / `123456`
- 管理员: `admin` / `123456`
- 普通用户: `user` / `123456`

## 🔧 API 配置

### 双 API 方案

本项目使用**双 API 配置**：

1. **用户认证 API**（Mock）
   - 登录、注册、用户管理等
   - 使用本地 Mock 数据
   - 请求实例: `src/utils/http/index.ts`

2. **文书管理 API**（真实后端）
   - 文书上传、提取、比对等
   - 连接真实后端服务
   - 请求实例: `src/utils/http/documentRequest.ts`

### 环境变量

**开发环境** (`.env.development`):
```env
VITE_API_URL = /                                    # Mock API
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu # 真实后端
VITE_USE_MOCK = true
```

**生产环境** (`.env.production`):
```env
VITE_API_URL = https://m1.apifoxmock.com/m1/6400575-6097373-default
VITE_DOCUMENT_API_URL = https://law_cwd.app.xdo.icu
```

详细配置请查看：[API配置说明.md](./API配置说明.md)

## 📁 项目结构

```
src/
├── api/
│   ├── auth.ts                    # 用户认证 API（Mock）
│   ├── documents.ts               # 文书管理 API（真实后端）
│   └── system-manage.ts           # 系统管理 API（Mock）
├── types/
│   └── api/
│       └── documents.d.ts         # 文书管理类型定义
├── utils/
│   └── http/
│       ├── index.ts               # 默认请求实例（Mock）
│       └── documentRequest.ts     # 文书管理请求实例（真实后端）
├── views/
│   └── documents/
│       ├── list/                  # 文书列表
│       ├── extract/               # 批量提取
│       └── components/            # 组件
│           ├── UploadDialog.vue
│           ├── ExtractDialog.vue
│           └── CompareDialog.vue
└── router/
    └── modules/
        └── documents.ts           # 文书管理路由
```

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [快速开始.md](./快速开始.md) | 快速入门指南 |
| [DOCUMENT_MANAGEMENT_GUIDE.md](./DOCUMENT_MANAGEMENT_GUIDE.md) | 详细使用指南 |
| [文书管理系统实现说明.md](./文书管理系统实现说明.md) | 技术实现说明 |
| [API配置说明.md](./API配置说明.md) | API 配置详解 |
| [API配置更新说明.md](./API配置更新说明.md) | 配置更新记录 |
| [项目交付清单.md](./项目交付清单.md) | 完整交付清单 |
| [API文档.md](./API文档.md) | 后端 API 文档 |
| [前端界面要求.md](./前端界面要求.md) | 需求文档 |

## 🎯 使用流程

### 1. 上传文书
```
文书列表 → 上传文书 → 选择文件 → 开始上传 → 等待解析完成
```

### 2. 结构化提取
```
选择文书 → 批量提取 → 等待完成 → 查看结果 → 导出
```

### 3. 文书比对
```
选择文书(≥2) → 文书比对 → 选择类型 → 开始比对 → 查看结果 → 导出报告
```

## 🛠️ 技术栈

- **框架**: Vue 3.5 + TypeScript 5.6
- **UI 组件**: Element Plus 2.11
- **构建工具**: Vite 7.1
- **状态管理**: Pinia 3.0
- **路由**: Vue Router 4.5
- **HTTP 请求**: Axios
- **样式**: SCSS + Tailwind CSS

## 📊 功能完成度

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 文书上传 | 100% | ✅ |
| 文书列表 | 100% | ✅ |
| 结构化提取 | 100% | ✅ |
| 智能比对 | 100% | ✅ |
| 权限控制 | 100% | ✅ |
| 国际化 | 100% | ✅ |

## 🔐 权限控制

系统支持三级权限：

- **超级管理员 (R_SUPER)**: 所有功能
- **管理员 (R_ADMIN)**: 文书管理、审查、比对
- **普通用户 (R_USER)**: 查看和基础操作

## 🌐 浏览器支持

- Chrome（推荐）
- Edge
- Firefox
- Safari

建议使用最新版本的现代浏览器。

## 📝 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm serve

# 代码检查
pnpm lint

# 代码格式化
pnpm fix

# 清理开发缓存
pnpm clean:dev
```

## ❓ 常见问题

### Q1: 登录后看不到文书管理菜单？
**A**: 确认用户权限，需要 R_USER 及以上权限。刷新页面重新加载菜单。

### Q2: 上传文件失败？
**A**: 
1. 检查文件格式（PDF、Word、图片）
2. 确认文件大小（建议 < 10MB）
3. 检查网络连接
4. 查看浏览器控制台错误信息

### Q3: API 请求失败？
**A**: 
1. 检查 `.env.development` 配置
2. 确认后端服务是否运行
3. 检查跨域配置
4. 查看 Network 标签的请求详情

### Q4: Mock 和真实 API 如何区分？
**A**: 
- 用户认证（登录、注册）使用 Mock
- 文书管理（上传、提取、比对）使用真实后端
- 详见 [API配置说明.md](./API配置说明.md)

## 🔄 版本信息

- **当前版本**: v1.0.0
- **开发时间**: 2026-02-06
- **开发状态**: ✅ 核心功能已完成

## 📞 技术支持

如遇到问题：
1. 查看相关文档
2. 检查浏览器控制台
3. 查看 Network 请求
4. 联系技术支持

## 📄 许可证

本项目遵循 MIT 许可证。

---

**开发完成！** 🎉

祝您使用愉快！如有任何问题，请查阅相关文档或联系技术支持。
