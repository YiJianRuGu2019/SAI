// Grok API 服务 - 图片生成
import API_KEYS from '@/api/apiKeys.js'

// 直接请求 Grok API（不使用代理）
const BASE_URL = 'https://api.x.ai/v1'

/**
 * 生成图片
 * @param {Object} params - 生成参数
 * @param {string} params.prompt - 图片描述提示词
 * @param {string} params.model - 模型名称，默认 'grok-2-image'
 * @param {number} params.n - 生成图片数量，默认 1（范围：1-10）
 * @returns {Promise<Object>} 生成结果
 */
export const generateImage = async (params) => {
  const { prompt, model = 'grok-2-image', n = 1 } = params

  console.log('🎨 Grok 图片生成请求:', { prompt, model, n })

  try {
    // 构建增强提示词
    const finalPrompt = `${prompt}。请根据该文案用合适的像素尺寸生成${n}个图片，如果你接收到的内容有明确的地址的话请根据你接收到的地址和本次的提示词相结合`

    // 构建请求体
    const requestBody = {
      model,
      prompt: finalPrompt,
      n: Math.min(Math.max(1, n), 10) // 确保 n 在 1-10 之间
    }

    const response = await fetch(`${BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEYS.GROK}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Grok API 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Grok 图片生成成功:', result)

    // 返回格式: { data: [{ url: "..." }] }
    return result
  } catch (error) {
    console.error('❌ Grok 图片生成失败:', error)
    throw error
  }
}

/**
 * 图片编辑（如果 Grok 支持）
 * @param {Object} params - 编辑参数
 * @param {string} params.image - 原始图片 URL 或 base64
 * @param {string} params.prompt - 编辑提示词
 * @param {string} params.mask - 遮罩图片（可选）
 * @returns {Promise<Object>} 编辑结果
 */
export const editImage = async (params) => {
  const { image, prompt, mask } = params

  console.log('✏️ Grok 图片编辑请求:', { prompt })

  try {
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('image', image)
    if (mask) {
      formData.append('mask', mask)
    }

    const response = await fetch(`${BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.GROK}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Grok 图片编辑错误:', errorText)
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Grok 图片编辑成功:', result)

    return result
  } catch (error) {
    console.error('❌ Grok 图片编辑失败:', error)
    throw error
  }
}

export default {
  generateImage,
  editImage
}

