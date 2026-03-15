import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { documentsRoutes } from './documents'
import { debugRoutes } from './debug'
import { rulesRoutes } from './rules'
import { casesRoutes } from './cases'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  casesRoutes,
  documentsRoutes,
  rulesRoutes,
  debugRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
