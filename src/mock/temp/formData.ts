/**
 * 临时表单数据
 */

// 账户表格数据
export const ACCOUNT_TABLE_DATA = [
  {
    id: '1',
    username: 'admin',
    nickname: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    status: 'active',
    role: 'admin',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    username: 'user',
    nickname: '普通用户',
    email: 'user@example.com',
    phone: '13800138001',
    status: 'active',
    role: 'user',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    createTime: '2024-01-02 00:00:00'
  }
]

// 角色列表数据
export const ROLE_LIST_DATA = [
  {
    id: '1',
    name: '管理员',
    code: 'admin',
    roleCode: 'admin',
    roleName: '管理员',
    description: '系统管理员',
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '普通用户',
    code: 'user',
    roleCode: 'user',
    roleName: '普通用户',
    description: '普通用户',
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    name: '访客',
    code: 'guest',
    roleCode: 'guest',
    roleName: '访客',
    description: '访客用户',
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  }
]
