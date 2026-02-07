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
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER'],
        authList: [
          { title: '上传文书', authMark: 'upload' },
          { title: '批量提取', authMark: 'batch-extract' },
          { title: '文书比对', authMark: 'compare' },
          { title: '文书审查', authMark: 'review' },
          { title: '结构化提取', authMark: 'extract' },
          { title: '下载', authMark: 'download' }
        ]
      }
    },
    {
      path: 'history',
      name: 'DocumentHistory',
      component: '/documents/history',
      meta: {
        title: 'menus.documents.history',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
      }
    }
  ]
}
