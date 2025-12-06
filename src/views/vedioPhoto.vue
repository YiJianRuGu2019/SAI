<template>
  <div class="box">
    <Header :is-logged-in="isLoggedIn" :default-active-nav="activeNav" @locationSelected="handleLocationSelected" />
    <div class="container">
      <div class="main_content">
        <!-- 顶部导航栏 -->
        <div class="video_creation_container">
          <div class="creation_modes">
            <div class="mode_box" :class="{ 'active': activeComponent === 'photo' }" @click="switchComponent('photo')">
              <h2>AI图片生成，解锁视觉新世界</h2>
              <p>Seedream-4.0，Grok-2-Image模型</p>
            </div>
            <div class="mode_box" :class="{ 'active': activeComponent === 'vedioe' }"
              @click="switchComponent('vedioe')">
              <h2>AI视频创作，开启灵感新纪元</h2>
              <p>Seedance V1 Pro模型</p>
            </div>
          </div>
          <!-- 使用 v-show 保持组件实例，避免切换时刷新 -->
          <Photo v-show="activeComponent === 'photo'" ref="photoComponentRef" :locationTags="vedioPhotoLocationTags"
            @removeLocationTag="removeLocationTag" />
          <Vedioe v-show="activeComponent === 'vedioe'" :locationTags="vedioPhotoLocationTags"
            @removeLocationTag="removeLocationTag" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Vedioe from '@/components/vedioe.vue';
import Photo from '@/components/photo.vue';

const route = useRoute();
const activeComponent = ref('photo');
const photoComponentRef = ref(null);

// vedioPhoto 独立的位置标签
const vedioPhotoLocationTags = ref([]);

// Header 组件事件处理
const isLoggedIn = ref(false);
const activeNav = ref('vedioPhoto');

// 处理位置选择
const handleLocationSelected = (location) => {
  const exists = vedioPhotoLocationTags.value.some(tag => tag.name === location.name);
  if (!exists) {
    vedioPhotoLocationTags.value.push(location);
  }
  console.log('vedioPhoto 添加位置标签:', location);
};

// 删除位置标签
const removeLocationTag = (index) => {
  vedioPhotoLocationTags.value.splice(index, 1);
};

// 切换组件的事件处理函数
const switchComponent = (componentName) => {
  activeComponent.value = componentName;
};

// 检查并处理待处理的提示词
const checkAndSetPrompt = () => {
  const pendingPrompt = sessionStorage.getItem('pendingImagePrompt');
  if (pendingPrompt) {
    // 延迟执行，确保子组件已挂载
    setTimeout(() => {
      if (photoComponentRef.value && photoComponentRef.value.setPromptAndGenerate) {
        photoComponentRef.value.setPromptAndGenerate(pendingPrompt);
      }
    }, 100);
    // 清除 sessionStorage
    sessionStorage.removeItem('pendingImagePrompt');
  }
};

// 组件挂载时检查
onMounted(() => {
  checkAndSetPrompt();
});

// 监听路由变化（处理同一页面内的重复导航）
watch(() => route.fullPath, () => {
  // 延迟检查，确保 sessionStorage 已更新
  setTimeout(() => {
    checkAndSetPrompt();
  }, 50);
});
</script>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.container {
  display: flex;
  flex: 1;
  background-color: #f0f2f5;
  overflow: hidden;
}

.main_content {
  flex-grow: 1;
}

.video_creation_container {
  min-height: 100%;
  background-color: white;
  padding: 30px;
  padding-top: 20px;
}

.creation_modes {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.mode_box {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
}

.mode_box.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.mode_box h2 {
  font-size: 16px;
  margin: 0 0 5px 0;
}

.mode_box p {
  font-size: 12px;
  color: #888;
  margin: 0;
}
</style>