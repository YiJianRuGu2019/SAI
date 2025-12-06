import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePpioStore = defineStore('ppio', () => {
  // 图片尺寸
  const size = ref('1024x1024')
  
  // 生成图片数量
  const maxImages = ref(1)
  
  // 历史记录
  const history = ref([])

  // 设置图片尺寸
  const setSize = (newSize) => {
    size.value = newSize
  }

  // 设置图片数量
  const setMaxImages = (count) => {
    maxImages.value = count
  }

  // 添加历史记录
  const addHistory = (record) => {
    history.value.unshift(record)
  }

  // 清空历史记录
  const clearHistory = () => {
    history.value = []
  }

  return {
    size,
    maxImages,
    history,
    setSize,
    setMaxImages,
    addHistory,
    clearHistory
  }
})

