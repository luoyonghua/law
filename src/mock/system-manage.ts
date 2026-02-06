/**
 * 系统管理相关 Mock 数据
 */
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { generatePhone, generatePaginatedData } from './utils'

const { Random } = Mock

// 生成用户列表数据
function generateUserList(count: number = 50): Api.SystemManage.UserListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    avatar: Random.image('80x80', Random.color(), '#FFF', Random.first()),
    status: Random.pick(['1', '2']), // 1: 启用, 2: 禁用
    userName: Random.word(5, 10),
    userGender: Random.pick(['male', 'female', 'unknown']),
    nickName: Random.cname(),
    userPhone: generatePhone(),
    userEmail: Random.email(),
    userRoles: Random.pick([
      ['admin'],
      ['user'],
      ['editor'],
      ['admin', 'editor'],
      ['user', 'editor']
    ]),
    createBy: Random.cname(),
    createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateBy: Random.cname(),
    updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
  }))
}

// 生成角色列表数据
function generateRoleList(count: number = 20): Api.SystemManage.RoleListItem[] {
  const roleNames = [
    '管理员',
    '普通用户',
    '编辑者',
    '审核员',
    '访客',
    '超级管理员',
    '部门经理',
    '财务',
    '人事',
    '技术'
  ]

  return Array.from({ length: count }, (_, index) => ({
    roleId: index + 1,
    roleName: roleNames[index % roleNames.length] || `角色${index + 1}`,
    roleCode: `ROLE_${Random.word(3, 8).toUpperCase()}`,
    description: Random.cparagraph(1, 3),
    enabled: Random.boolean(),
    createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
  }))
}

// 模拟数据
const mockUserList = generateUserList(100)
const mockRoleList = generateRoleList(15)

export default [
  // 获取用户列表
  {
    url: '/api/user/list',
    method: 'get',
    response: ({ query }: { query: Api.SystemManage.UserSearchParams }) => {
      const { current = 1, size = 10, userName, userGender, status } = query

      // 过滤数据
      let filteredList = mockUserList

      if (userName) {
        filteredList = filteredList.filter(
          (user) => user.userName.includes(userName) || user.nickName.includes(userName)
        )
      }

      if (userGender) {
        filteredList = filteredList.filter((user) => user.userGender === userGender)
      }

      if (status) {
        filteredList = filteredList.filter((user) => user.status === status)
      }

      // 分页
      const paginatedData = generatePaginatedData(filteredList, current, size)

      return {
        code: 200,
        msg: '获取用户列表成功',
        data: paginatedData
      }
    }
  },

  // 获取角色列表
  {
    url: '/api/role/list',
    method: 'get',
    response: ({ query }: { query: Api.SystemManage.RoleSearchParams }) => {
      const { current = 1, size = 10, roleName, roleCode, enabled } = query

      // 过滤数据
      let filteredList = mockRoleList

      if (roleName) {
        filteredList = filteredList.filter((role) => role.roleName.includes(roleName))
      }

      if (roleCode) {
        filteredList = filteredList.filter((role) => role.roleCode.includes(roleCode))
      }

      if (enabled !== undefined) {
        filteredList = filteredList.filter((role) => role.enabled === enabled)
      }

      // 分页
      const paginatedData = generatePaginatedData(filteredList, current, size)

      return {
        code: 200,
        msg: '获取角色列表成功',
        data: paginatedData
      }
    }
  },

  // 获取菜单列表
  {
    url: '/api/v3/system/menus/simple',
    method: 'get',
    response: () => {
      // 模拟菜单数据结构
      const menuList = [
        {
          id: 1,
          name: 'dashboard',
          path: '/dashboard',
          component: 'Layout',
          meta: {
            title: '仪表盘',
            icon: 'dashboard',
            order: 1
          },
          children: [
            {
              id: 11,
              name: 'console',
              path: '/dashboard/console',
              component: '/dashboard/console/index',
              meta: {
                title: '主控台',
                icon: 'console'
              }
            },
            {
              id: 12,
              name: 'analysis',
              path: '/dashboard/analysis',
              component: '/dashboard/analysis/index',
              meta: {
                title: '分析页',
                icon: 'analysis'
              }
            }
          ]
        },
        {
          id: 2,
          name: 'system',
          path: '/system',
          component: 'Layout',
          meta: {
            title: '系统管理',
            icon: 'system',
            order: 2
          },
          children: [
            {
              id: 21,
              name: 'user',
              path: '/system/user',
              component: '/system/user/index',
              meta: {
                title: '用户管理',
                icon: 'user'
              }
            },
            {
              id: 22,
              name: 'role',
              path: '/system/role',
              component: '/system/role/index',
              meta: {
                title: '角色管理',
                icon: 'role'
              }
            }
          ]
        }
      ]

      return {
        code: 200,
        msg: '获取菜单列表成功',
        data: menuList
      }
    }
  }
] as MockMethod[]
