import { ElMessage } from "element-plus";
import { nextTick } from "vue";
import { Message } from "@/stores/chat";
import { sendStreamMessageToDeepseek } from "@/api/deepseek";

// ================= 富文本处理相关函数 =================

/**
 * 处理富文本内容，移除可能导致第一行空白的HTML标签
 * @param content 原始HTML内容
 * @returns 处理后的HTML内容
 */
export const processContentForEditor = (content: string): string => {
  if (!content) return "<p></p>";

  // 处理内容，移除可能导致第一行空白的HTML标签
  let processedContent = content.trim();

  // 使用更高效的单一正则表达式处理所有空白标签情况
  const emptyTagPattern =
    /^(<(p|div|span)>\s*(&nbsp;|<br\s*\/?>|\s)*\s*<\/(p|div|span)>|<br\s*\/?>|\s)+/gi;

  // 循环应用模式直到内容不再变化，设置最大迭代次数防止无限循环
  let previousContent;
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  do {
    previousContent = processedContent;
    processedContent = processedContent.replace(emptyTagPattern, "");
    iterations++;
  } while (
    previousContent !== processedContent &&
    processedContent.length > 0 &&
    iterations < MAX_ITERATIONS
  );

  // 如果内容没有以块级元素开头，添加段落标签
  if (
    processedContent &&
    !/^<(h[1-6]|p|ul|ol|div|table|blockquote)/i.test(processedContent)
  ) {
    processedContent = "<p>" + processedContent + "</p>";
  }

  return processedContent || "<p></p>"; // 确保始终返回有效内容
};

// ================= AI助手交互相关函数 =================

/**
 * 聚焦AI输入框
 */
export const focusAIInput = (): void => {
  nextTick(() => {
    const inputElement = document.querySelector(".aiTextInput input");
    if (inputElement) {
      (inputElement as HTMLElement).focus();
    }
  });
};

/**
 * 滚动AI消息容器到底部
 * @param container AI消息容器元素
 */
export const scrollAIMessagesToBottom = (
  container: HTMLElement | null
): void => {
  if (!container) return;

  // 使用requestAnimationFrame确保在浏览器渲染前执行
  requestAnimationFrame(() => {
    // 立即滚动到底部
    container.scrollTop = container.scrollHeight;

    // 使用单一延迟时间点进行滚动
    setTimeout(() => {
      if (container && document.contains(container)) {
        container.scrollTop = container.scrollHeight;
      }
    }, 200);
  });
};

/**
 * 发送消息到AI并处理响应
 * @param messages 消息历史
 * @param input 用户输入
 * @param callbacks 回调函数集合
 * @param source 指定使用哪种系统提示词模式，默认为"landing"，为文档编辑器生成带HTML标签的富文本
 */
export const sendToAI = async (
  messages: { role: string; content: string }[],
  input: string,
  callbacks: {
    onStart: (input: string) => void;
    onContent: (content: string) => void;
    onComplete: () => void;
    onError: (error: any) => void;
    handleEditorContent?: (content: string, done: boolean) => void;
  },
  source: "chat" | "landing" = "landing"
): Promise<void> => {
  const trimmedInput = input.trim();
  if (!trimmedInput) return;

  // 调用开始回调
  callbacks.onStart(trimmedInput);

  try {
    // 使用DeepSeek流式API
    await sendStreamMessageToDeepseek(
      messages.map((msg) => ({
        id: Date.now().toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      (content, done) => {
        // 更新流式内容
        callbacks.onContent(content);

        // 实时将内容插入到编辑器中
        if (callbacks.handleEditorContent) {
          callbacks.handleEditorContent(content, done);
        }

        // 响应完成时的处理
        if (done) {
          callbacks.onComplete();
        }
      },
      source
    );
  } catch (error: any) {
    callbacks.onError(error);
  }
};

/**
 * 处理AI错误
 * @param error 错误对象
 * @returns 处理后的错误信息
 */
export const handleAIError = (
  error: any
): {
  errorMessage: string;
  notificationMessage: string;
  duration: number;
} => {
  console.error("调用AI助手失败:", error);

  let errorMessage = "抱歉，我遇到了一些问题，请稍后再试。";
  let notificationMessage = "AI助手遇到问题，请稍后再试";
  let duration = 3000;

  // 根据错误类型提供不同的错误提示
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    errorMessage =
      "<p>抱歉，发生了网络连接错误。可能的原因：</p><ul><li>您的网络连接不稳定或已断开</li><li>VPN或代理设置可能影响了连接</li><li>服务器暂时不可用</li></ul><p>请检查您的网络连接，然后重新尝试。</p>";
    notificationMessage = "网络连接问题，请检查您的网络连接后重试";
    duration = 5000;
  } else if (error.message && error.message.includes("多次重试后仍然失败")) {
    errorMessage = "<p>抱歉，多次尝试后仍无法连接到AI服务器。请稍后再试。</p>";
    notificationMessage = "多次尝试后仍无法连接到服务器，请稍后再试";
    duration = 5000;
  }

  // 显示错误通知
  ElMessage.error({
    message: notificationMessage,
    duration,
  });

  return { errorMessage, notificationMessage, duration };
};

// ================= 编辑器操作相关函数 =================

/**
 * 将内容插入到编辑器中
 * @param editor 编辑器实例
 * @param content 要插入的内容
 * @returns 是否插入成功
 */
export const insertToEditor = (editor: any, content: string): boolean => {
  if (!editor) {
    ElMessage.warning("编辑器未初始化，请刷新页面后重试");
    return false;
  }

  try {
    // 使用model.change方法在文档末尾插入文本，确保内容始终按顺序添加
    editor.model.change((writer: any) => {
      // 创建要插入的内容片段
      const contentToInsert = editor.data.processor.toView(content);
      const modelFragment = editor.data.toModel(contentToInsert);

      // 始终将内容添加到文档末尾
      const position = writer.createPositionAt(
        editor.model.document.getRoot(),
        "end"
      );
      editor.model.insertContent(modelFragment, position);

      // 将光标移动到插入内容之后
      const newPosition = writer.createPositionAt(
        editor.model.document.getRoot(),
        "end"
      );
      writer.setSelection(newPosition);
    });

    // 将编辑器聚焦以便用户继续编辑
    editor.editing.view.focus();

    // 显示成功提示
    ElMessage.success("内容已插入到文档");
    return true;
  } catch (error) {
    console.error("插入内容到编辑器失败:", error);
    ElMessage.error("插入内容失败，请重试");
    return false;
  }
};

/**
 * 初始化编辑器以接收AI响应
 * @param editor 编辑器实例
 * @returns AI内容开始位置
 */
export const initEditorForAIResponse = (editor: any): number => {
  let startPosition = -1;

  editor.model.change((writer: any) => {
    // 创建一个新段落
    const paragraph = writer.createElement("paragraph");
    // 在文档末尾插入新段落
    const root = editor.model.document.getRoot();
    const position = writer.createPositionAt(root, "end");
    editor.model.insertContent(paragraph, position);

    // 记住AI内容开始位置
    startPosition = root.maxOffset - 1;
  });

  return startPosition;
};

/**
 * 插入处理后的内容到编辑器
 * @param editor 编辑器实例
 * @param writer 编辑器writer对象
 * @param root 编辑器root对象
 * @param content 要插入的内容
 * @param startPosition AI内容开始位置
 */
export const insertProcessedContent = (
  editor: any,
  writer: any,
  root: any,
  content: string,
  startPosition: number
): void => {
  try {
    // 处理内容并准备插入
    const processedContent = processContentForEditor(content);

    // 将完整的新内容插入到记录的位置
    const contentToInsert = editor.data.processor.toView(processedContent);
    const modelFragment = editor.data.toModel(contentToInsert);
    const insertPosition = writer.createPositionAt(root, startPosition);
    editor.model.insertContent(modelFragment, insertPosition);

    // 将光标移动到内容末尾并确保编辑器滚动到底部
    const newPosition = writer.createPositionAt(root, "end");
    writer.setSelection(newPosition);

    // 确保编辑器滚动到底部
    const editorElement = editor.editing.view.getDomRoot();
    if (editorElement) {
      editorElement.scrollTop = editorElement.scrollHeight;
    }
  } catch (error) {
    console.error("插入内容到编辑器失败:", error);

    // 尝试简化内容后重新插入
    try {
      const simpleContent =
        "<p>" + content.replace(/<\/?[^>]+(>|$)/g, "") + "</p>";
      const contentToInsert = editor.data.processor.toView(simpleContent);
      const modelFragment = editor.data.toModel(contentToInsert);
      const insertPosition = writer.createPositionAt(root, startPosition);
      editor.model.insertContent(modelFragment, insertPosition);
    } catch (fallbackError) {
      console.error("简化内容后插入仍然失败:", fallbackError);
    }
  }
};

// ================= 实用工具函数 =================

/**
 * 复制内容到剪贴板
 * @param content 要复制的内容
 */
export const copyToClipboard = (content: string): void => {
  if (!content) {
    ElMessage.info("暂无内容可复制");
    return;
  }

  // 使用navigator.clipboard API复制，失败时降级
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(content)
      .then(() => ElMessage.success("内容已复制到剪贴板"))
      .catch(() => fallbackCopy(content));
  } else {
    fallbackCopy(content);
  }
};

/**
 * 降级的复制方法（用于不支持clipboard API的浏览器）
 * @param text 要复制的文本
 */
export const fallbackCopy = (text: string): void => {
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  // 确保临时元素在屏幕外
  tempTextArea.style.position = "absolute";
  tempTextArea.style.left = "-9999px";
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  try {
    document.execCommand("copy");
    ElMessage.success("内容已复制到剪贴板");
  } catch (err) {
    console.error("复制失败:", err);
    ElMessage.error("复制失败，请手动复制");
  }
  document.body.removeChild(tempTextArea);
};

/**
 * 格式化日期
 * @param timestamp 时间戳
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 生成唯一文档ID
 * @returns 生成的文档ID
 */
export const generateDocId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 加载CKEditor脚本
 * @returns Promise 加载完成的Promise
 */
export const loadCKEditorScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.ClassicEditor) {
      resolve();
      return;
    }

    try {
      // 加载CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.ckeditor.com/ckeditor5/38.1.0/classic/ckeditor.css";
      document.head.appendChild(link);

      // 加载中文语言包
      const langScript = document.createElement("script");
      langScript.src =
        "https://cdn.ckeditor.com/ckeditor5/38.1.0/classic/translations/zh.js";
      document.head.appendChild(langScript);

      // 加载主脚本，使用更全面的版本
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/ckeditor5-build-classic@38.1.0/build/ckeditor.js";
      script.async = true;

      script.onload = () => {
        console.log("CKEditor脚本加载成功");
        // 给一定时间确保语言包已加载
        setTimeout(() => {
          if (window.ClassicEditor) {
            resolve();
          } else {
            reject(new Error("CKEditor加载超时"));
          }
        }, 800);
      };

      script.onerror = (error) => {
        console.error("CKEditor脚本加载失败", error);
        // 尝试使用备用CDN
        const backupScript = document.createElement("script");
        backupScript.src =
          "https://cdn.ckeditor.com/ckeditor5/38.1.0/classic/ckeditor.js";
        backupScript.async = true;

        backupScript.onload = () => {
          console.log("使用备用CDN加载CKEditor成功");
          setTimeout(() => {
            if (window.ClassicEditor) {
              resolve();
            } else {
              reject(new Error("备用CKEditor加载超时"));
            }
          }, 800);
        };

        backupScript.onerror = (backupError) => {
          console.error("备用CKEditor加载失败", backupError);
          reject(backupError);
        };

        document.head.appendChild(backupScript);
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error("加载CKEditor时出错:", error);
      reject(error);
    }
  });
};

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
