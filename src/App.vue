<template>
  <div class="app-container">
    <sidebar></sidebar>
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Source Han Serif CN", serif;
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: transparent;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* background-color: #f7f8fa; */
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100%;
  position: relative;
}

.main-content {
  background-color: #fff;
  flex: 1;
  padding: 0;
  width: calc(100% - 60px);
  margin-left: 60px;
  /* 固定为侧边栏收起状态的宽度 */
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
}

/* 添加字体回退方案 */
@font-face {
  font-family: 'Source Han Serif CN';
  src: local('Source Han Serif CN'),
    local('Noto Serif CJK SC'),
    local('SimSun'),
    local('宋体');
  font-weight: 400;
}
</style>
