/*
 * @Author: ShawnPhang
 * @Date: 2022-01-08 09:43:37
 * @Description: 字体处理
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 10:33:36
 */
// import { isSupportFontFamily, blob2Base64 } from './utils'
import { TGetFontItemData, getFonts } from '@/api/material'
import { resolveAsset } from '../resolveAsset'

const nowVersion = '6' // 当前字体文件版本更新，将刷新前端缓存（base 路径变更后需清旧缓存）

function registerLocalFont(family: string, url: string) {
  if (!family || !url) return
  try {
    const ff = new window.FontFace(family, `url("${url}")`)
    ff.load()
      .then((f) => document.fonts.add(f))
      .catch(() => undefined)
  } catch {
    /* 不支持 FontFace 的环境忽略 */
  }
}

/** 字体item类型 */
export type TFontItemData = { url: string } & Omit<TGetFontItemData, 'woff'>

const fontList: TFontItemData[] = []
// const download: any = {}
export const useFontStore = {
  list: fontList,
  // download,
  async init() {
    this.list = []
    localStorage.getItem('FONTS_VERSION') !== nowVersion && localStorage.removeItem('FONTS')
    const localFonts: TFontItemData[] = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
    if (localFonts.length > 0) {
      localFonts.forEach((f) => {
        if (typeof f.url === 'string') f.url = resolveAsset(f.url)
        registerLocalFont(f.value, f.url)
      })
      this.list.push(...localFonts)
    }

    if (this.list.length === 0) {
      // TODO: 模拟
      const res = {
        list: [
          {
            id: 1001,
            alias: '站酷高端黑',
            preview: '',
            ttf: null,
            woff: '/assets/fonts/ZCOOLHei.woff2',
            value: 'ZCOOLHei',
            font_family: '',
            size: 0,
            lang: 'zh',
            woff_size: 0,
          },
          {
            id: 1002,
            alias: '钟齐志莽行书',
            preview: '',
            ttf: null,
            woff: '/assets/fonts/ZhongqiXingshu.woff2',
            value: 'ZhongqiXingshu',
            font_family: '',
            size: 0,
            lang: 'zh',
            woff_size: 0,
          },
          {
            id: 1003,
            alias: '杨任东竹石体',
            preview: '',
            ttf: null,
            woff: '/assets/fonts/YangRenDong.woff2',
            value: 'YangRenDong',
            font_family: '',
            size: 0,
            lang: 'zh',
            woff_size: 0,
          },
        ],
      }
      this.list.unshift(
        ...res.list.map((x) => {
          const { id, alias, value, preview, woff, lang } = x
          const url = resolveAsset(woff)
          registerLocalFont(value, url)
          return { id, oid: 0, value, preview, alias, url, lang }
        }),
      )
      localStorage.setItem('FONTS', JSON.stringify(this.list))
      localStorage.setItem('FONTS_VERSION', nowVersion)
    }
    // store.dispatch('setFonts', this.list)
  },
}

// export const useFontStore = () => {
//   return {
//     list: fontList,
//     download,
//     async init() {
//       this.list = []
//       const localFonts: any = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
//       if (localFonts.length > 0) {
//         this.list.push(...localFonts)
//       }

//       if (this.list.length === 0) {
//         const res = await getFonts({ pageSize: 400 })
//         this.list.unshift(
//           ...res.map((x: any) => {
//             const { content, id, name, preview } = x
//             return { id, name, preview: preview.url, alias: content.alias, family: content.family, lang: content.lang, ttf: content.ttf, url: content.woff }
//           }),
//         )
//         localStorage.setItem('FONTS', JSON.stringify(this.list))
//       }
//       console.log(this.list)
//     },
//     getList() {
//       return fontList
//     },
//   }
// }

// export const useFontStore = () => {
//   return {
//     list: fontList,
//     download,
//     async init() {
//       this.list = []
//       const localFonts: any = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
//       if (localFonts.length > 0) {
//         this.list.push(...localFonts)
//       }

//       if (this.list.length === 0) {
//         for (let i = 1; i < 99; i += 1) {
//           const res = await getFonts(i)
//           this.list.unshift(
//             ...res.map((x: any) => {
//               const { content, id, name, preview } = x
//               return { id, name, preview: preview.url, alias: content.alias, family: content.family, lang: content.lang, ttf: content.ttf, url: content.woff }
//             }),
//           )
//           if (res.length < 100) break
//         }
//         localStorage.setItem('FONTS', JSON.stringify(this.list))
//       }
//     },
//     async addFont2Style(name: string, url: string) {
//       // if (this.download[name]) return;
//       if (isSupportFontFamily(name)) return

//       const response = await fetch(url, { headers: { responseType: 'blob' } })
//       const blob = await response.blob()
//       const ff = new FontFace(name, `url(${URL.createObjectURL(blob)})`)
//       const f = await ff.load()
//       ;(document.fonts as FontFaceSet).add(f)

//       const b64 = await blob2Base64(blob)
//       // 使用 base64 是为了方便将 DOM 生成图片
//       this.download[name] = b64
//       // document.head.appendChild(generateFontStyle(name, b64));
//     },
//   }
// }
