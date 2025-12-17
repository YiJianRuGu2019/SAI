<template>
  <div class="tree_detail_container">
    <!-- 返回按钮 -->
    <button class="back_button" @click="handle_back_click">
      <span class="back_icon">←</span>
      <span class="back_text"></span>
    </button>

    <!-- 腾讯地图 3D 视图（集成 Three.js 树木模型） -->
    <div ref="map_3d_container" class="map_3d_view"></div>

    <!-- 树木信息面板 -->
    <div class="tree_info_panel">
      <div class="tree_name">
        <!-- 树木图片横向滚动 -->
        <div class="tree_images_container" v-if="tree_data.images && tree_data.images.length > 0">
          <div v-for="(image, index) in tree_data.images" :key="index" class="tree_image_item"
            @click="open_image_viewer(index)">
            <img :src="image" :alt="`${tree_data.name} - 图片 ${index + 1}`" />
          </div>
        </div>
      </div>
      <div class="info_grid">
        <div class="info_item">
          <span class="info_label">树名</span>
          <span class="info_value">{{ tree_data.name }}</span>
        </div>
        <div class="info_item">
          <span class="info_label">树种</span>
          <span class="info_value">{{ tree_data.species }}</span>
        </div>
        <div class="info_item">
          <span class="info_label">树龄</span>
          <span class="info_value">{{ tree_data.age }} 年</span>
        </div>
        <div class="info_item">
          <span class="info_label">树高</span>
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

    <!-- 图片查看器（放大查看） -->
    <div v-if="show_image_viewer" class="image_viewer_overlay" @click="close_image_viewer">
      <div class="image_viewer_container" @click.stop>
        <!-- 关闭按钮 -->
        <!-- <button class="viewer_close_btn" @click="close_image_viewer">✕</button> -->

        <!-- 左箭头 -->
        <button class="viewer_arrow viewer_arrow_left" @click="prev_image" v-if="tree_data.images.length > 1">
          ‹
        </button>

        <!-- 当前图片 -->
        <div class="viewer_image_wrapper">
          <img :src="tree_data.images[current_image_index]"
            :alt="`${tree_data.name} - 图片 ${current_image_index + 1}`" />
        </div>

        <!-- 右箭头 -->
        <button class="viewer_arrow viewer_arrow_right" @click="next_image" v-if="tree_data.images.length > 1">
          ›
        </button>

        <!-- 图片指示器 -->
        <div class="viewer_indicator" v-if="tree_data.images.length > 1">
          {{ current_image_index + 1 }} / {{ tree_data.images.length }}
        </div>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="control_hint">
      🖱️ 拖动地图旋转 | 滚轮缩放 | 3D 树木模型已集成到地图中
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import customMapStyle from '../custom_map_config.json'

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

// 腾讯地图实例
let map_instance = null
let tree_overlay = null // Three.js 覆盖物

// 图片查看器状态
const show_image_viewer = ref(false)
const current_image_index = ref(0)

// 打开图片查看器
const open_image_viewer = (index) => {
  current_image_index.value = index
  show_image_viewer.value = true
}

// 关闭图片查看器
const close_image_viewer = () => {
  show_image_viewer.value = false
}

// 上一张图片
const prev_image = () => {
  if (current_image_index.value > 0) {
    current_image_index.value--
  } else {
    current_image_index.value = props.tree_data.images.length - 1
  }
}

// 下一张图片
const next_image = () => {
  if (current_image_index.value < props.tree_data.images.length - 1) {
    current_image_index.value++
  } else {
    current_image_index.value = 0
  }
}

// 获取响应式缩放级别
const get_responsive_zoom_3d = () => {
  const width = window.innerWidth
  if (width < 768) {
    return 17 // H5/APP 模式
  }
  return 19 // Web 模式
}

// 创建 Three.js 自定义覆盖物类（腾讯地图版本）
const create_threejs_overlay_class = () => {
  class CustomThreeJSOverlay extends TMap.DOMOverlay {
    constructor(options) {
      super(options)
      this._tree_data = options.tree_data
      this._position = options.position
      this._container = null
      this._scene = null
      this._camera = null
      this._renderer = null
      this._tree_mesh = null
    }

    // 初始化（必须实现）
    onInit (options) {
      this._position = options.position
      this._tree_data = options.tree_data
    }

    // 创建DOM元素（必须实现）
    createDOM () {
      // 创建容器（固定尺寸，不随地图缩放变化）
      this._container = document.createElement('div')
      this._container.style.position = 'absolute'
      this._container.style.width = '150px'
      this._container.style.height = '150px'
      this._container.style.pointerEvents = 'none' // 不阻止地图交互

      // 初始化 Three.js 场景
      this._init_three_scene()

      return this._container
    }

    // 更新DOM元素（必须实现）
    updateDOM () {
      if (!this.map || !this._position) {
        return
      }

      // 经纬度坐标转容器像素坐标
      const pixel = this.map.projectToContainer(this._position)

      // 计算位置（居中对齐）
      const left = pixel.getX() - this.dom.clientWidth / 2 + 'px'
      const top = pixel.getY() - this.dom.clientHeight + 'px' // 底部对齐

      // 将平面坐标转为三维空间坐标，并应用缩放
      this.dom.style.transform = `translate3d(${left}, ${top}, 0px) scale(1)`
      this.dom.style.transformOrigin = 'center bottom'
    }

    // 初始化 Three.js 场景
    _init_three_scene () {
      // 创建场景
      this._scene = new THREE.Scene()

      // 创建相机
      this._camera = new THREE.PerspectiveCamera(
        75,
        1, // 宽高比 1:1
        0.1,
        1000
      )
      this._camera.position.set(0, 50, 100)
      this._camera.lookAt(0, 0, 0)

      // 创建渲染器
      this._renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      this._renderer.setSize(150, 150)
      this._renderer.setClearColor(0x000000, 0) // 透明背景
      this._container.appendChild(this._renderer.domElement)

      // 添加环境光
      const ambient_light = new THREE.AmbientLight(0xffffff, 0.6)
      this._scene.add(ambient_light)

      // 添加方向光
      const directional_light = new THREE.DirectionalLight(0xffffff, 0.8)
      directional_light.position.set(50, 100, 50)
      this._scene.add(directional_light)

      // 创建树木模型
      this._create_tree_model()

      // 开始渲染循环
      this._animate()
    }

    // 创建树木模型
    _create_tree_model () {
      const tree_group = new THREE.Group()

      // 树干
      const trunk_geometry = new THREE.CylinderGeometry(2, 3, 30, 8)
      const trunk_material = new THREE.MeshPhongMaterial({ color: 0x8B4513 })
      const trunk = new THREE.Mesh(trunk_geometry, trunk_material)
      trunk.position.y = 15
      tree_group.add(trunk)

      // 树冠（3层）
      const crown_colors = [0x228B22, 0x32CD32, 0x90EE90]
      const crown_sizes = [12, 10, 8]
      const crown_positions = [25, 32, 38]

      for (let i = 0; i < 3; i++) {
        const crown_geometry = new THREE.SphereGeometry(crown_sizes[i], 16, 16)
        const crown_material = new THREE.MeshPhongMaterial({ color: crown_colors[i] })
        const crown = new THREE.Mesh(crown_geometry, crown_material)
        crown.position.y = crown_positions[i]
        tree_group.add(crown)
      }

      this._tree_mesh = tree_group
      this._scene.add(this._tree_mesh)
    }

    // 动画循环
    _animate () {
      if (!this._renderer || !this._scene || !this._camera) return

      requestAnimationFrame(() => this._animate())

      // 树木缓慢旋转
      if (this._tree_mesh) {
        this._tree_mesh.rotation.y += 0.005
      }

      this._renderer.render(this._scene, this._camera)
    }

    // 更新位置
    onDestroy () {
      // 清理 Three.js 资源
      if (this._renderer) {
        this._renderer.dispose()
      }
      if (this._scene) {
        this._scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }
    }
  }

  return CustomThreeJSOverlay
}

// 初始化腾讯地图
const init_map = () => {
  if (!map_3d_container.value) return

  // 检查腾讯地图 API 是否加载
  if (typeof TMap === 'undefined') {
    console.error('❌ 腾讯地图 API 未加载')
    return
  }

  console.log('✅ 初始化腾讯地图 3D 视图')
  console.log('树木数据：', props.tree_data)

  // 创建地图实例
  const center = new TMap.LatLng(props.tree_data.latitude, props.tree_data.longitude)
  map_instance = new TMap.Map(map_3d_container.value, {
    center: center,
    zoom: get_responsive_zoom_3d(),
    pitch: 45, // 俯仰角度
    rotation: 0,
    viewMode: '3D',
    mapStyleId: 'style1' // 个性化地图样式ID（第一个绑定的样式通常是style1）
  })

  console.log('✅ 腾讯地图实例创建成功')

  // 添加 3D 树木覆盖物
  add_tree_overlay()
}

// 添加 3D 树木覆盖物
const add_tree_overlay = () => {
  const ThreeJSOverlay = create_threejs_overlay_class()

  tree_overlay = new ThreeJSOverlay({
    map: map_instance,
    position: new TMap.LatLng(props.tree_data.latitude, props.tree_data.longitude),
    tree_data: props.tree_data
  })

  console.log('✅ 3D 树木模型已添加到地图')
}

// 处理返回按钮点击
const handle_back_click = () => {
  emit('back_click')
}

// 处理窗口大小改变
const handle_resize = () => {
  if (!map_instance) return

  setTimeout(() => {
    if (map_instance) {
      const zoom_level = get_responsive_zoom_3d()
      map_instance.setZoom(zoom_level)
    }
  }, 100)
}

// 组件挂载
onMounted(() => {
  init_map()
  window.addEventListener('resize', handle_resize)
})

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener('resize', handle_resize)

  if (tree_overlay) {
    tree_overlay.onDestroy()
    tree_overlay = null
  }

  if (map_instance) {
    map_instance.destroy()
    map_instance = null
  }
})
</script>

<style scoped>
.tree_detail_container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #ECFDF5;
  color: #079769;
}

.back_button {
  position: absolute;
  top: 26px;
  left: 20px;
  z-index: 10000;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #4ade80;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.back_button:hover {
  background: #4ade80;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(74, 222, 128, 0.4);
}

.back_icon {
  font-size: 20px;
}

.map_3d_view {
  width: 100%;
  height: 100%;
}

.tree_info_panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(74, 222, 128, 0.3);
  max-width: 320px;
  z-index: 10000;
  pointer-events: auto;
}

.tree_name {
  background: #ECFDF5;
  color: #079769;
  padding: 0;
  border-radius: 8px;
  font-size: 18px;
  margin-bottom: 16px;
}

/* 树木图片横向滚动容器 */
.tree_images_container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.tree_images_container::-webkit-scrollbar {
  height: 6px;
}

.tree_images_container::-webkit-scrollbar-track {
  background: rgba(74, 222, 128, 0.1);
  border-radius: 3px;
}

.tree_images_container::-webkit-scrollbar-thumb {
  background: rgba(74, 222, 128, 0.5);
  border-radius: 3px;
}

.tree_images_container::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 222, 128, 0.7);
}

.tree_image_item {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(74, 222, 128, 0.3);
}

.tree_image_item:hover {
  transform: scale(1.05);
  border-color: #4ade80;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.tree_image_item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info_grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info_item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(74, 222, 128, 0.2);
}

.info_label {
  font-size: 11px;
  color: #059669;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info_value {
  font-size: 14px;
  color: #065f46;
  font-weight: 600;
}

.info_description {
  padding-top: 12px;
  border-top: 2px solid rgba(74, 222, 128, 0.3);
}

.info_description .info_label {
  display: block;
  margin-bottom: 8px;
}

.info_description .info_value {
  font-size: 13px;
  line-height: 1.6;
  color: #047857;
}

.control_hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  color: #059669;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  border: 1px solid rgba(74, 222, 128, 0.3);
  pointer-events: none;
}

/* 图片查看器样式 */
.image_viewer_overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade_in 0.3s ease;
}

@keyframes fade_in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.image_viewer_container {
  position: relative;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer_close_btn {
  position: absolute;
  top: -50px;
  right: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 20001;
}

.viewer_close_btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.viewer_arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: white;
  font-size: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 20001;
}

.viewer_arrow:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.viewer_arrow_left {
  left: 20px;
}

.viewer_arrow_right {
  right: 20px;
}

.viewer_image_wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: zoom_in 0.3s ease;
}

@keyframes zoom_in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.viewer_image_wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.viewer_indicator {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

/* 响应式布局 - H5/APP */
@media screen and (max-width: 768px) {
  .tree_info_panel {
    width: 200px;
    height: 150px;
    overflow-y: auto;
    padding: 12px;
  }

  .tree_name {
    font-size: 14px;
    margin-bottom: 10px;
    padding: 6px 10px;
  }

  .info_grid {
    gap: 8px;
    margin-bottom: 10px;
  }

  .info_item {
    padding: 6px 0;
  }

  .info_label {
    font-size: 9px;
  }

  .info_value {
    font-size: 11px;
  }

  .info_description .info_value {
    font-size: 10px;
  }

  .back_button {
    /* padding: 8px 16px; */
    font-size: 14px;
  }

  .control_hint {
    font-size: 12px;
    padding: 8px 16px;
  }
}
</style>
