<template>
  <div class="box">
    <!-- 使用SearchHeader组件作为顶部导航栏 -->
    <Header @locationSelected="handleLocationSelected" />

    <div class="indexBox">
      <!-- 顶部问候语 -->
      <div class="title">
        <h1>
          <span v-for="(char, index) in titleText" :key="index" class="char-animate"
            :style="{ animationDelay: `${index * 0.02}s` }">
            {{ char }}
          </span>
        </h1>
      </div>

      <!-- 中央输入区域 -->
      <div class="inputBox animate-fade-in-up" :class="{ 'expanded': isInputFocused }" style="animation-delay: 0.2s">
        <div class="inputMain">
          <!-- 标签和输入框 -->
          <div class="taggedInputContainer">
            <!-- 标签始终显示在前面 -->
            <div class="tagsContainer">
              <div v-for="(tag, index) in keywords" :key="index" class="locationTag">
                <span class="tagText">{{ tag }}</span>
                <button class="tagRemove" @click="removeTag(index)">&times;</button>
              </div>
              <div v-for="(tag, index) in locationStore.locationTags" :key="index" class="locationTag">
                <span class="tagText">{{ tag.name }}</span>
                <button class="tagRemove" @click="locationStore.removeLocationTag(index)">&times;</button>
              </div>
            </div>

            <input type="text" v-model="searchInput" placeholder="你可以问我任何问题..." class="mainInput"
              @keyup.enter="handleSearch" @keydown.backspace="handleBackspace" @focus="isInputFocused = true"
              @blur="handleBlur" />
          </div>

          <el-button icon="Position" circle class="sendButton" :disabled="!searchInput.trim()"
            @click="handleSearch"></el-button>
        </div>

        <!-- 添加关键词引导区域 -->
        <div class="tagBox">
          <div class="itemTag animate-scale-in" style="animation-delay: 0.25s" @click="cardBtn('AI绘画')">AI绘画</div>
          <div class="itemTag animate-scale-in" style="animation-delay: 0.3s" @click="cardBtn('如何学习编程')">如何学习编程</div>
          <div class="itemTag animate-scale-in" style="animation-delay: 0.35s" @click="cardBtn('创业点子')">创业点子</div>
          <div class="itemTag animate-scale-in" style="animation-delay: 0.4s" @click="cardBtn('健康饮食')">健康饮食</div>
          <div class="itemTag animate-scale-in" style="animation-delay: 0.45s" @click="cardBtn('旅游推荐')">旅游推荐</div>
        </div>
      </div>

      <!-- 底部卡片区域 -->
      <div class="featureSection animate-fade-in-up" style="animation-delay: 0.3s">
        <h2>你可以尝试下面的示例...</h2>

        <div class="leftCardBox">
          <!-- AI搜索卡片 -->
          <div class="featureCard animate-scale-in" style="animation-delay: 0.4s">
            <div class="leftCardTitle">
              <el-icon>
                <Search />
              </el-icon>
              <h3>AI 搜索</h3>
              <span class="tryMore" @click="navigateToFeature('search')">体验更多 ></span>
            </div>

            <div class="leftCardMain">
              <div class="searchExamples">
                <div class="leftCardItem animate-fade-in-up" style="animation-delay: 0.5s"
                  @click="navigateToSearchWithContent('特斯拉中国停止供应Model S和Model X进口新车，官网仅售库存车和二手车')">
                  <div class="searchThumb">
                    <img src="../img/8.jpg" alt="特斯拉新闻">
                  </div>
                  <div class="searchText">特斯拉中国停止供应Model S和Model X进口新车，官网仅售库存车和二手车</div>
                </div>

                <div class="leftCardItem animate-fade-in-up" style="animation-delay: 0.55s"
                  @click="navigateToSearchWithContent('中国半导体协会明确芯片产地认定规则，国产芯片厂商股价大涨')">
                  <div class="searchThumb">
                    <img src="../img/7.jpg" alt="芯片新闻">
                  </div>
                  <div class="searchText">中国半导体协会明确芯片产地认定规则，国产芯片厂商股价大涨</div>
                </div>

                <div class="leftCardItem animate-fade-in-up" style="animation-delay: 0.6s"
                  @click="navigateToSearchWithContent('中国将适度减少美国影片进口，美多家电影公司股价大幅下跌')">
                  <div class="searchThumb">
                    <img src="../img/6.jpg" alt="电影">
                  </div>
                  <div class="searchText">中国将适度减少美国影片进口，美多家电影公司股价大幅下跌</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 图像生成卡片 -->
          <div class="featureCard animate-scale-in" style="animation-delay: 0.5s">
            <div class="leftCardTitle">
              <el-icon>
                <Picture />
              </el-icon>
              <h3>图像生成</h3>
              <span class="tryMore" @click="navigateToFeature('image')">体验更多 ></span>
            </div>

            <div class="leftCardMain">
              <div class="imageGrid">
                <div class="imageRow">
                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.6s"
                    @mouseenter="hoveredImage = 'topDog'" @mouseleave="hoveredImage = ''">
                    <img
                      src="https://tse4-mm.cn.bing.net/th/id/OIP-C.UDez6EQFTrPB0wfjPBVwvwHaHa?w=193&h=193&c=7&r=0&o=5&dpr=1.4&pid=1.7"
                      alt="小狗" @click="navigateToImageWithContent('一只可爱的金毛小狗，毛发蓬松，惹人喜爱')">
                    <div class="imageDescription topDescription" v-if="hoveredImage === 'bottomGhost1'">
                      智能高效的人工智能系统，思维敏捷，日新月异，前景光明。
                    </div>
                  </div>

                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.65s"
                    @mouseenter="hoveredImage = 'topPrairie'" @mouseleave="hoveredImage = ''">
                    <img src="../img/1.jpg" alt="草原" @click="navigateToImageWithContent('一望无际的广阔草原，绿草如茵，生机盎然')">
                    <div class="imageDescription topDescription" v-if="hoveredImage === 'bottomGhost2'">
                      波光粼粼的宁静湖面，碧水如镜，清风拂面，美景如画。
                    </div>
                  </div>

                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.7s"
                    @mouseenter="hoveredImage = 'topSnow'" @mouseleave="hoveredImage = ''">
                    <img src="../img/2.jpg" alt="雪山" @click="navigateToImageWithContent('白雪皑皑的壮丽雪山，冰清玉洁，巍峨壮观')">
                    <div class="imageDescription topDescription" v-if="hoveredImage === 'bottomGhost3'">
                      威武雄壮的现代航母舰队，钢铁巨舰，雷达林立，气势恢宏。
                    </div>
                  </div>
                </div>

                <div class="imageRow">
                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.75s"
                    @mouseenter="hoveredImage = 'bottomGhost1'" @mouseleave="hoveredImage = ''">
                    <img src="../img/3.jpg" alt="万圣节幽灵"
                      @click="navigateToImageWithContent('智能高效的人工智能系统，思维敏捷，日新月异，前景光明。')">
                    <div class="imageDescription" v-if="hoveredImage === 'topDog'">
                      一只可爱的金毛小狗，毛发蓬松，惹人喜爱
                    </div>
                  </div>

                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.8s"
                    @mouseenter="hoveredImage = 'bottomGhost2'" @mouseleave="hoveredImage = ''">
                    <img src="../img/4.jpg" alt="万圣节幽灵"
                      @click="navigateToImageWithContent('波光粼粼的宁静湖面，碧水如镜，清风拂面，美景如画。')">
                    <div class="imageDescription" v-if="hoveredImage === 'topPrairie'">
                      一望无际的广阔草原，绿草如茵，生机盎然
                    </div>
                  </div>

                  <div class="imageContainer animate-scale-in" style="animation-delay: 0.85s"
                    @mouseenter="hoveredImage = 'bottomGhost3'" @mouseleave="hoveredImage = ''">
                    <img src="../img/5.jpg" alt="万圣节幽灵"
                      @click="navigateToImageWithContent('威武雄壮的现代航母舰队，钢铁巨舰，雷达林立，气势恢宏。')">
                    <div class="imageDescription" v-if="hoveredImage === 'topSnow'">
                      白雪皑皑的壮丽雪山，冰清玉洁，巍峨壮观
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部更多功能区域 -->
      <div class="rightCardBox animate-fade-in-up" style="animation-delay: 0.6s">
        <div class="rightCard" @click="cardBtn('帮我写一篇文章')">
          <el-icon>
            <Edit />
          </el-icon>
          <span>帮我写作</span>
        </div>
        <div class="rightCard" @click="cardBtn('帮我阅读一下这篇文章')">
          <el-icon>
            <Reading />
          </el-icon>
          <span>AI 阅读</span>
        </div>
        <div class="rightCard" @click="cardBtn('翻译这段文字')">
          <el-icon>
            <Connection />
          </el-icon>
          <span>翻译</span>
        </div>
        <div class="rightCard" @click="cardBtn('AI编程，生成一段代码')">
          <el-icon>
            <Document />
          </el-icon>
          <span>AI 编程</span>
        </div>
      </div>
    </div>
    <div id="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Picture, Edit, Reading, Connection, VideoPlay, Position, Document } from '@element-plus/icons-vue';
import { useChatStore } from '@/stores/chat';
import { useLocationStore } from '@/stores/location';
import AuthStore from '@/stores/auth.js';


const router = useRouter();
const chatStore = useChatStore();
const locationStore = useLocationStore();
const searchInput = ref('');
const hoveredImage = ref('');
const isInputFocused = ref(false);
const isButtonClicked = ref(false);

// 标题文字（拆分成字符数组用于动画）
const titleText = ref('你好面试官，我是你的专属AI助手小爱。让我们一起度过美好的一天！'.split(''));

// 添加关键词标签相关状态
const keywords = ref<string[]>([]);

// 添加一个计算属性检查是否有内容可发送
const hasContentToSend = computed(() => {
  return searchInput.value.trim() !== '' ||
    locationStore.locationTags.length > 0 ||
    keywords.value.length > 0;
});

// 构建消息内容的辅助函数
function buildMessageContent(): string {
  let content = searchInput.value.trim();

  // 添加关键词标签
  if (keywords.value.length > 0) {
    content = keywords.value.join(' ') + ' ' + content;
  }

  // 添加位置标签
  if (locationStore.locationTags.length > 0) {
    const locationNames = locationStore.locationTags.map(tag => tag.name).join(', ');
    content = `[位置: ${locationNames}] ${content}`;
  }

  return content;
}

function startChat() {
  if (hasContentToSend.value) {
    // 构建完整的消息内容
    const fullQuestion = buildMessageContent();

    // 保存问题和关键词到store中的临时字段，指定来源为chat，以便使用简洁的提示词
    chatStore.setPendingQuestion(fullQuestion, 'chat');

    // 将关键词和位置信息放入会话存储，以便ChatView可以获取
    if (keywords.value.length > 0) {
      sessionStorage.setItem('pendingKeywords', JSON.stringify(keywords.value));
    }

    // 清空地图标签
    locationStore.locationTags.length = 0;
    // 添加时间戳强制路由更新，确保每次都能触发
    router.push({
      path: '/chat',
      query: { t: Date.now() }
    });
  }
}

// 设置提示词
function cardBtn(prompt: string) {
  searchInput.value = prompt;
  startChat();
}

// 功能导航
function navigateToFeature(feature: string) {
  if (feature === 'search') {
    // 跳转到 SearchView 页面
    router.push('/search');
  } else if (feature === 'image') {
    // 跳转到 vedioPhoto 页面
    router.push('/vedioPhoto');
  } else {
    router.push(`/chat?feature=${feature}`);
  }
}

// AI 搜索卡片点击 - 带内容跳转到 SearchView
function navigateToSearchWithContent(content: string) {
  // 使用 query 参数传递搜索内容，添加时间戳强制路由更新
  router.push({
    path: '/search',
    query: {
      q: content,
      t: Date.now() // 添加时间戳，确保每次都是新的路由
    }
  });
}

// 图像生成卡片点击 - 带内容跳转到 vedioPhoto
function navigateToImageWithContent(content: string) {
  // 使用 sessionStorage 传递提示词
  sessionStorage.setItem('pendingImagePrompt', content);
  // 添加时间戳强制路由更新
  router.push({
    path: '/vedioPhoto',
    query: { t: Date.now() }
  });
}

// 删除标签
function removeTag(index: number) {
  keywords.value.splice(index, 1);
}

// 处理退格键，可以删除标签
function handleBackspace(event: KeyboardEvent) {
  if (searchInput.value.trim() === '') {
    if (keywords.value.length > 0) {
      // 如果有关键词标签，先删除关键词标签
      keywords.value.pop();
      event.preventDefault();
    } else if (locationStore.locationTags.length > 0) {
      // 如果没有关键词标签但有地图标签，则删除最后一个地图标签
      locationStore.locationTags.pop();
      event.preventDefault();
    }
  }
}

// 修改 blur 处理函数，避免点击按钮时收缩输入框
function handleBlur() {
  // 使用 setTimeout 延迟执行，给按钮点击事件时间处理
  setTimeout(() => {
    if (!isButtonClicked.value) {
      isInputFocused.value = false;
    }
    isButtonClicked.value = false;
  }, 100);
}

// 新增按钮点击处理函数
function handleSearch() {
  isButtonClicked.value = true;
  startChat();
}

// 处理位置选择
const handleLocationSelected = (location: { name: string, address: string, coords: any }) => {
  console.log('LandingView收到位置信息:', location);
  locationStore.addLocationTag(location);
};
// 在组件挂载时
onMounted(() => {
  // 检查是否有待处理的位置信息
  const pendingLocation = localStorage.getItem('pendingLocation');
  if (pendingLocation) {
    try {
      const location = JSON.parse(pendingLocation);
      locationStore.addLocationTag(location);
      localStorage.removeItem('pendingLocation');
    } catch (e) {
      console.error('解析待处理位置信息失败', e);
    }
  }
});

// 暴露方法给父组件
defineExpose({
  addLocationTag: locationStore.addLocationTag
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

.box {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.indexBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  background-color: #ffffff;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
  font-family: "Source Han Serif CN", serif;
  margin-bottom: 200px;
}

/* Logo区域样式 */

.title {
  text-align: center;
  margin-bottom: 30px;
}

.title h1 {
  font-size: 28px;
  font-weight: normal;
  color: #333;
  line-height: 1.6;
  letter-spacing: 1px;
}

/* 字符动画样式优化 */
.title h1 .char-animate {
  margin: 0 1px;
  white-space: pre;
}

.inputBox {
  max-width: 600px;
  width: 80%;
  margin: 22px auto 20px;
  transition: max-width 0.3s ease, width 0.3s ease;
}

.inputBox.expanded {
  max-width: 750px;
  width: 90%;
}

.inputMain {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 24px;
  padding: 10px 16px;
  gap: 10px;
  margin-top: 10px;
}

.inputMain :deep(.wideInput) {
  flex: 1;
}

.inputMain :deep(.wideInput .el-input__wrapper) {
  border: none;
  border-radius: 0;
  padding: 0;
  background-color: transparent;
  box-shadow: none !important;
}

.inputMain :deep(.el-input__inner) {
  height: 40px;
  font-size: 16px;
}

.sendButton {
  background-color: #1e90ff;
  color: white;
  margin-left: 0;
  z-index: 1000;
  position: relative;
  /* 确保按钮正确定位 */
}

.featureSection {
  margin-bottom: 20px;
  margin-top: 20px;
}

.featureSection h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 20px;
  font-weight: normal;
  color: #666;
}

.leftCardBox {
  display: flex;
  gap: 24px;
  margin-bottom: 9px;
}

.featureCard {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
}

.leftCardTitle {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
  gap: 10px;
  position: relative;
}

.leftCardTitle h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.tryMore {
  position: absolute;
  right: 16px;
  color: #1e90ff;
  font-size: 13px;
  cursor: pointer;
}

.leftCardMain {
  padding: 16px;
}

.searchExamples {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leftCardItem {
  display: flex;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #eee;
}

.leftCardItem:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.searchThumb {
  width: 80px;
  height: 60px;
  flex-shrink: 0;
}

.searchThumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.searchText {
  padding: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.imageGrid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.imageRow {
  display: flex;
  gap: 15px;
  /* margin-bottom: 15px; */
  height: auto;
}

.imageContainer {
  flex: 1;
  position: relative;
  height: 100px;
  border-radius: 8px;
  overflow: visible;
  /* margin-bottom: 20px; */
}

.imageContainer img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.imageContainer:hover img {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.imageDescription {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  /* padding: 5px 8px; */
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-in-out;
  white-space: normal;
  overflow: hidden;
  opacity: 0.96;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.rightCardBox {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  /* margin-top: 40px; */
}

.rightCard {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rightCard:hover {
  background-color: #e9e9e9;
}

.rightCard .el-icon {
  margin-right: 6px;
}

.rightCard span {
  font-size: 14px;
  color: #333;
}

/* 关键词引导样式 */
.tagBox {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 29px;
  justify-content: center;
  font-family: "Source Han Serif CN", serif;
}

.itemTag {
  background-color: #f0f0f0;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s ease;
}

.itemTag:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

/* 添加描述行样式 */
.descriptionRow {
  display: none;
}

/* 标签输入容器 */
.taggedInputContainer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  background: transparent;
}

/* 标签容器 */
.tagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 添加标签样式 */
.inputWithTags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  background: transparent;
  padding: 5px 0px;
  width: 100%;
}

.locationTags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.locationTag {
  display: flex;
  align-items: center;
  background-color: #e6f0ff;
  border: 1px solid #c0d9ff;
  border-radius: 16px;
  padding: 2px 8px;
  margin-right: 5px;
  font-size: 14px;
  z-index: 10;
}

.tagText {
  margin-right: 5px;
  color: #4e6ef2;
}

.tagRemove {
  background: none;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.mainInput {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 5px;
  min-width: 100px;
  font-size: 14px;
  background: transparent;
}

/* 确保搜索容器样式正确 */
.searchContainer {
  display: flex;
  max-width: 650px;
  margin: 20px auto;
  border-radius: 24px;
  border: 1px solid #ddd;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.searchButton {
  background: #4e6ef2;
  border: none;
  color: white;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.searchIcon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>');
  background-size: cover;
}
</style>