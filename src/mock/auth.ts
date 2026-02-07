/**
 * 认证相关 Mock 数据
 */
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

const { Random } = Mock

// 模拟用户数据
const mockUsers = [
  {
    userName: 'Super',
    password: '123456',
    userInfo: {
      buttons: [
        'user:add', 'user:edit', 'user:delete', 
        'role:add', 'role:edit', 'role:delete',
        'upload', 'batch-extract', 'compare', 'review', 'extract', 'download'
      ],
      roles: ['R_SUPER'], // 超级管理员角色 - 所有功能
      userId: 1,
      userName: 'Super',
      email: 'super@example.com',
      avatar: Random.image('100x100', Random.color(), '#FFF', 'Super')
    }
  },
  {
    userName: 'Admin',
    password: '123456',
    userInfo: {
      buttons: [
        'user:add', 'user:edit', 'user:delete', 
        'role:add', 'role:edit',
        'batch-extract', 'compare', 'review', 'extract', 'download'
      ],
      roles: ['R_ADMIN'], // 管理员角色 - 除上传外的所有功能
      userId: 2,
      userName: 'Admin',
      email: 'admin@example.com',
      avatar: Random.image('100x100', Random.color(), '#FFF', 'Admin')
    }
  },
  {
    userName: 'User',
    password: '123456',
    userInfo: {
      buttons: ['user:view'],
      roles: ['R_USER'], // 普通用户角色 - 只能查看
      userId: 3,
      userName: 'User',
      email: 'user@example.com',
      avatar: Random.image('100x100', Random.color(), '#FFF', 'User')
    }
  }
]

// 存储 token 和用户信息的映射关系
const tokenUserMap: Record<string, any> = {}

export default [
  // 登录接口
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: Api.Auth.LoginParams }) => {
      const { userName, password } = body

      // 查找用户
      const user = mockUsers.find((u) => u.userName === userName && u.password === password)

      if (!user) {
        return {
          code: 400,
          msg: '用户名或密码错误',
          data: null
        }
      }

      // 生成 token
      const token = `Bearer ${Random.string('upper', 32)}`
      const refreshToken = Random.string('upper', 32)

      // 存储 token 和用户信息的映射关系
      tokenUserMap[token] = user.userInfo

      return {
        code: 200,
        msg: '登录成功',
        data: {
          token,
          refreshToken
        }
      }
    }
  },

  // 获取用户信息接口
  {
    url: '/api/user/info',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = headers.authorization

      if (!token || !token.startsWith('Bearer ')) {
        return {
          code: 401,
          msg: '未授权访问',
          data: null
        }
      }

      // 根据 token 获取对应的用户信息
      const userInfo = tokenUserMap[token]

      if (!userInfo) {
        return {
          code: 401,
          msg: 'Token 无效或已过期',
          data: null
        }
      }

      return {
        code: 200,
        msg: '获取用户信息成功',
        data: userInfo
      }
    }
  }
] as MockMethod[]
