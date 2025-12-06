<template>
  <div class="map_3d_container">
    <!-- 3D 中国地图 -->
    <ChinaMap3D v-show="!show_tree_detail" @tree_click="handle_tree_click" />

    <!-- 树木 3D 详情视图 -->
    <TreeDetail3D v-if="show_tree_detail" :tree_data="selected_tree" @back_click="handle_back_click" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ChinaMap3D from '@/components/ChinaMap3D.vue'
import TreeDetail3D from '@/components/TreeDetail3D.vue'

// 控制显示状态
const show_tree_detail = ref(false)
const selected_tree = ref(null)

// 禁用所有弹窗
const disableAllPopups = () => {
  // 禁用 alert
  window.alert = () => { }
  // 禁用 confirm
  window.confirm = () => true
  // 禁用 prompt
  window.prompt = () => null

  // 拦截百度地图弹窗 - 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // 元素节点
          const element = node
          // 移除包含 "localhost" 或 "显示" 或 "确定" 的弹窗
          if (
            element.textContent?.includes('localhost') ||
            element.textContent?.includes('显示') ||
            element.textContent?.includes('系统于') ||
            element.textContent?.includes('地图服务') ||
            element.className?.includes('BMap') ||
            element.className?.includes('anchorBL')
          ) {
            element.remove()
          }
          // 递归检查子元素
          element.querySelectorAll('*').forEach((child) => {
            if (
              child.textContent?.includes('localhost') ||
              child.textContent?.includes('显示') ||
              child.textContent?.includes('系统于') ||
              child.textContent?.includes('地图服务')
            ) {
              child.remove()
            }
          })
        }
      })
    })
  })

  // 开始观察整个文档
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // 保存 observer 以便后续清理
  window.__mapPopupObserver = observer

  // 定时清理百度地图弹窗（备用方案）
  const intervalId = setInterval(() => {
    // 移除所有可能的百度地图弹窗元素
    document.querySelectorAll('div').forEach((div) => {
      if (
        div.textContent?.includes('localhost') ||
        div.textContent?.includes('系统于') ||
        div.textContent?.includes('地图服务') ||
        div.className?.includes('anchorBL')
      ) {
        div.remove()
      }
    })
  }, 100)

  window.__mapPopupInterval = intervalId
}

// 恢复原始弹窗函数
const originalAlert = window.alert
const originalConfirm = window.confirm
const originalPrompt = window.prompt

const restorePopups = () => {
  window.alert = originalAlert
  window.confirm = originalConfirm
  window.prompt = originalPrompt

  // 停止观察和定时器
  if (window.__mapPopupObserver) {
    window.__mapPopupObserver.disconnect()
    delete window.__mapPopupObserver
  }
  if (window.__mapPopupInterval) {
    clearInterval(window.__mapPopupInterval)
    delete window.__mapPopupInterval
  }
}

// 处理树木点击事件
const handle_tree_click = (tree_data) => {
  selected_tree.value = tree_data
  show_tree_detail.value = true
}

// 处理返回按钮点击
const handle_back_click = () => {
  show_tree_detail.value = false
  selected_tree.value = null
}

// 组件挂载时禁用弹窗
onMounted(() => {
  disableAllPopups()
})

// 组件卸载时恢复弹窗
onBeforeUnmount(() => {
  restorePopups()
})
</script>

<style scoped>
.map_3d_container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
