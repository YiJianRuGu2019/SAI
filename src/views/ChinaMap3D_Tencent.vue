<template>
  <div class="china_map_container">
    <div ref="map_container" class="map_canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import customMapStyle from '../custom_map_config.json'
import { API_KEYS } from '../api/apiKeys.js'

// 地图容器引用
const map_container = ref(null)
let map_instance = null
let markers = [] // 存储所有标记点

// 定义事件
const emit = defineEmits(['tree_click'])

// 树木数据列表（与百度地图版本相同）
const trees_data = [
  {
    id: 'tree_beijing_001',
    name: '古槐树',
    longitude: 115.9746,
    latitude: 40.0479,
    species: '槐树',
    age: 800,
    height: 22.0,
    description: '北京神泉峡风景区古槐树',
    images: [
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
    ]
  },
  {
    id: 'tree_beijing_002',
    name: '北京朝阳区的古槐树',
    longitude: 116.5500,
    latitude: 39.9450,
    species: '槐树',
    age: 800,
    height: 22.0,
    description: '古槐树',
    images: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ]
  },
  {
    id: 'tree_beijing_003',
    name: '千年古银杏树',
    longitude: 115.97447,
    latitude: 40.457067,
    species: '银杏树',
    age: 1000,
    height: 25.5,
    description: '北京延庆区的千年古银杏树',
    images: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800',
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800'
    ]
  },
  {
    id: 'tree_beijing_004',
    name: '北京霞云岭国家森林公园老榆树',
    longitude: 116.8,
    latitude: 39.7,
    species: '榆树',
    age: 650,
    height: 20.5,
    description: '北京霞云岭国家森林公园老榆树',
    images: [
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
    ]
  },
  {
    id: 'tree_beijing_005',
    name: '北京雁西湖古柏树',
    longitude: 116.6,
    latitude: 40.5,
    species: '柏树',
    age: 900,
    height: 24.0,
    description: '北京雁西湖古柏树',
    images: [
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800'
    ]
  },
  {
    id: 'tree_beijing_006',
    name: '北京玉渊潭槐树',
    longitude: 116.3,
    latitude: 39.9,
    species: '槐树',
    age: 750,
    height: 21.5,
    description: '北京玉渊潭槐树',
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800'
    ]
  },
  {
    id: 'tree_beijing_007',
    name: '北京亦庄新城滨河公园古松树',
    longitude: 116.5,
    latitude: 39.8,
    species: '松树',
    age: 850,
    height: 23.5,
    description: '北京亦庄新城滨河公园古松树',
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
    ]
  },
  {
    id: 'tree_shanghai_001',
    name: '上海古樟树',
    longitude: 121.4737,
    latitude: 31.2304,
    species: '樟树',
    age: 800,
    height: 22.0,
    description: '上海古樟树',
    images: [
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800'
    ]
  },
  {
    id: 'tree_guangzhou_001',
    name: '广州木棉王',
    longitude: 113.2644,
    latitude: 23.1291,
    species: '木棉树',
    age: 500,
    height: 18.5,
    description: '广州木棉王',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800'
    ]
  },
  {
    id: 'tree_chengdu_001',
    name: '成都银杏古树',
    longitude: 104.0668,
    latitude: 30.5728,
    species: '银杏树',
    age: 1200,
    height: 28.0,
    description: '成都银杏古树',
    images: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    ]
  },
  {
    id: 'tree_xinyang_001',
    name: '信阳国槐古树',
    longitude: 115.21,
    latitude: 31.46,
    species: '国槐',
    age: 1200,
    height: 28.0,
    description: '信阳国槐古树',
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800'
    ]
  }
]

// 获取响应式缩放级别
const get_responsive_zoom = () => {
  const width = window.innerWidth
  if (width < 768) {
    return 4 // H5/APP 模式
  }
  return 5 // Web 模式
}

// 初始化腾讯地图
const init_map = () => {
  console.log('🚀 开始初始化腾讯地图...')

  if (!map_container.value) {
    console.error('❌ 地图容器未找到')
    return
  }
  console.log('✅ 地图容器已找到')

  // 检查腾讯地图 API 是否加载
  if (typeof TMap === 'undefined') {
    console.error('❌ 腾讯地图 API 未加载')
    console.error('请检查以下问题：')
    console.error('1. 网络连接是否正常')
    console.error('2. index.html 中是否正确引入了腾讯地图 API')
    console.error('3. API 密钥是否有效')

    // 显示错误提示给用户
    if (map_container.value) {
      map_container.value.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          color: #666;
          font-size: 16px;
          text-align: center;
          flex-direction: column;
        ">
          <div style="margin-bottom: 10px;">🗺️</div>
          <div>地图加载失败</div>
          <div style="font-size: 12px; margin-top: 5px;">请检查网络连接或联系管理员</div>
        </div>
      `
    }
    return
  }
  console.log('✅ 腾讯地图 API 已加载')

  try {
    // 创建地图实例
    const center = new TMap.LatLng(35, 105) // 中国中心位置
    map_instance = new TMap.Map(map_container.value, {
      center: center,
      zoom: get_responsive_zoom(),
      pitch: 0, // 俯仰角度，0-45度
      rotation: 0, // 旋转角度
      viewMode: '3D', // 3D模式
      mapStyleId: 'style1' // 个性化地图样式ID（第一个绑定的样式通常是style1）
    })

    console.log('✅ 腾讯地图实例创建成功')

    // 监听地图加载完成事件
    map_instance.on('idle', () => {
      console.log('✅ 地图加载完成')
      // 添加树木标记点
      add_tree_markers()
    })

    // 监听地图错误事件
    map_instance.on('error', (error) => {
      console.error('❌ 地图加载错误:', error)
    })

  } catch (error) {
    console.error('❌ 创建地图实例时发生错误:', error)
    if (map_container.value) {
      map_container.value.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          color: #666;
          font-size: 16px;
          text-align: center;
          flex-direction: column;
        ">
          <div style="margin-bottom: 10px;">⚠️</div>
          <div>地图初始化失败</div>
          <div style="font-size: 12px; margin-top: 5px;">${error.message}</div>
        </div>
      `
    }
  }
}

// 添加树木标记点
const add_tree_markers = () => {
  console.log('开始添加树木标记点，共', trees_data.length, '个')

  // 准备标记点数据
  const geometries = trees_data.map((tree) => {
    return {
      id: tree.id,
      styleId: 'tree_marker',
      position: new TMap.LatLng(tree.latitude, tree.longitude),
      properties: {
        tree_data: tree
      }
    }
  })

  // 创建MultiMarker（多点标记）
  const marker_layer = new TMap.MultiMarker({
    map: map_instance,
    styles: {
      tree_marker: new TMap.MarkerStyle({
        width: 30,
        height: 30,
        anchor: { x: 15, y: 15 },
        src: create_marker_svg()
      })
    },
    geometries: geometries
  })

  // 监听标记点击事件
  marker_layer.on('click', (evt) => {
    const tree_data = evt.geometry.properties.tree_data
    console.log('点击树木标记：', tree_data.description)
    emit('tree_click', tree_data)
  })

  markers.push(marker_layer)
  console.log('✅ 所有树木标记点添加完成')
}

// 创建标记点SVG（带闪烁效果）
const create_marker_svg = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
      <defs>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; r: 8; }
            50% { opacity: 0.4; r: 6; }
          }
          .tree_marker {
            animation: pulse 1.5s ease-in-out infinite;
          }
        </style>
      </defs>
      <circle class="tree_marker" cx="15" cy="15" r="8" fill="#00ff88" stroke="#fff" stroke-width="2"/>
    </svg>
  `
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// 处理窗口大小改变
const handle_resize = () => {
  if (!map_instance) return

  setTimeout(() => {
    if (map_instance) {
      // 腾讯地图会自动调整大小
      const zoom_level = get_responsive_zoom()
      map_instance.setZoom(zoom_level)
    }
  }, 100)
}

// 动态加载腾讯地图 API
const load_tencent_map_api = () => {
  return new Promise((resolve, reject) => {
    // 如果已经加载过，直接返回
    if (typeof TMap !== 'undefined') {
      console.log('✅ 腾讯地图 API 已存在')
      resolve()
      return
    }

    // 检查是否已经有脚本标签在加载
    const existingScript = document.querySelector('script[src*="map.qq.com"]')
    if (existingScript) {
      console.log('🔄 腾讯地图 API 正在加载中...')
      // 等待现有脚本加载完成
      existingScript.onload = () => resolve()
      existingScript.onerror = () => reject(new Error('腾讯地图 API 加载失败'))
      return
    }

    console.log('🚀 开始加载腾讯地图 API...')

    // 创建脚本标签
    const script = document.createElement('script')
    script.type = 'text/javascript'

    // 使用 apiKeys.js 中的腾讯地图 API 密钥
    const apiKey = API_KEYS.TENCENT_MAP
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${apiKey}`

    console.log('🔑 使用腾讯地图 API 密钥:', apiKey)

    script.onload = () => {
      console.log('✅ 腾讯地图 API 脚本加载完成')
      // 等待一下确保 TMap 对象完全初始化
      setTimeout(() => {
        if (typeof TMap !== 'undefined') {
          console.log('✅ TMap 对象已可用')
          resolve()
        } else {
          console.error('❌ TMap 对象未定义')
          reject(new Error('TMap 对象未定义'))
        }
      }, 100)
    }

    script.onerror = () => {
      console.error('❌ 腾讯地图 API 脚本加载失败')
      reject(new Error('腾讯地图 API 脚本加载失败'))
    }

    // 添加到页面
    document.head.appendChild(script)
  })
}

// 等待腾讯地图 API 加载完成
const wait_for_tmap_api = async () => {
  try {
    await load_tencent_map_api()
    return true
  } catch (error) {
    console.error('❌ 腾讯地图 API 加载失败:', error)
    return false
  }
}

// 组件挂载
onMounted(async () => {
  console.log('🔄 组件已挂载，开始加载腾讯地图...')

  // 等待 API 加载完成
  const apiLoaded = await wait_for_tmap_api()

  if (apiLoaded) {
    // 稍微延迟一下确保 DOM 完全渲染
    setTimeout(() => {
      init_map()
    }, 200)
  } else {
    console.error('❌ 腾讯地图 API 加载失败，无法初始化地图')
    // 显示错误信息
    if (map_container.value) {
      map_container.value.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          color: #666;
          font-size: 16px;
          text-align: center;
          flex-direction: column;
        ">
          <div style="margin-bottom: 10px;">🌐</div>
          <div>地图服务不可用</div>
          <div style="font-size: 12px; margin-top: 5px;">请检查网络连接或 API 密钥配置</div>
        </div>
      `
    }
  }

  // 监听窗口大小改变
  window.addEventListener('resize', handle_resize)
})

// 组件卸载
onBeforeUnmount(() => {
  // 移除 resize 事件监听
  window.removeEventListener('resize', handle_resize)

  if (map_instance) {
    map_instance.destroy()
    map_instance = null
  }
})
</script>

<style scoped>
.china_map_container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map_canvas {
  width: 100%;
  height: 100%;
}
</style>
