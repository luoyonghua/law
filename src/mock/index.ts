/**
 * Mock 数据入口文件
 *
 * 统一导出所有 mock 接口
 */
import authMock from './auth'
import systemManageMock from './system-manage'
import dashboardMock from './dashboard'

export default [...authMock, ...systemManageMock, ...dashboardMock]
