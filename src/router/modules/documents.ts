import { AppRouteRecord } from '@/types/router'

export const documentsRoutes: AppRouteRecord = {
  name: 'Documents',
  path: '/documents',
  component: '/index/index',
  meta: {
    title: 'menus.documents.title',
    icon: 'ri:file-text-line',
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
  },
  children: [
    {
      path: 'list',
      name: 'DocumentList',
      component: '/documents/list',
      meta: {
        title: 'menus.documents.list',
        keepAlive: true
      }
    },
    {
      path: 'extract',
      name: 'DocumentExtract',
      component: '/documents/extract',
      meta: {
        title: 'menus.documents.extract',
        keepAlive: false
      }
    },
    {
      path: 'history',
      name: 'DocumentHistory',
      component: '/documents/history',
      meta: {
        title: 'menus.documents.history',
        keepAlive: true
      }
    }
  ]
}
