/*
 * @Author: ShawnPhang
 * @Date: 2021-12-24 18:09:35
 * @Description: 异步队列
 * @LastEditors: ShawnPhang <site: m.palxp.cn>
 * @LastEditTime: 2023-07-06 10:19:40
 */
interface Queue {
  Fn: Function
  sign?: string | number
}

import { maxNum } from '../configs'
const queueList: any = [] // 任务队列
let curNum = 0 // 当前执行的任务数

function queueRun(business: Function, ...arg: any) {
  return new Promise(async (resolve) => {
    const Fn = async () => resolve(await business(...arg))
    const sign = { ...arg }[2]
    if (curNum >= maxNum) {
      queueList.push({ sign, Fn })
    } else {
      await run(Fn)
    }
  })
}

function run(Fn: Function) {
  curNum++
  const next = () => {
    curNum--
    if (queueList.length > 0) {
      const Task: Queue = queueList.shift()
      run(Task.Fn)
    }
  }
  Fn().then((res: any) => {
    next()
    return res
  }).catch(() => {
    // 截图任务被拒绝（如 puppeteer Target closed）时仅结束当前任务，避免未处理拒绝拖垮服务
    next()
  })
}

export { queueRun, queueList }
