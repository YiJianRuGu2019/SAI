// PPIO Seedance V1 Pro 视频生成 API
import axios from 'axios'
import API_KEYS from '@/api/apiKeys.js'
const BASE_URL = 'https://api.ppinfra.com'

// 文生视频 (Text-to-Video)
export async function generateVideoFromText (params) {
  const {
    prompt,
    resolution = '1080p',
    aspect_ratio = '16:9',
    duration = 5,
    camera_fixed = false,
    seed = -1
  } = params

  try {
    const requestBody = {
      prompt,
      resolution,
      aspect_ratio,
      duration,
      camera_fixed,
      seed
    }

    console.log('文生视频请求体:', requestBody)

    const response = await axios.post(
      `${BASE_URL}/v3/async/seedance-v1-pro-t2v`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEYS.PPIO}`
        }
      }
    )

    console.log('文生视频 API 响应:', response.data)

    return {
      success: true,
      task_id: response.data.task_id
    }
  } catch (error) {
    console.error('文生视频 API 错误:', error)
    console.error('错误详情:', error.response?.data)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

// 图生视频 (Image-to-Video)
export async function generateVideoFromImage (params) {
  const {
    image,
    prompt = '',
    last_image = null,
    resolution = '1080p',
    aspect_ratio = '16:9',
    duration = 5,
    camera_fixed = false,
    seed = -1
  } = params

  try {
    // 处理 Base64 图片：如果有 data:image 前缀，保留完整格式
    // PPIO API 支持完整的 data URI 格式
    let processedImage = image

    console.log('原始图片数据长度:', image?.length)
    console.log('图片数据前100字符:', image?.substring(0, 100))

    // 构建请求体 - 按照 API 文档顺序
    const requestBody = {
      image: processedImage,
      resolution,
      aspect_ratio,
      duration,
      camera_fixed,
      seed
    }

    // 可选参数
    if (prompt && prompt.trim()) {
      requestBody.prompt = prompt
    }
    if (last_image) {
      requestBody.last_image = last_image
    }

    console.log('图生视频请求体:', {
      ...requestBody,
      image: requestBody.image?.substring(0, 100) + '...' // 只打印前100字符
    })

    const response = await axios.post(
      `${BASE_URL}/v3/async/seedance-v1-pro-i2v`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEYS.PPIO}`
        }
      }
    )

    console.log('图生视频 API 响应:', response.data)

    return {
      success: true,
      task_id: response.data.task_id
    }
  } catch (error) {
    console.error('图生视频 API 错误:', error)
    console.error('错误详情:', error.response?.data)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

// 查询任务结果
export async function getTaskResult (taskId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/v3/async/task-result`,
      {
        params: { task_id: taskId },
        headers: {
          'Authorization': `Bearer ${API_KEYS.PPIO}`
        }
      }
    )

    console.log('查询任务结果 API 响应:', JSON.stringify(response.data, null, 2))

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('查询任务结果 API 错误:', error)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

// 轮询任务直到完成
export async function pollTaskUntilComplete (taskId, maxAttempts = 60, interval = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskResult(taskId)

    if (!result.success) {
      return result
    }

    // 根据实际 API 响应格式，状态在 task.status 中
    const responseData = result.data
    const taskData = responseData.task || responseData
    const status = taskData.status

    console.log(`[轮询 ${i + 1}/${maxAttempts}] 任务状态:`, status, '进度:', taskData.progress_percent, '%')
    console.log('📦 responseData.videos:', responseData.videos)
    console.log('📦 videos 长度:', responseData.videos?.length)

    // 检查是否有视频生成完成
    if (status === 'TASK_STATUS_SUCCEED' || (responseData.videos && responseData.videos.length > 0)) {
      console.log('✅ 任务成功完成！视频数量:', responseData.videos?.length)
      console.log('✅ 返回的完整数据:', JSON.stringify(responseData, null, 2))
      return {
        success: true,
        data: responseData
      }
    } else if (status === 'TASK_STATUS_FAILED') {
      console.error('❌ 任务失败:', taskData.reason)
      return {
        success: false,
        error: taskData.reason || '任务失败'
      }
    }

    // 状态为 TASK_STATUS_QUEUED 或 TASK_STATUS_OUTPUT 时继续轮询
    console.log('⏳ 继续轮询，等待', interval / 1000, '秒...')
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  console.error('⏰ 任务超时，已轮询', maxAttempts, '次')
  return {
    success: false,
    error: '任务超时'
  }
}

