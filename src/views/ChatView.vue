<template>
  <div class="chatContainer">
    <Header :is-logged-in="isLoggedIn" @locationSelected="handleLocationSelected" />
    <!-- 添加登录模态框 -->
    <login-modal :visible="showLoginModal" @close="showLoginModal = false" @loginSuccess="handleLoginSuccess" />
    <!-- 添加头部组件 -->
    <header class="appHeader">
      <el-button class="newChatBtn" type="primary" plain @click="startNewChat"
        :disabled="chatStore.loading || !!streamingContent">
        <el-icon>
          <Plus />
        </el-icon> 新对话
      </el-button>
    </header>

    <!-- 消息区域 -->
    <div class="messagesContainer" ref="messagesContainer" @scroll="handleScroll">
      <!-- 欢迎消息 -->
      <template v-if="chatStore.messages.length === 0">
        <div class="welcomeMessage">
          <div class="aiMessageBubble">
            <div class="messageAvatar">
              <img src="@/img/1.png" alt="AI头像" class="avatarImg">
            </div>
            <div class="messageContent">
              <div>你好面试官，我是小爱同学。让我们一起度过美好的一天！</div>
              <div style="margin-top: 15px;">有什么我可以帮助你的吗？无论是回答问题、文案创作还是其他方面，都可以和我说说。</div>
            </div>
          </div>

          <div class="suggestions">
            <div class="suggestionItem" @click="usePrompt('你是怎么知道这些知识的？')">
              你是怎么知道这些知识的？ <el-icon>
                <ArrowRight />
              </el-icon>
            </div>
            <div class="suggestionItem" @click="usePrompt('能帮我写一篇500字的文章吗？')">
              能帮我写一篇500字的文章吗？ <el-icon>
                <ArrowRight />
              </el-icon>
            </div>
            <div class="suggestionItem" @click="usePrompt('你可以回答哪些领域的问题？')">
              你可以回答哪些领域的问题？ <el-icon>
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </div>
      </template>

      <!-- 聊天消息 -->
      <div v-for="(message, index) in chatStore.messages" :key="message.id"
        :class="['messageWrapper', message.role === 'user' ? 'userMessage' : 'aiMessage']">
        <div :class="[message.role === 'user' ? 'userMessageBubble' : 'aiMessageBubble']">
          <div class="messageAvatar" v-if="message.role === 'assistant'">
            <img src="@/img/1.png" alt="AI头像" class="avatarImg">
          </div>
          <div class="messageContent">
            <!-- 消息内容区域 - 只允许用户消息可编辑 -->
            <div v-if="!editingMessageId || editingMessageId !== message.id" class="messageText"
              :class="{ 'editable': message.role === 'user' }"
              @click="message.role === 'user' && !streamingContent && !chatStore.loading && startEditing(message.id, message.content, $event)">
              {{ message.content }}
              <!-- 添加操作按钮组 -->
              <div class="messageActions">
                <el-button type="text" size="small" @click.stop="copyMessage(message.content)" title="复制">
                  <el-icon>
                    <Document />
                  </el-icon>
                </el-button>
              </div>
            </div>
            <!-- 编辑状态 - 只对用户消息显示 -->
            <div v-else-if="message.role === 'user'" class="messageText editMode">
              <el-input type="textarea" v-model="editingContent" :autosize="false" :maxlength="10000"
                ref="seamlessEditInput" class="editorInput" @blur="confirmEditOnBlur" @keydown.esc="cancelEdit"
                @keydown.enter.prevent="sendEditedMessage(index)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 流式输出中的消息 -->
      <div v-if="streamingContent" class="messageWrapper aiMessage">
        <div class="aiMessageBubble">
          <div class="messageAvatar">
            <img src="@/img/1.png" alt="AI头像" class="avatarImg">
          </div>
          <div class="messageContent">
            <div class="messageText">
              {{ streamingContent }}
              <!-- 为流式内容也添加复制功能 -->
              <div class="messageActions">
                <el-button type="text" size="small" @click="copyMessage(streamingContent)" title="复制">
                  <el-icon>
                    <Document />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载动画 - 修改条件，仅在加载且没有流式内容时显示 -->
      <div v-if="chatStore.loading && !streamingContent" class="messageWrapper aiMessage">
        <div class="aiMessageBubble">
          <div class="messageAvatar">
            <img src="@/img/1.png" alt="AI头像" class="avatarImg">
          </div>
          <div class="messageContent">
            <div class="typingIndicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入框 -->
    <div class="footer">
      <div class="keywordPanel">
        <div class="keywordChips">
          <div class="keywordChip" @click="appendToInput('你能做什么')">你能做什么</div>
          <div class="keywordChip" @click="appendToInput('写一首诗')">写一首诗</div>
          <div class="keywordChip" @click="appendToInput('解释量子力学')">解释量子力学</div>
          <div class="keywordChip" @click="appendToInput('推荐几本书')">推荐几本书</div>
          <div class="keywordChip" @click="appendToInput('如何提高工作效率')">如何提高工作效率</div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column;">
        <div class="imagePreviewArea" v-if="uploadedImages.length > 0">
          <div class="imagePreviewGrid">
            <div v-for="(image, index) in uploadedImages" :key="index" class="imagePreviewItem">
              <img :src="image.url" class="previewImage">
              <el-button link class="removeImageBtn" @click="removeImage(index)">
                <el-icon>
                  <Close />
                </el-icon>
              </el-button>
            </div>
          </div>
          <!-- <div class="extractedTextArea" v-if="hasExtractedText">
          <div class="extractedTextHeader">
            <span>图片文字识别结果</span>
          </div>
          <div class="extractedText">{{ combinedExtractedText }}</div>
        </div> -->
        </div>
        <div class="inputArea">
          <!-- 标签和输入框 - 现有代码 -->
          <div class="taggedInputContainer" @paste="handlePaste">
            <!-- 标签始终显示在前面 -->
            <div class="tagsContainer">
              <div v-for="(tag, index) in keywords" :key="index" class="locationTag">
                <span class="tagText">{{ tag }}</span>
                <button class="tagRemove" @click.stop="removeTag(index)">&times;</button>
              </div>
              <div v-for="(tag, index) in locationStore.locationTags" :key="index" class="locationTag">
                <span class="tagText">{{ tag.name }}</span>
                <button class="tagRemove" @click="locationStore.removeLocationTag(index)">&times;</button>
              </div>
            </div>

            <!-- 输入框 -->
            <div class="inputWithTags">
              <el-input v-model="inputMessage" type="textarea" :rows="1" autosize
                placeholder="你可以问我任何问题... 或输入@触发关键词/黏贴图片进行识别" :disabled="chatStore.loading"
                @keydown.enter.prevent="() => sendMessage()" @keydown.backspace="handleBackspace" @input="handleInput"
                @focus="inputFocused = true" @blur="inputFocused = false" ref="inputRef">
              </el-input>
            </div>
          </div>
          <!-- 关键词建议下拉菜单 -->
          <div class="suggestionsDropdown" v-if="showSuggestions && filteredSuggestions.length > 0">
            <div v-for="(suggestion, index) in filteredSuggestions" :key="index" class="suggestionItem"
              @click="selectSuggestion(suggestion)">
              <div class="suggestionText">{{ suggestion.text }}</div>
              <div class="suggestionDescription">{{ suggestion.description }}</div>
            </div>
          </div>
          <!-- 修改输入动作区域，添加文件上传功能 -->
          <div class="inputActions">
            <!-- 修改上传按钮以在流式输出或加载时禁用 -->
            <el-upload class="uploadButton" action="#" :auto-upload="false" :show-file-list="false" accept="image/*"
              multiple :on-change="handleFileChange" ref="uploadRef"
              :disabled="chatStore.loading || !!streamingContent">
              <el-button plain circle title="上传图片" :disabled="chatStore.loading || !!streamingContent">
                <el-icon>
                  <Picture />
                </el-icon>
              </el-button>
            </el-upload>
            <!-- 同样禁用深度思考按钮 -->
            <el-button plain circle title="深度思考" :disabled="chatStore.loading || !!streamingContent">
              <el-icon>
                <Connection />
              </el-icon>
            </el-button>
            <!-- 发送按钮 - 保留 Element Plus 按钮，但修复禁用状态下的图标居中问题 -->
            <el-button style="margin-left: 5px;" type="primary" circle :loading="chatStore.loading"
              :disabled="(!inputMessage.trim() && uploadedImages.length === 0 && locationStore.locationTags.length === 0 && keywords.length === 0) || chatStore.loading"
              @click="() => sendMessage()" title="发送消息">
              <el-icon v-if="!chatStore.loading">
                <Position />
              </el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <!-- 添加一个可选的"返回底部"按钮, 当用户滚动上去且正在生成时显示 -->
    <div class="scrollToBottomBtn" v-if="isScrolledUp && (streamingContent || chatStore.loading)"
      @click="scrollToBottom">
      <el-button type="primary" circle size="small">
        <el-icon>
          <ArrowDown />
        </el-icon>
      </el-button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import { sendStreamMessageToDeepseek } from '@/api/deepseek';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';
import { processImageOCR, formatFileSize, validateImageFile } from '@/api/ocrPhoto';
import { useLocationStore } from '@/stores/location';
// import loginButton from '@/components/loginButton.vue';
// import loginModal from '@/components/loginModal.vue';
import AuthStore from '@/stores/auth.js';
import useMessageEditor from '@/utils/useMessageEditor';

const router = useRouter();
const route = useRoute();
const chatStore = useChatStore();
const locationStore = useLocationStore();
const inputMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const streamingContent = ref('');
const showKeywords = ref(true); // 控制关键词面板显示状态
const isScrolledUp = ref(false);
const autoScrollEnabled = ref(true);

// 使用封装的消息编辑功能
const {
  editingMessageId,
  editingContent,
  seamlessEditInput,
  startEditing,
  cancelEdit,
  confirmEditOnBlur,
  sendEditedMessage
} = useMessageEditor(chatStore, sendMessage);

// 添加关键词提示数据和状态
const keywordSuggestions = [
  { text: '写一篇文章', description: '根据提示创作文章内容' },
  { text: '今日热搜', description: '搜索今日最火的事件' },
  { text: '翻译内容', description: '将文本翻译成其他语言' },
  { text: '总结文章', description: '提取文章的主要观点' },
  { text: '编写代码', description: '生成特定编程语言的代码' },
]
const showSuggestions = ref(false);
const filteredSuggestions = ref(keywordSuggestions);

// 使用简单的变量和状态
const inputFocused = ref(false);
const keywords = ref<string[]>([]);
const atInput = ref(''); // 用于记录@后面输入的内容

// 添加图片处理相关的状态
const uploadedImages = ref<{
  file: File;
  url: string;
  name: string;
  size: string;
  text?: string; // 存储每张图片的OCR结果
}[]>([]);
const processingImage = ref(false);
const hasExtractedText = computed(() => {
  return uploadedImages.value.some(img => img.text && img.text.trim() !== '');
});
const combinedExtractedText = computed(() => {
  return uploadedImages.value
    .map((img, index) => img.text ? `[图片${index + 1}]: ${img.text}` : '')
    .filter(text => text !== '')
    .join('\n\n');
});

// 添加 uploadRef
const uploadRef = ref();

// 添加一个计算属性检查是否有内容可发送
const hasContentToSend = computed(() => {
  return inputMessage.value.trim() !== '' ||
    uploadedImages.value.length > 0 ||
    locationStore.locationTags.length > 0 ||
    keywords.value.length > 0;
});

// 添加登录状态
const isLoggedIn = ref<boolean>(false);
const userInfo = ref<{ username: string } | null>(null);
const showLoginModal = ref<boolean>(false);

// 检查用户是否已登录（移到下面的 onMounted 中统一处理）

// 处理登录成功
const handleLoginSuccess = (userData: { username: string }) => {
  isLoggedIn.value = true;
  userInfo.value = userData;

  // 模拟生成token，实际应用中应该从服务器获取
  const mockToken = `token_${Date.now()}`;

  // 保存到auth store
  AuthStore.login(userData, mockToken);

  showLoginModal.value = false;
};

// 退出登录
const logout = () => {
  isLoggedIn.value = false;
  userInfo.value = null;
  AuthStore.logout();
};

// 处理位置选择
const handleLocationSelected = (location: { name: string, address: string, coords: any }) => {
  locationStore.addLocationTag(location);
};

// 修复粘贴处理函数，保留成功消息提示
async function handlePaste(event: ClipboardEvent) {
  // 如果正在加载，则不处理粘贴
  if (chatStore.loading) return;

  // 获取剪贴板数据
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  // 检查是否有文件
  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 处理图片文件
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        // 阻止默认粘贴行为
        event.preventDefault();

        // 直接使用 handleFileChange 处理文件
        await handleFileChange({ raw: file, name: file.name, size: file.size });

        // 保留成功消息提示
        // ElMessage.success('图片粘贴成功');
        return;
      }
    }
  }
}

// 重写处理输入函数
function handleInput() {
  // 处理@触发
  if (inputMessage.value.endsWith('@')) {
    showSuggestions.value = true;
    filteredSuggestions.value = keywordSuggestions;
    atInput.value = '';
  } else if (inputMessage.value.includes('@')) {
    const lastAtIndex = inputMessage.value.lastIndexOf('@');
    const afterAt = inputMessage.value.substring(lastAtIndex + 1);

    // 如果@后面没有空格，表示还在输入关键词
    if (!afterAt.includes(' ')) {
      atInput.value = afterAt;
      showSuggestions.value = true;
      filteredSuggestions.value = keywordSuggestions.filter(item =>
        item.text.toLowerCase().includes(afterAt.toLowerCase()) ||
        item.description.toLowerCase().includes(afterAt.toLowerCase())
      );
    } else {
      showSuggestions.value = false;
    }
  } else {
    showSuggestions.value = false;
  }
}

// 简化 selectSuggestion 函数，移除自动发送逻辑
function selectSuggestion(suggestion: { text: string, description: string }) {
  // 添加标签
  keywords.value.push(suggestion.text);

  // 清除当前输入和建议
  inputMessage.value = '';
  showSuggestions.value = false;
}

// 删除标签
function removeTag(index: number) {
  keywords.value.splice(index, 1);
}

// 简化 handleBackspace 函数定义
function handleBackspace(event: Event | KeyboardEvent) {
  // 确保事件是 KeyboardEvent 类型
  if (!(event instanceof KeyboardEvent)) return;

  if (inputMessage.value === '') {
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

// 聚焦输入框
function focusInput() {
  nextTick(() => {
    inputRef.value?.focus();
  });
}

// 使用推荐提示
function usePrompt(prompt: string) {
  inputMessage.value = prompt;
  nextTick(() => {
    sendMessage();
  });
}

// 在输入框中添加文本
function appendToInput(text: string, autoSend = true) {
  inputMessage.value = text;
  if (autoSend) {
    nextTick(() => {
      sendMessage();
    });
  }
}

// 提取OCR处理为单独函数
async function processOCR(file: File): Promise<string | null> {
  try {
    return await processImageOCR(file);
  } catch (error) {
    console.error('OCR处理失败:', error);
    ElMessage.error('图片文字识别失败，请重试');
    return null;
  }
}

// 简化文件上传处理函数
async function handleFileChange(file: any) {
  // 验证文件
  if (!validateImageFile(file.raw)) {
    return;
  }

  // 创建图片URL并添加到上传图片列表
  const imageUrl = URL.createObjectURL(file.raw);
  uploadedImages.value.push({
    file: file.raw,
    url: imageUrl,
    name: file.name,
    size: formatFileSize(file.size)
  });

  // 设置处理状态
  processingImage.value = true;
  // 添加正在识别的提示
  ElMessage.success('图片上传中...');

  // 处理OCR
  const text = await processOCR(file.raw);
  if (text && text.trim() !== '') {
    const lastIndex = uploadedImages.value.length - 1;
    uploadedImages.value[lastIndex].text = text;
    // 添加识别成功的提示
    ElMessage.success('图片文字识别成功');
  } else {
    // 添加未检测到文字的提示
    ElMessage.warning('未检测到图片中的文字');
  }

  processingImage.value = false;

  // 重置上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
}

// 删除单个图片
function removeImage(index: number) {
  if (uploadedImages.value[index]?.url) {
    URL.revokeObjectURL(uploadedImages.value[index].url);
  }
  uploadedImages.value.splice(index, 1);
}

// 清空所有图片
function clearAllImages() {
  uploadedImages.value.forEach(image => {
    if (image.url) {
      URL.revokeObjectURL(image.url);
    }
  });
  uploadedImages.value = [];
}

// 构建消息内容的辅助函数
function buildMessageContent(): string {
  let content = inputMessage.value.trim();

  // 添加关键词标签
  if (keywords.value.length > 0) {
    content = keywords.value.join(' ') + ' ' + content;
  }

  // 添加位置标签
  if (locationStore.locationTags.length > 0) {
    const locationNames = locationStore.locationTags.map(tag => tag.name).join(', ');
    content = `[位置: ${locationNames}] ${content}`;
  }

  // 添加提取的文字
  if (hasExtractedText.value) {
    if (content.trim() === '') {
      content = combinedExtractedText.value;
    } else {
      content = `${content}\n\n图片中的文字：\n${combinedExtractedText.value}`;
    }
  } else if (content.trim() === '' && uploadedImages.value.length > 0) {
    content = '请分析这些图片';
  }

  return content;
}

// 简化 sendMessage 函数，移除 replaceHistory 参数
async function sendMessage(addUserMessage = true, source: 'chat' | 'landing' = 'chat') {
  // 如果正在加载或没有内容可发送，则返回
  if (chatStore.loading || (!hasContentToSend.value && addUserMessage)) {
    return;
  }

  // 构建消息内容
  const messageContent = buildMessageContent();

  // 添加用户消息 (如果需要)
  if (addUserMessage) {
    chatStore.addMessage({
      role: 'user',
      content: messageContent
    });
  }

  // 清空输入、标签和图片
  inputMessage.value = '';
  keywords.value = [];
  clearAllImages();

  // 清空地图标签
  locationStore.locationTags.length = 0; // 清空位置标签数组

  // 设置为加载状态
  chatStore.setLoading(true);
  streamingContent.value = '';

  // 发送后强制滚动到底部
  nextTick(() => {
    scrollToBottom();
  });

  try {
    // 使用流式API发送消息
    await sendStreamMessageToDeepseek(chatStore.messages, (content, done) => {
      // 更新流式内容
      streamingContent.value = content;

      // 如果完成，添加到消息列表并清空流式内容
      if (done) {
        chatStore.addMessage({
          role: 'assistant',
          content: content
        });
        streamingContent.value = '';

        // 回复完成后再次滚动到底部
        if (autoScrollEnabled.value) {
          nextTick(() => {
            scrollToBottom();
          });
        }
      }
    }, source);
  } catch (error: unknown) {
    console.error('发送消息失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '请求失败，请检查API配置或网络连接');
    chatStore.addMessage({
      role: 'assistant',
      content: '抱歉，处理您的请求时出现了错误。请检查API配置或网络连接。'
    });
    streamingContent.value = '';
  } finally {
    chatStore.setLoading(false);
  }
}

// 处理从LocalStorage加载位置信息
function loadPendingLocation() {
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
}

// 处理挂起的问题
function handlePendingQuestion() {
  const result = chatStore.consumePendingQuestion();
  if (result.question) {
    inputMessage.value = result.question;

    // 获取并处理从LandingView传来的关键词
    const pendingKeywords = sessionStorage.getItem('pendingKeywords');
    if (pendingKeywords) {
      try {
        const keywordsArray = JSON.parse(pendingKeywords);
        keywords.value = keywordsArray;
        // 处理完后清除，避免重复使用
        sessionStorage.removeItem('pendingKeywords');
      } catch (e) {
        console.error('解析待处理关键词失败', e);
      }
    }

    nextTick(() => {
      // 根据来源调用不同的API
      sendMessage(true, result.source);
    });
    return true;
  }
  return false;
}

// 标记是否已经处理过初始的 pendingQuestion
const hasProcessedInitialQuestion = ref(false);

// 简化组件挂载钩子
onMounted(() => {
  // 滚动消息容器到底部
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }

  // 首先检查消息列表中是否有用户消息但没有助手回复
  if (chatStore.messages.length > 0 &&
    chatStore.messages[chatStore.messages.length - 1].role === 'user') {
    sendMessage(false); // 传入 false 表示不需要添加新的用户消息
    return;
  }

  // 处理从首页带来的问题
  if (handlePendingQuestion()) {
    hasProcessedInitialQuestion.value = true;
  } else {
    focusInput();
  }

  // 初始化时确保关键词列表为空
  keywords.value = [];
  // 加载位置信息
  loadPendingLocation();

  // 添加登录检查
  const loggedIn = AuthStore.checkAuth();
  if (loggedIn) {
    isLoggedIn.value = true;
    userInfo.value = AuthStore.state.userInfo;
  }
});

// 监听 store 中的 pendingQuestion 变化（用于处理后续从 index 页面跳转的情况）
watch(() => chatStore.pendingQuestion, (newQuestion) => {
  // 当有新问题时，自动处理（跳过初始化时的处理，因为 onMounted 已经处理过了）
  if (newQuestion && hasProcessedInitialQuestion.value) {
    console.log('检测到新的待处理问题:', newQuestion);
    nextTick(() => {
      handlePendingQuestion();
    });
  }
});

// 简化 clearChat 函数
// function clearChat() {
//   ElMessage({
//     message: '对话已清空',
//     type: 'success'
//   });
//   chatStore.clearMessages();
//   focusInput();
// }

// 简化 startNewChat 函数
function startNewChat() {
  chatStore.setLoading(false);
  streamingContent.value = '';
  chatStore.resetCurrentChat();
  showKeywords.value = true;
  inputMessage.value = '';
  keywords.value = [];
  clearAllImages();
  focusInput();
}

// 处理滚动事件
function handleScroll() {
  if (!messagesContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // 检查是否滚动到了底部附近（留10px的余量）
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

  // 更新滚动状态
  isScrolledUp.value = !isAtBottom;

  // 如果用户滚动了并且不在底部，就禁用自动滚动
  if (!isAtBottom) {
    autoScrollEnabled.value = false;
  } else {
    // 如果滚动到底部，重新启用自动滚动
    autoScrollEnabled.value = true;
  }
}

// 手动滚动到底部
function scrollToBottom() {
  if (!messagesContainer.value) return;
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  autoScrollEnabled.value = true;
  isScrolledUp.value = false;
}

// 修改消息监听逻辑，只在允许时自动滚动
watch([() => chatStore.messages.length, streamingContent], async () => {
  await nextTick();

  // 如果自动滚动被启用或者是新消息完成后，才自动滚动
  if (autoScrollEnabled.value || (!streamingContent.value && chatStore.messages.length > 0)) {
    scrollToBottom();
  }
}, { deep: true });

// 复制消息内容
function copyMessage(content: string) {
  navigator.clipboard.writeText(content)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
}
</script>

<style scoped>
.chatContainer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: "Source Han Serif CN", serif;
}

.chatHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 10px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  height: 39px;
}

.headerLeft {
  display: flex;
  align-items: center;
}

.newChatBtn {
  font-size: 14px;
  margin-left: 95px;
}

.title {
  margin-left: 16px;
  font-size: 18px;
  font-weight: 500;
}

.headerRight {
  display: flex;
  gap: 12px;
}

/* 消息容器样式 */
.messagesContainer {
  width: 85%;
  flex: 1;
  margin: auto;
  background: #fff;
  overflow-y: auto;
  padding: 20px;
  border-radius: 8px;
}

/* 滚动条透明处理 */
.messagesContainer::-webkit-scrollbar {
  width: 6px;
}

.messagesContainer::-webkit-scrollbar-track {
  background: transparent;
}

.messagesContainer::-webkit-scrollbar-thumb {
  background: transparent;
}

.messagesContainer::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

.welcomeMessage {
  margin-bottom: 40px;
}

.suggestions {
  width: 30%;
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 80%;
}

.suggestionItem {
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  /* justify-content: space-between; */
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #333;
}

.suggestionItem:hover {
  background-color: #e9e9e9;
}

/* 消息样式 */
.messageWrapper {
  display: flex;
  margin-bottom: 24px;
  justify-content: flex-start;
}

.userMessage {
  justify-content: flex-end;
}

.aiMessageBubble,
.userMessageBubble {
  display: flex;
  max-width: 80%;
}

.aiMessageBubble {
  background-color: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.userMessageBubble {
  background-color: #fef6f65e;
  color: var(--s-color-text-secondary, rgba(0, 0, 0, .85));
  border-radius: 12px;
  padding: 12px 16px;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.messageAvatar {
  margin-right: 10px;
}

.messageContent {
  flex: 1;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.messageText {
  position: relative;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  /* 为按钮预留空间 */
  cursor: default;
  box-sizing: border-box;
  width: 100%;
}

/* 只有用户消息可编辑 */
.messageText.editable {
  cursor: pointer;
}

.messageText.editable:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.messageActions {
  display: none;
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
}

/* 编辑模式下完全保持一致的尺寸和样式 */
.messageText.editMode {
  position: relative;
  cursor: text;
  box-sizing: border-box;
  min-height: inherit;
  max-height: none !important;
  display: flex;
  flex-direction: column;
  overflow: visible;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "Source Han Serif CN", serif;
  margin: 0;
  line-height: 1.6;
  padding-right: 0;
  padding-bottom: 0;
}

/* 编辑器输入区域样式 */
.editorInput {
  height: auto;
  overflow-y: hidden;
  flex-grow: 1;
  margin: 0;
  padding: 0;
  max-height: none;
  box-sizing: border-box !important;
}

.editorInput :deep(.el-textarea__inner) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  font-size: inherit !important;
  line-height: inherit !important;
  color: inherit !important;
  resize: none !important;
  overflow-y: hidden !important;
  box-sizing: border-box !important;
  white-space: pre-wrap !important;
  word-break: break-word !important;
  min-height: auto !important;
  max-height: none !important;
}

/* 移除多余的选择器 */
.editorInput :deep(.el-textarea__wrapper) {
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* 修复编辑提示文本，避免影响高度 */
.editHint {
  width: 100%;
  font-size: 11px;
  color: #909399;
  text-align: right;
  opacity: 0.7;
  position: absolute;
  right: 5px;
  bottom: 0px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

/* 为特定语言添加字体优化 */
.messageText:lang(zh),
.messageText:lang(zh-CN),
.messageText.editMode:lang(zh),
.messageText.editMode:lang(zh-CN),
.editorInput :deep(.el-textarea__inner) {
  font-family: "Source Han Serif CN", "Microsoft YaHei", "SimSun", serif !important;
}

/* 底部区域样式 */
.footer {
  width: 85%;
  margin: 0 auto;
  padding: 15px 0;
  background-color: #fff;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* 输入区域样式 */
.inputArea {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  /* background-color: #f5f5f5; */
  border: 1px solid var(--s-color-border-secondary, rgba(0, 0, 0, .1));
  border-radius: 24px;
  padding: 2px 14px;
  position: relative;
}

/* 修复禁用状态下的输入框背景颜色 */
.inputArea :deep(.el-textarea__inner) {
  border: none;
  background-color: none;
  box-shadow: none !important;
  padding: 8px 10px;
  border-radius: 8px;
}

/* 特别处理禁用状态 */
.inputArea :deep(.el-textarea__inner[disabled]) {
  background-color: transparent !important;
  color: #909399;
}

/* 确保输入框容器也没有背景 */
.inputWithTags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  background: none;
  padding: 5px 15px;
  width: 100%;
  margin-left: -29px;
}

/* 确保主输入框也没有背景 */
.mainInput {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 5px;
  min-width: 100px;
  font-size: 14px;
  background: none;
}

.inputActions {
  display: flex;
  gap: 8px;
  margin-right: 10px;
}

/* 加载指示器 */
.typingIndicator {
  display: flex;
  align-items: center;
  height: 20px;
  margin-top: 8px;
}

.typingIndicator span {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.3s linear infinite;
}

.typingIndicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typingIndicator span:nth-child(3) {
  animation-delay: 0.3s;
}


@keyframes bounce {

  0%,
  60%,
  100% {
    transform: translateY(0);
  }

  30% {
    transform: translateY(-4px);
  }
}

/* 移动设备适配 - 增强版 */
@media (max-width: 768px) {

  /* 基础字体大小调整 */
  .chatContainer {
    font-size: 15px;
  }

  /* 移动端下新对话按钮左边距为0 */
  .newChatBtn {
    margin-left: 0;
  }

  .welcomeMessage .messageContent {
    font-size: 15px;
  }

  .messageText {
    font-size: 15px;
    line-height: 1.5;
  }

  /* 界面元素尺寸调整 */
  .messageAvatar {
    margin-right: 8px;
  }

  .messageAvatar img {
    width: 32px;
    height: 32px;
  }

  .aiMessageBubble,
  .userMessageBubble {
    max-width: 90%;
    padding: 10px 12px;
  }

  /* 输入区域调整 */
  .footer {
    padding: 8px;
  }

  /* .inputArea {
    padding: 6px 12px;
  } */

  .inputActions {
    gap: 4px;
  }

  .inputActions .el-button {
    padding: 8px;
  }

  .inputArea :deep(.el-textarea__inner) {
    font-size: 15px;
    /* padding: 6px 0; */
  }

  /* 图片预览区域 */
  .imagePreviewArea {
    margin: 8px 12px;
  }

  .imagePreviewGrid {
    gap: 8px;
    padding: 10px;
  }

  .imagePreviewItem {
    width: 119px;
    height: 71px;
  }

  /* 关键词面板调整 */
  /* .keywordPanel {
    padding: 8px 12px;
  } */

  .keywordChip {
    /* padding: 6px 10px; */
    font-size: 13px;
  }

  /* .keywordTitle {
    font-size: 12px;
  } */
}

/* 特小屏幕设备适配 (小型手机) */
@media (max-width: 375px) {
  .chatContainer {
    font-size: 14px;
  }

  .welcomeMessage .messageContent {
    font-size: 14px;
  }

  .messageText {
    font-size: 14px;
  }

  .messageAvatar img {
    width: 28px;
    height: 28px;
  }

  .imagePreviewItem {
    width: 80px;
    height: 60px;
  }

  .keywordChip {
    padding: 5px 8px;
    font-size: 12px;
  }

  .newChatBtn {
    font-size: 12px;
    padding: 6px 10px;
  }

  .footer {
    padding: 6px;
  }
}

/* 关键词引导面板样式 */
.keywordPanel {
  margin-top: 16px;
  /* background-color: #f8f8f8; */
  /* border-radius: 8px; */
  /* padding: 10px 16px; */
  margin-left: 10px;
  margin-bottom: 15px;
}

.keywordTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.closeBtn {
  padding: 2px;
}

.keywordChips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keywordChip {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--s-color-text-tertiary, rgba(0, 0, 0, .5));
  background-color: #fff;
  border: 1px solid var(--s-color-border-secondary, rgba(0, 0, 0, .06));
  border-radius: 19px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.keywordChip:hover {
  background-color: #f0f0f0;
  border-color: #ccc;
}

/* 关键词提示样式 */
.suggestionsDropdown {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-bottom: 5px;
}

.suggestionItem {
  background-color: #fff;
  padding: 10px 15px;
  cursor: pointer;
  /* border-bottom: 1px solid #f0f0f0; */
}

.suggestionItem:hover {
  background-color: #f5f7fa;
}

.suggestionText {
  color: #000;
  font-weight: 500;
  margin-bottom: 3px;
}

.suggestionDescription {
  font-size: 12px;
  color: #909399;
  margin-left: 19px;
}

/* 头像样式 */
.avatarImg {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

/* 添加返回底部按钮样式 */
.scrollToBottomBtn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 100;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 标签输入容器 */
.taggedInputContainer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  /* background-color: #000000; */
  /* background: none; */
  /* border-radius: 8px; */
  /* border: 1px solid #e0e0e0; */
}

/* 标签容器 */
.tagsContainer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-right: 8px;
}

/* 关键词标签 */
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
  /* background: transparent; */
}

/* 文件预览区域 */
.photoBox {
  width: 150px;
  height: 100px;
  margin-bottom: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
  overflow: hidden;
}

/* 文件预览 */
.photoView {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: white;
}

.photoImg {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.photoWord {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 10px;
  position: relative;
}

.fileSize {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.removeBtn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
}

/* 提取文本区域 */
.extractedTextArea {
  padding: 10px;
}

.extractedTextHeader {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.extractedText {
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
}

/* 上传按钮样式 */
.uploadButton {
  display: inline-block;
}

/* 在消息区域和底部输入框之间添加图片预览区域 */
.imagePreviewArea {
  margin: 10px 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.imagePreviewGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  padding-left: 12px;
}

.imagePreviewItem {
  position: relative;
  width: 119px;
  height: 71px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.previewImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}



.imageName {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.removeImageBtn {
  position: absolute;
  right: 4px;
  top: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: white;
  z-index: 10;
  opacity: 0.8;
}

.removeImageBtn:hover {
  opacity: 1;
  background-color: rgba(220, 53, 69, 0.8);
}

.extractedTextArea {
  padding: 10px 15px;
  border-top: 1px solid #eee;
}

.extractedTextHeader {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.extractedText {
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
}

/* 添加标签样式 */
.inputWithTags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  background: none;
  padding: 5px 15px;
  width: 100%;
  margin-left: -29px;
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
  /* background: transparent; */
}

/* 添加头部样式 */
.appHeader {
  width: 92%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  margin-top: 10px;
  background-color: #fff;
}

.rightSection {
  display: flex;
  align-items: center;
  gap: 15px;
}

.userInfo {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 添加地图容器样式 */
.headerMapWrapper {
  width: 90px;
  height: 27px;
  margin-right: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

/* 修复禁用状态下按钮图标不居中的问题 */
.el-button.is-circle {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 确保禁用状态下图标仍然居中 */
.el-button.is-circle.is-disabled {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 确保图标本身的定位正确 */
.el-button.is-circle .el-icon,
.el-button.is-circle.is-disabled .el-icon {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 更具体地定位发送按钮 */
.el-button[title="发送消息"] {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 确保禁用状态下的发送按钮图标居中 */
.el-button[title="发送消息"].is-disabled {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 确保发送按钮中的图标居中 */
.el-button[title="发送消息"] .el-icon,
.el-button[title="发送消息"].is-disabled .el-icon {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 专门修复禁用状态下的发送按钮图标居中问题 */
.el-button[title="发送消息"].is-disabled .el-icon {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

/* 确保按钮有相对定位，以便绝对定位的图标能够正确定位 */
.el-button[title="发送消息"].is-disabled {
  position: relative !important;
}

/* 编辑容器样式 */
.messageEditContainer {
  width: 100%;
}

/* 编辑操作按钮 */
.editActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 确保消息气泡有足够空间 */
.aiMessageBubble,
.userMessageBubble {
  position: relative;
  /* min-width: 200px; */
}
</style>