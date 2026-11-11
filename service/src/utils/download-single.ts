/*
 * @Author: ShawnPhang
 * @Date: 2021-09-30 14:47:22
 * @Description: 下载图片（单浏览器版，适用于低配置服务器）
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-10-16 10:56:35
 */
const isDev = process.env.NODE_ENV === 'development'
const puppeteer = require('puppeteer')
// 注意：原原生 images(node-images) 插件在 Node 22 下 ABI 不兼容，加载/缩放会硬崩溃整个进程，
// 已移除；缩略图改由浏览器侧截图导出 JPEG，避免原生模块拖垮后端。
const { executablePath } = require('../configs.ts')
const forceTimeOut = 60 // 强制超时时间，单位：秒
// 4K规格，总计约830万像素 3840 * 2160 2K规格，总计约830万像素 2048 * 1080
// const maxPXs = 8294400
const maxPXs = 4211840 // 超出此规格会触发限制器降低dpr，节省服务器资源
const maximum = 5000 // 最大宽高限制，超过截断以防止服务崩溃

export const saveScreenshot = async (url: string, { path, width, height, thumbPath, size = 0, quality = 0, prevent, ua, devices, scale, wait }: any) => {
  return new Promise(async (resolve: Function, reject: Function) => {
    let isPageLoad = false
    let browser: any = null
    let settled = false
    // 格式化浏览器宽高
    width = Number(width).toFixed(0)
    height = Number(height).toFixed(0)

    const puppeteerArgs = {
      old: ['--no-first-run', '--no-sandbox', '--disable-setuid-sandbox', `--window-size=${width},${height}`, '--disable-gpu', '--disable-dev-shm-usage'],
      new: ['--no-first-run', '--no-sandbox', '--disable-setuid-sandbox', `--window-size=${width},${height}`]
    }

    // 安全关闭浏览器：Target closed 等异常下 close 自身也会抛错，必须吞掉
    const safeClose = async () => {
      try {
        if (browser) {
          await browser.close()
        }
      } catch (e) {
        // 浏览器已断开，忽略
      }
      browser = null
    }

    const finish = (fn: Function) => {
      if (settled) return
      settled = true
      clearTimeout(regulators)
      fn()
    }

    // 启动浏览器
    try {
      browser = await puppeteer.launch({
        headless: true, // !isDev,
        executablePath,
        ignoreHTTPSErrors: true, // 忽略https安全提示
        args: puppeteerArgs.old, // 如puppeteer版本v20+报错请尝试使用新参数
        defaultViewport: null,
      })
    } catch (error) {
      console.log('Puppeteer Error: ', error, '窗口大小：', width, height)
      finish(() => reject(error))
      return false
    }

    const regulators = setTimeout(() => {
      safeClose()
      console.log('超时强制释放浏览器')
      finish(() => resolve())
    }, forceTimeOut * 1000)

    try {
      // 打开页面
      const page = await browser.newPage()
      // 设置浏览器视窗
      function limiter(w: number, h: number) {
        return w * h < maxPXs ? 1 : +(1 / (w * h) * maxPXs).toFixed(2)
      }
      page.setViewport({
        width: Number(width) > maximum ? 5000 : Number(width),
        height: Number(height) > maximum ? 5000 : Number(height),
        deviceScaleFactor: !isNaN(scale) ? (+scale > 4 ? 4 : +scale) : limiter(Number(width), Number(height)),
      })
      ua && page.setUserAgent(ua)
      if (devices) {
        devices = puppeteer.devices[devices]
        devices && (await page.emulate(devices))
      }
      // 浏览器侧导出 JPEG 缩略图（替代原生 images 缩放，避免 ABI 崩溃）
      const captureThumb = async () => {
        if (!thumbPath) return
        try {
          await page.screenshot({ path: thumbPath, type: 'jpeg', quality: +quality || 70, fullPage: true, omitBackground: false })
        } catch (e) {
          console.log('缩略图生成失败:', e && e.message)
        }
      }

      // 自动模式下页面加载完毕、且画布图层渲染完成后再截图
      if (!prevent) {
        page.on('load', async () => {
          try {
            await autoScroll(page)
            // 等待模板图层挂载完成（模板数据为异步拉取），超时兜底继续截图
            try {
              await page.waitForSelector('.w-image, .w-text, .w-svg', { timeout: 8000 })
            } catch (e) {}
            await sleep(wait || 1200)
            await page.screenshot({ path, fullPage: true })
            await captureThumb()
            await safeClose()
            finish(() => resolve())
          } catch (e) {
            await safeClose()
            finish(() => reject(e))
          }
        })
      }
      // 主动模式下注入全局方法
      await page.exposeFunction('loadFinishToInject', async () => {
        try {
          await page.screenshot({ path, omitBackground: true })
          await captureThumb()
          await browserClose()
          finish(() => resolve())
        } catch (e) {
          await safeClose()
          finish(() => reject(e))
        }
      })

      // 地址栏输入网页地址
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      isPageLoad = true
    } catch (error) {
      await safeClose()
      finish(() => reject(error))
      return false
    }

    async function autoScroll(page: any) {
      await page.evaluate(async () => {
        await new Promise((resolve: any, reject: any) => {
          try {
            const maxScroll = Number.MAX_SAFE_INTEGER
            let lastScroll = 0
            const interval = setInterval(() => {
              window.scrollBy(0, 100)
              const scrollTop = document.documentElement.scrollTop || window.scrollY
              if (scrollTop === maxScroll || scrollTop === lastScroll) {
                clearInterval(interval)
                resolve()
              } else {
                lastScroll = scrollTop
              }
            }, 100)
          } catch (err) {
            console.log(err)
            reject(err)
          }
        })
      })
    }

    function sleep(timeout: number = 1) {
      return new Promise((resolve: any) => {
        setTimeout(() => {
          resolve()
        }, timeout)
      })
    }

    // 异步关闭：Error: Navigation failed because browser has disconnected!
    async function browserClose() {
      if (isPageLoad) {
        await safeClose()
      } else {
        browser = null
      }
    }
  })
}

export default { saveScreenshot }
