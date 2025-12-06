<template>
  <header class="top_header">
    <!-- 添加登录模态框 -->
    <login-modal :visible="showLoginModal" @close="showLoginModal = false" @loginSuccess="handleLoginSuccess" />

    <div class="header_left">
      <!-- 简化左侧，只保留小图标 -->
      <div class="header_logo">
        <div class="logoSection">
          <a href="https://saiweb.edgeone.app/" target="_blank">
            <div class="logoAreaBox">
              <img class="logoArea" src="../img/slogo.png" alt="logo">
            </div>
          </a>
        </div>
      </div>
    </div>

    <div class="header_center">
      <nav class="nav_links">
        <a href="#" class="nav_link" :class="{ active: activeNav === 'chat' }" @click.prevent="navigateTo('/')">
          <el-icon>
            <HomeFilled />
          </el-icon>
          首页
        </a>
        <a href="#" class="nav_link" :class="{ active: activeNav === 'Search' }" @click.prevent="navigateTo('/search')">
          <el-icon>
            <Clock />
          </el-icon>
          搜索
        </a>
        <a href="#" class="nav_link" :class="{ active: activeNav === 'vedioPhoto' }"
          @click.prevent="navigateTo('/vedioPhoto')">
          <el-icon>
            <Star />
          </el-icon>
          生图
        </a>
        <a href="#" class="nav_link" :class="{ active: activeNav === 'office' }" @click.prevent="navigateTo('/office')">
          <el-icon>
            <Clock />
          </el-icon>
          文档
        </a>
      </nav>
    </div>

    <div class="header_right">
      <!-- 地图组件放在最左边 -->
      <div class="headerMapWrapper">
        <header-map2 :disabled="editorLoading" @locationSelected="handleLocationSelected" />
      </div>

      <!-- 设置和通知图标 -->
      <el-icon class="header_icon" @click="handleSettings">
        <Setting />
      </el-icon>
      <el-icon class="header_icon" @click="handleNotifications">
        <Bell />
      </el-icon>

      <!-- 登录按钮和用户信息放在最右边 -->
      <login-button @openLogin="showLoginModal = true" v-if="!isLoggedIn" />
      <div class="userInfo" v-else>
        <span>{{ userInfo?.username }}</span>
        <button @click="logout" class="logoutBtn">退出</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, HomeFilled, Clock, Star, Setting, Bell } from '@element-plus/icons-vue'
import AuthStore from '@/stores/auth.js'
// import HeaderMap from './HeaderMap.vue'

const router = useRouter()
const route = useRoute()

// Component name for debugging
defineOptions({
  name: 'searchHeader'
})

// Props
interface Props {
  defaultActiveNav?: string
  editorLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultActiveNav: 'home',
  editorLoading: false
})

// Emits
const emit = defineEmits<{
  navChange: [nav: string]
  settings: []
  notifications: []
  login: []
  locationSelected: [location: { name: string, address: string, coords: any }]
}>()

// 根据路由路径获取对应的导航标识
const getNavFromPath = (path: string): string => {
  if (path === '/' || path === '/index') return 'chat'
  if (path === '/search' || path === '/searchhub') return 'Search'
  if (path === '/vedioPhoto') return 'vedioPhoto'
  if (path === '/office') return 'office'
  return 'chat'
}

// State
const activeNav = ref(getNavFromPath(route.path))
const isLoggedIn = ref<boolean>(false)
const userInfo = ref<{ username: string } | null>(null)
const showLoginModal = ref<boolean>(false)

// 监听路由变化，自动更新高亮
watch(() => route.path, (newPath) => {
  activeNav.value = getNavFromPath(newPath)
  emit('navChange', activeNav.value)
})

// Methods
const setActiveNav = (nav: string) => {
  activeNav.value = nav
  emit('navChange', nav)
}

// 路由跳转方法
const navigateTo = (routePath: string) => {
  router.push(routePath)
}

const handleSettings = () => {
  emit('settings')
}

const handleNotifications = () => {
  emit('notifications')
}

const handleLogin = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true
  }
  emit('login')
}

// 处理登录成功
const handleLoginSuccess = (userData: { username: string }) => {
  isLoggedIn.value = true
  userInfo.value = userData

  // 模拟生成token，实际应用中应该从服务器获取
  const mockToken = `token_${Date.now()}`

  // 保存到auth store
  AuthStore.login(userData, mockToken)

  showLoginModal.value = false
}

// 退出登录
const logout = () => {
  isLoggedIn.value = false
  userInfo.value = null
  AuthStore.logout()
}

// 处理位置选择 - 只向父组件发送事件，由父组件决定如何处理
const handleLocationSelected = (location: { name: string, address: string, coords: any }) => {
  emit('locationSelected', location)
}

// 初始化检查登录状态
onMounted(() => {
  const loggedIn = AuthStore.checkAuth()
  if (loggedIn) {
    isLoggedIn.value = true
    userInfo.value = AuthStore.state.userInfo
  }
})
</script>

<style scoped>
.header_logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 顶部导航栏 */
.logoSection {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.logoAreaBox {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logoArea {
  width: 70px;
  height: 34px;
  margin-right: 20px;
}

.top_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 24px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: "Source Han Serif CN", serif;
}

.header_left .brand_icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white !important;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.header_left .brand_icon:hover {
  transform: scale(1.05);
}

.header_left .brand_icon .el-icon {
  color: white !important;
  font-size: 16px;
}

.header_center .nav_links {
  display: flex;
  gap: 32px;
  margin-left: 156px;
}

.nav_link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-family: "Source Han Serif CN", serif;
  transition: color 0.2s;
  cursor: pointer;
}

.nav_link.active,
.nav_link:hover {
  color: #4e6ef2;
}

.header_right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header_icon {
  color: #666;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.header_icon:hover {
  color: #4e6ef2;
}

.login_btn {
  border-radius: 20px;
  padding: 8px 20px;
}

/* 用户信息样式 */
.userInfo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
}

.logoutBtn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: color 0.2s;
}

.logoutBtn:hover {
  color: #4e6ef2;
  background-color: #f5f5f5;
}

/* 地图容器样式 */
.headerMapWrapper {
  width: 90px;
  height: 27px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header_center {
    display: none;
  }

  .top_header {
    padding: 8px 16px;
  }

  .header_right {
    gap: 12px;
  }

  .login_btn {
    padding: 6px 16px;
    font-size: 14px;
  }

  .userInfo {
    font-size: 13px;
  }

  .headerMapWrapper {
    width: 70px;
    height: 24px;
  }
}
</style>
