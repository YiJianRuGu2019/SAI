<template>
  <div class="tree_detail_container">
    <!-- 返回按钮 -->
    <button class="back_button" @click="handle_back_click">
      <span class="back_icon">←</span>
      <span class="back_text">返回地图</span>
    </button>

    <!-- 百度地图 3D 视图（集成 Three.js 树木模型） -->
    <div ref="map_3d_container" class="map_3d_view"></div>

    <!-- 充电桩信息面板 -->
    <div class="tree_info_panel">
      <h2 class="tree_name">⚡ {{ tree_data.name }}</h2>
      <div class="info_grid">
        <div class="info_item">
          <span class="info_label">类型</span>
          <span class="info_value">{{ tree_data.species }}</span>
        </div>
        <div class="info_item">
          <span class="info_label">功率</span>
          <span class="info_value">{{ tree_data.age }} kW</span>
        </div>
        <div class="info_item">
          <span class="info_label">高度</span>
          <span class="info_value">{{ tree_data.height }} 米</span>
        </div>
        <div class="info_item">
          <span class="info_label">位置</span>
          <span class="info_value">{{ tree_data.longitude.toFixed(4) }}, {{ tree_data.latitude.toFixed(4) }}</span>
        </div>
      </div>
      <div class="info_description">
        <span class="info_label">描述</span>
        <p class="info_value">{{ tree_data.description }}</p>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="control_hint">
      🖱️ 拖动地图旋转 | 滚轮缩放 | 3D 充电桩模型已集成到地图中
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import customMapStyle from '../custom_map_config.json'
import { loadBaiduMapAPI, isBaiduMapLoaded, createBaiduMap3D } from '@/api/baiduApi'

// 接收树木数据
const props = defineProps({
  tree_data: {
    type: Object,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['back_click'])

// 容器引用
const map_3d_container = ref(null)

// 百度地图实例
let map_instance = null
let tree_marker = null // 百度地图标注
let tree_overlay = null // Three.js 覆盖物

// 创建 Three.js 自定义覆盖物类
const create_threejs_overlay_class = () => {
  // 继承百度地图的 Overlay 类
  class CustomThreeJSOverlay extends BMapGL.Overlay {
    constructor(position, tree_data) {
      super()
      this._position = position
      this._tree_data = tree_data
      this._container = null
      this._scene = null
      this._camera = null
      this._renderer = null
      this._tree_mesh = null
    }

    // 初始化覆盖物
    initialize (map) {
      this._map = map

      // 创建容器（增大尺寸）
      this._container = document.createElement('div')
      this._container.style.position = 'absolute'
      this._container.style.width = '600px'
      this._container.style.height = '600px'
      this._container.style.pointerEvents = 'none' // 不阻止地图交互

      // 初始化 Three.js 场景
      this._init_three_scene()

      // 添加到地图的覆盖物层
      map.getPanes().markerPane.appendChild(this._container)

      return this._container
    }

    // 初始化 Three.js 场景
    _init_three_scene () {
      // 创建场景
      this._scene = new THREE.Scene()

      // 创建相机（调整位置以查看小树木）
      this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
      this._camera.position.set(0, 2.5, 8)
      this._camera.lookAt(0, 1.8, 0)

      // 创建渲染器（透明背景）
      this._renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })
      this._renderer.setClearColor(0x000000, 0)
      this._renderer.setSize(150, 150)
      this._renderer.shadowMap.enabled = true
      this._container.appendChild(this._renderer.domElement)

      // 添加光源
      const ambient_light = new THREE.AmbientLight(0xffffff, 0.6)
      this._scene.add(ambient_light)

      const directional_light = new THREE.DirectionalLight(0xffffff, 0.8)
      directional_light.position.set(10, 20, 10)
      directional_light.castShadow = true
      this._scene.add(directional_light)

      // 创建充电桩模型
      this._create_charging_station_model()

      // 移除地面圆盘（去掉底部阴影）

      // 添加鼠标拖拽控制
      this._add_mouse_controls()

      // 开始动画
      this._animate()
    }

    // 添加鼠标拖拽控制（360° 旋转）
    _add_mouse_controls () {
      let is_dragging = false
      let previous_mouse_x = 0
      let previous_mouse_y = 0
      let rotation_x = 0 // 上下旋转角度
      let rotation_y = 0 // 左右旋转角度

      // 鼠标按下
      this._renderer.domElement.addEventListener('mousedown', (e) => {
        is_dragging = true
        previous_mouse_x = e.clientX
        previous_mouse_y = e.clientY
        this._renderer.domElement.style.cursor = 'grabbing'
      })

      // 鼠标移动
      this._renderer.domElement.addEventListener('mousemove', (e) => {
        if (!is_dragging) return

        const delta_x = e.clientX - previous_mouse_x
        const delta_y = e.clientY - previous_mouse_y

        // 更新旋转角度
        rotation_y += delta_x * 0.005 // 左右旋转
        rotation_x += delta_y * 0.005 // 上下旋转

        // 限制上下旋转角度（避免翻转）
        rotation_x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation_x))

        // 应用旋转到相机（适配小树木）
        const radius = 8
        this._camera.position.x = radius * Math.sin(rotation_y) * Math.cos(rotation_x)
        this._camera.position.y = 2.5 + radius * Math.sin(rotation_x)
        this._camera.position.z = radius * Math.cos(rotation_y) * Math.cos(rotation_x)
        this._camera.lookAt(0, 1.8, 0)

        previous_mouse_x = e.clientX
        previous_mouse_y = e.clientY
      })

      // 鼠标松开
      const mouse_up = () => {
        is_dragging = false
        this._renderer.domElement.style.cursor = 'grab'
      }

      this._renderer.domElement.addEventListener('mouseup', mouse_up)
      this._renderer.domElement.addEventListener('mouseleave', mouse_up)

      // 设置初始光标样式
      this._renderer.domElement.style.cursor = 'grab'
    }

    // 创建充电桩模型
    _create_charging_station_model () {
      const station_group = new THREE.Group()

      // 底座
      const base_geometry = new THREE.BoxGeometry(0.8, 0.1, 0.8)
      const base_material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8
      })
      const base = new THREE.Mesh(base_geometry, base_material)
      base.position.y = 0.05
      base.castShadow = true
      station_group.add(base)

      // 主体立柱
      const pillar_geometry = new THREE.BoxGeometry(0.4, 2.0, 0.3)
      const pillar_material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5
      })
      const pillar = new THREE.Mesh(pillar_geometry, pillar_material)
      pillar.position.y = 1.1
      pillar.castShadow = true
      station_group.add(pillar)

      // 显示屏
      const screen_geometry = new THREE.BoxGeometry(0.35, 0.5, 0.05)
      const screen_material = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.5,
        roughness: 0.2
      })
      const screen = new THREE.Mesh(screen_geometry, screen_material)
      screen.position.set(0, 1.5, 0.175)
      station_group.add(screen)

      // 充电枪接口
      const socket_geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16)
      const socket_material = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        roughness: 0.6
      })
      const socket = new THREE.Mesh(socket_geometry, socket_material)
      socket.rotation.z = Math.PI / 2
      socket.position.set(0.25, 0.8, 0)
      station_group.add(socket)

      // 顶部指示灯
      const light_geometry = new THREE.SphereGeometry(0.1, 16, 16)
      const light_material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1.0
      })
      const light = new THREE.Mesh(light_geometry, light_material)
      light.position.y = 2.2
      station_group.add(light)

      this._tree_mesh = station_group
      this._scene.add(station_group)
    }

    // 动画循环
    _animate () {
      if (!this._renderer || !this._scene || !this._camera) return

      // 移除自动旋转，改为手动控制
      // if (this._tree_mesh) {
      //   this._tree_mesh.rotation.y += 0.005
      // }

      this._renderer.render(this._scene, this._camera)
      requestAnimationFrame(() => this._animate())
    }

    // 绘制覆盖物
    draw () {
      if (!this._container || !this._map) return

      // 获取树木位置在屏幕上的像素坐标（跟随地图移动）
      const pixel = this._map.pointToPixel(this._position)

      // 固定缩放比例（不随地图缩放变化）
      const final_scale = 1.0

      // 容器基础尺寸
      const base_size = 150

      // 设置容器位置（与 2D 标注对齐）
      // 3D 模型底部对齐标注中心
      this._container.style.left = pixel.x - base_size / 2 + 'px'
      this._container.style.top = pixel.y - base_size * 0.85 + 'px'

      // 应用缩放变换（从底部中心缩放）
      this._container.style.transform = `scale(${final_scale})`
      this._container.style.transformOrigin = 'center bottom'
    }

    // 销毁覆盖物
    destroy () {
      if (this._renderer) {
        this._renderer.dispose()
      }
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container)
      }
    }
  }

  return CustomThreeJSOverlay
}

// 初始化百度地图 3D 视图
const init_map_3d = () => {
  if (!map_3d_container.value) return

  // 检查百度地图 API 是否加载
  if (!isBaiduMapLoaded('3d')) {
    console.error('❌ 百度地图 API 未加载')
    return
  }

  // 创建地图实例
  map_instance = createBaiduMap3D(map_3d_container.value, {
    restrictCenter: false
  })
  if (!map_instance) return

  // 设置地图中心为充电桩位置
  const tree_point = new BMapGL.Point(props.tree_data.longitude, props.tree_data.latitude)
  map_instance.centerAndZoom(tree_point, 19) // 高缩放级别，近距离视图

  // 启用 3D 视图
  map_instance.setHeading(45) // 设置地图旋转角度
  map_instance.setTilt(60) // 设置地图倾斜角度（3D 视角）

  // 启用地图交互
  map_instance.enableDragging()
  map_instance.enableScrollWheelZoom()
  map_instance.enableDoubleClickZoom()

  // 添加控件
  const zoom_control = new BMapGL.ZoomControl({
    anchor: window.BMAP_ANCHOR_TOP_RIGHT
  })
  map_instance.addControl(zoom_control)

  // 设置自定义地图样式
  map_instance.setMapStyleV2({
    styleJson: customMapStyle
  })

  // 1. 先添加百度地图官方标注（底层）
  tree_marker = new BMapGL.Marker(tree_point, {
    icon: new BMapGL.Icon(
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
          <circle cx="30" cy="30" r="25" fill="#00ff88" opacity="0.3" stroke="#00ff88" stroke-width="3"/>
          <circle cx="30" cy="30" r="15" fill="#00ff88" stroke="#fff" stroke-width="3"/>
          <text x="30" y="35" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">⚡</text>
        </svg>
      `),
      new BMapGL.Size(60, 60),
      { anchor: new BMapGL.Size(30, 30) }
    )
  })
  map_instance.addOverlay(tree_marker)

  // 2. 再添加 Three.js 自定义覆盖物（上层 3D 模型）
  const ThreeJSOverlay = create_threejs_overlay_class()
  tree_overlay = new ThreeJSOverlay(tree_point, props.tree_data)
  map_instance.addOverlay(tree_overlay)
}

// 窗口大小改变
const handle_resize = () => {
  if (!map_instance) return

  // 重新调整地图大小
  setTimeout(() => {
    if (map_instance) {
      map_instance.resize()
    }
  }, 100)
}

// 返回按钮点击
const handle_back_click = () => {
  emit('back_click')
}

// 组件挂载
onMounted(async () => {
  console.log('TreeDetail3D 组件已挂载，充电桩数据：', props.tree_data)

  try {
    // 加载百度地图 3D API
    if (!isBaiduMapLoaded('3d')) {
      await loadBaiduMapAPI('3d')
    }
    // 初始化百度地图 3D 视图
    init_map_3d()
  } catch (error) {
    console.error('百度地图 3D 加载失败:', error)
  }
})

// 组件卸载
onBeforeUnmount(() => {

  // 清理 3D 覆盖物
  if (tree_overlay && map_instance) {
    map_instance.removeOverlay(tree_overlay)
    tree_overlay.destroy()
  }

  // 清理百度地图标注
  if (tree_marker && map_instance) {
    map_instance.removeOverlay(tree_marker)
  }

  // 清理地图资源
  if (map_instance) {
    map_instance.destroy()
  }
})
</script>

<style scoped>
.tree_detail_container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

/* 百度地图 3D 视图 */
.map_3d_view {
  width: 100%;
  height: 100%;
}

/* 返回按钮 */
.back_button {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 12px 24px;
  background: rgba(74, 222, 128, 0.9);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.back_button:hover {
  background: rgba(74, 222, 128, 1);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.back_icon {
  font-size: 20px;
}

/* 树木信息面板 */
.tree_info_panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid #4ade80;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.tree_name {
  font-size: 24px;
  font-weight: bold;
  color: #4ade80;
  margin-bottom: 16px;
  text-align: center;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.info_grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.info_item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info_label {
  font-size: 11px;
  font-weight: bold;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info_value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.info_description {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #475569;
}

.info_description .info_label {
  font-size: 11px;
  font-weight: bold;
  color: #94a3b8;
  text-transform: uppercase;
}

.info_description .info_value {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.6;
  margin: 0;
}

/* 操作提示 */
.control_hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #4ade80;
  border-radius: 8px;
  color: #4ade80;
  font-size: 14px;
  z-index: 1000;
  pointer-events: none;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 响应式布局 - 平板 */
@media screen and (max-width: 1024px) {
  .tree_info_panel {
    width: 280px;
    padding: 16px;
  }

  .tree_name {
    font-size: 20px;
  }

  .back_button {
    padding: 10px 20px;
    font-size: 14px;
  }
}

/* 响应式布局 - 移动端 */
@media screen and (max-width: 768px) {
  .tree_info_panel {
    top: 10px;
    right: 10px;
    width: calc(100% - 20px);
    max-width: 300px;
    padding: 12px;
  }

  .tree_name {
    font-size: 18px;
  }

  .info_grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .back_button {
    top: 10px;
    left: 10px;
    padding: 8px 16px;
    font-size: 12px;
  }

  .control_hint {
    font-size: 12px;
    padding: 8px 16px;
    bottom: 10px;
  }
}
</style>
