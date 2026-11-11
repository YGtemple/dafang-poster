<!--
 * @Author: ShawnPhang
 * @Date: 2022-02-11 18:48:23
 * @Description: 照片图库 Form:Unsplash无版权图片
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-14 18:50:09
-->
<template>
  <div class="wrap">
    <search-header type="none" @change="searchChange" />
    <div v-if="controlStore.bgUploadHint" class="bg-hint">请上传产品照片作为底图</div>
    <div class="upload-entry">
      <uploader @done="onUploadDone">
        <el-button size="small" type="primary" plain>上传产品照片</el-button>
      </uploader>
    </div>
    <p class="upload-tip">上传后将自动替换模板底图，标题、标注、logo和底部联系条会保留</p>
    <div style="height: 0.5rem" />
    <classHeader v-show="!state.currentCategory" :types="state.types" @select="selectTypes">
      <template v-slot="{ index }">
        <photo-list :isShort="true" :listData="state.showList[index]" @load="getDataList" @drag="dragStart($event, state.showList[index])" @select="selectImg($event, state.showList[index])" />
      </template>
    </classHeader>
    <div v-if="state.currentCategory">
      <classHeader :is-back="true" @back="back">{{ state.currentCategory.name }}</classHeader>
      <br /><br /><br />
      <div style="margin: 0 1rem; height: 100vh">
        <photo-list :isDone="state.loadDone" :listData="state.recommendImgList" @load="getDataList" @drag="dragStart" @select="selectImg" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 图片列表
// const NAME = 'img-list-wrap'
import { toRefs, reactive, computed, onMounted } from 'vue'
// import wImage from '../../widgets/wImage/wImage.vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import api from '@/api'
import uploader, { TUploadDoneData } from '@/components/common/Uploader/index.vue'

import setImageData from '@/common/methods/DesignFeatures/setImage'
import useNotification from '@/common/methods/notification'
import _config from '@/config'
import { storeToRefs } from 'pinia'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import { TGetImageListResult } from '@/api/material'
import { TdWidgetData } from '@/store/design/widget'

type TProps = {
  active?: boolean
}

type TState = {
  recommendImgList: TGetImageListResult[]
  loadDone: boolean
  page: number
  currentCategory: TCurrentCategory | null
  types: []
  showList: TGetImageListResult[][]
}

type TCurrentCategory = {
  name: string
  id?: number
}

const props = defineProps<TProps>()

const controlStore = useControlStore()
const widgetStore = useWidgetStore()

const { dPage } = storeToRefs(useCanvasStore())
const state = reactive<TState>({
  recommendImgList: [],
  loadDone: false,
  page: 0,
  currentCategory: null,
  types: [] as TCurrentCategory[],
  showList: [],
})
let loading = false

onMounted(async () => {
  if (state.types.length <= 0) {
    // const types = await api.material.getKinds({ type: 4 })
    state.types = [
      { id: 1, name: '照片列表，自适应布局' },
      { id: 2, name: '照片列表，自适应布局' },
    ]
    // 纯静态模式不请求本机图库接口，预置分组为空，仅保留本地上传入口。
    if (_config.STATIC) {
      state.showList = state.types.map(() => [])
      return
    }
    for (const iterator of state.types) {
      const { list } = await api.material.getImagesList({ cate: iterator.id, pageSize: 2 })
      state.showList.push(list)
    }
  }
})

const selectImg = async (index: number, list: TGetImageListResult[]) => {
  const item = list ? list[index] : state.recommendImgList[index]

  // store.commit('setShowMoveable', false) // 清理掉上一次的选择
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wImageSetting))
  const img = await setImageData(item) // await getImage(item.url)
  setting.width = img.width
  setting.height = img.height // parseInt(100 / item.value.ratio, 10)
  setting.imgUrl = item.url
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - img.width / 2
  setting.top = pH / 2 - img.height / 2

  widgetStore.addWidget(setting)
  // store.dispatch('addWidget', setting)
}

// 本地上传产品照片：若当前页存在标记为产品底图的 w-image 层，原地替换其图片；
// 无标记层时保留原“新增悬浮图片”行为。
const onUploadDone = async (data: TUploadDoneData) => {
  controlStore.setShowMoveable(false)
  const bgLayer = widgetStore.dWidgets.find(
    (w: TdWidgetData) => w.type === 'w-image' && (w.isBackground === true || w.name === '产品底图')
  )

  if (bgLayer) {
    const target = bgLayer as Record<string, any>
    // 保留原 left/top/width/height/rotate/lock；仅替换图片，cover 铺满原画框，
    // 并清除旧裁剪/变换/翻转/缩放残留，避免影响新图。
    target.imgUrl = data.url
    target.objectFit = 'cover'
    target.zoom = 1
    target.flip = ''
    target.cropEdit = false
    target.transform = 'scale(1)translate(0px, 0px)'
    if ('imageTransform' in target) target.imageTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
    if ('cropData' in target) target.cropData = null
    controlStore.setBgUploadHint(false)
    useNotification('产品底图已替换', '可编辑标题并导出', { type: 'success', position: 'bottom-left' })
    return
  }

  let setting = JSON.parse(JSON.stringify(wImageSetting))
  setting.width = data.width
  setting.height = data.height
  setting.imgUrl = data.url
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - data.width / 2
  setting.top = pH / 2 - data.height / 2
  widgetStore.addWidget(setting)
}

const getDataList = async () => {
  if (state.loadDone || loading) {
    return
  }
  if (_config.STATIC) {
    state.loadDone = true
    return
  }
  loading = true
  state.page += 1
  let { list = [], total } = await api.material.getImagesList({ cate: state.currentCategory?.id, page: state.page, pageSize: 30 })
  list.length <= 0 ? (state.loadDone = true) : (state.recommendImgList = state.recommendImgList.concat(list))
  setTimeout(() => {
    loading = false
  }, 100)
}

const dragStart = (index: number, list: TGetImageListResult[]) => {
  const item = list ? list[index] : state.recommendImgList[index]

  widgetStore.setSelectItem({ data: { value: item }, type: 'image' })
  // store.commit('selectItem', { data: { value: item }, type: 'image' })
}

const searchChange = (e: Event) => {
  console.log(e)
}

const selectTypes = (item: TCurrentCategory) => {
  state.currentCategory = item
  getDataList()
}

const back = () => {
  state.currentCategory = null
  state.page = 0
  state.loadDone = false
  state.recommendImgList = []
}

defineExpose({
  selectImg,
  getDataList,
  dragStart,
  searchChange,
  selectTypes,
  back,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
  .bg-hint {
    margin: 0 5% 10px;
    padding: 10px 12px;
    background: rgba(245, 184, 0, 0.14);
    border: 1px solid rgba(245, 184, 0, 0.5);
    border-radius: 8px;
    color: #f5b800;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
  }
  .upload-entry {
    margin: 0 5%;
    :deep(.el-button) {
      width: 100%;
    }
  }
  .upload-tip {
    margin: 10px 5% 0;
    color: #a8a8a8;
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
