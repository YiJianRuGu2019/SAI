<template>
  <div class="creation_area">
    <div class="left_panel">
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'text_to_image' }"
          @click="switchTab('text_to_image')">视频生成</button>
        <button class="tab" :class="{ active: activeTab === 'image_edit' }"
          @click="switchTab('image_edit')">首位帧</button>
      </div>

      <!-- 视频生成模式：单图上传 -->
      <div class="upload_section" v-if="activeTab === 'text_to_image'">
        <div class="upload_box" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
          <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" style="display: none;">
          <div v-if="!uploadedImage" class="upload_placeholder">
            <p>点击/拖拽/粘贴 上传图片（可选）</p>
            <p class="file_info">上传图片后将使用图生视频，否则使用文生视频</p>
            <p class="file_info">支持JPG, PNG格式，最大30MB，短边&gt;300px，长边&lt;6000px</p>
          </div>
          <div v-else class="uploaded_image">
            <img :src="uploadedImage" alt="上传的图片">
            <button class="remove_image_btn" @click.stop="removeImage" title="删除图片">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 首位帧模式：双图上传 -->
      <div class="upload_section" v-if="activeTab === 'image_edit'">
        <div class="dual_upload_container">
          <!-- 首帧上传 -->
          <div class="upload_box_small">
            <div class="upload_content" @click="triggerFirstFrameInput" @dragover.prevent
              @drop.prevent="handleFirstFrameDrop">
              <input ref="firstFrameInput" type="file" accept="image/*" @change="handleFirstFrameSelect"
                style="display: none;">
              <div v-if="!firstFrameImage" class="upload_placeholder_small">
                <p>上传首帧图片</p>
                <p class="file_info_small">JPG/PNG</p>
              </div>
              <div v-else class="uploaded_image">
                <img :src="firstFrameImage" alt="首帧图片">
                <button class="remove_image_btn" @click.stop="removeFirstFrame" title="删除首帧">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 尾帧上传 -->
          <div class="upload_box_small">
            <div class="upload_content" @click="triggerLastFrameInput" @dragover.prevent
              @drop.prevent="handleLastFrameDrop">
              <input ref="lastFrameInput" type="file" accept="image/*" @change="handleLastFrameSelect"
                style="display: none;">
              <div v-if="!lastFrameImage" class="upload_placeholder_small">
                <p>上传尾帧图片</p>
                <p class="file_info_small">JPG/PNG</p>
              </div>
              <div v-else class="uploaded_image">
                <img :src="lastFrameImage" alt="尾帧图片">
                <button class="remove_image_btn" @click.stop="removeLastFrame" title="删除尾帧">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频生成模式的提示词输入 -->
      <div class="prompt_section" v-if="activeTab === 'text_to_image'">
        <div class="prompt_input_wrapper">
          <!-- 位置标签容器 - 在输入框内部 -->
          <div class="tagsContainer" v-if="locationTags && locationTags.length > 0">
            <div v-for="(tag, index) in locationTags" :key="index" class="locationTag">
              <span class="tagText">{{ tag.name }}</span>
              <button class="tagRemove" @click="$emit('removeLocationTag', index)">&times;</button>
            </div>
          </div>
          <textarea v-model="textToImagePrompt" placeholder="描述你想要生成的视频内容" maxlength="500">
          </textarea>
        </div>
      </div>

      <!-- 首位帧模式的提示词输入 -->
      <div class="prompt_section" v-if="activeTab === 'image_edit'">
        <div class="prompt_input_wrapper">
          <!-- 位置标签容器 - 在输入框内部 -->
          <div class="tagsContainer" v-if="locationTags && locationTags.length > 0">
            <div v-for="(tag, index) in locationTags" :key="index" class="locationTag">
              <span class="tagText">{{ tag.name }}</span>
              <button class="tagRemove" @click="$emit('removeLocationTag', index)">&times;</button>
            </div>
          </div>
          <textarea v-model="imageEditPrompt" placeholder="描述首尾帧之间的过渡内容" maxlength="500">
          </textarea>
        </div>
      </div>

      <!-- <div class="styles_section">
        <div class="style_item" v-for="i in 6" :key="i"></div>
      </div> -->

      <div class="model_selection">
        <label>视频模型</label>
        <div class="model_box">
          <span>Doubao-Seedance-1.0-pro</span>
        </div>
      </div>

      <div class="generation_params">
        <!-- 生成数量固定为1，不显示 -->
        <!-- <div class="param_row">
          <label>生成数量</label>
          <input type="range" min="1" max="4" v-model="videoCount" />
          <span>{{ videoCount }}</span>
        </div> -->
        <div class="param_row">
          <label>分辨率</label>
          <div class="resolution_options">
            <button :class="{ active: resolution === '480p' }" @click="resolution = '480p'">480P</button>
            <button :class="{ active: resolution === '720p' }" @click="resolution = '720p'">720P</button>
            <button :class="{ active: resolution === '1080p' }" @click="resolution = '1080p'">1080P</button>
          </div>
        </div>
        <div class="param_row">
          <label>宽高比</label>
          <div class="aspect_ratio_options">
            <button :class="{ active: aspectRatio === '21:9' }" @click="aspectRatio = '21:9'">21:9</button>
            <button :class="{ active: aspectRatio === '9:16' }" @click="aspectRatio = '9:16'">9:16</button>
            <button :class="{ active: aspectRatio === '16:9' }" @click="aspectRatio = '16:9'">16:9</button>
            <!-- <button :class="{ active: aspectRatio === '4:3' }" @click="aspectRatio = '4:3'">4:3</button> -->
            <!-- <button :class="{ active: aspectRatio === '1:1' }" @click="aspectRatio = '1:1'">1:1</button> -->
            <!-- <button :class="{ active: aspectRatio === '3:4' }" @click="aspectRatio = '3:4'">3:4</button> -->
            <!-- <button :class="{ active: aspectRatio === '9:21' }" @click="aspectRatio = '9:21'">9:21</button> -->
          </div>
        </div>
        <div class="param_row">
          <label>视频时长</label>
          <div class="duration_options">
            <button :class="{ active: duration === 5 }" @click="duration = 5">5秒</button>
            <button :class="{ active: duration === 10 }" @click="duration = 10">10秒</button>
          </div>
        </div>
        <!-- <div class="param_row">
          <label>相机固定</label>
          <div class="camera_fixed_toggle">
            <button :class="{ active: !cameraFixed }" @click="cameraFixed = false">否</button>
            <button :class="{ active: cameraFixed }" @click="cameraFixed = true">是</button>
          </div>
        </div> -->
      </div>

      <button class="generate_button" @click="handleGenerate" :disabled="isGenerating">
        <span v-if="!isGenerating">免费生成</span>
        <span v-else class="generating_text">
          <span class="loading_spinner"></span>
          {{ generationProgress || '生成中...' }}
        </span>
      </button>
    </div>

    <div class="right_panel">
      <!-- 范例按钮：只在有生成内容或正在生成时显示 -->
      <button v-if="generatedVideos.length > 0 || generatingTasks.length > 0" class="example_toggle_button"
        @click="toggleShowcase" :title="showShowcase ? '查看生成结果' : '查看范例'">
        <svg v-if="!showShowcase" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </button>

      <!-- 范例展示区域 - 使用 v-show 保留 DOM -->
      <transition name="fade-slide">
        <div class="showcase_area"
          v-show="showShowcase || (generatedVideos.length === 0 && generatingTasks.length === 0)">
          <div class="showcase_grid">
            <div v-for="item in showcaseVideos" :key="item.id" class="showcase_item">
              <div class="video_box">
                <video v-if="item.videoUrl" :src="convertVideoUrl(item.videoUrl)" muted loop preload="metadata"
                  @mouseenter="$event.target.play()" @mouseleave="$event.target.pause(); $event.target.currentTime = 0"
                  class="showcase_video">
                </video>
                <!-- 一键同款按钮 -->
                <button class="one_click_generate_btn" @click="applyVideoPrompt(item)">一键同款</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 生成结果区域 - 使用 v-show 保留 DOM -->
      <transition name="fade-slide">
        <div ref="generatedVideosContainer" class="generated_videos"
          v-show="!showShowcase && (generatedVideos.length > 0 || generatingTasks.length > 0)">
          <!-- 已生成的视频组 -->
          <div v-for="video in generatedVideos" :key="video.id" class="generation_group">
            <div class="group_header">
              <div class="group_info">
                <span class="group_time">{{ video.created_at }}</span>
                <span class="group_model">Doubao-Seedance-1.0-pro</span>
                <span class="group_count">1个</span>
                <span class="group_resolution">{{ video.resolution }}</span>
                <span class="group_resolution">{{ video.aspectRatio }}</span>
                <span class="group_resolution">{{ video.duration }}秒</span>
              </div>
              <div class="group_prompt">{{ video.prompt }}</div>
            </div>

            <!-- 视频网格 -->
            <div class="videos_grid">
              <div class="video_item">
                <div class="video_wrapper">
                  <video :src="convertVideoUrl(video.url)" controls preload="metadata" class="generated_video">
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>
            </div>
          </div>

          <!-- 骨架屏：支持多个并发生成任务 -->
          <div v-for="task in generatingTasks" :key="task.id" class="generation_group skeleton_group">
            <div class="group_header">
              <div class="group_info">
                <span class="group_time">{{ task.time }}</span>
                <span class="group_model">Doubao-Seedance-1.0-pro</span>
                <span class="group_count">1个</span>
                <span class="group_resolution">{{ task.resolution }}</span>
                <span class="group_resolution">{{ task.aspectRatio }}</span>
                <span class="group_resolution">{{ task.duration }}秒</span>
              </div>
              <div class="group_prompt">{{ task.prompt }}</div>
            </div>

            <!-- 骨架屏视频网格 -->
            <div class="videos_grid">
              <div class="video_item skeleton_video_item">
                <div class="skeleton_video_box"></div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
// import { generateVideo, uploadImage, pollTaskUntilComplete } from '@/api/doubaoApi.js'
import { generateVideoFromText, generateVideoFromImage, pollTaskUntilComplete as ppioPolltask } from '@/api/ppioVideoApi.js'
import { ElMessage } from 'element-plus'

// 导入视频范例图片（只导入存在的图片）
import v2Img from '@/img/vedio/2.png'
import v3Img from '@/img/vedio/3.png'
import v4Img from '@/img/vedio/4.png'
import v5Img from '@/img/vedio/5.png'
import v6Img from '@/img/vedio/6.png'
import v7Img from '@/img/vedio/7.png'
import v8Img from '@/img/vedio/8.png'
import v10Img from '@/img/vedio/10.png'
// Props
const props = defineProps({
  locationTags: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['removeLocationTag'])
const activeTab = ref('text_to_image')
const fileInput = ref(null)
const uploadedImage = ref('')
const uploadedImageFile = ref(null)
const hasUploadedImage = ref(false) // 监控是否上传了图片

// 首位帧模式的图片
const firstFrameInput = ref(null)
const lastFrameInput = ref(null)
const firstFrameImage = ref('')
const lastFrameImage = ref('')
const firstFrameImageFile = ref(null)
const lastFrameImageFile = ref(null)

// 两个独立的提示词
const textToImagePrompt = ref('') // 视频生成模式的提示词
const imageEditPrompt = ref('') // 首位帧模式的提示词

const isGenerating = ref(false)
const generatedVideos = ref([])
const currentTaskId = ref('')
const generationProgress = ref('')
const showShowcase = ref(false) // 控制范例展示/生成结果切换
const resolution = ref('1080p') // 分辨率
const videoCount = ref(1) // 生成数量
const aspectRatio = ref('9:16') // 宽高比
const cameraFixed = ref(false) // 相机固定
const duration = ref(5) // 视频时长（秒）
const generatedVideosContainer = ref(null) // 生成结果容器引用

// 正在生成的任务列表（支持多个并发生成）
const generatingTasks = ref([]) // { id, prompt, resolution, aspectRatio, duration, time }

// 计算属性：判断范例区域是否应该显示
const isShowcaseVisible = computed(() => {
  return showShowcase.value || (generatedVideos.value.length === 0 && !isGenerating.value)
})

// 范例展示数据
const showcaseVideos = ref([
  {
    id: 1,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/88d58158-8220-45c1-9d0c-df841533147e-c3360d46-70f5-4408-9288-32791e64b253.mp4?e=1764311217&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:HuPCBj83Cdj9DlK5F2dPd7tcWgI=',
    img: '',
    imgfast: '',
    description: '迪斯尼3D动画电影风格，穿越机镜头顺着窗前的男子的楼体超高速垂直上摇到高空，俯瞰中国极简居民楼全景，男子和窗口极速变小，消失在俯瞰视角的灯火阑珊的极简居民小区中，光影变换，电影级调色强化皮肤质感与发丝光泽，无瑕疵渲染呈现超写实动态，确保画面清晰度达专业影视标准'
  },
  {
    id: 2,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/5bd0d7fd-0ccd-47dd-bede-e83da97c8a0f-5a60fe3c-442f-41c5-9464-66c8f7a4eef8.mp4?e=1764318768&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:iwheVidgOYt5ph-Qw6l55nLOJfE=',
    img: v2Img,
    imgfast: '',
    description: '静谧的夏日森林中，湖平静微泛梦幻般微光涟漪，如璀璨星辰，一阵风吹来，茂密树叶随风轻柔摇曳，蜻蜓从屏幕前点水掠过，大师级运镜展现电影级光影在32k超清画质下呈现森林光影层次和水面倒影的精致细节，营造出身临其境的沉浸氛围'
  },
  {
    id: 3,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/d17398e2-1a92-4a63-8343-1552c3cd315c-b6219ecd-ebbf-4061-9cfa-a1448bdaf9ce.mp4?e=1764314714&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:GpjRjliXyMmRmKrZKpoyHhJHH_8=',
    img: v3Img,
    imgfast: '',
    description: '立体画卷在山谷河流场景中缓慢翻滚旋转，蜿蜒水流穿过陡峭山峰，小桥上行人悠然漫步，远处金色塔顶在阳光下闪烁，古朴木质桌面背景营造立体空间感，固定镜头'
  },
  {
    id: 4,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/c464ec65-62f5-4746-a3cf-beb20cd003a6-61131e19-1d3b-4785-a37d-4d53d90d7a2d.mp4?e=1764318811&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:K18ScJJTEpy7gsWqwcP1EM38GRI=',
    img: v4Img,
    imgfast: '',
    description: '帮我生成一个视频：吉卜力工作室风格，第三人称视角，模拟低空飞行穿梭的沉浸式体验，夸张的运动视角搭配强烈的动态模糊来突出飞行速度，自然色调鲜艳明快，电影级光影渲染，奇幻治愈的氛围，超精细纹理细节，8K超高清画质，镜头跟随飞行轨迹灵活移动，模拟真实飞行时的视角晃动与速度变化'
  },
  {
    id: 5,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/d5dbb38c-09cd-4e67-a249-ee0f665661f1-5c3ce8fb-e597-4d99-bb1c-bdd03695c03c.mp4?e=1764316063&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:eWZ86oLSXa47ygM7EspfmXxRxhM=',
    img: v5Img,
    imgfast: '',
    description: '镜头跟随，微风飘动，人物向前跑动看到地球'
  },
  {
    id: 6,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/64a0cc89-c522-4548-a5db-f81bf36d8fa3-5f0872df-459e-41ad-a944-bb77bcbe018d.mp4?e=1764318783&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:JsOegjdNKzsuFdl41OY6FUfzTM8=',
    img: v6Img,
    imgfast: '',
    description: '梦中的世界，像金鱼一样，隔着玻璃看你，用泪水放大你，用七秒忘记你……'
  },
  {
    id: 7,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/f089200a-2005-403b-8497-f9a0df394668-cdc65630-bd2b-44f8-9b38-36d9938d2dc4.mp4?e=1764318038&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:AkUjHjGi7XtiU4D3LTX7wUQEZHk=',
    img: v7Img,
    imgfast: '',
    description: '左右运镜，风吹过花朵自然摇摆，花上方一只蝴蝶飞舞，背景有雾气流动，整体动手动脚自然流畅！'
  },
  {
    id: 8,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/8ce0b92a-a225-488d-994d-f9418cd42505-990418cc-cc04-43a8-a99a-aeb78faf4e83.mp4?e=1764317507&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:by3ZTmiw7erIDPBNr5K5XXcUT-c=',
    img: v8Img,
    imgfast: '',
    description: '第一人称视角，生成关于吴均的《与朱元思书》视频，领略他笔下的富春江那独具特色的美景。'
  },
  {
    id: 9,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/1de605ea-6aff-4d5d-8666-316ab165ec37-695fb884-e068-4064-bb4b-9aeee8092819.mp4?e=1764316975&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:SoWY8TWw0OP9H2gX5tu5BA55s_I=',
    img: '',
    imgfast: '',
    description: '俯拍一张有些古老的实木桌子上放着一本古书，书的封面是白色的，没有字，书自动打开，镜头慢慢旋转，书里出现了纯白色立体剪纸风的古建筑，从古建筑的门里，飞出许多剪纸风的鸟，飞向镜头后方。'
  },
  {
    id: 10,
    videoUrl: 'http://t6f3i3j5v.hn-bkt.clouddn.com/6ad642b8-1bd8-4f87-87a7-e3e1988b689f-b85b0910-70d1-46c8-bda4-6857352cdb05.mp4?e=1764320049&token=22czwi9Q5kaMD7_3z4rVOSzuZMoYIQP-XZ1IAzw8:9bBe4j1J-LIK4SheoHfAUcISbxg=',
    img: v10Img,
    imgfast: '',
    description: '想和你一起去看花海'
  }
])
const switchTab = (tab) => {
  activeTab.value = tab
  // 切换标签时清空图片
  // if (tab === 'text_to_image') {
  //   firstFrameImage.value = ''
  //   lastFrameImage.value = ''
  //   firstFrameImageFile.value = null
  //   lastFrameImageFile.value = null
  // } else if (tab === 'image_edit') {
  //   uploadedImage.value = ''
  //   uploadedImageFile.value = null
  //   hasUploadedImage.value = false
  // }
}


// 转换视频 URL：七牛云测试域名强制使用 HTTP
const convertVideoUrl = (url) => {
  if (!url) return url

  // 方案 1：强制使用 HTTP（在 HTTPS 网站上会被浏览器阻止）
  // if (url.includes('clouddn.com') && url.startsWith('https://')) {
  //   return url.replace('https://', 'http://')
  // }

  // 方案 2：使用代理（推荐）
  // 如果你配置了 Nginx 代理，取消下面的注释并替换为你的域名
  // if (url.includes('t6f3i3j5v.hn-bkt.clouddn.com')) {
  //   return url.replace('http://t6f3i3j5v.hn-bkt.clouddn.com', 'https://your-domain.com/qiniu-proxy')
  //            .replace('https://t6f3i3j5v.hn-bkt.clouddn.com', 'https://your-domain.com/qiniu-proxy')
  // }

  // 方案 3：直接返回原 URL（如果七牛云已支持 HTTPS）
  return url
}

// 切换范例展示和生成结果
let isToggling = false // 防止快速点击
const toggleShowcase = () => {
  // 如果正在切换中，忽略点击
  if (isToggling) return

  isToggling = true
  showShowcase.value = !showShowcase.value

  // 等待动画完成后才允许下次切换（fade-slide 动画时长为 0.4s）
  setTimeout(() => {
    isToggling = false
  }, 400)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

const handlePaste = (event) => {
  const items = event.clipboardData.items
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      processFile(file)
      break
    }
  }
}

const processFile = (file) => {
  // 检查文件大小（最大 30MB）
  const maxSize = 30 * 1024 * 1024 // 30MB
  if (file.size > maxSize) {
    ElMessage.error(`图片文件过大，最大支持 30MB，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    return
  }

  uploadedImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Data = e.target.result

    // 检查图片尺寸
    const img = new Image()
    img.onload = () => {
      const width = img.width
      const height = img.height
      const aspectRatio = width / height
      const shortSide = Math.min(width, height)
      const longSide = Math.max(width, height)

      console.log('📐 图片尺寸:', { width, height, aspectRatio, shortSide, longSide })

      // 验证尺寸要求
      if (shortSide < 300) {
        ElMessage.error(`图片短边不能小于 300px，当前为 ${shortSide}px`)
        return
      }
      if (longSide > 6000) {
        ElMessage.error(`图片长边不能大于 6000px，当前为 ${longSide}px`)
        return
      }
      if (aspectRatio < 0.4 || aspectRatio > 2.5) {
        ElMessage.error(`图片宽高比需在 0.4-2.5 之间，当前为 ${aspectRatio.toFixed(2)}`)
        return
      }

      uploadedImage.value = base64Data
      hasUploadedImage.value = true // 标记已上传图片
      ElMessage.success('图片上传成功')
    }
    img.onerror = () => {
      ElMessage.error('图片加载失败')
    }
    img.src = base64Data
  }
  reader.readAsDataURL(file)
}

// 删除图片
const removeImage = () => {
  uploadedImage.value = ''
  uploadedImageFile.value = null
  hasUploadedImage.value = false // 标记已删除图片
}

// 首帧处理方法
const triggerFirstFrameInput = () => {
  firstFrameInput.value.click()
}

const handleFirstFrameSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFirstFrameFile(file)
  }
}

const handleFirstFrameDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFirstFrameFile(file)
  }
}

const processFirstFrameFile = (file) => {
  const maxSize = 30 * 1024 * 1024 // 30MB
  if (file.size > maxSize) {
    ElMessage.error(`图片文件过大，最大支持 30MB，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    return
  }

  firstFrameImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Data = e.target.result
    const img = new Image()
    img.onload = () => {
      const width = img.width
      const height = img.height
      const shortSide = Math.min(width, height)
      const longSide = Math.max(width, height)

      if (shortSide < 300) {
        ElMessage.error(`图片短边不能小于 300px，当前为 ${shortSide}px`)
        return
      }
      if (longSide > 6000) {
        ElMessage.error(`图片长边不能大于 6000px，当前为 ${longSide}px`)
        return
      }

      firstFrameImage.value = base64Data
      ElMessage.success('首帧图片上传成功')
    }
    img.src = base64Data
  }
  reader.readAsDataURL(file)
}

const removeFirstFrame = () => {
  firstFrameImage.value = ''
  firstFrameImageFile.value = null
  if (firstFrameInput.value) {
    firstFrameInput.value.value = ''
  }
}

// 尾帧处理方法
const triggerLastFrameInput = () => {
  lastFrameInput.value.click()
}

const handleLastFrameSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processLastFrameFile(file)
  }
}

const handleLastFrameDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processLastFrameFile(file)
  }
}

const processLastFrameFile = (file) => {
  const maxSize = 30 * 1024 * 1024 // 30MB
  if (file.size > maxSize) {
    ElMessage.error(`图片文件过大，最大支持 30MB，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    return
  }

  lastFrameImageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Data = e.target.result
    const img = new Image()
    img.onload = () => {
      const width = img.width
      const height = img.height
      const shortSide = Math.min(width, height)
      const longSide = Math.max(width, height)

      if (shortSide < 300) {
        ElMessage.error(`图片短边不能小于 300px，当前为 ${shortSide}px`)
        return
      }
      if (longSide > 6000) {
        ElMessage.error(`图片长边不能大于 6000px，当前为 ${longSide}px`)
        return
      }

      lastFrameImage.value = base64Data
      ElMessage.success('尾帧图片上传成功')
    }
    img.src = base64Data
  }
  reader.readAsDataURL(file)
}

const removeLastFrame = () => {
  lastFrameImage.value = ''
  lastFrameImageFile.value = null
  if (lastFrameInput.value) {
    lastFrameInput.value.value = ''
  }
}

// 应用视频范例的提示词和图片
const applyVideoPrompt = async (item) => {
  // 填充提示词到当前激活的 tab 对应的输入框
  if (item.description) {
    if (activeTab.value === 'text_to_image') {
      textToImagePrompt.value = item.description
    } else {
      imageEditPrompt.value = item.description
    }
  }

  // 处理图片逻辑
  const hasImg = item.img && item.img !== ''
  const hasImgfast = item.imgfast && item.imgfast !== ''

  if (!hasImg && !hasImgfast) {
    // 情况1：没有图片，只填充文字 - 清空所有已上传的图片
    // 清空单图模式的图片
    uploadedImage.value = ''
    uploadedImageFile.value = null
    hasUploadedImage.value = false

    // 清空首尾帧模式的图片
    firstFrameImage.value = ''
    firstFrameImageFile.value = null
    lastFrameImage.value = ''
    lastFrameImageFile.value = null

    // 清空文件输入框
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    if (firstFrameInput.value) {
      firstFrameInput.value.value = ''
    }
    if (lastFrameInput.value) {
      lastFrameInput.value.value = ''
    }

    ElMessage.success('提示词已填充，请点击生成按钮')
  } else if (hasImg && !hasImgfast) {
    // 情况2：只有 img，放入图片展示区（图生视频模式）
    try {
      // 将图片 URL 转换为 base64 和 File 对象
      const base64 = await imageUrlToBase64(item.img)
      const file = await imageUrlToFile(item.img, 'showcase-image.png')

      // 验证图片尺寸（与直接上传保持一致）
      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height
        const aspectRatio = width / height
        const shortSide = Math.min(width, height)
        const longSide = Math.max(width, height)

        console.log('📐 范例图片尺寸:', { width, height, aspectRatio, shortSide, longSide })

        // 验证尺寸要求
        if (shortSide < 300) {
          ElMessage.error(`图片短边不能小于 300px，当前为 ${shortSide}px`)
          return
        }
        if (longSide > 6000) {
          ElMessage.error(`图片长边不能大于 6000px，当前为 ${longSide}px`)
          return
        }
        if (aspectRatio < 0.4 || aspectRatio > 2.5) {
          ElMessage.error(`图片宽高比需在 0.4-2.5 之间，当前为 ${aspectRatio.toFixed(2)}`)
          return
        }

        // 设置图片数据（与直接上传保持一致）
        uploadedImage.value = base64
        uploadedImageFile.value = file
        hasUploadedImage.value = true

        // 切换到图生视频模式
        activeTab.value = 'text_to_image'

        ElMessage.success('提示词和图片已填充，请点击生成按钮')
      }
      img.onerror = () => {
        ElMessage.error('图片加载失败')
      }
      img.src = base64
    } catch (error) {
      console.error('图片加载失败:', error)
      ElMessage.error('图片加载失败')
    }
  } else if (hasImg && hasImgfast) {
    // 情况3：有 img 和 imgfast，分别放入首位帧
    try {
      const base64First = await imageUrlToBase64(item.img)
      const base64Last = await imageUrlToBase64(item.imgfast)
      const fileFirst = await imageUrlToFile(item.img, 'first-frame.png')
      const fileLast = await imageUrlToFile(item.imgfast, 'last-frame.png')

      // 验证首帧图片尺寸
      const imgFirst = new Image()
      imgFirst.onload = () => {
        const width = imgFirst.width
        const height = imgFirst.height
        const shortSide = Math.min(width, height)
        const longSide = Math.max(width, height)

        if (shortSide < 300) {
          ElMessage.error(`首帧图片短边不能小于 300px，当前为 ${shortSide}px`)
          return
        }
        if (longSide > 6000) {
          ElMessage.error(`首帧图片长边不能大于 6000px，当前为 ${longSide}px`)
          return
        }

        // 验证尾帧图片尺寸
        const imgLast = new Image()
        imgLast.onload = () => {
          const widthLast = imgLast.width
          const heightLast = imgLast.height
          const shortSideLast = Math.min(widthLast, heightLast)
          const longSideLast = Math.max(widthLast, heightLast)

          if (shortSideLast < 300) {
            ElMessage.error(`尾帧图片短边不能小于 300px，当前为 ${shortSideLast}px`)
            return
          }
          if (longSideLast > 6000) {
            ElMessage.error(`尾帧图片长边不能大于 6000px，当前为 ${longSideLast}px`)
            return
          }

          // 设置首尾帧数据（与直接上传保持一致）
          firstFrameImage.value = base64First
          firstFrameImageFile.value = fileFirst
          lastFrameImage.value = base64Last
          lastFrameImageFile.value = fileLast

          // 切换到首位帧模式
          activeTab.value = 'image_edit'

          ElMessage.success('提示词和首尾帧图片已填充，请点击生成按钮')
        }
        imgLast.onerror = () => {
          ElMessage.error('尾帧图片加载失败')
        }
        imgLast.src = base64Last
      }
      imgFirst.onerror = () => {
        ElMessage.error('首帧图片加载失败')
      }
      imgFirst.src = base64First
    } catch (error) {
      console.error('图片加载失败:', error)
      ElMessage.error('图片加载失败')
    }
  }
}

// 将图片 URL 转换为 base64
const imageUrlToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous' // 处理跨域
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const base64 = canvas.toDataURL('image/png')
      resolve(base64)
    }
    img.onerror = reject
    img.src = url
  })
}

// 将图片 URL 转换为 File 对象
const imageUrlToFile = async (url, filename) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: 'image/png' })
          resolve(file)
        } else {
          reject(new Error('Failed to create blob'))
        }
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

const handleGenerate = async () => {
  // 获取当前 tab 对应的提示词
  const currentPromptValue = activeTab.value === 'text_to_image' ? textToImagePrompt.value : imageEditPrompt.value

  // 验证：至少需要提示词
  if (!currentPromptValue.trim()) {
    ElMessage.warning('请输入提示词')
    return
  }

  // 首位帧模式：必须上传两张图片
  if (activeTab.value === 'image_edit') {
    if (!firstFrameImage.value || !lastFrameImage.value) {
      ElMessage.warning('首位帧模式需要上传首帧和尾帧两张图片')
      return
    }
  }

  // 保存当前的 prompt 值（避免用户修改输入框后影响已提交的任务）
  const savedPrompt = currentPromptValue

  // 检查范例区域是否实际正在显示（包括初始状态下没有生成结果时）
  const wasShowingShowcase = isShowcaseVisible.value

  // 如果当前显示的是范例区域，切换到生成结果视图
  if (showShowcase.value) {
    showShowcase.value = false
  }

  // 创建新的生成任务
  const taskId = Date.now()
  const newTask = {
    id: taskId,
    prompt: savedPrompt,
    resolution: resolution.value,
    aspectRatio: aspectRatio.value,
    duration: duration.value,
    time: new Date().toLocaleString()
  }

  // 添加到生成任务列表
  generatingTasks.value.push(newTask)
  isGenerating.value = true
  generationProgress.value = '准备中...'
  currentTaskId.value = ''

  // 滚动到底部显示骨架屏
  // 如果是从范例页切换过来，需要等待过渡动画完成后再滚动
  const scrollToBottom = () => {
    if (generatedVideosContainer.value) {
      generatedVideosContainer.value.scrollTo({
        top: generatedVideosContainer.value.scrollHeight,
        behavior: 'smooth'
      })
      console.log('📜 开始生成时滚动到底部')
    }
  }

  if (wasShowingShowcase) {
    setTimeout(() => {
      scrollToBottom()
    }, 450) // 等待过渡动画完成（0.4s + 50ms缓冲）
  } else {
    setTimeout(() => {
      scrollToBottom()
    }, 200)
  }

  try {
    // 构建完整的提示词：位置标签 + 用户输入（使用保存的 savedPrompt）
    let fullPrompt = savedPrompt
    if (props.locationTags && props.locationTags.length > 0) {
      const locationText = props.locationTags.map(tag => tag.name).join('、')
      fullPrompt = `位置：${locationText}，${savedPrompt}`
    }

    let taskResult = null

    // 提交任务
    ElMessage.info('正在提交视频生成任务...')

    // 根据模式决定使用哪个 API
    if (activeTab.value === 'image_edit') {
      // 首位帧模式 - 图生视频（双图）
      console.log('首位帧视频参数:', {
        firstImageLength: firstFrameImage.value?.length,
        lastImageLength: lastFrameImage.value?.length,
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })

      taskResult = await generateVideoFromImage({
        image: firstFrameImage.value, // 首帧 Base64
        last_image: lastFrameImage.value, // 尾帧 Base64
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })
    } else if (hasUploadedImage.value && uploadedImage.value) {
      // 视频生成模式 - 图生视频（单图）
      console.log('图生视频参数:', {
        imageLength: uploadedImage.value?.length,
        imagePrefix: uploadedImage.value?.substring(0, 50),
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })

      taskResult = await generateVideoFromImage({
        image: uploadedImage.value, // Base64 格式
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })
    } else {
      // 视频生成模式 - 文生视频
      console.log('文生视频参数:', {
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })

      taskResult = await generateVideoFromText({
        prompt: fullPrompt,
        resolution: resolution.value,
        aspect_ratio: aspectRatio.value,
        duration: duration.value,
        camera_fixed: cameraFixed.value
      })
    }

    console.log('📤 任务提交结果:', taskResult)

    if (!taskResult.success) {
      ElMessage.error('任务提交失败: ' + taskResult.error)
      isGenerating.value = false // 失败时也要解除禁用
      return
    }

    currentTaskId.value = taskResult.task_id
    ElMessage.success(`任务已提交，任务ID: ${taskResult.task_id}`)
    generationProgress.value = '正在生成...'

    // 第一个接口成功，解除按钮禁用状态，允许用户继续提交新任务
    isGenerating.value = false

    // 轮询任务状态
    try {
      const completedResult = await ppioPolltask(taskResult.task_id)

      console.log('✅ 完成的任务结果:', JSON.stringify(completedResult, null, 2))

      // 根据 PPIO API 响应格式处理结果
      if (completedResult.success && completedResult.data) {
        const resultData = completedResult.data

        console.log('📦 resultData:', resultData)
        console.log('🎬 videos 数组:', resultData.videos)

        // PPIO API 返回的视频 URL 在 videos[0].video_url 中
        let videoUrl = null
        if (resultData.videos && resultData.videos.length > 0) {
          videoUrl = resultData.videos[0].video_url
          console.log('🎥 提取到的视频URL:', videoUrl)

          // 七牛云测试域名不支持 HTTPS，强制使用 HTTP
          if (videoUrl && videoUrl.includes('clouddn.com')) {
            videoUrl = videoUrl.replace('https://', 'http://')
            console.log('🔄 已转换为 HTTP 协议:', videoUrl)
          }
        } else {
          console.error('❌ videos 数组为空或不存在')
        }

        if (videoUrl) {
          const newVideo = {
            id: Date.now(),
            url: videoUrl,
            prompt: savedPrompt,
            type: hasUploadedImage.value ? 'image_to_video' : 'text_to_video',
            created_at: new Date().toLocaleString(),
            taskId: taskResult.task_id,
            duration: duration.value,
            resolution: resolution.value,
            aspectRatio: aspectRatio.value
          }

          console.log('➕ 添加视频到列表:', newVideo)
          generatedVideos.value.push(newVideo) // 改为 push，最新的在最下面
          console.log('📋 当前视频列表长度:', generatedVideos.value.length)

          // 等待 DOM 更新后滚动到底部
          setTimeout(() => {
            if (generatedVideosContainer.value) {
              generatedVideosContainer.value.scrollTo({
                top: generatedVideosContainer.value.scrollHeight,
                behavior: 'smooth'
              })
              console.log('📜 视频生成完成后滚动到底部')
            }
          }, 200)

          ElMessage.success('视频生成成功！')
          generationProgress.value = '生成完成'
        } else {
          console.error('❌ 无法从结果中提取视频URL')
          console.error('完整响应数据:', JSON.stringify(completedResult, null, 2))
          ElMessage.error('视频生成完成，但无法获取视频链接')
          generationProgress.value = '生成失败：无法获取视频链接'
        }
      } else {
        console.error('❌ 任务失败:', completedResult.error)
        ElMessage.error('视频生成失败: ' + completedResult.error)
        generationProgress.value = '生成失败'
      }
    } catch (pollError) {
      console.error('❌ 轮询任务状态失败:', pollError)
      ElMessage.error('任务处理失败: ' + pollError.message)
      generationProgress.value = '任务处理失败: ' + pollError.message
    } finally {
      // 移除对应的骨架屏任务
      const taskIndex = generatingTasks.value.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        generatingTasks.value.splice(taskIndex, 1)
      }

      // 如果没有其他生成任务了，设置 isGenerating 为 false
      if (generatingTasks.value.length === 0) {
        isGenerating.value = false
      }
    }
  } catch (error) {
    console.error('生成视频时出错:', error)
    ElMessage.error('生成失败: ' + error.message)

    // 移除对应的骨架屏任务
    const taskIndex = generatingTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      generatingTasks.value.splice(taskIndex, 1)
    }

    // 如果没有其他生成任务了，设置 isGenerating 为 false
    if (generatingTasks.value.length === 0) {
      isGenerating.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
.creation_area {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.left_panel {
  width: 330px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* background: #fafbfc; */
  /* padding: 25px; */
  border-radius: 16px;
  /* border: 1px solid #e5e7eb; */
}

.tabs {
  display: flex;
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 6px;
  border: 1px solid #e2e8f0;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
}

.tab.active {
  background-color: white;
  color: #4f46e5;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

/* 双图上传容器 */
.dual_upload_container {
  height: 148px;
  display: flex;
  gap: 12px;
}

.upload_box_small {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload_content {
  height: 100%;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 0px 5px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload_content:hover {
  border-color: #4f46e5;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: translateY(-1px);
}

.upload_placeholder_small p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.upload_placeholder_small .file_info_small {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.upload_section .upload_box {
  height: 148px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 0px 5px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload_box:hover {
  border-color: #4f46e5;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: translateY(-1px);
}

.upload_placeholder p {
  margin: 0;
  font-size: 14px;
}

.upload_placeholder .file_info {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.uploaded_image {
  width: 100%;
  height: 94%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uploaded_image img {
  /* width: 100%; */
  height: 100%;
  border-radius: 6px;
}

.remove_image_btn {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.remove_image_btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

/* 输入框包装器 */
.prompt_input_wrapper {
  width: 100%;
  height: 166px;
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
  background-color: white;
}

/* 位置标签容器 - 在输入框内部 */
.tagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
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

.prompt_section textarea {
  width: 100%;
  height: 150px;
  padding: 0;
  border: none;
  resize: none;
  box-sizing: border-box;
  outline: none;
}

.style_item {
  height: 40px;
  background-color: #eee;
  border-radius: 6px;
}

.model_selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model_selection label {
  font-size: 14px;
}

.model_box {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.generation_params {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.param_row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param_row label {
  font-size: 14px;
  width: 60px;
}

.param_row input[type="range"] {
  flex-grow: 1;
}

.resolution_options,
.aspect_ratio_options,
.duration_options,
.camera_fixed_toggle {
  width: 200px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.resolution_options button,
.aspect_ratio_options button,
.duration_options button,
.camera_fixed_toggle button {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.resolution_options button:hover,
.aspect_ratio_options button:hover,
.duration_options button:hover,
.camera_fixed_toggle button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.resolution_options button.active,
.aspect_ratio_options button.active,
.duration_options button.active,
.camera_fixed_toggle button.active {
  border-color: #1890ff;
  color: #1890ff;
  background-color: #e6f7ff;
}

.generate_button {
  width: 100%;
  padding: 16px 24px;
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.generate_button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.generate_button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  box-shadow: none;
  transform: none;
}

.generating_text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading_spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.right_panel {
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 范例切换按钮 */
.example_toggle_button {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 13px;
  background: linear-gradient(135deg, #3b51bc 0%, #87e3ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.example_toggle_button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #4f68e8 0%, #87e3ff 100%);
}

.example_toggle_button:active {
  transform: translateY(0);
}

.example_toggle_button svg {
  flex-shrink: 0;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 范例区域 */
.showcase_area {
  height: 100%;
  background: linear-gradient(135deg,
      #fee7f6,
      #cfe1ff,
      #c2e9fb);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite, showcaseFadeIn 1s ease;
  border-radius: 16px;
  padding: 20px;
  color: #333;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(255, 214, 215, 0.3);
  transition: box-shadow 0.3s ease;
}

.showcase_area:hover {
  box-shadow: 0 12px 48px rgba(255, 246, 246, 0.4);
}

/* 滚动条透明处理 */
.showcase_area::-webkit-scrollbar {
  width: 6px;
}

.showcase_area::-webkit-scrollbar-track {
  background: transparent;
}

.showcase_area::-webkit-scrollbar-thumb {
  background: transparent;
}

.showcase_area::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes showcaseFadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.showcase_grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
}

.showcase_video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.showcase_iframe {
  width: 100%;
  height: 100%;
  display: block;
  border: none;
}

.showcase_item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.showcase_item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.video_box {
  width: 100%;
  height: 430px;
  position: relative;
  overflow: hidden;
}

/* 一键同款按钮 */
.video_box .one_click_generate_btn {
  position: absolute;
  bottom: 11px;
  left: 50%;
  transform: translate(-50%, 150%);
  width: 92%;
  padding: 10px;
  background: rgba(253, 254, 255, 0.121);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.showcase_item:hover .one_click_generate_btn {
  transform: translate(-50%, 0);
}

.video_box .one_click_generate_btn:hover {
  background: rgba(253, 254, 255, 0.203);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}



@keyframes skeleton-loading {
  0% {
    background-position: 0% 0%;
  }

  100% {
    background-position: 100% 100%;
  }
}

.video_box::after {
  content: '▶';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.video_box:has(video)::after,
.video_box:has(iframe)::after {
  display: none;
}

.showcase_info {
  padding: 20px;
}

.showcase_info h4 {
  font-size: 18px;
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #333;
}

.showcase_info p {
  font-size: 14px;
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* 生成结果区域 */
.generated_videos {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px;
  padding-top: 0px;
  padding-left: 0px;
  background: #fff;
  border-radius: 12px;
  overflow-y: auto;
}

/* 滚动条透明处理 */
.generated_videos::-webkit-scrollbar {
  width: 6px;
}

.generated_videos::-webkit-scrollbar-track {
  background: transparent;
}

.generated_videos::-webkit-scrollbar-thumb {
  background: transparent;
}

.generated_videos::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* 每个生成组的容器 */
.generation_group {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  padding-bottom: 0px;
  padding-top: 4px;
}

/* 组头部信息 */
.group_header {
  margin-bottom: 12px;
}

.group_info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

.group_time {
  color: #6c757d;
  font-weight: 500;
}

.group_model {
  padding: 2px 8px;
  background: linear-gradient(to right, #0d2dd2, #3159ff);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.group_count {
  padding: 2px 8px;
  background: #e9ecef;
  color: #495057;
  border-radius: 4px;
  font-size: 12px;
}

.group_resolution {
  padding: 2px 8px;
  background: #d1ecf1;
  color: #0c5460;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.group_prompt {
  width: 90%;
  font-size: 16px;
  color: #495057;
  line-height: 1.5;
}

/* 视频网格 */
.videos_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 5fr));
  gap: 24px;
  border-radius: 12px;
}

.video_item {
  width: 100%;
  /* height: 430px; */
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.video_wrapper {
  position: relative;
  width: 100%;
  /* height: 100%; */
  overflow: hidden;
  border-radius: 8px;
  background: #000;
  border: 1px solid #e9ecef;
}

.generated_video {
  width: 100%;
  height: 100%;
  display: block;
}

/* 骨架屏样式 */
.skeleton_group {
  opacity: 0.8;
}

.skeleton_video_item {
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton_video_box {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  background: linear-gradient(135deg,
      #e0f7fa 0%,
      #b2ebf2 14%,
      #80deea 28%,
      #4dd0e1 42%,
      #e0f7fa 56%,
      #b2ebf2 70%,
      #80deea 84%,
      #4dd0e1 100%);
  background-size: 400% 400%;
  animation: skeleton-loading 3s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
  }
}
</style>