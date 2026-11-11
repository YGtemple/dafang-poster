/*
 * @Author: ShawnPhang
 * @Date: 2024-04-05 07:31:45
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 05:30:15
 */
const prefix = process.env

const isDev = prefix.NODE_ENV === 'development'
import { version } from '../package.json'

// 生产构建为纯静态前端（GitHub Pages），不依赖本机 Express；开发环境仍可连本地后端。
const STATIC = !isDev
const BASE_URL = import.meta.env.BASE_URL || '/'

export default {
  isDev,
  STATIC,
  BASE_URL,
  VERSION: version,
  APP_NAME: '大方控股',
  COPYRIGHT: '大方控股',
  API_URL: isDev ? 'http://localhost:7001' : '', // 后端地址（静态生产为空，不请求本机接口）
  SCREEN_URL: isDev ? 'http://localhost:7001' : '', // 截图服务地址（静态生产为空）
  IMG_URL: '', // 远程素材前缀（静态版不使用七牛/远程图床）
  // ICONFONT_URL: '//at.alicdn.com/t/font_3223711_74mlzj4jdue.css',
  ICONFONT_URL: '//at.alicdn.com/t/font_2717063_ypy8vprc3b.css?display=swap',
  ICONFONT_EXTRA: '//at.alicdn.com/t/c/font_3228074_xojoer6zhp.css',
  QINIUYUN_PLUGIN: '',
  supportSubFont: false, // 是否开启服务端字体压缩
}

export const LocalStorageKey = {
  tokenKey: "xp_token"
}
