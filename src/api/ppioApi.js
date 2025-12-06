import API_KEYS from '@/api/apiKeys.js'

const API_URL = 'https://api.ppinfra.com/v3/seedream-4.0'

/**
 * 调用 Seedream API 生成图片
 * @param {Object} params - 生成参数
 * @param {string} params.prompt - 提示词
 * @param {number} params.max_images - 生成图片数量
 * @param {string} params.size - 图片尺寸
 * @param {Array<string>} params.images - 可选，上传的图片Base64数组
 * @returns {Promise<Object>} 生成结果
 */
export const generateImageWithSeedream = async (params) => {
  const { prompt, max_images = 1, size = '2K', images } = params

  // 在用户提示词后添加固定提示词，让API根据内容选择合适的像素尺寸
  const finalPrompt = `${prompt}。请根据该文案用合适的像素尺寸生成${max_images}个图片，如果你接收到的内容有明确的地址的话请根据你接收到的地址和本次的提示词相结合`

  // 构建请求体
  const requestBody = {
    prompt: finalPrompt,
    size,
    sequential_image_generation: 'auto',
    max_images,
    watermark: false
  }

  // 如果有上传的图片，添加到请求体中
  if (images && images.length > 0) {
    requestBody.images = images
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEYS.PPIO}`
    },
    body: JSON.stringify(requestBody)
  }

  try {
    const response = await fetch(API_URL, options)

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Seedream API 调用失败:', error)
    throw error
  }
}

