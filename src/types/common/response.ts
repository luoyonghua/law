/*
 * @Author: lyh 2648740098@qq.com
 * @Date: 2026-01-14 14:48:22
 * @LastEditors: lyh 2648740098@qq.com
 * @LastEditTime: 2026-01-23 12:02:30
 * @FilePath: \art-design-pro\src\types\common\response.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * API 响应类型定义模块
 *
 * 提供统一的 API 响应结构类型定义
 *
 * ## 主要功能
 *
 * - 基础响应结构定义
 * - 泛型支持（适配不同数据类型）
 * - 统一的响应格式约束
 *
 * ## 使用场景
 *
 * - API 请求响应类型约束
 * - 接口数据类型定义
 * - 响应数据解析
 *
 * @module types/common/response
 * @author Art Design Pro Team
 */

/** 基础 API 响应结构 */
export interface BaseResponse<T = unknown> {
  /** 状态码 */
  code: number
  /** 消息 */
  msg: string
  /** 数据 */
  data: T
}
