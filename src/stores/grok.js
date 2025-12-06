import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Grok 图片生成状态管理
 */
export const useGrokStore = defineStore('grok', () => {
  // 生成图片数量（1-10张）
  const imageCount = ref(1)

  // 图片比例
  const aspectRatio = ref('16:9')

  // 当前选择的模型
  const currentModel = ref('grok-2-image')

  // 生成历史记录
  const generationHistory = ref([])

  /**
   * 设置生成图片数量
   * @param {number} count - 图片数量（1-10）
   */
  const setImageCount = (count) => {
    if (count >= 1 && count <= 10) {
      imageCount.value = count
    }
  }

  /**
   * 设置图片比例
   * @param {string} ratio - 图片比例
   */
  const setAspectRatio = (ratio) => {
    aspectRatio.value = ratio
  }

  /**
   * 设置当前模型
   * @param {string} model - 模型名称
   */
  const setCurrentModel = (model) => {
    currentModel.value = model
  }

  /**
   * 添加生成历史
   * @param {Object} record - 生成记录
   */
  const addHistory = (record) => {
    generationHistory.value.unshift(record)
    // 最多保存 50 条历史记录
    if (generationHistory.value.length > 50) {
      generationHistory.value.pop()
    }
  }

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    generationHistory.value = []
  }

  return {
    // 状态
    imageCount,
    aspectRatio,
    currentModel,
    generationHistory,

    // 方法
    setImageCount,
    setAspectRatio,
    setCurrentModel,
    addHistory,
    clearHistory
  }
})

