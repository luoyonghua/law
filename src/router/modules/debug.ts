import { AppRouteRecord } from '@/types/router'

export const debugRoutes: AppRouteRecord = {
  name: 'Debug',
  path: '/debug',
  component: '/index/index',
  meta: {
    title: '调试工具',
    icon: 'ri:bug-line',
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER'] // 所有用户都可以访问
  },
  children: [
    {
      path: 'permission',
      name: 'DebugPermission',
      component: '/debug/permission',
      meta: {
        title: '权限调试',
        keepAlive: false
      }
    }
  ]
}
