# Mock 数据说明

本项目使用 `vite-plugin-mock` 插件实现本地 mock 数据服务，替代了原来的在线 Apifox Mock 服务。

## 目录结构

```
src/mock/
├── index.ts          # Mock 入口文件
├── auth.ts           # 认证相关接口
├── system-manage.ts  # 系统管理接口
├── dashboard.ts      # 仪表盘接口
├── utils.ts          # Mock 工具函数
└── README.md         # 说明文档
```

## 已实现的接口

### 认证模块 (auth.ts)

- `POST /api/auth/login` - 用户登录
- `GET /api/user/info` - 获取用户信息

### 系统管理模块 (system-manage.ts)

- `GET /api/user/list` - 获取用户列表（支持分页和搜索）
- `GET /api/role/list` - 获取角色列表（支持分页和搜索）
- `GET /api/v3/system/menus/simple` - 获取菜单列表

### 仪表盘模块 (dashboard.ts)

- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/activities` - 获取最近活动
- `GET /api/dashboard/todos` - 获取待办事项

## 测试 Mock 接口

### 方法一：使用测试页面

1. 启动开发服务器：`pnpm dev`
2. 在浏览器中访问：`http://localhost:3007/src/mock/test-mock.html`
3. 使用测试页面中的按钮测试各个接口

### 方法二：使用浏览器开发者工具

1. 打开项目主页面
2. 按 F12 打开开发者工具
3. 在 Console 中执行以下代码测试：

```javascript
// 测试登录
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userName: 'Super', password: '123456' })
})
  .then((res) => res.json())
  .then(console.log)

// 测试用户列表
fetch('/api/user/list?current=1&size=5')
  .then((res) => res.json())
  .then(console.log)
```

### 方法三：使用项目登录页面

1. 访问项目登录页面
2. 使用预设账号登录：
   - 超级管理员：`Super` / `123456`
   - 管理员：`Admin` / `123456`
   - 普通用户：`User` / `123456`
3. 登录成功后可以在网络面板中看到 mock 数据响应

## 测试账号

### 超级管理员账号

- 用户名: `Super`
- 密码: `123456`
- 权限: 完整的超级管理员权限（包括菜单管理）

### 管理员账号

- 用户名: `Admin`
- 密码: `123456`
- 权限: 管理员权限（用户管理、角色管理）

### 普通用户账号

- 用户名: `User`
- 密码: `123456`
- 权限: 基础用户权限

## 如何添加新的 Mock 接口

1. 在对应的模块文件中添加新的接口定义
2. 或者创建新的模块文件，然后在 `index.ts` 中导入

### 示例：添加新接口

```typescript
// 在对应的模块文件中添加
{
  url: '/api/your-endpoint',
  method: 'get', // 或 'post', 'put', 'delete'
  response: ({ query, body }) => {
    return {
      code: 200,
      msg: '成功',
      data: {
        // 你的数据
      }
    }
  }
}
```

## 工具函数

`utils.ts` 提供了一些常用的数据生成函数：

- `generatePhone()` - 生成中国手机号
- `generateIdCard()` - 生成身份证号
- `generateAddress()` - 生成地址
- `generateCompany()` - 生成公司名称
- `generatePaginatedData()` - 生成分页数据
- `generateTreeData()` - 生成树形数据
- `delay()` - 模拟网络延迟
- `randomSuccess()` - 随机返回成功或失败

## 配置说明

### 环境变量

在 `.env.development` 中：

```bash
# 启用本地 Mock
VITE_USE_MOCK = true
```

### Vite 配置

在 `vite.config.ts` 中已配置：

```typescript
viteMockServe({
  mockPath: 'src/mock',
  enable: mode === 'development',
  logger: true,
  supportTs: true
})
```

## 切换回在线 Mock

如果需要切换回 Apifox 在线 Mock 服务：

1. 在 `vite.config.ts` 中注释掉 `viteMockServe` 插件
2. 取消注释 `server.proxy` 配置
3. 在 `.env.development` 中恢复 `VITE_API_PROXY_URL` 配置

## 注意事项

1. Mock 数据仅在开发环境生效
2. 生产环境需要配置真实的后端 API 地址
3. Mock 数据会在每次重启开发服务器时重新生成
4. 可以通过修改生成函数的参数来调整数据量和数据特征
