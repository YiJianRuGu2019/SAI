// 豆包API服务 - 基于真实API格式
import API_KEYS from '@/api/apiKeys.js'

// 使用代理地址避免CORS问题
const BASE_URL = '/api/doubao'

// API请求头配置
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEYS.DOUBAO}`
})

// 视频生成API - 根据真实API格式
export const generateVideo = async (params) => {
  const { type, prompt, image_url, aspect_ratio = '16:9' } = params

  // 构建文本提示词，包含比例信息
  let textContent = prompt
  if (aspect_ratio) {
    textContent += ` --ratio ${aspect_ratio}`
  }

  // 根据真实API格式构建请求体
  const requestBody = {
    model: 'doubao-seedance-1-0-pro-250528',  // 使用正确的模型名称
    content: []
  }

  // 如果是图片生成视频，先添加图片内容
  if (type === 'image_to_video' && image_url) {
    requestBody.content.push({
      type: 'image_url',
      image_url: {
        url: image_url
      }
    })
  }

  // 添加文本提示词
  requestBody.content.push({
    type: 'text',
    text: textContent
  })

  try {
    console.log('发送豆包视频生成请求:', requestBody)
    console.log('请求URL:', `${BASE_URL}/contents/generations/tasks`)

    const response = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody)
    })

    console.log('响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API错误响应:', errorText)
      throw new Error(`API请求失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('API响应结果:', result)
    return { task_id: result.id }
  } catch (error) {
    console.error('视频生成失败:', error)
    // 提供更详细的错误信息
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络连接或代理配置')
    }
    throw error
  }
}

// 图片生成API - 根据真实API格式
export const generateImage = async (params) => {
  const { prompt, aspect_ratio = '16:9' } = params

  // 构建文本提示词，包含比例信息
  let textContent = prompt
  if (aspect_ratio) {
    textContent += ` --ratio ${aspect_ratio}`
  }

  const requestBody = {
    model: 'doubao-seedance-1-0-pro-250528',  // 使用正确的模型名称
    content: [
      {
        type: 'text',
        text: textContent
      }
    ]
  }

  try {
    console.log('发送豆包图片生成请求:', requestBody)

    const response = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API错误响应:', errorText)
      throw new Error(`API请求失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('图片生成API响应结果:', result)
    return { task_id: result.id }
  } catch (error) {
    console.error('图片生成失败:', error)
    throw error
  }
}

// 图像编辑API - 根据火山引擎文档格式
export const editImage = async (params) => {
  const { image_url, prompt, aspect_ratio = '16:9' } = params

  // 构建文本提示词，包含比例信息
  let textContent = prompt
  if (aspect_ratio) {
    textContent += ` --ratio ${aspect_ratio}`
  }

  const requestBody = {
    model: 'Doubao-Seedance-1.0-pro',
    content: [
      {
        type: 'image_url',
        url: image_url
      },
      {
        type: 'text',
        text: textContent
      }
    ]
  }

  try {
    const response = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEYS.DOUBAO}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    return { task_id: result.id }
  } catch (error) {
    console.error('图像编辑失败:', error)
    throw error
  }
}

// 查询任务状态
export const queryTaskStatus = async (taskId) => {
  try {
    console.log('查询任务状态:', taskId)

    const response = await fetch(`${BASE_URL}/contents/generations/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEYS.DOUBAO}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('查询任务API错误响应:', errorText)
      throw new Error(`查询任务失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('任务状态查询结果:', result)
    return result
  } catch (error) {
    console.error('查询任务状态失败:', error)
    throw error
  }
}

// 轮询任务直到完成 - 根据实际API响应格式优化
export const pollTaskUntilComplete = async (taskId, maxAttempts = 60, interval = 3000) => {
  console.log(`开始轮询任务 ${taskId}，最大尝试次数: ${maxAttempts}，间隔: ${interval}ms`)

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await queryTaskStatus(taskId)
      console.log(`第 ${i + 1} 次查询，任务状态:`, result.status)
      console.log('完整响应:', result)

      // 根据实际API响应，状态包括：running, succeeded, failed
      if (result.status === 'succeeded') {
        console.log('任务完成，返回结果:', result)
        return result
      } else if (result.status === 'failed') {
        console.error('任务执行失败:', result)
        throw new Error(`任务执行失败: ${result.error || '未知错误'}`)
      } else if (result.status === 'running') {
        console.log(`任务正在处理中 (${result.status})，继续等待...`)

        // 如果不是最后一次尝试，等待后继续
        if (i < maxAttempts - 1) {
          console.log(`等待 ${interval}ms 后进行下次查询...`)
          await new Promise(resolve => setTimeout(resolve, interval))
        }
      } else {
        console.warn('未知任务状态:', result.status)

        // 对于未知状态，也继续等待
        if (i < maxAttempts - 1) {
          console.log(`未知状态，等待 ${interval}ms 后继续查询...`)
          await new Promise(resolve => setTimeout(resolve, interval))
        }
      }
    } catch (error) {
      console.error(`第 ${i + 1} 次查询失败:`, error)

      // 如果是网络错误，继续重试
      if (error.message.includes('网络') || error.message.includes('fetch')) {
        if (i < maxAttempts - 1) {
          console.log('网络错误，继续重试...')
          await new Promise(resolve => setTimeout(resolve, interval))
          continue
        }
      }

      throw error
    }
  }

  throw new Error(`任务超时：在 ${maxAttempts} 次尝试后仍未完成`)
}

// 处理图片文件（检查尺寸并转换为base64）
export const uploadImage = async (file) => {
  try {
    // 首先检查图片尺寸
    const imageInfo = await getImageDimensions(file)
    console.log('原始图片尺寸:', imageInfo)

    // 豆包API要求图片宽度至少300px
    if (imageInfo.width < 300 || imageInfo.height < 300) {
      console.log('图片尺寸不符合要求，正在调整...')
      // 调整图片尺寸
      const resizedFile = await resizeImage(file, Math.max(300, imageInfo.width), Math.max(300, imageInfo.height))
      const base64 = await fileToBase64(resizedFile)
      console.log('图片已调整尺寸并转换为base64格式')
      return base64
    } else {
      // 图片尺寸符合要求，直接转换
      const base64 = await fileToBase64(file)
      console.log('图片尺寸符合要求，已转换为base64格式')
      return base64
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    throw new Error('图片处理失败：' + error.message)
  }
}

// 获取图片尺寸信息
const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片信息'))
    }

    img.src = url
  })
}

// 调整图片尺寸
const resizeImage = (file, targetWidth, targetHeight) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 设置画布尺寸
      canvas.width = targetWidth
      canvas.height = targetHeight

      // 绘制调整后的图片
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      // 转换为Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // 创建新的File对象
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(resizedFile)
        } else {
          reject(new Error('图片调整失败'))
        }
      }, file.type, 0.9) // 0.9 质量
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法加载图片'))
    }

    img.src = url
  })
}

// 将文件转换为base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}