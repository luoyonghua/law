# Art Design Pro Template 🎨

基于 Art Design Pro 的企业级中后台管理系统模板，集成了本地 Mock 系统、完整的权限控制和开发指南。

## ✨ 特性

- 🚀 **Vue 3 + TypeScript** - 使用最新的 Vue 3 Composition API 和 TypeScript
- 🎨 **Element Plus** - 基于 Element Plus 的组件库
- 🔐 **权限控制** - 完整的 RBAC 权限控制系统
- 🌍 **国际化** - 内置中英文国际化支持
- 📱 **响应式设计** - 支持多种设备和屏幕尺寸
- 🎯 **本地 Mock** - 完整的本地 Mock 数据系统
- 📖 **开发指南** - 详细的开发文档和最佳实践

## 🛠️ 技术栈

- **框架**: Vue 3, TypeScript
- **构建工具**: Vite
- **UI 组件**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **CSS 框架**: Tailwind CSS
- **图标**: Iconify
- **Mock**: vite-plugin-mock + MockJS
- **代码规范**: ESLint + Prettier
- **Git 规范**: Husky + Commitlint

## 📦 安装

```bash
# 克隆项目
git clone https://github.com/luoyonghua/art-design-pro-template.git

# 进入项目目录
cd art-design-pro-template

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 🚀 快速开始

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint

# 代码格式化
pnpm lint:prettier

# 构建生产版本
pnpm build
```

### 测试账号

| 用户名 | 密码   | 角色       | 权限                     |
| ------ | ------ | ---------- | ------------------------ |
| Super  | 123456 | 超级管理员 | 完整权限（包括菜单管理） |
| Admin  | 123456 | 管理员     | 用户管理、角色管理       |
| User   | 123456 | 普通用户   | 基础用户权限             |

## 📁 项目结构

```
src/
├── api/                     # API 接口
├── assets/                  # 静态资源
├── components/              # 公共组件
├── config/                  # 配置文件
├── directives/              # 自定义指令
├── enums/                   # 枚举定义
├── hooks/                   # 组合式函数
├── locales/                 # 国际化
├── mock/                    # Mock 数据
├── plugins/                 # 插件
├── router/                  # 路由配置
├── store/                   # 状态管理
├── types/                   # 类型定义
├── utils/                   # 工具函数
└── views/                   # 页面组件
```

## 🔧 核心功能

### 本地 Mock 系统

- ✅ 完全替代在线 Mock 服务
- ✅ 支持热更新和自定义数据
- ✅ 包含认证、用户管理、角色管理等完整接口
- ✅ 提供测试页面和工具函数

### 权限控制

- ✅ 基于角色的访问控制 (RBAC)
- ✅ 路由级权限控制
- ✅ 按钮级权限控制
- ✅ 动态菜单生成

### 开发体验

- ✅ TypeScript 类型安全
- ✅ ESLint + Prettier 代码规范
- ✅ Git Hooks 自动检查
- ✅ 热更新开发服务器

## 📖 开发指南

- [新增页面开发指南](./HOW_TO_ADD_NEW_PAGE.md) - 详细说明如何新增页面
- [Mock 系统说明](./src/mock/README.md) - Mock 数据的使用和配置
- [侧边栏菜单修复](./SIDEBAR_MENU_FIX.md) - 权限问题的解决方案
- [TypeScript 问题修复](./TYPESCRIPT_ESLINT_FIXES.md) - 常见问题的解决方案

## 🎯 主要改进

### 相比原版的改进

1. **本地 Mock 系统** - 替代了在线 Apifox Mock，提供更好的开发体验
2. **权限修复** - 修复了角色权限不匹配导致的菜单显示问题
3. **类型安全** - 完善了 TypeScript 类型定义
4. **开发文档** - 提供了详细的开发指南和最佳实践
5. **代码质量** - 修复了 ESLint 和 Prettier 问题

### 新增功能

- 🆕 完整的本地 Mock 数据系统
- 🆕 权限测试页面
- 🆕 详细的开发文档
- 🆕 类型安全的 API 调用
- 🆕 Mock 工具函数库

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE)

## 🙏 致谢

感谢 [Art Design Pro](https://github.com/Daymychen/art-design-pro) 提供的优秀基础框架。

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
