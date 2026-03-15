import { AppRouteRecord } from '@/types/router'

export const casesRoutes: AppRouteRecord = {
  name: 'Cases',
  path: '/cases',
  component: '/index/index',
  meta: {
    title: 'menus.cases.title',
    icon: 'ri:folder-line',
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
  },
  children: [
    {
      path: 'list',
      name: 'CaseList',
      component: '/cases/list',
      meta: {
        title: 'menus.cases.list',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER'],
        authList: [
          { title: '新建案件', authMark: 'create' },
          { title: '编辑案件', authMark: 'edit' },
          { title: '删除案件', authMark: 'delete' },
          { title: '上传文档', authMark: 'upload' }
        ]
      }
    },
    {
      path: 'detail/:id',
      name: 'CaseDetail',
      component: '/cases/detail',
      meta: {
        title: 'menus.cases.detail',
        isHide: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    }
  ]
}
