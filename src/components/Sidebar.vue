<template>
  <div class="sidebarBox" :class="{ 'collapsed': isCollapsed }" @mouseenter="expand" @mouseleave="collapse">
    <div class="sidebarContent">
      <!-- 新对话按钮 -->
      <div class="newChatBtn">
        <el-button type="primary" class="newChat" @click="createNewChat">
          <el-icon>
            <Plus />
          </el-icon>
          <span class="btnText">新对话</span>
        </el-button>
      </div>

      <!-- 功能列表 -->
      <div class="featuresList">
        <div v-for="(item, index) in features" :key="index" class="featureItem"
          :class="{ 'active': currentRoute === item.route }" @click="navigateTo(item.route)">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span class="featureText">{{ item.text }}</span>
          <span v-if="item.badge" class="modelBadge">{{ item.badge }}</span>
          <span v-if="item.notification" class="notificationDot"></span>
        </div>
      </div>

      <!-- <div class="divider"></div> -->

      <!-- AI云盘 -->
      <!-- <div class="featuresList">
        <div class="featureItem" @click="navigateTo('/cloud')">
          <el-icon>
            <Folder />
          </el-icon>
          <span class="featureText">AI 云盘</span>
        </div>
      </div> -->

      <div class="divider"></div>

      <!-- 历史对话 -->
      <div class="historySection">
        <div class="sectionTitle">历史对话</div>
        <div class="historyList">
          <div v-for="(item, index) in historyItems" :key="index" class="historyItem" @click="loadHistoryChat(item)">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span class="historyText">{{ item.text }}</span>
          </div>
        </div>
      </div>

      <!-- 底部下载按钮 -->
      <div class="downloadSection">
        <div class="downloadButton" @click="downloadDesktopApp">
          <el-icon>
            <Download />
          </el-icon>
          <span class="downloadText">下载电脑版</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 计算当前路由
const currentRoute = computed(() => route.path);

// 侧边栏状态
const isCollapsed = ref(true);

// 功能列表数据
const features = [
  { icon: 'Opportunity', text: 'AI对话', route: '/' },
  { icon: 'Search', text: 'AI搜索', route: '/search' },
  { icon: 'VideoPlay', text: 'AI图片和视频', route: '/vedioPhoto' },
  { icon: 'Reading', text: 'AI创意文档', route: '/office' },
  { icon: 'Place', text: '3D全景地图', route: '/map3d' },
];

// 历史记录数据
const historyItems = [
  { icon: 'Picture', text: '生成红色图标', id: 'chat-1' },
  { icon: 'Cellphone', text: '手机版对话', id: 'chat-2' }
];

// 展开/收起函数
const expand = () => {
  isCollapsed.value = false;
};

const collapse = () => {
  isCollapsed.value = true;
};

// 导航函数
const navigateTo = (path) => {
  router.push(path);
};

// 创建新对话
const createNewChat = () => {
  router.push('/chat');
};

// 加载历史对话
const loadHistoryChat = (item) => {
  router.push(`/chat/${item.id}`);
};

// 下载桌面版
const downloadDesktopApp = () => {
  window.open('https://saiweb.edgeone.app/download', '_blank');
};
</script>

<style scoped>
.sidebarBox {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 160px;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  z-index: 1001;
  border-right: 1px solid #eee;
}

.sidebarBox.collapsed {
  width: 60px;
}

.sidebarContent {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.newChatBtn {
  margin-bottom: 16px;
  width: 100%;
}

.newChat {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border-radius: 8px;
  background-color: #4e6ef2;
  padding: 10px 14px;
  white-space: nowrap;
  box-sizing: border-box;
  font-size: 14px;
}

.shortcutKey {
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: auto;
  transition: opacity 0.3s ease;
}

.featuresList {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  width: 100%;
}

/* 合并共同样式 */
.featureItem,
.historyItem,
.downloadButton {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  font-size: 14px;
}

.featureItem:hover,
.historyItem:hover,
.downloadButton:hover {
  background-color: #f5f5f5;
}

.featureItem.active {
  background-color: #eef1ff;
  color: #4e6ef2;
}

/* 合并图标样式 */
.featureItem .el-icon,
.historyItem .el-icon,
.downloadButton .el-icon,
.newChat .el-icon {
  font-size: 18px;
  min-width: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modelBadge {
  font-size: 10px;
  color: #fff;
  background-color: #1e90ff;
  padding: 2px 4px;
  border-radius: 4px;
  position: absolute;
  right: 5px;
  transition: all 0.3s ease;
}

.notificationDot {
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
  position: absolute;
  right: 5px;
  top: 10px;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 8px 0 16px;
}

.historySection {
  flex: 1;
  overflow-y: auto;
}

.sectionTitle {
  font-size: 13px;
  color: #999;
  margin-bottom: 10px;
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

.historyList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.downloadSection {
  margin-top: auto;
  padding-top: 16px;
}

/* 收起状态样式 */
.collapsed .shortcutKey,
.collapsed .btnText,
.collapsed .featureText,
.collapsed .historyText,
.collapsed .downloadText,
.collapsed .sectionTitle {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  display: none;
  margin: 0;
}

.collapsed .modelBadge {
  opacity: 0;
  visibility: hidden;
}

.collapsed .notificationDot {
  right: auto;
  top: 2px;
  left: 38px;
}

/* 收起状态下居中图标 */
.collapsed .featureItem,
.collapsed .historyItem,
.collapsed .downloadButton,
.collapsed .newChat {
  justify-content: center;
  padding: 10px 0;
}

.collapsed .newChat {
  padding: 12px 5px;
}

.collapsed .featureItem .el-icon,
.collapsed .historyItem .el-icon,
.collapsed .downloadButton .el-icon,
.collapsed .newChat .el-icon {
  margin: 0 auto;
}

.collapsed .sidebarContent {
  padding: 16px 10px;
}
</style>