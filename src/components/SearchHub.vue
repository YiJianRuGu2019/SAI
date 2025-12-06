  <template>
    <div class="search_hub">
      <!-- Header -->
      <Header :is-logged-in="isLoggedIn" @locationSelected="handleLocationSelected" />
      <header class="header animate-on-scroll" data-animation="fade-in-up">
        <el-input v-model="searchQuery" placeholder="请输入您的搜索内容" class="search_input" @keyup.enter="handleSearch">
          <template #suffix>
            <el-icon class="search_icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </header>

      <div class="main_content">
        <!-- 左侧边栏 -->
        <div class="sidebar animate-on-scroll" data-animation="fade-in-up">
          <div class="sidebar_section">
            <h3 class="section_title">全部分类</h3>
            <ul class="category_list">
              <li v-for="category in categories" :key="category.name" :class="{ active: category.active }"
                @click="selectCategory(category)" class="category_item">
                {{ category.name }}
              </li>
            </ul>
          </div>
          <div class="sidebar_section">
            <h3 class="section_title">搜索配置</h3>
            <div class="config_item">
              <label class="config_label">结果数量:</label>
              <el-input-number v-model="searchConfig.size" :min="1" :max="100" size="small" />
            </div>
            <div class="config_item">
              <label class="config_label">搜索范围:</label>
              <el-select v-model="searchConfig.scope" size="small" style="width: 100%">
                <el-option label="网页" value="webpage" />
                <el-option label="图片" value="image" />
                <el-option label="文档" value="document" />
                <el-option label="学术" value="scholar" />
                <el-option label="视频" value="video" />
                <el-option label="全部" value="all" />
              </el-select>
            </div>
            <div class="config_item">
              <el-checkbox v-model="searchConfig.includeSummary">包含摘要</el-checkbox>
            </div>
            <div class="config_item">
              <el-checkbox v-model="searchConfig.includeRawContent">包含原始内容</el-checkbox>
            </div>
            <div class="config_item">
              <el-checkbox v-model="searchConfig.conciseSnippet">简洁摘要</el-checkbox>
            </div>
          </div>
        </div>

        <!-- 主内容 -->
        <div class="content animate-on-scroll" data-animation="fade-in-up">

          <!-- 骨架屏 -->
          <div v-if="currentSearchType !== 'image'" class="article_list">
            <!-- 加载状态骨架屏 -->
            <template v-if="isLoading">
              <div v-for="n in 6" :key="`skeleton-${n}`" class="article_item skeleton_item">
                <div class="skeleton_image"></div>
                <div class="article_content">
                  <div class="article_meta">
                    <div class="skeleton_text skeleton_source"></div>
                    <div class="skeleton_text skeleton_date"></div>
                    <div class="skeleton_text skeleton_score"></div>
                  </div>
                  <div class="skeleton_text skeleton_title"></div>
                  <div class="skeleton_text skeleton_description"></div>
                  <div class="skeleton_text skeleton_description_short"></div>
                  <div class="skeleton_tags">
                    <div class="skeleton_tag"></div>
                    <div class="skeleton_tag"></div>
                    <div class="skeleton_tag"></div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 实际文章列表 -->
            <template v-else>
              <!-- 结果统计信息 -->
              <div class="result_info_box">
                <span class="result_count">
                  共找到 {{ totalResults }} 条结果 (用时 {{ searchTime }} 秒)
                </span>
              </div>

              <article v-for="(article, index) in paginatedArticles" :key="article.id" class="article_item"
                :class="{ 'fade_in': animatedItems.includes(index) }" @click="openArticle(article)">
                <div v-if="article.image && !article.imageError" class="article_image">
                  <img :src="article.image" :alt="article.title" @error="handleImageError(article)"
                    :referrerpolicy="getImageReferrerPolicy(article.image)" crossorigin="anonymous" loading="lazy" />
                </div>
                <div class="article_content">
                  <div class="article_meta">
                    <span class="article_source">{{ article.source }}</span>
                    <span class="article_date">{{ article.date }}</span>
                    <span v-if="article.score" class="article_score" :class="`score_${article.score}`">
                      {{ getScoreText(article.score) }}
                    </span>
                  </div>
                  <h2 class="article_title">{{ article.title }}</h2>
                  <p class="article_description">{{ article.description }}</p>
                  <div v-if="article.authors && article.authors.length > 0" class="article_authors">
                    <span class="authors_label">作者：</span>
                    <span v-for="(author, index) in article.authors" :key="index" class="author_name">
                      {{ author }}{{ index < article.authors.length - 1 ? '，' : '' }} </span>
                  </div>
                  <div class="article_tags">
                    <el-tag v-for="tag in article.tags" :key="tag" size="small" class="article_tag">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </article>
            </template>
          </div>

          <!-- Image List -->
          <div v-if="currentSearchType === 'image'" class="image_list">
            <!-- 图片加载状态骨架屏 -->
            <template v-if="isLoading">
              <div v-for="n in 12" :key="`image-skeleton-${n}`" class="image_item skeleton_image_item">
                <div class="skeleton_image_box"></div>
              </div>
            </template>

            <!-- 实际图片列表 -->
            <template v-else>
              <div v-for="(image, index) in paginatedImages" :key="image.id" class="image_item"
                :class="{ 'fade_in': animatedItems.includes(index) }" @click="openImageLink(image)">
                <div class="image_container">
                  <img v-if="!image.imageError" :src="image.imageUrl" :alt="image.title" class="search_image"
                    @error="handleImageError(image)" loading="lazy"
                    :referrerpolicy="getImageReferrerPolicy(image.imageUrl)" crossorigin="anonymous" />
                  <div v-else class="image_placeholder">
                    <el-icon class="placeholder_icon">
                      <Picture />
                    </el-icon>
                    <span class="placeholder_text">图片加载失败</span>
                  </div>
                  <div class="image_overlay">
                    <div class="image_title" :title="image.title">{{ image.title }}</div>
                  </div>
                </div>
                <div class="image_info">
                  <div class="image_meta">
                    <span v-if="image.imageWidth && image.imageHeight" class="image_size">
                      {{ image.imageWidth }} × {{ image.imageHeight }}
                    </span>
                    <span v-if="image.score" class="image_score">
                      评分: {{ image.score }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Pagination -->
          <div class="pagination_wrapper">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="totalResults"
              layout="prev, pager, next" @current-change="handlePageChange" class="pagination" />
          </div>
        </div>
        <!-- 右边侧边栏 -->
        <div class="related_searches">
          <h3 class="related_title">热搜榜</h3>
          <div class="related_grid">
            <div v-for="item in relatedSearches" :key="item.title" class="related_item"
              @click="searchRelated(item.title)">
              <span class="related_text">{{ item.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { searchWithMetaso } from '@/api/metasoApi'
import { useLocationStore } from '@/stores/location'
const isLoggedIn = ref(false)

const route = useRoute()
const locationStore = useLocationStore()

// 处理位置选择 - 更新 locationStore，触发 watch 监听
const handleLocationSelected = (location) => {
  locationStore.addLocationTag(location)
  console.log('SearchHub 位置选择:', location)
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

let scrollObserver = null

// 响应式数据
const searchQuery = ref('前端开发教程')
const currentPage = ref(1)
const pageSize = ref(10) // 每页显示10条结果
const totalResults = ref(12560)
const searchTime = ref(0.32)
const animatedItems = ref([])
const isLoading = ref(false)
const searchCredits = ref(null)

// 存储所有搜索结果
const allArticles = ref([])
// 存储图片搜索结果
const allImages = ref([])
// 当前搜索类型
const currentSearchType = ref('webpage')

// 计算属性：当前页显示的文章
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allArticles.value.slice(start, end)
})

// 计算属性：当前页显示的图片
const paginatedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allImages.value.slice(start, end)
})

// 搜索参数配置
const searchConfig = ref({
  scope: "webpage",            // 搜索范围
  includeSummary: false,       // 是否包含摘要
  size: 40,                    // 返回结果数量
  includeRawContent: false,    // 是否包含原始内容
  conciseSnippet: false,       // 是否使用简洁摘要
  format: "chat_completions"   // 响应格式
})

// 分类列表
const categories = ref([
  { name: '全部分类', active: true, scope: 'webpage' },
  { name: '网页', active: false, scope: 'webpage' },
  { name: '文库', active: false, scope: 'document' },
  { name: '学术', active: false, scope: 'scholar' },
  { name: '图片', active: false, scope: 'image' },
])



// 相关搜索
const relatedSearches = ref([
  { title: '成都火锅香进NASA，宇航员求带锅上天!' },
  { title: '中国高铁百亿出海，老外求打包WiFi！' },
  { title: 'CGTN视频刷爆全球，中国手机成外星科技！' },
  { title: '中国电商屠英国榜，老外双11囤到爆！' },
  { title: '中国风车太阳能爆红，环保博主集体朝圣！' },
  { title: '月球土壤种出西红柿，嫦娥开宇宙菜园!' },
  { title: '中国AI主播24小时不秃头，全球新老板深夜痛哭！' },
  { title: '中国00后把麻将做成奥运项目，老外看完规则直接投降！' },
  { title: '哈尔滨冰雕秒杀迪士尼，公主想来过冬！' },
  { title: '义乌圣诞树订单爆仓，欧洲人：今年圣诞树全靠中国续命！' },
  { title: '重庆轻轨穿楼成全球打卡点，蜘蛛侠看了都沉默！' },
])

// 方法
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  // 显示加载状态
  isLoading.value = true
  animatedItems.value = []

  try {
    // 调用秘塔AI搜索API - 使用页面配置的参数
    const searchResult = await searchWithMetaso({
      q: searchQuery.value,                    // 搜索查询词
      scope: searchConfig.value.scope,         // 搜索范围
      includeSummary: searchConfig.value.includeSummary,     // 是否包含摘要
      size: searchConfig.value.size,           // 返回结果数量
      includeRawContent: searchConfig.value.includeRawContent,  // 是否包含原始内容
      conciseSnippet: searchConfig.value.conciseSnippet,    // 是否使用简洁摘要
      format: searchConfig.value.format        // 响应格式
    })

    // 更新搜索结果数据
    totalResults.value = searchResult.total || (searchResult.results ? searchResult.results.length : searchResult.images ? searchResult.images.length : 0)
    searchTime.value = searchResult.searchTime ? searchResult.searchTime.toFixed(2) : '0.32'
    searchCredits.value = searchResult.credits
    currentSearchType.value = searchConfig.value.scope

    // 处理图片搜索结果
    if (searchConfig.value.scope === 'image' && searchResult.images) {
      console.log('处理图片搜索结果，图片数量:', searchResult.images.length)
      allImages.value = searchResult.images.map((image, index) => ({
        id: index + 1,
        title: image.title,
        imageUrl: processImageUrl(image.imageUrl), // 应用图片URL处理逻辑
        imageWidth: image.imageWidth,
        imageHeight: image.imageHeight,
        score: image.score,
        position: image.position,
        imageError: false, // 初始化图片错误状态
        hasTriedProxy: false // 初始化代理重试状态
      }))
      allArticles.value = [] // 清空文章结果

      // 重置到第一页
      currentPage.value = 1
      isLoading.value = false

      // 为图片搜索结果添加动画效果
      nextTick(() => {
        const currentPageImages = paginatedImages.value
        currentPageImages.forEach((_, index) => {
          setTimeout(() => {
            animatedItems.value.push(index)
          }, index * 100)
        })
      })

      ElMessage.success(`找到 ${totalResults.value} 张相关图片`)
    } else if (searchResult.results) {
      // 转换搜索结果为文章格式并存储到 allArticles
      allImages.value = [] // 清空图片结果
      allArticles.value = searchResult.results.map((result, index) => {
        const imageUrl = extractImageFromSnippet(result.snippet)
        // 从摘要中移除各种形式的图片链接、代码和乱码
        let description = result.snippet || ''

        // 1. 移除JavaScript代码片段
        description = description.replace(/['"]\+[^+]*\+['"]/g, '')
        description = description.replace(/\w+\.\w+\([^)]*\)/g, '')
        description = description.replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '')
        description = description.replace(/var\s+\w+\s*=\s*[^;]+;?/g, '')
        description = description.replace(/this\.\w+[^,\n]*/g, '')

        // 2. 移除HTML标签和属性
        description = description.replace(/<[^>]*>/g, '')
        description = description.replace(/&[a-zA-Z0-9#]+;/g, '')

        // 3. 移除各种形式的Markdown图片语法
        description = description.replace(/!\s*\[.*?\]\s*\([^)]*\)\s*/g, '')
        description = description.replace(/!\s*\[\s*\]\s*\([^)]*\)\s*/g, '')
        description = description.replace(/!\s*\[\s*\]\s*\.*/g, '')

        // 4. 移除URL链接
        description = description.replace(/https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp)(?:[^\s]*)?/gi, '')
        description = description.replace(/https?:\/\/[^\s]*(?:sinaimg|img\d*\.doubanio|qpic|hdslb)[^\s]*/gi, '')
        description = description.replace(/https?:\/\/[^\s]*(?:img|image|photo|pic)[^\s]*/gi, '')

        // 5. 移除特殊字符和乱码
        description = description.replace(/[{}[\]()]/g, '')
        description = description.replace(/['"]\s*[,+]\s*['"]/g, '')
        description = description.replace(/\\\w+/g, '')
        description = description.replace(/\w+\s*:\s*function/g, '')

        // 6. 清理连续的标点符号和特殊字符
        description = description.replace(/[,，.。;；:：]{2,}/g, '，')
        description = description.replace(/\s*[,，]\s*\n/g, '\n')
        description = description.replace(/\n+/g, '\n')

        // 7. 最终清理：移除空行、多余空白和开头标点
        description = description.replace(/\s+/g, ' ')
        description = description.replace(/^\s*[,，.。;；:：\n]+/, '')
        description = description.trim()

        // 8. 如果清理后内容太短或包含过多技术术语，尝试提取有意义的部分
        if (description.length < 20 || /^[\w\s,，.。]+$/.test(description)) {
          // 尝试从原始snippet中提取中文内容
          const chineseMatch = (result.snippet || '').match(/[\u4e00-\u9fa5][^'"{}()[\]]{10,}/g)
          if (chineseMatch && chineseMatch.length > 0) {
            description = chineseMatch[0].substring(0, 200)
          }
        }

        return {
          id: index + 1,
          title: result.title,
          description: description,
          source: result.source || extractDomainFromUrl(result.url),
          date: result.publishedDate || new Date().toLocaleDateString('zh-CN'),
          image: imageUrl, // 使用从摘要中提取的图片
          imageError: false, // 初始化图片错误状态
          hasTriedProxy: false, // 初始化代理重试状态
          tags: generateTagsFromTitle(result.title),
          url: result.url,
          score: result.score,
          position: result.position,
          authors: result.authors
        }
      })

      // 重置到第一页
      currentPage.value = 1
      isLoading.value = false

      // 搜索动画 - 只为当前页的文章添加动画
      nextTick(() => {
        const currentPageArticles = paginatedArticles.value
        currentPageArticles.forEach((_, index) => {
          setTimeout(() => {
            animatedItems.value.push(index)
          }, index * 100)
        })
      })

      ElMessage.success(`找到 ${totalResults.value} 条相关结果`)
    }
  } catch (error) {
    console.error('搜索失败:', error)
    isLoading.value = false
    ElMessage.error('搜索失败，请稍后重试')
  }
}

const selectCategory = (category) => {
  categories.value.forEach(cat => cat.active = false)
  category.active = true
  console.log('选择分类:', category.name)

  // 更新搜索配置中的 scope 字段
  if (category.scope) {
    searchConfig.value.scope = category.scope
    console.log('更新搜索范围为:', category.scope)
  }

  // 如果有搜索内容，自动执行搜索
  if (searchQuery.value.trim()) {
    handleSearch()
  } else {
    // 添加分类切换动效（当没有搜索内容时）
    animatedItems.value = []
    nextTick(() => {
      const currentItems = currentSearchType.value === 'image' ? paginatedImages.value : paginatedArticles.value
      currentItems.forEach((_, index) => {
        setTimeout(() => {
          animatedItems.value.push(index)
        }, index * 80)
      })
    })
  }
}

const openArticle = (article) => {
  console.log('打开文章:', article.title)

  // 如果有URL，在新窗口中打开
  if (article.url) {
    window.open(article.url, '_blank')
    ElMessage({
      message: `正在打开：${article.title}`,
      type: 'success',
      duration: 2000
    })
  } else {
    ElMessage({
      message: '暂无可访问的链接',
      type: 'warning',
      duration: 2000
    })
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  console.log('切换页面:', page)

  // 重置动画状态
  animatedItems.value = []

  // 滚动到顶部 - 使用多种方法确保兼容性
  scrollToTop()

  // 为新页面的项目添加入场动画
  nextTick(() => {
    const itemsToAnimate = currentSearchType.value === 'image' ? paginatedImages.value : paginatedArticles.value
    itemsToAnimate.forEach((_, index) => {
      setTimeout(() => {
        animatedItems.value.push(index)
      }, index * 100)
    })
  })
}

const searchRelated = (query) => {
  searchQuery.value = query
  console.log('相关搜索:', query)
  // 滚动到顶部 - 使用多种方法确保兼容性
  scrollToTop()
  // 延迟执行搜索，确保滚动动画完成
  setTimeout(() => {
    handleSearch()
  }, 300)
}

// 图片点击处理
const openImageLink = (image) => {
  // 从图片标题中提取可能的链接信息
  const title = image.title
  let url = null

  // 尝试从标题中提取域名
  const domainMatch = title.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g)
  if (domainMatch && domainMatch.length > 0) {
    url = `https://${domainMatch[0]}`
  }

  // 如果没有找到域名，使用Google图片搜索
  if (!url) {
    const searchTerm = encodeURIComponent(title)
    url = `https://www.google.com/search?q=${searchTerm}&tbm=isch`
  }

  // 在新标签页中打开链接
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 辅助函数：滚动到顶部
const scrollToTop = () => {
  try {
    // 方法1: 现代浏览器的平滑滚动
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // 方法2: 兼容旧浏览器的立即滚动
      window.scrollTo(0, 0)
    }

    // 方法3: 备用方案 - 滚动到页面顶部元素
    const topElement = document.querySelector('.search_hub') || document.body
    if (topElement) {
      topElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch (error) {
    console.warn('滚动到顶部失败:', error)
    // 最后的备用方案
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
}

// 辅助函数：从摘要中提取图片URL
const extractImageFromSnippet = (snippet) => {
  if (!snippet) return null

  // 匹配Markdown图片语法 ![]()，支持各种图片格式和域名
  // 更宽松的匹配，支持B站、豆瓣等各种图片服务
  const markdownMatch = snippet.match(/!\[.*?\]\((https?:\/\/[^\s)]+(?:\.(?:jpg|jpeg|png|gif|webp|bmp))?(?:@\d+w)?(?:[^\s)]*)?)\)/i)
  if (markdownMatch) {
    let imageUrl = markdownMatch[1]

    // 过滤掉无意义的默认占位图片
    if (isDefaultPlaceholderImage(imageUrl)) {
      return null
    }

    // 使用统一的图片URL处理函数
    return processImageUrl(imageUrl)
  }

  // 匹配直接的图片URL（以http开头，以图片扩展名结尾）
  const directMatch = snippet.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp)(?:@\d+w)?(?:\?[^\s]*)?)/i)
  if (directMatch) {
    let imageUrl = directMatch[1]

    // 过滤掉无意义的默认占位图片
    if (isDefaultPlaceholderImage(imageUrl)) {
      return null
    }

    return processImageUrl(imageUrl)
  }

  // 特殊处理：匹配豆瓣图片格式
  const doubanMatch = snippet.match(/!\[.*?\]\((https?:\/\/img\d*\.doubanio\.com\/[^)]+)\)/i)
  if (doubanMatch) {
    return processImageUrl(doubanMatch[1])
  }

  // 特殊处理：匹配B站图片链接（即使没有文件扩展名）
  const bilibiliMatch = snippet.match(/!\[.*?\]\((https?:\/\/i\d*\.hdslb\.com\/[^)]+)\)/i)
  if (bilibiliMatch) {
    return processImageUrl(bilibiliMatch[1])
  }

  // 检查是否包含占位符（###IMG_数字###），如果有则返回null，避免显示空图片
  if (snippet.includes('###IMG_') || snippet.includes('empty.png')) {
    return null
  }

  return null
}

// 辅助函数：检查是否为默认占位图片或有严格防盗链的图片
const isDefaultPlaceholderImage = (imageUrl) => {
  if (!imageUrl) return true

  // 常见的默认占位图片模式
  const placeholderPatterns = [
    /default\.gif$/i,           // 360doc的默认gif
    /placeholder\./i,           // 各种placeholder图片
    /no-image\./i,             // no-image图片
    /empty\./i,                // empty图片
    /avatar-default\./i,       // 默认头像
    /loading\./i,              // 加载图片
    /blank\./i,                // 空白图片
    /1x1\./i,                  // 1x1像素图片
    /spacer\./i,               // 间隔图片
    /transparent\./i           // 透明图片
  ]



  return placeholderPatterns.some(pattern => pattern.test(imageUrl))
}

// 辅助函数：处理图片URL，添加代理或优化
const processImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  let cleanUrl = imageUrl.trim();

  // B站图片特殊处理（应在通用规则前执行）
  if (cleanUrl.includes('hdslb.com')) {
    cleanUrl = cleanUrl.replace(/@\d+w$/, '');
    cleanUrl = cleanUrl.replace(/^http:/, 'https:');
    return cleanUrl;
  }

  // 如果URL已经是https，则直接返回
  if (cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // 如果URL是http，则使用代理服务来避免混合内容问题
  if (cleanUrl.startsWith('http://')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
  }

  // 如果URL以"//"开头，则补充https协议
  if (cleanUrl.startsWith('//')) {
    return `https:${cleanUrl}`;
  }

  // 对于其他情况（如相对路径），直接返回
  return cleanUrl;
}

// 辅助函数：从URL中提取域名
const extractDomainFromUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return '未知来源'
  }
}

// 辅助函数：根据标题生成标签
const generateTagsFromTitle = (title) => {
  const tagMap = {
    '前端': ['HTML', 'CSS', 'JavaScript', 'Vue', 'React'],
    '后端': ['Node.js', 'Python', 'Java', 'API'],
    '教程': ['入门', '实战', '进阶'],
    '开发': ['Web开发', '移动开发', '全栈'],
    '框架': ['Bootstrap', 'jQuery', 'Angular'],
    '响应式': ['移动端', '自适应', '布局'],
    '项目': ['实战', '案例', '源码']
  }

  const tags = []

  // 根据标题内容匹配相关标签
  Object.keys(tagMap).forEach(keyword => {
    if (title.includes(keyword) && tags.length < 4) {
      const relatedTags = tagMap[keyword]
      const randomTag = relatedTags[Math.floor(Math.random() * relatedTags.length)]
      if (!tags.includes(randomTag)) {
        tags.push(randomTag)
      }
    }
  })

  // 如果没有匹配的标签，添加一些默认标签
  if (tags.length === 0) {
    tags.push('教程', '学习')
  }

  return tags
}

// 辅助函数：将评分转换为中文显示
const getScoreText = (score) => {
  const scoreMap = {
    high: '高质量',
    medium: '中等',
    low: '一般'
  }
  return scoreMap[score] || '未知'
}

// 处理图片加载错误
const handleImageError = (item) => {

  // 如果还没有尝试过代理，尝试使用代理服务
  if (!item.hasTriedProxy) {
    item.hasTriedProxy = true
    const originalUrl = item.imageUrl || item.image

    if (originalUrl && !originalUrl.includes('weserv.nl') && !originalUrl.includes('imageproxy')) {
      // 尝试使用代理服务
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`

      if (item.imageUrl) {
        item.imageUrl = proxyUrl
      } else if (item.image) {
        item.image = proxyUrl
      }

      // 强制重新加载图片
      setTimeout(() => {
        const imgElements = document.querySelectorAll(`img[alt="${item.title}"]`)
        imgElements.forEach(img => {
          img.src = proxyUrl
        })
      }, 100)

      return // 不立即标记为错误，给代理一次机会
    }
  }

  // 如果代理也失败了，或者已经是代理URL，标记为错误
  item.imageError = true
}

// 获取图片的referrer策略
const getImageReferrerPolicy = (imageUrl) => {
  if (!imageUrl) return 'no-referrer-when-downgrade'

  // 需要使用no-referrer策略的域名列表
  const noReferrerDomains = [
    'autoimg.cn',           // 汽车之家
    'hdslb.com',           // B站
    'sinaimg.cn',          // 新浪图片
    'qpic.cn',             // 腾讯图片
    'doubanio.com',        // 豆瓣图片
    'traileraddict.com',   // TrailerAddict
    'scoopwhoop.com',      // ScoopWhoop
    'weserv.nl',           // 代理服务
    'imageproxy.pimg.tw',  // 代理服务
    'cors-anywhere.herokuapp.com' // 代理服务
  ]

  // 检查是否需要使用no-referrer策略
  const needsNoReferrer = noReferrerDomains.some(domain => imageUrl.includes(domain))

  if (needsNoReferrer) {
    return 'no-referrer'
  }

  // 其他图片使用默认策略
  return 'no-referrer-when-downgrade'
}

// 生命周期
onMounted(() => {
  scrollToTop()
  // 从路由查询参数中获取搜索关键词
  const queryParam = route.query.q
  if (queryParam && typeof queryParam === 'string') {
    searchQuery.value = queryParam
    // 如果有搜索参数，立即执行搜索
    handleSearch()
  } else {
    // 如果没有搜索参数，显示默认内容
    searchQuery.value = '前端开发教程'
    // 可以选择是否执行默认搜索
    // handleSearch()
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

// 监听从地图组件选择的位置
watch(() => locationStore.lastSelection, (selection) => {
  if (selection && selection.name) {
    searchQuery.value = selection.name; // 更新搜索框内容
    handleSearch(); // 执行搜索
  }
}, { deep: true });

// 监听路由查询参数变化，处理从 SearchView 页面跳转过来的情况
watch(() => route.query.q, (newQuery, oldQuery) => {
  // 只有当查询参数真正变化时才处理
  if (newQuery && newQuery !== oldQuery) {
    console.log('检测到搜索查询变化:', newQuery);
    searchQuery.value = newQuery;
    // 执行搜索
    nextTick(() => {
      handleSearch();
    });
  }
});
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

/* 动画类 */
.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 1s ease-out forwards;
  opacity: 0;
}

.search_hub {
  min-height: 100vh;
  background: #ffffff;
}

/* Header Styles */
.header {
  /* background: rgb(255, 1, 1); */
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search_input {
  width: 980px;
}

.search_input :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 8px 16px;
}

.search_input :deep(.el-input__wrapper.is-focus) {
  border-color: #4e6ef2;
  box-shadow: 0 0 0 1px #4e6ef2;
}

.search_button_icon {
  font-size: 18px;
  color: #4e6ef2;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s;
  background: #f0f2ff;
}

.search_button_icon:hover {
  background: #4e6ef2;
  color: white;
  transform: scale(1.1);
}

/* Main Content */
.main_content {
  width: 80%;
  display: flex;
  gap: 24px;
  padding: 24px 20px;
  padding-bottom: 0px;
  margin: auto;
}

.sidebar {
  width: 240px;
}

.sidebar_section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section_title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #333;
}

.filter_tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter_tag {
  cursor: pointer;
  transition: all 0.3s;
}

.filter_tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(78, 110, 242, 0.3);
}

.category_list,
.other_list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category_item,
.other_item {
  width: 44%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  color: #666;
}

.category_item:hover,
.other_item:hover {
  width: 44%;
  background: #f0f2ff;
  color: #4e6ef2;
}

.category_item.active {
  width: 44%;
  font-size: 14px;
  background: #4e6ef2;
  color: white;
}

/* 配置面板样式 */
.config_item {
  margin-bottom: 12px;
}

.config_label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

/* Content Area */
.content {
  flex: 1;
}

.content_header {
  /* margin-bottom: 20px; */
  margin-left: 17px;
}

.result_info {
  color: #666;
  font-size: 14px;
}

.result_info_box {
  padding: 8px 0 12px 20px;
  margin-bottom: -30px;
}

.result_info_box .result_count {
  color: #666;
  font-size: 14px;
}

.credits_info {
  color: #4e6ef2;
  font-weight: 500;
}

.loading_text {
  color: #4e6ef2;
  font-size: 14px;
  animation: pulse 1.5s ease-in-out infinite;
}

/* 骨架屏样式 */
.loading_skeleton_header {
  display: flex;
  align-items: center;
}

.skeleton_result_count {
  width: 300px;
  height: 16px;
}

.skeleton_item {
  pointer-events: none;
  opacity: 1 !important;
  transform: none !important;
}

.skeleton_image {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton_text {
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton_source {
  width: 80px;
  height: 12px;
}

.skeleton_date {
  width: 100px;
  height: 12px;
}

.skeleton_score {
  width: 60px;
  height: 12px;
}

.skeleton_title {
  width: 85%;
  height: 20px;
  margin: 8px 0;
}

.skeleton_description {
  width: 100%;
  height: 14px;
  margin: 4px 0;
}

.skeleton_description_short {
  width: 70%;
  height: 14px;
  margin: 4px 0;
}

.skeleton_tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.skeleton_tag {
  width: 50px;
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Article List - 保持原有的卡片布局 */
.article_list {
  width: 800px;
  height: 800px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-x: hidden;
  position: relative;
  margin: auto;
}

/* 滚动条透明处理 */
.article_list::-webkit-scrollbar {
  width: 6px;
}

.article_list::-webkit-scrollbar-track {
  background: transparent;
}

.article_list::-webkit-scrollbar-thumb {
  background: transparent;
}

.article_list::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* Image List - 专门的图片瀑布流布局 */
.image_list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 0;
  align-items: start;
}

.image_item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  break-inside: avoid;
}

.image_item.fade_in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.image_item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.image_container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.search_image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: all 0.4s ease;
  min-height: 200px;
  max-height: 400px;
}

.image_placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
}

.placeholder_icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.placeholder_text {
  font-size: 12px;
}

.image_item:hover .search_image {
  transform: scale(1.08);
  filter: brightness(1.1);
}

.image_overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.4) 50%,
      transparent 100%);
  padding: 24px 16px 16px;
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateY(10px);
}

.image_item:hover .image_overlay {
  opacity: 1;
  transform: translateY(0);
}

.image_title {
  color: white;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.image_info {
  padding: 16px;
  background: white;
}

.image_meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.image_size {
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  color: #333;
}

.image_score {
  color: #4e6ef2;
  font-weight: 500;
}

/* 图片骨架屏样式 */
.skeleton_image_item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.skeleton_image_box {
  width: 100%;
  height: 250px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.article_item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  padding-top: 15px;
  padding-bottom: 15px;
  display: flex;
  gap: 17px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px);
  position: relative;
  z-index: 1;
}

.article_item.fade_in {
  opacity: 1;
  transform: translateY(0);
}

.article_item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.article_image {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}

.article_image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: opacity 0.3s ease;
}

.article_image img[src*="placeholder"] {
  opacity: 0.7;
  filter: grayscale(20%);
}

.article_content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article_meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.article_source {
  color: #4e6ef2;
}

.article_score {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
}

.score_high {
  background: #e8f5e8;
  color: #52c41a;
}

.score_medium {
  background: #fff7e6;
  color: #fa8c16;
}

.score_low {
  background: #f5f5f5;
  color: #8c8c8c;
}

.article_title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
  line-height: 1.4;
}

.article_description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article_authors {
  font-size: 12px;
  color: #999;
  margin: 8px 0;
}

.authors_label {
  font-weight: 500;
}

.author_name {
  color: #666;
}

.article_tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.article_tag {
  font-size: 12px;
}

/* Pagination */
.pagination_wrapper {
  display: flex;
  justify-content: center;
  margin-top: 23px;
}

.pagination :deep(.el-pager li) {
  background: white;
  border: 1px solid #ddd;
  margin: 0 4px;
}

.pagination :deep(.el-pager li.is-active) {
  background: #4e6ef2;
  border-color: #4e6ef2;
  color: white;
}

/* Related Searches */
.related_searches {
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.related_title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  margin-left: 5px;
}

.related_grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.related_item {
  padding: 7px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.related_item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #f5f7fa;
}

.related_icon {
  font-size: 17px;
  color: #4e6ef2;
}

.related_text {
  font-size: 14px;
  color: #333;
}

/* 动画效果 */
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

.fade_in {
  animation: fadeInUp 0.6s ease-out forwards;
}
</style>
