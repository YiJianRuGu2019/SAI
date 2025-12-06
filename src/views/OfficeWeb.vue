<template>
  <div class="officeContainer">

    <!-- 顶部导航栏 -->
    <Header :is-logged-in="isLoggedIn" :default-active-nav="activeNav" :editor-loading="editorLoading"
      @nav-change="handleNavChange" @settings="handleSettings" @notifications="handleNotifications" @login="handleLogin"
      @locationSelected="handleLocationSelected" />

    <!-- 头部组件 -->
    <header class="appHeader" tabindex="0" @keydown.space="spaceBtn">
      <div class="leftSection">
        <el-button class="newDocBtn" type="primary" plain @click="createNewDocument">
          <el-icon>
            <Plus />
          </el-icon> 新建文档
        </el-button>
      </div>
      <div class="rightSection">
        <!-- 文档保存按钮 重新部署-->
        <el-button class="saveBtn" type="primary" plain @click="saveDocument" :loading="saving"
          :disabled="aiLoading || !!streamingAIContent">
          <el-icon v-if="!saving">
            <Check />
          </el-icon>
          {{ saving ? '保存中...' : aiLoading || streamingAIContent ? 'AI输出中...' : '下载文档' }}
        </el-button>

        <!-- 上传文档按钮 -->
        <!-- <el-button type="success" class="docsBtn" plain @click="uploadDocument">
          <el-icon>
            <Upload />
          </el-icon> 上传文档
        </el-button> -->

        <!-- AI 助手按钮 -->
        <el-button class="aiBtn" type="success" plain @click="toggleAIAssistant">
          <el-icon>
            <ChatDotRound />
          </el-icon> AI 助手
        </el-button>
      </div>
    </header>

    <!-- 编辑器主容器 -->
    <div class="editorContainer">
      <!-- 编辑器加载遮罩 -->
      <div class="editorLoadingMask" v-if="editorLoading">
        <div class="loadingContent">
          <div class="loadingSpinner"></div>
          <div class="loadingText">Word编辑器加载中，大约10秒...</div>
        </div>
      </div>

      <div class="editorContent">
        <!-- CKEditor 组件区域 -->
        <div class="editorMain">
          <!-- 文档编辑区域 -->
          <div id="editor"></div>
          <div class="aiShortcutTip" v-if="!showAIAssistant">
            <span>按下 <kbd>Space</kbd> 键或点击 <strong>AI 助手</strong> 按钮获取写作帮助</span>
          </div>

          <!-- AI助手悬浮窗 -->
          <transition name="ai-panel-fade">
            <div class="aiAssistantPanel" v-if="showAIAssistant" @click.self="showAIAssistant = false">
              <div class="aiAssistantBody" @click.stop>
                <!-- 添加顶部问题显示区域 -->
                <div class="aiQueryHeader">
                  <div class="aiQueryPrefix">
                    <svg t="1745833179957" class="icon" viewBox="0 0 1024 1024" version="1.1"
                      xmlns="http://www.w3.org/2000/svg" p-id="1430" width="20" height="20">
                      <path
                        d="M500.321878 762.187829 227.735491 480.657306l69.88142-56.876638 157.62533 125.524494c64.58701-78.003114 207.999576-232.775378 405.821253-355.858328l16.654308 38.988766C696.139114 401.857533 547.45792 640.31286 500.321878 762.187829L500.321878 762.187829 500.321878 762.187829zM848.675494 432.107823c5.936975 25.469931 9.098231 52.019131 9.098231 79.288043 0 191.85912-155.517759 347.376878-347.376878 347.376878S163.019968 703.254985 163.019968 511.395866 318.537528 164.018987 510.396847 164.018987c46.698938 0 91.23914 9.252327 131.924155 25.9582l0-40.916259c-42.175605-15.394962-86.458781-23.182482-131.924155-23.182482-52.019131 0-102.52189 10.203282-150.069053 30.301655-45.902278 19.430026-87.126928 47.21299-122.543116 82.603595-35.390405 35.390605-63.173368 76.640838-82.603595 122.543116-20.098373 47.547163-30.301655 98.049922-30.301655 150.069053s10.203282 102.52189 30.301655 150.069053c19.430026 45.902278 47.21299 87.15271 82.603595 122.543116 35.416188 35.390605 76.640838 63.173568 122.543116 82.603595 47.547163 20.098373 98.049922 30.301655 150.069053 30.301655s102.52189-10.203282 150.069053-30.301655c45.902278-19.430026 87.126928-47.21299 122.543116-82.603595 35.390605-35.390405 63.173568-76.640838 82.603595-122.543116 20.098373-47.547163 30.301655-98.049922 30.301655-150.069053 0-26.909156-2.749936-53.40699-8.173059-79.288043L848.675494 432.107823 848.675494 432.107823zM848.675494 432.107823c5.936975 25.469931 9.098231 52.019131 9.098231 79.288043 0 191.85912-155.517759 347.376878-347.376878 347.376878S163.019968 703.254985 163.019968 511.395866 318.537528 164.018987 510.396847 164.018987c46.698938 0 91.23914 9.252327 131.924155 25.9582l0-40.916259c-42.175605-15.394962-86.458781-23.182482-131.924155-23.182482-52.019131 0-102.52189 10.203282-150.069053 30.301655-45.902278 19.430026-87.126928 47.21299-122.543116 82.603595-35.390405 35.390605-63.173368 76.640838-82.603595 122.543116-20.098373 47.547163-30.301655 98.049922-30.301655 150.069053s10.203282 102.52189 30.301655 150.069053c19.430026 45.902278 47.21299 87.15271 82.603595 122.543116 35.416188 35.390605 76.640838 63.173568 122.543116 82.603595 47.547163 20.098373 98.049922 30.301655 150.069053 30.301655s102.52189-10.203282 150.069053-30.301655c45.902278-19.430026 87.126928-47.21299 122.543116-82.603595 35.390605-35.390405 63.173568-76.640838 82.603595-122.543116 20.098373-47.547163 30.301655-98.049922 30.301655-150.069053 0-26.909156-2.749936-53.40699-8.173059-79.288043L848.675494 432.107823 848.675494 432.107823z"
                        fill="#272636" p-id="1431"></path>
                    </svg>
                    <span v-if="aiMessages.length > 0">{{ aiMessages[aiMessages.length - 1].role === 'user' ?
                      aiMessages[aiMessages.length - 1].content : currentQueryTitle }}</span>
                    <span v-else>{{ currentQueryTitle || "文档名称" }}</span>
                  </div>

                  <!-- 添加右上角操作按钮组 -->
                  <div class="aiQueryActions">
                    <button class="aiActionBtn" title="复制内容" @click="copyAIContent">
                      <el-icon>
                        <DocumentCopy />
                      </el-icon>
                    </button>
                    <button class="aiActionBtn" title="关闭面板" @click="showAIAssistant = false">
                      <el-icon>
                        <Close />
                      </el-icon>
                    </button>
                  </div>
                </div>

                <!-- 中间内容显示区域 -->
                <div class="aiAssistantMessages" ref="aiMessagesContainer">
                  <div class="aiMessagesInner">
                    <!-- 流式响应内容 -->
                    <!-- <div v-if="streamingAIContent" class="aiResponseContent">
                    <div v-html="streamingAIContent"></div>
                    <div class="messageActions">
                      <el-button type="text" size="small" @click="copyAIContent" title="复制内容">
                        <el-icon>
                          <DocumentCopy />
                        </el-icon> 复制内容
                      </el-button>
                    </div>
                  </div> -->

                    <!-- 加载中状态 -->
                    <div v-if="aiLoading" class="typingContainer">
                      <div class="loader"></div>
                    </div>

                    <!-- 助手回复内容，显示最后一条回复 -->
                    <div v-else-if="aiMessages.length > 0 && aiMessages[aiMessages.length - 1].role === 'assistant'"
                      class="aiResponseContent">
                      <div v-html="aiMessages[aiMessages.length - 1].content"></div>
                      <div class="messageActions">
                        <el-button type="text" size="small" @click="copyAIContent" title="复制内容">
                          <el-icon>
                            <DocumentCopy />
                          </el-icon> 复制内容
                        </el-button>
                      </div>
                    </div>

                    <!-- 初始状态提示 -->
                    <div v-else class="aiResponseContent">
                      <div style="font-size: 19px; text-align: center; margin-top: 20px;">请输入您的文档大纲</div>
                    </div>
                  </div>
                </div>

                <!-- 底部控制区域 -->
                <div class="aiAssistantFooter">
                  <!-- 生成中状态栏 -->
                  <div v-if="aiLoading" class="aiGeneratingBar">
                    <div class="aiGeneratingContent">
                      <div class="aiAvatar">AI</div>
                      <div class="aiGeneratingText">AI 正在生成中...</div>
                    </div>
                    <button class="aiStopBtn" @click="stopAIGeneration">
                      停止生成 <span class="escKey">ESC</span>
                    </button>
                  </div>

                  <!-- 常规输入框 -->
                  <div v-else class="aiInputWrapper">
                    <div class="aiSimpleInput">
                      <div class="aiInputLeft">
                        <div class="aiModelSelector">
                          <span>自由输入</span>
                          <el-icon class="aiDropdownIcon">
                            <ArrowDown />
                          </el-icon>
                        </div>
                      </div>
                      <!-- 位置标签和输入框容器 -->
                      <div class="aiInputContainer">
                        <!-- 位置标签 -->
                        <div class="tagsContainer" v-if="officeLocationTags && officeLocationTags.length > 0">
                          <div v-for="(tag, index) in officeLocationTags" :key="index" class="locationTag">
                            <span class="tagText">{{ tag.name }}</span>
                            <button class="tagRemove" @click="removeOfficeLocationTag(index)">&times;</button>
                          </div>
                        </div>
                        <el-input v-model="aiInputMessage" type="text" class="aiTextInput" placeholder="请告诉我您想要写什么"
                          @keydown.space="spaceBtn" @input="updateCurrentQueryTitle" @keyup.enter="sendToAI" />
                      </div>
                      <button class="aiSendButton" @click="sendToAI" :disabled="!aiInputMessage.trim() || aiLoading">
                        <el-icon>
                          <Position />
                        </el-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import AuthStore from '@/stores/auth';
import {
  processContentForEditor,
  focusAIInput,
  scrollAIMessagesToBottom,
  sendToAI as sendMessageToAI,
  handleAIError,
  insertToEditor,
  initEditorForAIResponse,
  insertProcessedContent,
  copyToClipboard,
  formatDate,
  loadCKEditorScript
} from '@/utils/officeWeb';

// 文档接口定义 - 简化
interface DocItem {
  title: string;
  content: string;
}

// 定义状态变量
const documentTitle = ref<string>('');
const showLoginModal = ref<boolean>(false);
const isLoggedIn = ref<boolean>(AuthStore.state.isLoggedIn);
const userInfo = ref<{ username: string } | null>(AuthStore.state.userInfo);
const saving = ref<boolean>(false);
const lastSaved = ref<number | null>(null);
const showAIAssistant = ref<boolean>(false);
const aiMessages = ref<{ role: string; content: string }[]>([]);
const aiInputMessage = ref<string>('');
const aiLoading = ref<boolean>(false);
const streamingAIContent = ref<string>('');
const currentQueryTitle = ref<string>('');
const editorLoading = ref<boolean>(true); // 编辑器加载状态
const activeNav = ref('office')

// officeWeb 独立的位置标签
interface LocationTag {
  name: string;
  address?: string;
  coords?: { lat: number; lng: number } | null;
}
const officeLocationTags = ref<LocationTag[]>([])

// Header 组件事件处理方法
const handleNavChange = (nav: string) => {
  console.log('导航切换:', nav)
}

const handleSettings = () => {
  console.log('打开设置')
}

const handleNotifications = () => {
  console.log('打开通知')
}

const handleLogin = () => {
  showLoginModal.value = true
}

// 处理位置选择
const handleLocationSelected = (location: LocationTag) => {
  const exists = officeLocationTags.value.some(tag => tag.name === location.name)
  if (!exists) {
    officeLocationTags.value.push(location)
  }
  console.log('officeWeb 添加位置标签:', location)

  // 如果 AI 助手弹窗未打开，则自动打开
  if (!showAIAssistant.value) {
    showAIAssistant.value = true
  }
}

// 删除位置标签
const removeOfficeLocationTag = (index: number) => {
  officeLocationTags.value.splice(index, 1)
}

let editor: any = null;
let autoSaveInterval: any = null;
const spaceBtn = (event: Event | KeyboardEvent): void => {
  // 阻止默认行为（防止在输入框中插入空格）
  event.preventDefault();

  // 打开AI助手面板
  showAIAssistant.value = true;

  console.log('Space key pressed, AI assistant opened');
};

// 检查用户登录状态
const checkAuthStatus = () => {
  if (AuthStore.checkAuth()) {
    isLoggedIn.value = true;
    userInfo.value = AuthStore.state.userInfo;
  }
};

// 处理登录成功
const handleLoginSuccess = (data: { username: string }) => {
  isLoggedIn.value = true;
  userInfo.value = data;
  AuthStore.login(data, 'mock-token-' + new Date().getTime());
  // 登录不再需要加载文档
};

// 处理登出
const logout = () => {
  AuthStore.logout();
  isLoggedIn.value = false;
  userInfo.value = null;
};

// 创建新文档
const createNewDocument = () => {
  if (editor) {
    editor.setData('');
    documentTitle.value = '无标题文档';
    lastSaved.value = null;
    ElMessage.success('已创建新文档');
  }
};

// 通用下载链接创建函数
const createDownloadLink = (blob: Blob, filename: string) => {
  // 创建下载链接
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;

  // 模拟点击下载
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // 释放URL对象
  setTimeout(() => URL.revokeObjectURL(downloadLink.href), 100);
};

// 改进DOCX下载函数，添加文档名参数
const downloadAsDocx = (content: string, docName: string) => {
  ElMessage.info('正在生成Word文档...');

  // 创建更符合Word格式要求的HTML
  const htmlWithStyles = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${docName}</title>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <style>
        @page {
          size: 21.0cm 29.7cm;
          margin: 2cm;
        }
        body {
          font-family: "Times New Roman", "SimSun", serif;
          font-size: 12pt;
          line-height: 1.5;
        }
        h1 { font-size: 18pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
        h2 { font-size: 16pt; font-weight: bold; margin-top: 10pt; margin-bottom: 6pt; }
        h3 { font-size: 14pt; font-weight: bold; margin-top: 8pt; margin-bottom: 6pt; }
        p { margin-top: 0pt; margin-bottom: 6pt; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1pt solid #ccc; padding: 5pt; }
        th { background-color: #f0f0f0; }
        ul, ol { margin-left: 20pt; padding-left: 0; }
        li { margin-bottom: 3pt; }
      </style>
    </head>
    <body>
      <h1>${docName}</h1>
      ${content}
    </body>
    </html>
  `;

  // 设置正确的MIME类型
  const blob = new Blob([htmlWithStyles], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  // 使用docName作为文件名
  createDownloadLink(blob, `${docName}.docx`);

  ElMessage.success('Word文档已下载');
};

// 保存文档 - 修改为直接下载docx格式并使用aiInputMessage作为文档名
const saveDocument = async () => {
  // 检查是否正在 AI 输出
  if (aiLoading.value || streamingAIContent.value) {
    ElMessage.warning('AI 正在输出中，请等待完成后再下载');
    return;
  }

  if (!editor) {
    ElMessage.error('编辑器未初始化');
    return;
  }

  saving.value = true;

  try {
    const content = await editor.getData();

    if (!content) {
      ElMessage.warning('文档内容为空，无需下载');
      saving.value = false;
      return;
    }

    // 使用aiInputMessage作为文档名称，如果为空则使用"无标题文档"
    const docName = aiInputMessage.value.trim() || currentQueryTitle.value || documentTitle.value || '无标题文档';

    // 直接下载为docx格式
    downloadAsDocx(content, docName);
  } catch (error) {
    console.error('下载文档失败', error);
    ElMessage.error('下载失败，请重试');
  } finally {
    saving.value = false;
  }
};

// 设置自动保存 - 修改为自动下载提示
const setupAutoSave = () => {
  // 每2分钟提醒用户下载文档
  autoSaveInterval = setInterval(() => {
    if (editor && editor.getData().trim() !== '') {
      ElMessage.info('提醒：您的文档尚未下载，请记得及时下载保存');
    }
  }, 120000);
};

// 标记组件是否已卸载
let isComponentMounted = true;

// 初始化CKEditor
const initCKEditor = async () => {
  try {
    editorLoading.value = true; // 开始加载
    console.log('开始加载CKEditor...');

    // 先加载脚本
    await loadCKEditorScript();

    // 检查组件是否已卸载
    if (!isComponentMounted) {
      console.log('组件已卸载，停止加载编辑器');
      return;
    }
    // 确保ClassicEditor已定义
    if (!window.ClassicEditor) {
      console.error('ClassicEditor未定义!');
      throw new Error('CKEditor not loaded');
    }

    // 删除CKEditor默认的占位符元素，防止出现红框
    const editorElement = document.querySelector('#editor');
    if (editorElement) {
      editorElement.innerHTML = '';
    }

    // 再次检查组件是否已卸载
    if (!isComponentMounted) {
      console.log('组件已卸载，停止创建编辑器实例');
      return;
    }

    // 增强的编辑器配置
    const editorInstance = await window.ClassicEditor.create(document.querySelector('#editor'), {
      language: 'zh',
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'link',
          '|',
          'bulletedList',
          'numberedList',
          'todoList',
          '|',
          'fontSize',
          'fontColor',
          'fontBackgroundColor',
          '|',
          'alignment',
          'indent',
          'outdent',
          '|',
          'insertTable',
          'imageUpload',
          'blockQuote',
          'codeBlock',
          '|',
          'undo',
          'redo'
        ],
        shouldNotGroupWhenFull: false
      },
      heading: {
        options: [
          { model: 'paragraph', title: '正文', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: '标题 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: '标题 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: '标题 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: '标题 4', class: 'ck-heading_heading4' }
        ]
      },
      fontFamily: {
        options: [
          '宋体', '黑体', '楷体', '微软雅黑',
          'Arial', 'Courier New', 'Georgia', 'Times New Roman'
        ]
      },
      fontSize: {
        options: [
          'tiny',
          'small',
          'default',
          'big',
          'huge'
        ]
      },
      // 表格配置
      table: {
        contentToolbar: [
          'tableColumn',
          'tableRow',
          'mergeTableCells',
          'tableCellProperties',
          'tableProperties'
        ]
      },
      // 图片上传配置 (这里可以根据实际情况配置)
      image: {
        toolbar: [
          'imageStyle:full',
          'imageStyle:side',
          '|',
          'imageTextAlternative'
        ]
      },
      // 自动保存提示配置
      autosave: {
        waitingTime: 3000, // 3秒
        save: () => {
          // 当编辑器内容变化时，显示"未保存"状态
          lastSaved.value = null;
          return Promise.resolve();
        }
      },
      // 完全禁用占位符或自定义
      placeholder: '开始编写您的文档...'
    });

    console.log('CKEditor实例创建成功!');

    // 最后检查组件是否已卸载
    if (!isComponentMounted) {
      console.log('组件已卸载，销毁刚创建的编辑器实例');
      editorInstance.destroy();
      return;
    }

    // 设置编辑器实例
    editor = editorInstance;

    // 编辑器加载完成
    editorLoading.value = false;

    // 监听编辑器内容变化
    editor.model.document.on('change:data', () => {
      // 内容有变化，标记文档为未保存状态
      if (lastSaved.value !== null) {
        // 显示未保存标记
        documentTitle.value = documentTitle.value.endsWith('*')
          ? documentTitle.value
          : documentTitle.value + '*';
      }

      // 将光标移至文档开头，避免出现子标题提示
      if (editor.getData() === '') {
        const model = editor.model;
        const root = model.document.getRoot();
        if (root && root.childCount === 0) {
          model.change((writer: { createElement: (arg0: string) => any; insert: (arg0: any, arg1: any, arg2: number) => void; setSelection: (arg0: any, arg1: string) => void; }) => {
            const paragraph = writer.createElement('paragraph');
            writer.insert(paragraph, root, 0);
            writer.setSelection(paragraph, 'in');
          });
        }
      }
    });

    // 添加AI助手快捷键集成
    if (editorElement) {
      // 监听编辑器区域的空格键事件
      editor.editing.view.document.on('keydown', (evt: any, data: any) => {
        // 检查是否按下了空格键
        if (data.keyCode === 32 && !showAIAssistant.value) { // 32 是空格键的键码
          // 阻止默认行为（插入空格）
          evt.stop();
          data.preventDefault();

          // 打开AI助手面板
          showAIAssistant.value = true;

          // 确保面板显示后滚动到底部并聚焦输入框
          nextTick(() => {
            scrollAIMessagesToBottom(aiMessagesContainer.value);
            focusAIInput();
          });

          return false;
        }

        // ESC键关闭AI助手面板
        if (data.keyCode === 27 && showAIAssistant.value) { // 27 是ESC键的键码
          showAIAssistant.value = false;
          return false;
        }
      });
    }

    // 设置初始文档标题
    documentTitle.value = '无标题文档';

  } catch (error) {
    console.error('CKEditor初始化失败:', error);
    ElMessage.error('编辑器加载失败，请刷新页面重试');
    // 加载失败也要隐藏 loading
    editorLoading.value = false;
  }
};

// 切换AI助手显示状态
const toggleAIAssistant = () => {
  showAIAssistant.value = !showAIAssistant.value;

  if (showAIAssistant.value) {
    // 显示助手时滚动到底部并聚焦输入框
    nextTick(() => {
      scrollAIMessagesToBottom(aiMessagesContainer.value);
      focusAIInput();
    });
  } else if (!aiLoading.value) {
    // 隐藏时重置状态（仅当不在加载状态时）
    aiInputMessage.value = '';
  }
};

const stopAIGeneration = () => {
  // 这里可以添加取消请求的逻辑
  aiLoading.value = false;
  // 不要清空输入框，让用户可以修改后重新发送
};

// 组件卸载时销毁编辑器
onUnmounted(() => {

  // 标记组件已卸载
  isComponentMounted = false;

  // 重置加载状态
  editorLoading.value = false;

  // 销毁编辑器实例
  if (editor) {
    try {
      editor.destroy();
      editor = null;
    } catch (error) {
      console.error('销毁编辑器失败:', error);
    }
  }

  // 清理自动保存定时器
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }

  // 移除全局点击事件监听器
  document.removeEventListener('click', handleGlobalClick);

  // 清理 CKEditor DOM 元素
  const editorElement = document.querySelector('#editor');
  if (editorElement) {
    editorElement.innerHTML = '';
  }
});

// AI助手相关逻辑
const aiMessagesContainer = ref<HTMLElement | null>(null);



const scrollAIMessagesToBottomHandler = () => {
  scrollAIMessagesToBottom(aiMessagesContainer.value);
};

// 更新watch函数中的调用
watch(
  [() => aiMessages.value.length, () => streamingAIContent.value],
  ([messagesLength, content], [oldMessagesLength, oldContent]) => {
    // 只在内容真正变化时触发滚动
    if (messagesLength !== oldMessagesLength || content !== oldContent) {
      nextTick(scrollAIMessagesToBottomHandler);
    }
  }
);

const performInsert = (content: string) => {
  if (insertToEditor(editor, content)) {
    // 关闭AI助手面板
    showAIAssistant.value = false;
  }
};

const sendToAI = async () => {
  const trimmedInput = aiInputMessage.value.trim();
  if (!trimmedInput) return;

  // 构建完整的消息内容：位置标签 + 用户输入
  let fullMessage = trimmedInput;
  if (officeLocationTags.value && officeLocationTags.value.length > 0) {
    const locationText = officeLocationTags.value.map(tag => tag.name).join('、');
    fullMessage = `位置：${locationText}\n${trimmedInput}`;
  }

  await sendMessageToAI(
    aiMessages.value,
    fullMessage,
    {
      onStart: (input) => {
        // 存储当前问题并更新标题
        currentQueryTitle.value = trimmedInput; // 标题只显示用户输入，不包含位置

        // 添加用户消息并重置状态
        aiMessages.value.push({ role: 'user', content: input });
        aiInputMessage.value = '';
        // 发送后清空位置标签
        officeLocationTags.value = [];
        aiLoading.value = true;
        streamingAIContent.value = '';

        // 确保消息滚动到底部
        scrollAIMessagesToBottomHandler();
      },
      onContent: (content) => {
        // 更新流式内容
        streamingAIContent.value = content;
        scrollAIMessagesToBottomHandler();
      },
      handleEditorContent: (content, done) => {
        // 实时将内容插入到编辑器中
        if (editor) {
          handleEditorContent(content, done);
        }
      },
      onComplete: () => {
        finishAIResponse();
      },
      onError: (error) => {
        const { errorMessage } = handleAIError(error);
        aiLoading.value = false;

        // 添加错误信息到消息列表
        aiMessages.value.push({
          role: 'assistant',
          content: errorMessage
        });

        // 错误状态下也滚动到底部
        scrollAIMessagesToBottomHandler();
      }
    },
    "landing" // 使用landing提示词，生成带有HTML标签的格式化富文本输出
  );
};

const handleEditorContent = (content: string, _done: boolean) => {
  // 只在第一次响应时初始化
  if (!editor._aiResponseStarted) {
    editor._aiResponseStarted = true;
    editor._aiContentStartPosition = initEditorForAIResponse(editor);
  }

  // 使用完整替换方式更新内容，避免乱序
  editor.model.change((writer: any) => {
    const root = editor.model.document.getRoot();

    // 如果存在之前的AI内容，先清除
    if (editor._aiContentStartPosition !== undefined) {
      const range = writer.createRange(
        writer.createPositionAt(root, editor._aiContentStartPosition),
        writer.createPositionAt(root, 'end')
      );
      writer.remove(range);
    }

    // 处理内容并插入
    insertProcessedContent(editor, writer, root, content, editor._aiContentStartPosition);
  });

  // 保持编辑器聚焦
  editor.editing.view.focus();
};

const copyAIContent = () => {
  // 确定要复制的内容：优先使用流式内容，其次使用最后一条助手消息
  const assistantMessages = aiMessages.value.filter((msg: { role: string; content: string }) => msg.role === 'assistant');
  const lastAssistantMessage = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;
  const contentToCopy = streamingAIContent.value || (lastAssistantMessage?.content || '');

  copyToClipboard(contentToCopy);
};

// 实时更新标题
const updateCurrentQueryTitle = () => {
  currentQueryTitle.value = aiInputMessage.value;
};

// 在组件挂载时确保编辑器初始化
onMounted(async () => {
  // 标记组件已挂载
  isComponentMounted = true;

  // 初始化编辑器
  try {
    await initCKEditor();

    // 检查组件是否已卸载
    if (!isComponentMounted) {
      return;
    }

    // 设置自动保存提醒
    setupAutoSave();
    // 检查用户登录状态
    checkAuthStatus();

    // 添加全局点击事件监听器，用于关闭AI助手弹窗
    document.addEventListener('click', handleGlobalClick);
  } catch (error) {
    console.error('组件挂载时初始化编辑器失败:', error);
    if (isComponentMounted) {
      ElMessage.error('编辑器加载失败，请刷新页面');
    }
    editorLoading.value = false;
  }
});

// 处理全局点击事件，点击空白处关闭AI助手弹窗
const handleGlobalClick = (event: MouseEvent) => {
  if (showAIAssistant.value) {
    // 检查点击是否在AI助手面板外部
    const aiPanel = document.querySelector('.aiAssistantBody');
    const aiBtn = document.querySelector('.aiBtn');

    if (aiPanel && !aiPanel.contains(event.target as Node) &&
      aiBtn && !aiBtn.contains(event.target as Node)) {
      showAIAssistant.value = false;
    }
  }
};

// 添加finishAIResponse函数
const finishAIResponse = () => {
  if (!streamingAIContent.value) return;

  // 添加助手回复到消息列表
  aiMessages.value.push({
    role: 'assistant',
    content: streamingAIContent.value
  });

  // 重置状态
  streamingAIContent.value = '';
  aiLoading.value = false;
  if (editor) {
    editor._aiResponseStarted = false;
    delete editor._aiContentStartPosition;
  }

  // 关闭AI助手面板
  showAIAssistant.value = false;

  // 显示成功提示
  ElMessage.success('内容已插入到文档');
};

// 修复insertToEditor函数调用
const insertToEditorHandler = (content: string) => {
  if (!editor) {
    // 检查编辑器是否已初始化
    ElMessage.warning('编辑器未初始化，正在尝试重新加载...');

    // 尝试重新初始化编辑器
    initCKEditor().then(() => {
      // 编辑器初始化成功后再次尝试插入内容
      if (editor) {
        performInsert(content);
        ElMessage.success('编辑器已重新加载并插入内容');
      } else {
        ElMessage.error('编辑器加载失败，请刷新页面后重试');
      }
    }).catch(err => {
      console.error('重新初始化编辑器失败:', err);
      ElMessage.error('编辑器初始化失败，请刷新页面后重试');
    });
    return;
  }

  // 如果编辑器已初始化，执行插入操作
  performInsert(content);
};

// 修复上传文档函数 - 保留按钮但仅显示提示
const uploadDocument = () => {
  ElMessage.info('上传文档功能已被移除');
};
</script>

<style scoped>
.loader {
  height: 13px;
  aspect-ratio: 4;
  display: grid;
}

.loader:before,
.loader:after {
  content: "";
  grid-area: 1/1;
  --_g: no-repeat radial-gradient(farthest-side, #000 94%, #0000);
  background:
    var(--_g) left,
    var(--_g) right;
  background-size: 25% 100%;
  animation: l34 1s infinite;
  transform: translate(var(--d, 0)) rotate(0);
}

.loader:after {
  --d: 37.5%;
  animation-delay: .5s;
}

@keyframes l34 {

  50%,
  100% {
    transform: translate(var(--d, 0)) rotate(.5turn)
  }
}

.officeContainer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  font-family: "Source Han Serif CN", serif;
}

/* 头部样式 */
.appHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: white;
  z-index: 10;
  height: 50px;
  outline: none;
}

/* 文档标题输入框 */
.docTitleInput {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border: none;
  text-align: center;
  width: 100%;
  max-width: 400px;
  padding: 5px 10px;
  border-radius: 4px;
}

.docTitleInput:focus {
  outline: none;
  background-color: #f5f5f5;
}

/* 顶部菜单栏 */
.editorMenuBar {
  background-color: #f8f9fa;
  padding: 4px 16px;
  border-bottom: 1px solid #eee;
}

.menuItems {
  display: flex;
  align-items: center;
}

.menuItem {
  padding: 8px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.menuItem:hover {
  background-color: #e8e8e8;
}

.leftSection {
  display: flex;
  align-items: center;
  gap: 16px;
}

.centerSection {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.rightSection {
  display: flex;
  align-items: center;
  gap: 16px;
}

.userInfo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logoutBtn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
}

.logoutBtn:hover {
  color: #4e6ef2;
}

/* 编辑器容器样式 */
.editorContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  background-color: white;
  overflow: hidden;
  position: relative;
}

/* 编辑器加载遮罩 */
.editorLoadingMask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loadingContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loadingSpinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066ff;
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

.loadingText {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.editorContent {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* CKEditor 组件区域 */
.editorMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* AI助手悬浮窗 */
.aiAssistantPanel {
  width: 80%;
  max-width: 780px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 460px;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: left top;
}

/* AI 助手弹窗动画 - 从左上角到右下角展开 */
.ai-panel-fade-enter-active {
  animation: expandFromTopLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-panel-fade-leave-active {
  animation: collapseToTopLeft 0.3s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes expandFromTopLeft {
  0% {
    opacity: 0;
    transform: scale(0) translateX(-50%);
    transform-origin: left top;
  }

  100% {
    opacity: 1;
    transform: scale(1) translateX(-50%);
    transform-origin: left top;
  }
}

@keyframes collapseToTopLeft {
  0% {
    opacity: 1;
    transform: scale(1) translateX(-50%);
    transform-origin: left top;
  }

  100% {
    opacity: 0;
    transform: scale(0) translateX(-50%);
    transform-origin: left top;
  }
}

.aiAssistantBody {
  display: flex;
  flex-direction: column;
}

.aiQueryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.aiQueryPrefix {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  padding: 4px 8px;
  background-color: #fff;
  /* border: 1px solid #0066ff; */
  border-radius: 4px;
  color: #333;
}

.aiQueryPrefix .el-icon {
  color: #0066ff;
  font-size: 16px;
}

.aiQueryActions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.aiActionBtn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 6px;
  font-size: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.aiActionBtn:hover {
  background-color: #f5f5f5;
  color: #0066ff;
}

.aiAssistantMessages {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  max-height: 300px;
  /* 增加高度，使内容更容易看到 */
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  scroll-behavior: smooth;
}

.aiMessagesInner {
  padding: 16px;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 100%;
}

.aiResponseContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  overflow-wrap: break-word;
  margin-top: 16px;
}

.aiResponseContent>div:first-child {
  color: #333;
  line-height: 1.6;
  word-break: break-word;
}

.typingContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

/* 生成中状态栏样式 */
.aiGeneratingBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: white;
  border-top: 1px solid #eee;
}

.aiGeneratingContent {
  display: flex;
  align-items: center;
}

.aiGeneratingText {
  font-size: 14px;
  color: #666;
  margin-left: 8px;
}

/* 输入区域 */
.aiAssistantFooter {
  background-color: white;
  padding: 10px 16px;
}

.aiInputWrapper {
  position: relative;
  width: 100%;
}

/* 新的简洁输入框样式 */
.aiSimpleInput {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 24px;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.aiInputLeft {
  display: flex;
  align-items: center;
  padding-right: 8px;
  margin-left: 4px;
}

.aiModelSelector {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #0066ff;
  cursor: pointer;
  padding: 4px 8px;
  border-right: 1px solid #eee;
}

.aiDropdownIcon {
  font-size: 12px;
  margin-left: 4px;
}

/* 输入框和标签容器 */
.aiInputContainer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
}

/* 位置标签容器 */
.tagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.locationTag {
  display: flex;
  align-items: center;
  background-color: #e6f0ff;
  border: 1px solid #c0d9ff;
  border-radius: 16px;
  padding: 2px 8px;
  font-size: 12px;
  white-space: nowrap;
}

.tagText {
  margin-right: 4px;
  color: #4e6ef2;
  font-weight: 500;
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
  line-height: 1;
  transition: all 0.2s;
}

.tagRemove:hover {
  color: #4e6ef2;
  transform: scale(1.2);
}

.aiTextInput {
  flex: 1;
  margin-left: 10px;
}

:deep(.aiTextInput .el-input__wrapper) {
  background-color: transparent;
  box-shadow: none !important;
  padding: 0;
}

:deep(.aiTextInput .el-input__inner) {
  border: none;
  height: 32px;
  font-size: 14px;
  padding: 0;
}

.aiSendButton {
  background-color: #0066ff;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 2px;
}

.aiSendButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.aiSendButton .el-icon {
  font-size: 18px;
}

/* 加载指示器 */
.typingIndicator {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 20px;
}

.typingIndicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #aaa;
  border-radius: 50%;
  margin-right: 5px;
  animation: blink 1.4s infinite both;
}

.typingIndicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typingIndicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0% {
    opacity: 0.1;
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0.1;
  }
}

/* 文档列表模态框 */
.documentsModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.documentsContent {
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.documentsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.documentsHeader h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.closeBtn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.documentsList {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.emptyDocuments {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
}

.documentItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.documentItem:hover {
  background-color: #f9f9f9;
}

.docInfo h4 {
  margin: 0 0 5px;
  font-size: 16px;
  color: #333;
}

.docInfo p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.docActions {
  display: flex;
  gap: 5px;
}

.docDeleteBtn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  font-size: 16px;
  border-radius: 4px;
}

.docDeleteBtn:hover {
  color: #f56c6c;
  background-color: #fee;
}

/* 删除确认模态框 */
.confirmDeleteModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.confirmDeleteContent {
  width: 400px;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
}

.confirmDeleteContent h3 {
  margin-top: 0;
  color: #333;
}

.confirmActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* CKEditor 自定义样式 */
:deep(.ck-editor__editable_inline) {
  min-height: calc(100vh - 150px);
  max-height: none;
  overflow-y: auto;
  padding: 2rem 3rem !important;
  border: none !important;
  box-shadow: none !important;
  width: 100%;
}

:deep(.ck-editor__editable_inline.ck-focused) {
  border: none !important;
  box-shadow: none !important;
}

:deep(.ck-editor) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

:deep(.ck-editor__main) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.ck-content) {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

:deep(.ck-placeholder:before) {
  color: #aaa !important;
  opacity: 0.6;
}

:deep(.ck-content h1) {
  font-size: 28px;
  margin-top: 28px;
  margin-bottom: 14px;
  color: #333;
  font-weight: 600;
  border: none !important;
}

:deep(.ck-content h2) {
  font-size: 22px;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
  border: none !important;
}

:deep(.ck-content h3) {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #444;
  font-weight: 600;
  border: none !important;
}

:deep(.ck-content p) {
  margin-bottom: 14px;
}

:deep(.ck-content strong) {
  font-weight: 600;
  color: #111;
}

:deep(.ck-content em) {
  color: #444;
}

:deep(.ck-toolbar) {
  border: none !important;
  border-bottom: 1px solid #eee !important;
  background: white !important;
}

:deep(.ck-toolbar_grouping) {
  padding: 8px 16px !important;
}

:deep(.ck-button) {
  border-radius: 4px !important;
}

:deep(.ck-on) {
  background: #e8f0fe !important;
  color: #1a73e8 !important;
}

/* 去除红框等干扰元素 */
:deep(.ck .ck-widget) {
  outline: none !important;
}

:deep(.ck .ck-widget.ck-widget_selected) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.ck .ck-widget__selection-handle) {
  display: none !important;
}

:deep(.ck .ck-widget.ck-widget_selected) {
  outline: none !important;
  border: none !important;
}

:deep(.ck .ck-editor__nested-editable.ck-editor__nested-editable_focused) {
  border: none !important;
  box-shadow: none !important;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .appHeader {
    padding: 8px 12px;
  }

  .editorMenuBar {
    padding: 2px 8px;
    overflow-x: auto;
  }

  .menuItem {
    padding: 6px 10px;
    font-size: 13px;
    white-space: nowrap;
  }

  .editorContainer {
    margin: 0;
  }

  .editorContent {
    flex-direction: column;
  }

  .editorMain {
    padding: 0;
  }

  :deep(.ck-editor__editable_inline) {
    padding: 1rem 1.5rem !important;
    min-height: 250px;
  }

  .rightSection {
    gap: 8px;
  }

  .newDocBtn,
  .saveBtn,
  .docsBtn {
    padding: 6px;
  }

  .aiAssistantPanel {
    width: 95%;
    bottom: 10px;
  }

  .aiModelSelector {
    font-size: 13px;
    padding: 3px 6px;
  }

  .aiQueryPrefix {
    font-size: 13px;
    padding: 3px 6px;
  }
}

/* AI 助手按钮 */
.aiBtn {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* AI快捷键提示 */
.aiShortcutTip {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #666;
  z-index: 100;
  animation: fadeInUp 0.3s ease;
}

.aiShortcutTip kbd {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 1px 5px;
  font-family: monospace;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.aiStopBtn {
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
}

.aiStopBtn:hover {
  background-color: #f0f0f0;
}

.escKey {
  font-size: 11px;
  color: #999;
  border: 1px solid #ddd;
  padding: 1px 3px;
  border-radius: 3px;
  margin-left: 4px;
}

/* 消息气泡样式 */
.messageBubble {
  display: flex;
  margin-bottom: 16px;
  max-width: 100%;
}

.userBubble {
  justify-content: flex-end;
}

.aiBubble {
  justify-content: flex-start;
}

.aiAvatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.messageContent {
  background-color: white;
  border-radius: 8px;
  padding: 10px 14px;
  max-width: 90%;
  word-break: break-word;
}

.userBubble .messageContent {
  background-color: #e3f2fd;
  margin-left: auto;
}

/* 消息操作按钮 */
.messageActions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.messageActions .el-button {
  color: #0066ff;
}

.messageActions .el-button:hover {
  background-color: rgba(0, 102, 255, 0.1);
}
</style>

<script lang="ts">
// 为TypeScript添加ClassicEditor类型定义
declare global {
  interface Window {
    ClassicEditor: {
      create: Function;
      builtinPlugins: Array<{
        pluginName: string;
        defaultConfig?: any;
      }>;
      _translations?: {
        [lang: string]: {
          [key: string]: string;
        };
      };
    };
  }
}
</script>