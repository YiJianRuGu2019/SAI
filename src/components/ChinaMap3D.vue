<template>
  <div class="china_map_container">
    <div ref="map_container" class="map_canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import customMapStyle from '../custom_map_config.json'
import { loadBaiduMapAPI, isBaiduMapLoaded, createBaiduMap3D } from '@/api/baiduApi'

// 地图容器引用
const map_container = ref(null)
let map_instance = null
let markers = [] // 存储所有标记点

// 定义事件
const emit = defineEmits(['tree_click'])

// 树木数据列表
const trees_data = [
  {
    id: 'tree_beijing_001',
    name: '北京01充电桩',
    longitude: 116.4074,
    latitude: 39.9042,
    species: '高效能型',
    age: 1000,
    height: 25.5,
    description: '高效能型充电桩'
  },
  {
    id: 'tree_shanghai_001',
    name: '上海01充电桩',
    longitude: 121.4737,
    latitude: 31.2304,
    species: '高效能型',
    age: 800,
    height: 22.0,
    description: '高效能型充电桩'
  },
  {
    id: 'tree_guangzhou_001',
    name: '广州01充电桩',
    longitude: 113.2644,
    latitude: 23.1291,
    species: '高效能型',
    age: 500,
    height: 18.5,
    description: '高效能型充电桩'
  },
  {
    id: 'tree_chengdu_001',
    name: '成都01充电桩',
    longitude: 104.0668,
    latitude: 30.5728,
    species: '高效能型',
    age: 1200,
    height: 28.0,
    description: '高效能型充电桩'
  },
  {
    id: 'tree_chengdu_001',
    name: '信阳01充电桩',
    longitude: 114.075,
    latitude: 32.123,
    species: '高效能型',
    age: 1200,
    height: 28.0,
    description: '高效能型充电桩'
  }
]

// 初始化百度地图
const init_map = () => {
  if (!map_container.value) return

  // 检查百度地图 API 是否加载
  if (!isBaiduMapLoaded('3d')) {
    console.error('❌ 百度地图 API 未加载，请检查网络连接')
    return
  }
  console.log('✅ 百度地图 API 已加载')

  // 创建地图实例
  map_instance = createBaiduMap3D(map_container.value)
  if (!map_instance) return

  // 设置地图中心点（中国中心位置）更改地图默认大小
  const center_point = new BMapGL.Point(105, 35)
  map_instance.centerAndZoom(center_point, 5.6) // 缩放级别 4 显示更大范围

  // 启用地图功能
  map_instance.enableScrollWheelZoom(true) // 允许鼠标滚轮缩放
  map_instance.enableDragging(true) // 允许拖拽
  map_instance.enableDoubleClickZoom(true) // 允许双击放大

  // 添加地图控件
  map_instance.addControl(new BMapGL.NavigationControl()) // 缩放控件
  map_instance.addControl(new BMapGL.ScaleControl()) // 比例尺控件

  // 设置自定义地图样式
  map_instance.setMapStyleV2({
    styleJson: customMapStyle
  })

  // 添加树木标记点
  console.log('📍 开始添加标记点，共', trees_data.length, '个')
  add_tree_markers()
}

// 添加树木标记点
const add_tree_markers = () => {
  // 清除旧标记
  markers.forEach(marker => map_instance.removeOverlay(marker))
  markers = []

  // 为每个树木添加标记
  trees_data.forEach((tree, index) => {
    console.log(`📍 添加标记点 ${index + 1}:`, tree.name, `经度=${tree.longitude}, 纬度=${tree.latitude}`)

    // 创建标记点
    const point = new BMapGL.Point(tree.longitude, tree.latitude)

    // 使用简单的圆形标记（更可靠）
    const marker = new BMapGL.Marker(point, {
      icon: new BMapGL.Icon(
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <circle cx="20" cy="20" r="15" fill="#00ff88" stroke="#fff" stroke-width="3"/>
          </svg>
        `),
        new BMapGL.Size(40, 40),
        { anchor: new BMapGL.Size(20, 20) }
      )
    })

    // 添加标记到地图
    map_instance.addOverlay(marker)
    markers.push(marker)
    console.log(`✅ 标记点 ${index + 1} 添加成功`)

    // 点击标记直接进入 3D 视图
    marker.addEventListener('click', () => {
      emit('tree_click', tree)
    })

    // 添加标签
    const label = new BMapGL.Label(tree.name, {
      position: point,
      offset: new BMapGL.Size(0, -45)
    })

    label.setStyle({
      color: '#fff',
      fontSize: '13px',
      fontWeight: 'bold',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid #00ff88',
      borderRadius: '4px',
      padding: '4px 8px',
      textAlign: 'center'
    })

    map_instance.addOverlay(label)
  })
}

// 组件挂载
onMounted(async () => {
  try {
    // 加载百度地图 3D API
    if (!isBaiduMapLoaded('3d')) {
      await loadBaiduMapAPI('3d')
    }
    // 初始化地图
    init_map()
  } catch (error) {
    console.error('百度地图 3D 加载失败:', error)
  }
})

// 组件卸载
onBeforeUnmount(() => {
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
  overflow: hidden;
}

.map_canvas {
  width: 100%;
  height: 100%;
}

/* 响应式布局 - 移动端适配 */
@media screen and (max-width: 768px) {
  .china_map_container {
    height: 100vh;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  .china_map_container {
    height: 100vh;
  }
}

@media screen and (min-width: 1025px) {
  .china_map_container {
    height: 100vh;
  }
}
</style>
