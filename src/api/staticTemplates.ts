/**
 * 纯静态模板数据：生产构建下从 public/templates/*.json 读取，不请求本机 Express。
 * 响应结构与原后端接口对齐：列表返回 `{ list }`，详情返回含 `data`（内层 JSON 字符串）的对象。
 */
import { resolveAsset } from '@/common/methods/resolveAsset'

export interface StaticTemplateRow {
  id: number
  cover: string
  title: string
  width: number
  height: number
  state: number
  data?: string
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(resolveAsset(path), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`static json ${path} request failed: ${res.status}`)
  return (await res.json()) as T
}

export async function fetchStaticTemplateList(): Promise<{ list: StaticTemplateRow[] }> {
  const rows = await getJson<StaticTemplateRow[]>('templates/list.json')
  return { list: rows }
}

export async function fetchStaticTemplateDetail(id: number | string): Promise<StaticTemplateRow> {
  return getJson<StaticTemplateRow>(`templates/${id}.json`)
}
