<template>
  <div class="search_page">
    <!-- 顶部导航栏 -->
    <Header :is-logged-in="isLoggedIn" @locationSelected="handleLocationSelected" />

    <!-- 主要内容区域 -->
    <main class="main_content">
      <!-- 标题和描述 -->
      <section class="hero_section animate-on-scroll" data-animation="fade-in-up">
        <h1 class="main_title">
          <span v-for="(char, index) in titleText" :key="'title-' + index" class="char-animate"
            :style="{ animationDelay: `${index * 0.02}s` }">
            {{ char }}
          </span>
        </h1>
        <p class="subtitle">
          <span v-for="(char, index) in subtitleText" :key="'subtitle-' + index" class="char-animate"
            :style="{ animationDelay: `${(index + titleText.length) * 0.02}s` }">
            {{ char }}
          </span>
        </p>
      </section>

      <!-- 搜索框 -->
      <section class="search_section animate-on-scroll" data-animation="fade-in-up">
        <div class="search_container">
          <div class="search_input_wrapper">
            <el-icon class="search_input_icon">
              <Search />
            </el-icon>
            <!-- 标签和输入框容器 -->
            <div class="taggedInputContainer">
              <!-- 标签容器 -->
              <div class="tagsContainer">
                <div v-for="(tag, index) in searchViewLocationTags" :key="index" class="locationTag">
                  <span class="tagText">{{ tag.name }}</span>
                  <button class="tagRemove" @click="removeLocationTag(index)">&times;</button>
                </div>
              </div>
              <input type="text" class="search_input" placeholder="搜索任何你想知道的..." v-model="searchQuery" />
            </div>
          </div>
          <el-button @click="searchBtn" type="primary" class="ai_search_btn">AI搜索</el-button>
        </div>

        <!-- 快捷标签 -->
        <div class="quick_tags animate-on-scroll" data-animation="fade-in-up">
          <span class="tag" @click="quickSearch('人工智能新发展')">人工智能新发展</span>
          <span class="tag" @click="quickSearch('前端开发趋势')">前端开发趋势</span>
          <span class="tag" @click="quickSearch('机器学习入门')">机器学习入门</span>
          <span class="tag" @click="quickSearch('数据分析工具')">数据分析工具</span>
        </div>

        <!-- 特性标签 -->
        <div class="feature_tags animate-on-scroll" data-animation="fade-in-up">
          <div class="feature_tag">
            <el-icon>
              <Document />
            </el-icon>
            <span>超过100万数据</span>
          </div>
          <div class="feature_tag">
            <el-icon>
              <Clock />
            </el-icon>
            <span>平均响应时间1秒</span>
          </div>
          <div class="feature_tag">
            <el-icon>
              <Star />
            </el-icon>
            <span>安全可靠</span>
          </div>
        </div>
      </section>

      <!-- 搜索类型选择 -->
      <section class="search_types animate-on-scroll" data-animation="fade-in-up">
        <div class="type_tabs">
          <div class="type_tab active">
            <el-icon>
              <Grid />
            </el-icon>
            全部
          </div>
          <div class="type_tab">
            <el-icon>
              <Document />
            </el-icon>
            网页
          </div>
          <div class="type_tab">
            <el-icon>
              <Picture />
            </el-icon>
            图片
          </div>
          <div class="type_tab">
            <el-icon>
              <VideoPlay />
            </el-icon>
            视频
          </div>
          <div class="type_tab">
            <el-icon>
              <Notebook />
            </el-icon>
            资讯
          </div>
          <div class="type_tab">
            <el-icon>
              <Reading />
            </el-icon>
            学术
          </div>
          <div class="type_tab">
            <el-icon>
              <More />
            </el-icon>
          </div>
        </div>
      </section>

      <!-- AI为您推荐 -->
      <section class="recommendations animate-on-scroll" data-animation="fade-in-up">
        <div class="section_header">
          <h2>AI为您推荐</h2>
          <a href="#" class="view_more">查看更多 <el-icon>
              <ArrowRight />
            </el-icon></a>
        </div>
        <div class="recommendation_grid">
          <div v-for="card in recommendationCards" :key="card.id" class="recommendation_card"
            @click="handleCardClick(card.title)">
            <div class="card_image" :class="card.bgClass">
              <img :src="card.image" :alt="card.category" class="card_img" />
            </div>
            <div class="card_content">
              <div class="card_meta">
                <span class="category">{{ card.category }}</span>
                <span class="time">{{ card.time }}</span>
              </div>
              <h3 class="card_title">{{ card.title }}</h3>
              <p class="card_description">{{ card.description }}</p>
              <div class="card_author">
                <div class="author_avatar"></div>
                <span class="author_name">{{ card.author }}</span>
                <div class="card_stats">
                  <span><el-icon>
                      <View />
                    </el-icon> {{ card.views }}</span>
                  <span><el-icon>
                      <ChatDotRound />
                    </el-icon> {{ card.comments }}</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      <!-- 为什么选择我们的AI搜索 -->
      <section class="why_choose_us animate-on-scroll" data-animation="fade-in-up">
        <h2>为什么选择我们的AI搜索</h2>
        <p class="section_subtitle">我们的AI搜索引擎融合了最新的人工智能技术，为您提供精准、更智能的搜索体验</p>

        <div class="features_grid">
          <div class="feature_item">
            <div class="feature_icon lightning">
              <el-icon>
                <Lightning />
              </el-icon>
            </div>
            <h3>极速响应</h3>
            <p>毫秒级搜索未知内容，让您无需等待即可获取所需信息</p>
          </div>

          <div class="feature_item">
            <div class="feature_icon smart">
              <el-icon>
                <MagicStick />
              </el-icon>
            </div>
            <h3>智能理解</h3>
            <p>深度理解自然语言，准确把握您的搜索意图，提供精准结果</p>
          </div>

          <div class="feature_item">
            <div class="feature_icon multi">
              <el-icon>
                <Grid />
              </el-icon>
            </div>
            <h3>多维度结果</h3>
            <p>整合网页、图片和视频等多种内容形式，满足您的多样化需求</p>
          </div>

          <div class="feature_item">
            <div class="feature_icon personal">
              <el-icon>
                <User />
              </el-icon>
            </div>
            <h3>个性化推荐</h3>
            <p>基于您的搜索历史和偏好，提供量身定制的内容推荐</p>
          </div>
        </div>
      </section>

      <!-- 当前热门搜索 -->
      <section class="trending_section animate-on-scroll" data-animation="fade-in-up">
        <h2>当前热门搜索</h2>
        <div class="trending_content">
          <div class="trending_list">
            <h3><el-icon class="hot_icon">
                <Sunny />
              </el-icon> 实时热题</h3>
            <div class="trending_items">
              <div v-for="item in trendingItems" :key="item.rank" class="trending_item"
                @click="handleTrendingClick(item.title)">
                <span class="rank" :class="{ hot: item.isHot }">{{ item.rank }}</span>
                <span class="title">{{ item.title }}</span>
                <span class="count">{{ item.count }}</span>
              </div>
            </div>
          </div>

          <div class="trending_chart">
            <h3><el-icon class="chart_icon">
                <TrendCharts />
              </el-icon> 搜索趋势</h3>
            <div class="chart_container">
              <div class="chart_placeholder">
                <div class="chart_lines">
                  <svg width="100%" height="200" viewBox="0 0 400 200">
                    <polyline points="0,150 50,120 100,100 150,80 200,60 250,40 300,30 350,20 400,10" fill="none"
                      stroke="#4e6ef2" stroke-width="3" />
                    <polyline points="0,180 50,160 100,140 150,120 200,100 250,80 300,70 350,60 400,50" fill="none"
                      stroke="#52c41a" stroke-width="3" />
                  </svg>
                </div>
                <div class="chart_legend">
                  <div class="legend_item">
                    <span class="legend_color ai"></span>
                    <span>人工智能</span>
                  </div>
                  <div class="legend_item">
                    <span class="legend_color frontend"></span>
                    <span>前端开发</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 订阅AI搜索资讯 -->
      <section class="newsletter_section animate-on-scroll" data-animation="fade-in-up">
        <div class="newsletter_content">
          <h2>订阅AI搜索资讯</h2>
          <p>获取最新的AI搜索技术动态、使用技巧和独家内容，首发发送到您的邮箱</p>
          <div class="newsletter_form">
            <input type="email" placeholder="输入您的邮箱地址" class="email_input" />
            <el-button type="primary" class="subscribe_btn">立即订阅</el-button>
          </div>
          <p class="privacy_note">我们尊重您的隐私，不会向第三方分享您的信息</p>
        </div>
      </section>
    </main>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer_content">
        <div class="footer_section">
          <div class="footer_logo">
            <el-icon class="footer_logo_icon">
              <Search />
            </el-icon>
            <span class="footer_logo_text">AI搜索</span>
          </div>
          <p class="footer_description">
            智能、高效的下一代搜索引擎，让信息获取更简单
          </p>
          <div class="social_links">
            <el-icon>
              <Share />
            </el-icon>
            <el-icon>
              <Share />
            </el-icon>
            <el-icon>
              <Share />
            </el-icon>
          </div>
        </div>

        <div class="footer_section">
          <h4>产品</h4>
          <ul class="footer_links">
            <li><a href="#">功能介绍</a></li>
            <li><a href="#">使用教程</a></li>
            <li><a href="#">API文档</a></li>
            <li><a href="#">价格方案</a></li>
            <li><a href="#">更新日志</a></li>
          </ul>
        </div>

        <div class="footer_section">
          <h4>资源</h4>
          <ul class="footer_links">
            <li><a href="#">帮助中心</a></li>
            <li><a href="#">开发者社区</a></li>
            <li><a href="#">常见问题</a></li>
            <li><a href="#">技术博客</a></li>
            <li><a href="#">合作伙伴</a></li>
          </ul>
        </div>

        <div class="footer_section">
          <h4>公司</h4>
          <ul class="footer_links">
            <li><a href="#">关于我们</a></li>
            <li><a href="#">联系我们</a></li>
            <li><a href="#">招贤纳士</a></li>
            <li><a href="#">隐私政策</a></li>
            <li><a href="#">服务条款</a></li>
          </ul>
        </div>
      </div>

      <div class="footer_bottom">
        <p>&copy; 2023 AI搜索. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Document, Grid, Picture, VideoPlay, Notebook, Reading, More, ArrowRight,
  View, ChatDotRound, Lightning, MagicStick, User, Sunny, TrendCharts, Share
} from '@element-plus/icons-vue'
import aiImg from '@/img/ai.png'
import ai2Img from '@/img/ai2.png'
import ai3Img from '@/img/ai3.png'

const router = useRouter()
const route = useRoute()

// 状态管理
const searchQuery = ref('')
const isLoggedIn = ref(false)

// 标题和副标题文字（拆分成字符数组用于动画）
const titleText = ref('智能AI搜索，发现更多可能'.split(''))
const subtitleText = ref('借助先进的人工智能技术，快速精准地获取您所需的信息，让搜索变得更智能、更高效'.split(''))

// SearchView 独立的位置标签（不与 index.vue 共享）
interface LocationTag {
  name: string;
  address?: string;
  coords?: { lat: number; lng: number } | null;
}

const searchViewLocationTags = ref<LocationTag[]>([])

// 添加位置标签
const addLocationTag = (location: LocationTag) => {
  const exists = searchViewLocationTags.value.some(tag => tag.name === location.name)
  if (!exists) {
    searchViewLocationTags.value.push(location)
  }
}

// 删除位置标签
const removeLocationTag = (index: number) => {
  searchViewLocationTags.value.splice(index, 1)
}

// 滚动动画观察器
const observeScrollAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const animation = entry.target.getAttribute('data-animation')
          if (animation === 'fade-in-up') {
            entry.target.classList.add('animate-fade-in-up')
          } else if (animation === 'scale-in') {
            entry.target.classList.add('animate-scale-in')
          }
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  const elements = document.querySelectorAll('.animate-on-scroll')
  elements.forEach((el) => observer.observe(el))

  return observer
}

let scrollObserver: IntersectionObserver | null = null

// 组件挂载时检查是否有传递的搜索内容
onMounted(() => {
  const queryParam = route.query.q as string
  if (queryParam) {
    searchQuery.value = queryParam
  }

  // 初始化滚动动画观察器
  scrollObserver = observeScrollAnimations()
})

// 组件卸载时清理观察器
onUnmounted(() => {
  if (scrollObserver) {
    scrollObserver.disconnect()
  }
})

// 监听路由变化，处理后续点击
watch(() => route.query.q, (newQuery) => {
  if (newQuery) {
    searchQuery.value = newQuery as string
  }
})

// 处理位置选择 - SearchView 独立处理
const handleLocationSelected = (location: LocationTag) => {
  addLocationTag(location)
  console.log('SearchView 添加位置标签:', location)
}

// 搜索按钮点击事件
const searchBtn = () => {
  if (searchQuery.value.trim()) {
    // 将搜索查询作为URL参数传递给SearchHub
    router.push({
      path: '/searchhub',
      query: {
        q: searchQuery.value,
        t: Date.now() // 添加时间戳强制路由更新
      }
    })
  } else {
    // 如果没有输入搜索内容，直接跳转到SearchHub
    router.push({
      path: '/searchhub',
      query: { t: Date.now() }
    })
  }
}

// 推荐卡片数据
const recommendationCards = ref([
  {
    id: 1,
    title: '人工智能的最新发展趋势与未来展望',
    description: '探索人工智能领域的最新突破，包括大模型语言模型、计算机视觉和自动化学习方面的发展趋势与应用前景。',
    category: '技术前沿',
    time: '10分钟前',
    author: '张明教授',
    views: '2.4k',
    comments: '56',
    image: aiImg,
    bgClass: 'tech_bg'
  },
  {
    id: 2,
    title: '经典爱情电影的情感内核与艺术表达',
    description: '剖析爱情电影中不同时代的叙事风格，涵盖细腻情感刻画、镜头语言运用和经典桥段设计的特点与打动人心的核心魅力。',
    category: '爱情电影',
    time: '2小时前',
    author: '李华工程师',
    views: '5.1k',
    comments: '128',
    image: ai2Img,
    bgClass: 'frontend_bg'
  },
  {
    id: 3,
    title: '秋天的自然景致与生活美学',
    description: '展现秋天的多样魅力，涵盖山林间的斑斓色彩、田野里的丰收景象以及人们在秋日里的生活方式与专属浪漫氛围。',
    category: '自然景致',
    time: '昨天',
    author: '王强分析师',
    views: '3.8k',
    comments: '94',
    image: ai3Img,
    bgClass: 'data_bg'
  }
])

// 热门搜索数据
const trendingItems = ref([
  { rank: 1, title: '2023人工智能大会最新动态', count: '12.5万', isHot: true },
  { rank: 2, title: 'Web3.0技术发展现状', count: '9.8万', isHot: true },
  { rank: 3, title: '机器学习入门教程', count: '8.2万', isHot: false },
  { rank: 4, title: '大语言模型应用案例', count: '7.6万', isHot: false },
  { rank: 5, title: '前端框架性能对比', count: '6.3万', isHot: false }
])

// 推荐卡片点击事件
const handleCardClick = (title: string) => {
  router.push({
    path: '/searchhub',
    query: {
      q: title,
      t: Date.now() // 添加时间戳强制路由更新
    }
  })
}

// 热门搜索项点击事件
const handleTrendingClick = (title: string) => {
  router.push({
    path: '/searchhub',
    query: {
      q: title,
      t: Date.now() // 添加时间戳强制路由更新
    }
  })
}

// 快捷搜索标签点击事件
const quickSearch = (query: string) => {
  searchQuery.value = query
  router.push({
    path: '/searchhub',
    query: {
      q: query,
      t: Date.now() // 添加时间戳强制路由更新
    }
  })
}
</script>

<style scoped>
/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 字符弹出动画 */
@keyframes charPopIn {
  0% {
    opacity: 0;
    transform: translateX(-20px) scale(0.8);
  }

  50% {
    transform: translateX(5px) scale(1.1);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* 动画类 */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.6s ease-out forwards;
  opacity: 0;
}

/* 字符动画类 */
.char-animate {
  display: inline-block;
  opacity: 0;
  animation: charPopIn 0.4s ease-out forwards;
}

.search_page {
  font-family: "Source Han Serif CN", serif;
  background-color: #ffffff;
  min-height: 100vh;
}



/* 主要内容 */
.main_content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}


/* 标题区域 */
.hero_section {
  text-align: center;
  padding: 60px 0 40px;
}

.main_title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #333;
  letter-spacing: 1px;
  line-height: 1.4;
}

/* 字符动画样式优化 */
.main_title .char-animate {
  margin: 0 1px;
  white-space: pre;
}

.highlight {
  color: #4e6ef2;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0 auto;
  line-height: 1.8;
  letter-spacing: 0.5px;
}

/* 副标题字符动画样式优化 */
.subtitle .char-animate {
  margin: 0 0.5px;
  white-space: pre;
}

/* 搜索区域 */
.search_section {
  text-align: center;
  margin-bottom: 60px;
  padding: 0 20px;
}

.search_container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.search_input_wrapper {
  position: relative;
  width: 600px;
  max-width: 100%;
}

.search_input_icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  z-index: 2;
}

.taggedInputContainer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  min-height: 48px;
  padding: 4px 16px 4px 48px;
  border: 2px solid #0b34b587;
  border-radius: 24px;
  background: #ffffff;
  transition: all 0.2s;
}

.taggedInputContainer:focus-within {
  border-color: #4e6ef2;
  box-shadow: 0 0 0 3px rgba(78, 110, 242, 0.1);
}

.tagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.locationTag {
  display: flex;
  align-items: center;
  background-color: #e6f0ff;
  border: 1px solid #c0d9ff;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 14px;
  white-space: nowrap;
  margin-right: 10px;
}

.tagText {
  margin-right: 6px;
  color: #4e6ef2;
  font-weight: 500;
}

.tagRemove {
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  line-height: 1;
  transition: all 0.2s;
}

.tagRemove:hover {
  color: #4e6ef2;
  transform: scale(1.2);
}

.search_input {
  flex: 1;
  min-width: 150px;
  height: 40px;
  padding: 0;
  border: none;
  font-size: 16px;
  outline: none;
  background: transparent;
}

.search_input:focus {
  border: none;
  box-shadow: none;
}

.ai_search_btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 24px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.ai_search_btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.quick_tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.tag {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.tag:hover {
  background: #e3f2fd;
  border-color: #4e6ef2;
  color: #4e6ef2;
  transform: translateY(-1px);
}

.feature_tags {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.feature_tag {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.feature_tag .el-icon {
  color: #4e6ef2;
}

/* 搜索类型 */
.search_types {
  margin-bottom: 60px;
}

.type_tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: fit-content;
  margin: 0 auto;
}

.type_tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #666;
}

.type_tab.active {
  background: #4e6ef2;
  color: white;
}

.type_tab:hover:not(.active) {
  background: #f5f5f5;
}

/* 推荐区域 */
.recommendations {
  margin-bottom: 80px;
}

.section_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section_header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.view_more {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4e6ef2;
  text-decoration: none;
  font-size: 14px;
}

.recommendation_grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.recommendation_card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  cursor: pointer;
}

.recommendation_card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e0e0e0;
}

.card_image {
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.card_img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 1;
  transition: transform 0.3s ease;
}

.recommendation_card:hover .card_img {
  transform: scale(1.05);
}

.tech_bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.frontend_bg {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.data_bg {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card_content {
  padding: 20px;
}

.card_meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category {
  color: #4e6ef2;
  font-size: 12px;
  font-weight: 500;
}

.time {
  color: #999;
  font-size: 12px;
}

.card_title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  line-height: 1.4;
}

.card_description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
}

.card_author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author_avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
}

.author_name {
  font-size: 12px;
  color: #666;
  flex: 1;
}

.card_stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.card_stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 特性区域 */
.why_choose_us {
  text-align: center;
  margin-bottom: 80px;
}

.why_choose_us h2 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.section_subtitle {
  font-size: 16px;
  color: #666;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.features_grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.feature_item {
  text-align: center;
}

.feature_icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
}

.feature_icon.lightning {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.feature_icon.smart {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.feature_icon.multi {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.feature_icon.personal {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.feature_item h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.feature_item p {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 热门搜索 */
.trending_section {
  margin-bottom: 80px;
}

.trending_section h2 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 32px;
  color: #333;
  text-align: center;
}

.trending_content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

.trending_list h3,
.trending_chart h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #333;
}

.hot_icon {
  color: #ff4d4f;
}

.chart_icon {
  color: #52c41a;
}

.trending_items {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.trending_item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.trending_item:hover {
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 0 -8px;
  padding: 12px 8px;
}

.trending_item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #f0f0f0;
  color: #666;
}

.rank.hot {
  background: #ff4d4f;
  color: white;
}

.title {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.count {
  font-size: 12px;
  color: #999;
}

.chart_container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart_placeholder {
  height: 200px;
  position: relative;
}

.chart_legend {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  justify-content: center;
}

.legend_item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.legend_color {
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.legend_color.ai {
  background: #4e6ef2;
}

.legend_color.frontend {
  background: #52c41a;
}

/* 订阅区域 */
.newsletter_section {
  background: linear-gradient(135deg, #4e6ef2 0%, #3c5ad8 100%);
  color: white;
  text-align: center;
  padding: 60px 0;
  margin-bottom: 0;
}

.newsletter_content h2 {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
}

.newsletter_content p {
  font-size: 16px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.newsletter_form {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.email_input {
  width: 300px;
  height: 48px;
  padding: 0 16px;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  outline: none;
}

.subscribe_btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 24px;
  background: white;
  color: #4e6ef2;
  border: none;
}

.privacy_note {
  font-size: 12px;
  opacity: 0.7;
}

/* 底部 */
.footer {
  background: #1a1a1a;
  color: #ffffff;
  padding: 48px 0 24px;
}

.footer_content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  justify-content: space-between;
}

.footer_section {
  flex: 1;
  min-width: 200px;
}

.footer_section:first-child {
  flex: 2;
}

.footer_logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.footer_logo_icon {
  color: #4e6ef2;
  font-size: 24px;
}

.footer_logo_text {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.footer_description {
  color: #cccccc;
  line-height: 1.6;
  margin-bottom: 24px;
}

.social_links {
  display: flex;
  gap: 12px;
}

.social_links .el-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.social_links .el-icon:hover {
  background: #4e6ef2;
  color: white;
}

.footer_section h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
}

.footer_links {
  list-style: none;
  padding: 0;
}

.footer_links li {
  margin-bottom: 12px;
}

.footer_links a {
  color: #cccccc;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.footer_links a:hover {
  color: #ffffff;
}

.footer_bottom {
  border-top: 1px solid #333333;
  margin-top: 32px;
  padding-top: 24px;
  text-align: center;
  color: #999999;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .recommendation_grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .features_grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .trending_content {
    grid-template-columns: 1fr;
  }

  .footer_content {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main_title {
    font-size: 32px;
  }

  .search_input_wrapper {
    width: 100%;
  }

  .taggedInputContainer {
    padding: 4px 12px 4px 40px;
  }

  .search_input {
    min-width: 100px;
    font-size: 14px;
  }

  .locationTag {
    font-size: 12px;
    padding: 3px 8px;
  }

  .search_container {
    flex-direction: column;
    gap: 16px;
  }

  .recommendation_grid {
    grid-template-columns: 1fr;
  }

  .features_grid {
    grid-template-columns: 1fr;
  }

  .type_tabs {
    flex-wrap: wrap;
  }



  .footer_content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .newsletter_form {
    flex-direction: column;
    align-items: center;
  }

  .email_input {
    width: 100%;
    max-width: 300px;
  }
}
</style>
