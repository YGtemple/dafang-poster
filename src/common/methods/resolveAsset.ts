/**
 * 静态资源路径适配：把模板/配置里的根路径 `/assets/...` 拼上 Vite base（生产为 `/dafang-poster/`）。
 * 开发环境 base 为 `/`，拼接后仍是根路径；dataURL/blob/远程 http(s) 地址原样返回。
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export function resolveAsset(url?: string | null): string {
  if (url == null || url === '') return ''
  if (/^(data:|blob:|https?:|mailto:|#)/.test(url)) return url
  const clean = url.replace(/^\//, '')
  // 已带 base 前缀的绝对路径（如 localStorage 缓存项）不再二次拼接。
  if (BASE && clean.startsWith(BASE.slice(1) + '/')) return '/' + clean
  return `${BASE}/${clean}`
}

/** 归一化单个画布图层内的静态资源字段（imgUrl/mask/svgUrl/字体 url/背景图）。 */
export function normalizeWidgetAssets(widget: Record<string, any>): Record<string, any> {
  if (!widget || typeof widget !== 'object') return widget
  if (typeof widget.imgUrl === 'string') widget.imgUrl = resolveAsset(widget.imgUrl)
  if (typeof widget.mask === 'string') widget.mask = resolveAsset(widget.mask)
  if (typeof widget.svgUrl === 'string') widget.svgUrl = resolveAsset(widget.svgUrl)
  if (typeof widget.backgroundImage === 'string' && widget.backgroundImage) {
    widget.backgroundImage = resolveAsset(widget.backgroundImage)
  }
  if (widget.fontClass && typeof widget.fontClass === 'object' && typeof widget.fontClass.url === 'string') {
    widget.fontClass.url = resolveAsset(widget.fontClass.url)
  }
  return widget
}
