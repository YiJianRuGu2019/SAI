<template>
  <div class="creation_area">
    <div class="left_panel">
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'text_to_image' }"
          @click="switchTab('text_to_image')">图片生成</button>
        <button class="tab" :class="{ active: activeTab === 'image_edit' }"
          @click="switchTab('image_edit')">图像编辑</button>
      </div>

      <!-- 图片上传区域 -->
      <div class="image_upload_section">
        <div class="upload_container">
          <!-- 已上传的图片预览 -->
          <div v-for="(image, index) in uploadedImages" :key="index" class="uploaded_image_item">
            <img :src="image.preview" alt="上传的图片" />
            <button class="remove_image_btn" @click="removeImage(index)">×</button>
          </div>

          <!-- 上传按钮 -->
          <label v-if="uploadedImages.length < 5" class="upload_btn" for="imageUpload">
            <input type="file" id="imageUpload" accept="image/*" @change="handleImageUpload" style="display: none;" />
            <svg class="upload_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </label>
        </div>
      </div>

      <div class="prompt_section">
        <div class="prompt_input_wrapper">
          <!-- 位置标签容器 - 在输入框内部 -->
          <div class="tagsContainer" v-if="locationTags && locationTags.length > 0">
            <div v-for="(tag, index) in locationTags" :key="index" class="locationTag">
              <span class="tagText">{{ tag.name }}</span>
              <button class="tagRemove" @click="$emit('removeLocationTag', index)">&times;</button>
            </div>
          </div>
          <textarea v-model="prompt" placeholder="描述你想要的图片，点击右下方的锦囊有惊喜哦!" maxlength="500">
          </textarea>
        </div>
        <div class="prompt_info">
          <span>{{ prompt.length }}/500</span>
          <span>提示词锦囊</span>
        </div>
      </div>

      <div class="styles_section">
        <div class="style_item" v-for="(item, index) in imgArr2" :key="index"
          :style="{ backgroundImage: `url(${item.img})` }" @click="selectStyle(item)">
          <span class="style_name">{{ item.name }}</span>
        </div>
      </div>

      <div class="model_selection">
        <label>图片模型</label>
        <div class="model_options">
          <button :class="['model_button', { active: currentModel === 'seedream-4.0' }]"
            @click="currentModel = 'seedream-4.0'">
            Seedream-4.0
          </button>
          <button :class="['model_button', { active: currentModel === 'grok-2-image' }]"
            @click="currentModel = 'grok-2-image'">
            Grok-2-Image(VPN)
          </button>
        </div>
      </div>
      <div class="generation_params">
        <!-- 生成数量 - 两个模型通用 -->
        <div class="param_row">
          <label>生成数量</label>
          <el-select v-model="imageCount" placeholder="选择生成数量" class="count_select">
            <el-option v-for="count in 10" :key="count" :value="count" :label="`${count}张`" />
          </el-select>
        </div>

        <!-- 图片分辨率 - 两个模型通用 -->
        <div class="param_row">
          <label>图片分辨率</label>
          <div class="aspect_ratio_options">
            <button v-for="resolution in resolutions" :key="resolution"
              :class="{ active: selectedResolution === resolution }" @click="selectedResolution = resolution">
              {{ resolution }}
            </button>
          </div>
        </div>
      </div>
      <button class="generate_button" @click="handleGenerateDebounced" :disabled="isButtonDisabled">
        {{ buttonText }}
      </button>
    </div>
    <div class="right_panel">
      <!-- 范例按钮：只在有生成内容时显示 -->
      <button v-if="generationGroups.length > 0 || hasGeneratingTasks" class="example_toggle_button"
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
        <!-- <span>{{ showShowcase ? '' : '' }}</span> -->
      </button>

      <!-- 范例展示区域 - 使用 v-show 保留 DOM -->
      <transition name="fade-slide">
        <div class="showcase_area" v-show="showShowcase || (generationGroups.length === 0 && !hasGeneratingTasks)">
          <div class="showcase_grid">
            <div v-for="(item, index) in imgArr" :key="index" :style="{ backgroundImage: `url(${item.img})` }"
              class="showcase_item">
              <div class="image_box"></div>
              <div class="showcase_info">
                <h4>{{ item.name }}</h4>
                <div class="showcase_description">{{ item.title }}</div>
              </div>
              <!-- 一键同款按钮 -->
              <button class="one_click_generate_btn" @click="selectStyle(item)">一键同款</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 生成结果区域 - 使用 v-show 保留 DOM -->
      <transition name="fade-slide">
        <div class="generated_images" v-show="!showShowcase && (generationGroups.length > 0 || hasGeneratingTasks)">
          <!-- 每个 group 代表一次生成请求 -->
          <div class="generation_group" v-for="group in generationGroups" :key="group.id">
            <div class="group_header">
              <div class="group_info">
                <span class="group_time">{{ group.created_at }}</span>
                <span class="group_model">{{ group.model === 'grok-2-image' ? 'Grok-2-Image' : 'Seedream-4.0' }}</span>
                <span class="group_count">{{ group.images.length }}张</span>
                <span class="group_resolution" v-if="group.resolution">{{ group.resolution }}</span>
              </div>
              <div class="group_prompt">{{ group.prompt }}</div>
            </div>

            <!-- 图片网格：每行最多4张 -->
            <div class="images_grid">
              <div class="image_item" v-for="image in group.images" :key="image.id">
                <div class="image_wrapper">
                  <img :src="image.url" alt="生成的图片" class="generated_image">
                  <div class="image_overlay">
                    <button class="action_button" @click="downloadImage(image.url)" title="下载">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 骨架屏：支持多个并发生成任务 -->
          <div v-for="task in generatingTasks" :key="task.id" class="generation_group skeleton_group">
            <div class="group_header">
              <div class="group_info">
                <span class="group_time">{{ task.time }}</span>
                <span class="group_model">{{ task.model === 'grok-2-image' ? 'Grok-2-Image(VPN)' : 'Seedream-4.0'
                }}</span>
                <span class="group_count">{{ task.count }}张</span>
                <span class="group_resolution" v-if="task.resolution">{{ task.resolution }}</span>
              </div>
              <div class="group_prompt">{{ task.prompt }}</div>
            </div>

            <!-- 骨架屏图片网格 -->
            <div class="images_grid">
              <div class="image_item skeleton_image_item" v-for="n in task.count" :key="`skeleton-${task.id}-${n}`">
                <div class="skeleton_image_box"></div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { generateImage } from '@/api/grokApi.js'
import { generateImageWithSeedream } from '@/api/ppioApi.js'
import { ElMessage } from 'element-plus'
import { useGrokStore } from '@/stores/grok'
import { usePpioStore } from '@/stores/ppioStore'

// Props
const props = defineProps({
  locationTags: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['removeLocationTag'])

// 导入图片
// 这里是锦囊的图片
import j1Img from '@/img/photo/j1.png'
import j2Img from '@/img/photo/j2.png'
import j3Img from '@/img/photo/j3.png'
import j4Img from '@/img/photo/j4.png'
import j5Img from '@/img/photo/j5.png'
// 这里是宣传的图片
import g1Img from '@/img/photo/g1.png'
import g2Img from '@/img/photo/g2.png'
import g3Img from '@/img/photo/g3.png'
import g4Img from '@/img/photo/g4.png'
import g5Img from '@/img/photo/g5.png'
import g6Img from '@/img/photo/g6.png'
import g7Img from '@/img/photo/g7.png'
import g8Img from '@/img/photo/g8.png'
import g9Img from '@/img/photo/g9.png'
import g10Img from '@/img/photo/g10.png'
import g11Img from '@/img/photo/g11.png'
import g12Img from '@/img/photo/g12.png'
import g13Img from '@/img/photo/g13.png'
import g14Img from '@/img/photo/g14.png'
import g15Img from '@/img/photo/g15.png'
// import g3Img from '@/img/photo/g3.png'
// 使用 Pinia store
const grokStore = useGrokStore()
const ppioStore = usePpioStore()

// 当前选择的模型
const currentModel = ref('seedream-4.0') // 'grok-2-image' 或 'seedream-4.0'

const prompt = ref('')
const isGenerating = ref(false)
const activeTab = ref('text_to_image')
const currentGeneratingTime = ref('') // 当前生成的时间

// 防抖相关状态
const isButtonDisabled = ref(false)
const debounceTimer = ref(null)
const remainingSeconds = ref(0)

// 按钮文字计算属性
const buttonText = computed(() => {
  if (remainingSeconds.value > 0) {
    return `请等待 ${remainingSeconds.value}s`
  }
  return '免费生成'
})

// 图片上传相关
const uploadedImages = ref([]) // 存储上传的图片 { file: File, preview: string }

// 修改数据结构：每个元素代表一次生成请求，包含多张图片
const generationGroups = ref([])

// 正在生成的任务列表（支持多个并发生成）
const generatingTasks = ref([]) // { id, prompt, model, count, time, resolution }

// 统一的生成参数
const imageCount = ref(1) // 生成数量
const selectedResolution = ref('2K') // 选中的分辨率

// 分辨率选项 - 两个模型通用
const resolutions = ['1K', '2K', '4K']

// 控制范例展示的显示/隐藏
const showShowcase = ref(false)
let imgArr = ref([
  { name: '风景画作', title: '主体元素：一本打开的书周围开满的鲜花，后面是一片海洋，远处的海波分明清晰，海洋和花的沙滩分明花瓣颜色包含柔和的粉色、淡蓝色和白色，部分花瓣飘落于空中。 环境氛围水面波光鳞鳞，光线明亮且柔和，彩虹光晕，反射出五彩光斑，营造出清新、浪漫、治愈的氛围。 画面效果：8K 高清，超高清，具有逼真的细节，色彩饱和度适中，新清治愈梦幻，光影效果自然。书正中的花是从白转间粉的 ❤ 心形', img: g1Img },
  { name: '人物肖像', title: '主体元素：一簇洋甘菊，花瓣颜色包含柔和的粉色、淡蓝色和白色，部分花瓣飘落于水面。 环境氛围：阳光明媚，光线明亮且柔和，水面波光粼粼，反射出五彩光斑，营造出清新、浪漫、治愈的氛围。 画面效果：8K 高清，超高清，具有逼真的细节，色彩饱和度适中，光影效果自然。', img: g2Img },
  { name: '梦幻童话', title: '一幅宁静阳光草地的照片，草地上高高茂盛的绿色草丛一直延伸到地平线。前景中，一位皮肤白皙、身材纤细的女子背对着镜头站立，身穿白色无袖连衣裙，戴着一顶米色宽边帽。她双手抬起，扶着帽檐。背景是一片清澈的蓝天，地平线上方中央飘着一朵蓬松的白云。草地的尽头是一片深绿色的森林，并与远处平静的蓝色海洋相接。这幅画面捕捉到了一个宁静自然的景象，突出了简洁与安宁的氛围', img: g6Img },
  { name: '复古油画', title: '在光滑的浅蓝色背景上设置了一个充满活力的花卉排列。中心焦点是一簇处于不同开花阶段的大型、逼真的花朵。主要有三种突出的花：一种大的、盛开的白色花，中心为黄色，一种部分开放的蓝色花，以及一种中心为黄色的完全开放的蓝色花朵。这些花周围是较小的白色花朵和蓝色花朵，白色花朵有黄色中心，还有精致的白色多叶藤蔓，优雅地交织在花朵之间。花瓣光滑，有轻微的纹理，给它们一种自然、逼真的外观。背景是坚实的浅蓝色，增强了花朵的鲜艳色彩。', img: g15Img },
  { name: '复古油画', title: '站在开阔的山坡上眺望，脚下是柔软的绿草和零星的小雏菊。视野前方是起伏的、被薄雾笼罩的青色山峦，像一幅水墨画。天空是日出前或日落后的柔和色调，粉紫色与淡橙色交融，令人心旷神怡，豁然开朗。', img: g8Img },
  { name: '科幻未来', title: '深秋枫林被夕阳染成一片炽烈的金红，蜿蜒山径铺满层层落叶。薄雾轻绕林间，光影从枝叶缝隙洒落，跳跃在霜染的枫叶上——那些叶片红得灼眼，比早春花朵更浓艳，仿佛整片山林都在燃烧。远处有古朴亭角隐现，石阶上零星落叶带着露水的光泽。空气清冷而透明，每一片枫叶都脉络清晰，在逆光中呈现半透明的猩红与琥珀色。画面充满诗意与暖意，既有秋的深邃，又带着超越季节的生命力，用古典水墨的渲染手法结合油画质感，营造温暖朦胧的梦幻氛围', img: g4Img },
  { name: '可爱治愈', title: '在星空夜色下，栽满鲜花船上，在发光的星海，稀碎星光，星光一圈圈荡漾，船上有线条亮光，颗粒发光，光泽感，轻柔涂抹营造朦胧氛围，印象派对光影与色彩氛围的捕捉，强调整体意境的诗意表达。淡紫色为主调，构建梦幻基底，搭配浅粉、白色描绘花丛，点缀黄色、橙色花朵丰富层次。。天上挂个巨大的富有纹理月球，光斑变化，星空璀璨，蓝色氛围，梦幻，电影质感，画面自然顺滑，镜头跟随蝴蝶，清透的蓝色调，鲜花的花朵，通往地面的路径，意识流，唯美浪漫，极致想像，高清大片', img: g5Img },
  { name: '赛博朋克', title: '主体：浅米色外墙的建筑，带有白色窗框的双层四格的小窗户，窗台上摆放着色彩鲜艳的橙色花卉盆栽，窗下是开满各色花朵（如粉色、黄色、蓝色等）的花园，花瓣颜色包含柔和的粉色、淡蓝色和白色， 环境氛围：阳光明媚，光线明亮且柔和，彩虹色反射的光芒，反射出五彩光斑，营造出清新、浪漫、治愈的氛围。 画面效果：8K 高清，超高清，具有逼真的细节，色彩饱和度适中，光影效果自然。', img: g14Img },
  { name: '赛博朋克', title: '真实摄影，8k 高清，超清画质，画面主体呈现出一幅由白云、晚霞、光线、树共同构成的绝美风景。天空中，洁白如雪的云朵形态各异，有的如棉花糖般蓬松圆润，有的似薄纱般轻盈飘逸，它们在晚霞的映照下，边缘被染成了绚丽的橙红色、粉红色，仿佛被大自然这位画师精心勾勒。晚霞似火，从天边蔓延开来，色彩丰富且过渡自然，由橙黄渐变为玫红，再到淡紫，如同一幅展开的巨型油画，绚丽夺目。 温暖的光线从云层缝隙中斜射而出，形成一道道金色的光柱，洒落在大地上，给万物都披上了一层梦幻的光辉。光线所及之处，景物的轮廓被清晰勾勒，明暗对比强烈，营造出极具立体感的视觉效果。 画面中的树，身姿挺拔，树叶在晚霞与光线的映衬下，呈现出金黄与翠绿交织的色彩。粗壮的树干纹理清晰，树皮上岁月的痕迹诉说着古老的故事。树枝向四周伸展，与天空中的云朵、晚霞相互呼应，为整个画面增添了一份生机与活力。 场景氛围营造出一种宁静而壮丽的美感。在这片美景之下，仿佛时间都静止了，让人不禁沉醉于大自然的鬼斧神工之中。微风轻轻拂过，树叶沙沙作响，与远处传来的鸟鸣声交织在一起，构成了一曲美妙的自然乐章。 构图采用三分构图法，将天空与大地以大约 2:1 的比例划分画面。天空部分着重展现晚霞与白云的绚烂，占据画面上方三分之二的空间；下方三分之一则突出树木与被光线照亮的大地，通过这种构图方式，增强画面的层次感和稳定性，使观者的视线自然地在天空与大地之间流动，全面感受这一美景的魅力。 艺术风格为写实风格，细腻地描绘每一个元素的细节，从云朵的蓬松质感、晚霞的色彩渐变，到光线的强弱变化、树木的枝叶脉络，都力求真实还原大自然的壮美景色。通过精准的光影捕捉和色彩调配，让整个画面充满真实感和感染力，仿佛能让观者身临其境，亲身感受这如诗如画的美景。 图像质量达到超清级别，每一个细节都清晰入微。从天空中云朵的微小褶皱、光线中细微的尘埃，到树叶上的脉络纹理、树干上的每一道裂纹，都栩栩如生，分毫毕现。画面中的色彩鲜艳而不失真实，光影效果自然而逼真，为观者带来一场极致的视觉盛宴，仿佛将这绝美景色毫无保留地呈现在眼前。镜头采用广角镜头，以收纳广袤的天空、远处的树木以及整个美景，让观者能够全方位地领略这大自然的壮丽画卷。超清写实风格', img: g7Img },
  { name: '古风意境', title: '竖版特写视角，一位少女侧身站立于玫瑰花丛中。她有着粉蓝渐变的长卷发，发丝蓬松飘逸，发间点缀着细碎的闪粉和彩色羽毛装饰；眼眸为浅蓝色，眼尾处有粉色亮片点缀，脸颊泛着自然红晕，唇瓣呈淡粉色；身着由粉、橙、蓝三色渐变羽毛编织而成的露背长裙，羽毛轻盈蓬松，边缘泛着七彩光泽；背景是茂密的绿色植物和盛开的红色玫瑰花，阳光透过枝叶洒下金色光斑，空气中漂浮着闪烁的光点，整体光影温暖柔和，营造出梦幻、浪漫的氛围，高分辨率，细节精致，羽毛纹理和闪粉效果清晰可见。', img: g3Img },
  { name: '治愈日常', title: '我做了很短的梦，我梦见……那束光还在我手里。极简艺术，淡彩，油画，厚涂，意识流，朦胧，迷幻，孤独世界，弥散渐变，层次感，梦幻效果，明显的磨砂颗粒质感，颜色鲜明，晕染，弥散渐变，高级感，优雅，浪漫主义，故事感，设计感，画面上方有极细无衬线字体“October 25”、“PG-13”、“Angel.AI”一字型排开，画面下方有极细无衬线字体“What we are, What we become.”，细闪珠光感，光影层次感，电影质感，梦幻光影，肌理反光，折射光影，光影弥散，抽象表达，艺术氛围，极简艺术海报', img: g9Img },
  { name: '史诗奇幻', title: '8K 超高清画质，秋日骑行幻境，金黄银杏叶构建的圆形隧道，淡绿色树干与绿叶衬托，光影交错的叶片纹理，飘落的动态叶片，广袤金黄花田波浪延展，远处点缀黄绿树木，色彩浓郁饱满，水墨江南意境，荧光橙红黑金花纹，古代女子骑行姿态，右下角签名：wangyu，细腻笔触与水墨渲染融合，沉浸式视觉体验。', img: g10Img },
  { name: '科幻未来', title: '由颜料雕刻的立体油画，流体油画，浮雕壁画，童趣绘本，梵高风格，星空，太阳，云朵，大面积米白色，旷野之境，山丘上的藏式宫殿，一条开满鲜花的铁路，道路旁开满彩色的花朵，精细的花朵刻画，花朵超级精细，一辆蒸汽火车，炫彩光影，丁达尔光效，清晰的笔触，复杂的画面，清晰的雕刻线条，极致的细节，超高清，8K', img: g11Img },
  { name: '可爱治愈', title: '帮我生成图片：8K 摄影写真，获奖作品，国家地理级画质，超高清细节，富士胶片色彩科学。 清晨日出时分，低角度广角视野，营造电影般开阔空间感。天空呈现精细的渐变色阶：地平线处为浓郁的靛蓝色，向上无缝过渡到暖橙色、玫红色，最终融于太阳周边的金黄色调。太阳位于画面右侧黄金分割点略偏上位置，正从远山轮廓后缓缓升起，光芒具有可见的射线质感，在镜头前形成极细微的星芒效果。前景构图：画面左侧，一棵形态优美的孤树或一小丛静谧的树木，以剪影与半剪影状态呈现，树干纹理依稀可辨。树木下方是如镜面般平静的水域，完美倒映着天空绚烂的朝霞与太阳，形成对称与不对称相结合的构图美感。水面泛着极细微的粼光，点缀着几缕晨雾。光影与氛围：魔幻时刻的柔和暖光，暖色调主导，光影过渡如丝绸般顺滑。整体画面色彩浓郁而自然，具有油画般的厚重感与摄影的极致清晰。云层被染成絮状的粉金色，层次丰富。远处山峦笼罩在淡紫色的薄雾中，增强了画面的纵深感。空气中弥漫着晨曦的朦胧光晕，营造出充满希望、壮丽而宁静的史诗级氛围，带有一丝超现实主义的静谧感。比例 9:16。', img: g12Img },
  { name: '梦幻童话', title: '插画，强烈设计感，几何抽象，插画师 Malika Favre 风格。“寂寞空庭春欲晚，梨花满地不开门”诗意。极简构图，大量留白，层次感。细腻渲染。浪漫主义，梦幻的氛围，层层叠叠的构图，金箔。俯瞰超广角全景视角。中式庭院，虚掩的朱漆木门，门缝微露满地梨花瓣。暮色庭院，数株梨树，枝条疏落，花飞如雨。纱窗可隐约勾勒一女子背影，衣衫素雅，与梨花色调呼应。色彩：主调为月白、赭石、花青。色彩柔和', img: g13Img },
])
let imgArr2 = ref([
  { name: '虚幻', title: '在一片广阔的绿色草地上，一位身穿黑衣的人静静地坐在一张椅子上，面朝远方，姿态沉稳。天空湛蓝，阳光柔和，背景干净简洁。人物周围环绕着多位模糊的幽影人形，呈半透明状态，仿佛在缓慢行走或游动，带有动态模糊效果，营造出超现实的氛围。这些虚幻身影与静止的主角形成鲜明对比，象征记忆、思绪或精神世界的流动。整体画面充满孤独、沉思与梦境感，适合表现心理探索、时间流动或人与自我之间的关系', img: j1Img },
  { name: '云海', title: '一位身穿浅蓝色连衣裙的人行走在高空中的一根悬挂电缆上，脚下是广阔的云海，云朵洁白蓬松，如同柔软的地面。此人手提一个橙色行李箱，神态从容，仿佛在进行一场空中的旅行。周围有多只海鸥在飞翔，增强画面的动感与自由感。背景是晴朗的天空，几朵细长的云漂浮其间，远方无边的天际线延伸出无限空间感。画面风格为超现实主义，色调清新，构图浪漫，主题围绕“自由”、“冒险”、“漂浮”与“幻想”展开', img: j2Img },
  { name: '天空', title: '在一片广阔而平静的盐湖或镜面水面上，一节蓝色的列车车厢静静地停放，仿佛漂浮于天地之间。天空湛蓝，布满洁白蓬松的积云，云层与列车在水面中形成几乎完美的倒影，画面上下对称，营造出梦境般的空间感。列车为现代风格，无乘客，孤立于自然之中，是画面中唯一的人造元素。整体色调清澈明亮，构图简洁，画面充满宁静、空灵与超现实氛围，象征时间暂停、孤独旅程或人与自然的静默对话。', img: j3Img },
  { name: '梦幻', title: '一个梦幻唯美的场景，画面是一只手的剪影，手中握着一朵花，背景是深蓝色的夜空，点缀着星星。花朵的位置与一朵粉色云彩完美重合，使云彩看起来像是花的花瓣，营造出超现实的视觉效果。画面充满艺术感与想象力，表达人与自然、梦境之间的诗意连接。', img: j4Img },
]
)
// 骨架屏数量：使用统一的生成数量参数
const skeletonCount = computed(() => {
  return imageCount.value
})

// 计算属性：判断是否有正在生成的任务
const hasGeneratingTasks = computed(() => {
  return generatingTasks.value.length > 0
})

// 滚动到底部
const scrollToBottom = () => {
  // 使用 nextTick 确保 DOM 已更新，然后延迟滚动
  setTimeout(() => {
    // 查找 generated_images 容器
    const generatedImages = document.querySelector('.generated_images')
    if (generatedImages) {
      generatedImages.scrollTo({
        top: generatedImages.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      // 如果 generated_images 不存在，尝试滚动 right_panel
      const rightPanel = document.querySelector('.right_panel')
      if (rightPanel) {
        rightPanel.scrollTo({
          top: rightPanel.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, 200) // 增加延迟时间，确保骨架屏已渲染
}

const switchTab = (tab) => {
  activeTab.value = tab
}

// 切换范例展示
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

// 选择风格，将 title 填入输入框（不自动发送）
const selectStyle = async (item) => {
  prompt.value = item.title
  // 等待 Vue 响应式更新完成
  await nextTick()
  ElMessage.success('提示词已填充，请点击生成按钮')
}

// 设置提示词并生成（供父组件调用）
const setPromptAndGenerate = async (promptText) => {
  prompt.value = promptText
  // 等待 Vue 响应式更新完成
  await nextTick()
  // 不自动生成，只填充提示词
  ElMessage.success('提示词已填充，请点击生成按钮')
}

// 暴露方法给父组件
defineExpose({
  setPromptAndGenerate
})

// 处理图片上传
const handleImageUpload = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const file = files[0]

  // 检查是否已达到最大数量
  if (uploadedImages.value.length >= 5) {
    ElMessage.warning('最多只能上传5张图片')
    return
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  // 检查文件大小（限制为10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过10MB')
    return
  }

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImages.value.push({
      file: file,
      preview: e.target.result
    })
    ElMessage.success('图片上传成功')
  }
  reader.readAsDataURL(file)

  // 清空input，允许重复上传同一文件
  event.target.value = ''
}

// 删除已上传的图片
const removeImage = (index) => {
  uploadedImages.value.splice(index, 1)
  ElMessage.info('图片已删除')
}

// 防抖包装函数
const handleGenerateDebounced = () => {
  if (isButtonDisabled.value) {
    return
  }

  // 执行生成
  handleGenerate()

  // 禁用按钮并开始倒计时
  isButtonDisabled.value = true
  remainingSeconds.value = 5

  // 清除之前的定时器
  if (debounceTimer.value) {
    clearInterval(debounceTimer.value)
  }

  // 开始倒计时
  debounceTimer.value = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      clearInterval(debounceTimer.value)
      debounceTimer.value = null
      isButtonDisabled.value = false
    }
  }, 1000)
}

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning('请输入提示词')
    return
  }

  // 如果当前显示的是范例区域，切换到生成结果视图
  const wasShowingShowcase = showShowcase.value
  if (showShowcase.value) {
    showShowcase.value = false
  }

  // 记录当前生成时间
  const now = new Date()
  const generatingTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // 构建完整的提示词：位置标签 + 用户输入
  let fullPrompt = prompt.value
  if (props.locationTags && props.locationTags.length > 0) {
    const locationText = props.locationTags.map(tag => tag.name).join('、')
    fullPrompt = `位置：${locationText}，${prompt.value}`
  }

  // 创建新的生成任务
  const taskId = Date.now()
  const newTask = {
    id: taskId,
    prompt: fullPrompt,
    model: currentModel.value,
    count: imageCount.value,
    time: generatingTime,
    resolution: selectedResolution.value
  }

  // 添加到生成任务列表
  generatingTasks.value.push(newTask)
  // isGenerating.value = true // 隐藏原有禁用逻辑，改用防抖

  // 滚动到底部显示骨架屏
  // 如果是从范例页切换过来，需要等待过渡动画完成后再滚动
  if (wasShowingShowcase) {
    setTimeout(() => {
      scrollToBottom()
    }, 450) // 等待过渡动画完成（0.4s + 50ms缓冲）
  } else {
    scrollToBottom()
  }

  try {
    let result

    // 准备上传的图片（转为 Base64 数组）
    const imageBase64Array = uploadedImages.value.map(img => img.preview)

    // 根据选择的模型调用不同的 API
    if (currentModel.value === 'grok-2-image') {
      const params = {
        model: grokStore.currentModel,
        prompt: fullPrompt,
        n: imageCount.value
      }
      ElMessage.success(`正在使用 Grok 生成 ${imageCount.value} 张图片...`)
      result = await generateImage(params)
    } else {
      // Seedream API
      const params = {
        prompt: fullPrompt,
        max_images: imageCount.value,
        size: selectedResolution.value // 使用分辨率参数（1K/2K/4K）
      }

      // 如果有上传的图片，添加到参数中
      if (imageBase64Array.length > 0) {
        params.images = imageBase64Array
      }

      ElMessage.success(`正在使用 Seedream 生成 ${imageCount.value} 张图片...`)
      result = await generateImageWithSeedream(params)
    }

    // 请求已成功发送，解除按钮禁用状态，允许用户继续提交新任务
    // isGenerating.value = false // 隐藏原有禁用逻辑，改用防抖

    // 处理返回结果 - 兼容不同 API 的返回格式
    let imageList = []

    if (currentModel.value === 'grok-2-image') {
      // Grok 返回格式: { data: [{ url: "...", revised_prompt: "..." }] }
      if (result && result.data && result.data.length > 0) {
        imageList = result.data.map((imageData, index) => ({
          id: Date.now() + index,
          url: imageData.url,
          revisedPrompt: imageData.revised_prompt
        }))
      }
    } else {
      // Seedream 返回格式: { images: ["url1", "url2", ...] }
      if (result && result.images && result.images.length > 0) {
        imageList = result.images.map((url, index) => ({
          id: Date.now() + index,
          url: url
        }))
      }
    }

    if (imageList.length > 0) {
      // 将同一次请求的所有图片作为一组
      const newGroup = {
        id: Date.now(),
        prompt: prompt.value,
        type: activeTab.value,
        model: currentModel.value,
        resolution: selectedResolution.value, // 使用分辨率参数
        created_at: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        images: imageList
      }

      // 将新组添加到末尾（最新的在最下面）
      generationGroups.value.push(newGroup)

      // 添加到对应模型的历史记录
      if (currentModel.value === 'grok-2-image') {
        grokStore.addHistory({
          id: Date.now(),
          prompt: prompt.value,
          imageCount: imageList.length,
          images: result.data,
          created_at: new Date().toLocaleString()
        })
      } else {
        ppioStore.addHistory({
          id: Date.now(),
          prompt: prompt.value,
          imageCount: imageList.length,
          images: result.images,
          created_at: new Date().toLocaleString()
        })
      }

      // 生成完成后滚动到底部，显示新生成的图片
      // 使用 nextTick 和延迟确保 DOM 完全更新后再滚动
      nextTick(() => {
        setTimeout(() => {
          scrollToBottom()
        }, 200) // 延迟 200ms 确保图片已渲染
      })

      ElMessage.success(`成功生成 ${imageList.length} 张图片！`)
    } else {
      ElMessage.error('图片生成失败，请重试')
    }
  } catch (error) {
    console.error('生成图片时出错:', error)
    ElMessage.error('生成失败: ' + error.message)
  } finally {
    // 从生成任务列表中移除该任务
    const taskIndex = generatingTasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      generatingTasks.value.splice(taskIndex, 1)
    }

    // 如果没有其他生成任务了，设置 isGenerating 为 false
    // if (generatingTasks.value.length === 0) {
    //   isGenerating.value = false // 隐藏原有禁用逻辑，改用防抖
    // }
  }
}

// 下载图片功能 - 使用多种方案尝试下载
const downloadImage = async (imageUrl) => {
  try {
    ElMessage.info('正在准备下载...')

    // 方案1: 尝试使用 Image + Canvas 转换（绕过部分 CORS 限制）
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        // 创建 canvas
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        // 转换为 Blob 并下载
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `ai_image_${Date.now()}.jpg`

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            window.URL.revokeObjectURL(blobUrl)
            ElMessage.success('图片下载成功！')
          }
        }, 'image/jpeg', 0.95)
      } catch (canvasError) {
        console.error('Canvas 转换失败:', canvasError)
        fallbackDownload(imageUrl)
      }
    }

    img.onerror = () => {
      console.warn('图片加载失败，使用备用方案')
      fallbackDownload(imageUrl)
    }

    img.src = imageUrl
  } catch (error) {
    console.error('下载失败:', error)
    fallbackDownload(imageUrl)
  }
}

// 备用下载方案 - 在新窗口打开
const fallbackDownload = (imageUrl) => {
  const link = document.createElement('a')
  link.href = imageUrl
  link.download = `ai_image_${Date.now()}.jpg`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.warning('图片已在新窗口打开，请右键选择"图片另存为"')
}
</script>

<style scoped>
.creation_area {
  background: #fff;
  border-radius: 8px;
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
  gap: 10px;
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

/* 图片上传区域 */
.image_upload_section {
  width: 100%;
}

.upload_container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.uploaded_image_item {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: #f9f9f9;
}

.uploaded_image_item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove_image_btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: all 0.2s;
  padding: 0;
}

.remove_image_btn:hover {
  background: #ff7875;
  transform: scale(1.1);
}

.upload_btn {
  width: 50px;
  height: 50px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.3s;
}

.upload_btn:hover {
  border-color: #40a9ff;
  background: #e6f7ff;
}

.upload_icon {
  width: 16px;
  height: 16px;
  color: #8c8c8c;
}

.upload_btn:hover .upload_icon {
  color: #40a9ff;
}

/* 输入框包装器 */
.prompt_input_wrapper {
  position: relative;
  width: 100%;
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
  height: 180px;
  padding: 0;
  border: none;
  resize: none;
  box-sizing: border-box;
  outline: none;
}

.prompt_info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.styles_section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.style_item {
  height: 80px;
  background-color: #eee;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.style_item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.style_name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.model_selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.model_selection label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.model_options {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.model_button {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.model_button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.model_button.active {
  border-color: #1890ff;
  background: linear-gradient(to right, #6a82fb, #4e6ef2);
  color: white;
}

.generation_params {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
}

.param_row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param_row label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.count_select {
  width: 100%;
}

.count_select :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e0e0e0 inset;
  transition: all 0.3s ease;
}

.count_select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #1890ff inset;
}

.count_select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1890ff inset;
}

.aspect_ratio_options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.aspect_ratio_options button {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
}

.aspect_ratio_options button.active {
  border-color: #1890ff;
  color: #1890ff;
}

.generate_button {
  width: 100%;
  padding: 12px;
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;
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
  top: 67px;
  left: -73px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 13px;
  background: linear-gradient(135deg, #3b51bc 0%, #87e3ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
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

.showcase_area {
  height: 100%;
  background: linear-gradient(135deg,
      #fee7f6,
      #cfe1ff,
      #c2e9fb);
  background-size: 400% 400%;
  animation: showcaseGradient 20s ease infinite, showcaseFadeIn 1s ease;
  border-radius: 12px;
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


.showcase_grid {
  display: grid;
  grid-template-columns: repeat(5, 0fr);
  gap: 20px;
}

.showcase_item {
  width: 290px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  padding: 12px 12px;
  border-radius: 12px;
  text-align: left;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.showcase_item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 一键同款按钮 */
.one_click_generate_btn {
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
}

.showcase_item:hover .one_click_generate_btn {
  transform: translate(-50%, 0);
}

.one_click_generate_btn:hover {
  background: rgba(253, 254, 255, 0.203);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@keyframes gradientShift {
  0% {
    background-position: 100% 100%;
  }

  50% {
    background-position: 0% 0%;
  }

  100% {
    background-position: 100% 100%;
  }
}

@keyframes showcaseGradient {
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

.image_box {
  width: 100%;
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 8px;
}

.showcase_info {
  width: 100%;
}

.showcase_info h4 {
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #fff;
}

.showcase_info p {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
  line-height: 1.4;
  color: #fff;
}

.showcase_description {
  height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  font-size: 14px;
  line-height: 1.5;
  color: #fff;
  opacity: 0.9;
  word-break: break-word;
}

.generated_images {
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
.generated_images::-webkit-scrollbar {
  width: 6px;
}

.generated_images::-webkit-scrollbar-track {
  background: transparent;
}

.generated_images::-webkit-scrollbar-thumb {
  background: transparent;
}

.generated_images::-webkit-scrollbar-thumb:hover {
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
  background: linear-gradient(to right, #6a82fb, #4e6ef2);
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

.images_grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  border-radius: 12px;
}

/* 确保最多4列 */
@media (min-width: 1200px) {
  .images_grid {
    width: 80%;
    grid-template-columns: repeat(4, 1fr);
  }
}

.image_item {
  width: 310px;
  position: relative;
  /* aspect-ratio: 1; */
  overflow: hidden;
  border-radius: 8px;
}

.image_wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e9ecef;
}

.generated_image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.image_wrapper:hover .generated_image {
  transform: scale(1.05);
}

/* 悬浮操作层 */
.image_overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image_wrapper:hover .image_overlay {
  opacity: 1;
}

.action_button {
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action_button:hover {
  background: white;
  transform: scale(1.1);
}

.action_button svg {
  color: #4e6ef2;
}

/* 骨架屏样式 */
.skeleton_group {
  pointer-events: none;
}

.skeleton_image_item {
  pointer-events: none;
}

.skeleton_image_box {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  /* 斜向柔和渐变（135deg = 左上 → 右下） */
  background: linear-gradient(135deg,
      #e0f7fa 0%,
      #b2ebf2 14%,
      #80deea 28%,
      #4dd0e1 42%,
      #e0f7fa 56%,
      #b2ebf2 70%,
      #80deea 84%,
      #4dd0e1 100%);
  /* 让渐变宽度更大，流动更顺滑 */
  background-size: 400% 400%;
  animation: skeleton-loading 7s ease-in-out infinite;
}

/* 斜向流动关键帧 */
@keyframes skeleton-loading {
  0% {
    background-position: 0% 0%;
  }

  100% {
    background-position: 100% 100%;
  }
}
</style>