/**
 * 仪表盘相关 Mock 数据
 */
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'

const { Random } = Mock

export default [
  // 获取仪表盘统计数据
  {
    url: '/api/dashboard/stats',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: '获取统计数据成功',
        data: {
          totalUsers: Random.integer(1000, 10000),
          totalOrders: Random.integer(500, 5000),
          totalRevenue: Random.float(10000, 100000, 2, 2),
          growthRate: Random.float(0, 100, 2, 2),
          // 图表数据
          chartData: {
            // 用户增长趋势
            userGrowth: Array.from({ length: 12 }, (_, index) => ({
              month: `${index + 1}月`,
              value: Random.integer(100, 1000)
            })),
            // 订单统计
            orderStats: Array.from({ length: 7 }, (_, index) => ({
              day: `周${index + 1}`,
              orders: Random.integer(50, 200),
              revenue: Random.float(1000, 10000, 2, 2)
            })),
            // 热门产品
            popularProducts: Array.from({ length: 5 }, (_, index) => ({
              name: `产品${index + 1}`,
              sales: Random.integer(100, 1000),
              revenue: Random.float(5000, 50000, 2, 2)
            }))
          }
        }
      }
    }
  },

  // 获取最近活动
  {
    url: '/api/dashboard/activities',
    method: 'get',
    response: () => {
      const activities = Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        type: Random.pick(['login', 'order', 'payment', 'register', 'update']),
        user: Random.cname(),
        description: Random.cparagraph(1, 2),
        time: Random.datetime('yyyy-MM-dd HH:mm:ss'),
        status: Random.pick(['success', 'warning', 'error'])
      }))

      return {
        code: 200,
        msg: '获取活动记录成功',
        data: activities
      }
    }
  },

  // 获取待办事项
  {
    url: '/api/dashboard/todos',
    method: 'get',
    response: () => {
      const todos = Array.from({ length: 8 }, (_, index) => ({
        id: index + 1,
        title: Random.ctitle(5, 15),
        description: Random.cparagraph(1, 2),
        priority: Random.pick(['high', 'medium', 'low']),
        status: Random.pick(['pending', 'in-progress', 'completed']),
        dueDate: Random.date('yyyy-MM-dd'),
        assignee: Random.cname()
      }))

      return {
        code: 200,
        msg: '获取待办事项成功',
        data: todos
      }
    }
  }
] as MockMethod[]
