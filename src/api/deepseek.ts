import { Message } from "@/stores/chat";
import API_KEYS from "@/api/apiKeys.js";

interface DeepseekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface DeepseekRequestBody {
  model: string;
  messages: DeepseekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream: boolean;
}

interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    message: DeepseekMessage;
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepseekStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: null | string;
    index: number;
  }[];
}

// 创建系统消息函数 - 增强了系统提示以提供更好的富文本输出
function createSystemMessage(
  source: "chat" | "landing" = "chat"
): DeepseekMessage {
  // 简洁版提示词 - 用于ChatView页面
  const chatPrompt: DeepseekMessage = {
    role: "system",
    content:
      "你是一个友好的AI助手，提供简洁清晰的回答，回答的内容不要带任何符号，不要回答涉及政治，宗教等敏感话题，比如'*,#,$'，如果你接收到的内容有明确的地址的话请根据你接收到的地址和本次的提示词相结合，生成带有该地址的内容，要求美好，清新。",
  };

  // 详细版提示词 - 用于officeWeb页面
  const landingPrompt: DeepseekMessage = {
    role: "system",
    content:
      "你是一个专业的内容创作助手，擅长生成结构清晰、层次分明的高质量内容(如果你接收到的内容有明确的地址的话请根据你接收到的地址和本次的提示词相结合，生成带有该地址的内容，要求美好，清新)。请严格按照以下规范提供回答：\n\n" +
      "1. 使用<h1>标签作为主标题，内容简洁有力\n" +
      "2. 使用<h2>标签作为主要章节标题，确保逻辑分明\n" +
      "3. 使用<h3>标签作为次级章节标题，提供更细致的内容分类\n" +
      "4. 使用<p>标签包裹所有段落文本，段落应当简明扼要\n" +
      "5. 使用<ul>和<li>标签创建条目清晰的列表\n" +
      "6. 使用<ol>和<li>标签创建有序列表，适用于步骤说明\n" +
      "7. 使用<strong>标签强调重要内容，但不要过度使用\n" +
      "8. 使用<em>标签表示需要强调的内容\n" +
      "9. 适当使用<br>标签分隔内容，确保视觉上的整洁\n\n" +
      "你的回答必须：\n" +
      "- 始终以<h1>或<h2>级别的标题开始，提供清晰的内容主题\n" +
      "- 每个段落必须用<p>标签包裹，保持格式一致性\n" +
      "- 保持层级分明的标题结构，使内容易于理解\n" +
      "- 在关键点使用无序列表或有序列表，提高可读性\n" +
      "- 确保所有标签都正确配对和嵌套\n\n" +
      "你的回答应当包含适当的HTML标签，以便在富文本编辑器中直接展示，但不要使用完整的HTML文档结构（无需<!DOCTYPE>、<html>、<body>等标签）。\n" +
      "确保输出内容布局美观，各级标题突出，并使用适当的间距使内容易于阅读",
  };

  return source === "chat" ? chatPrompt : landingPrompt;
}

// 转换消息格式函数 - 修复类型问题
function convertMessages(
  messages: Message[],
  source: "chat" | "landing" = "chat"
): DeepseekMessage[] {
  const systemMessage = createSystemMessage(source);
  const userMessages = messages.map((msg) => ({
    role:
      msg.role === "user" || msg.role === "assistant" || msg.role === "system"
        ? msg.role
        : ((msg.role === "human" ? "user" : "assistant") as
            | "user"
            | "assistant"
            | "system"),
    content: msg.content,
  }));

  return [systemMessage, ...userMessages];
}

/**
 * 向DeepSeek发送流式API请求，实时返回响应内容
 * @param messages 聊天消息历史
 * @param onChunk 处理返回内容的回调函数
 * @param source 消息来源页面，用于选择不同的系统提示词
 */
export async function sendStreamMessageToDeepseek(
  messages: Message[],
  onChunk: (content: string, done: boolean) => void,
  source: "chat" | "landing" = "chat"
): Promise<void> {
  const MAX_RETRIES = 3;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const deepseekUrl = "https://api.deepseek.com/v1/chat/completions";
      const deepseekMessages = convertMessages(messages, source);
      const API_KEY = API_KEYS.DEEPSEEK;

      const requestBody: DeepseekRequestBody = {
        model: "deepseek-chat", // 使用deepseek-chat模型以获得更好的文本结构
        messages: deepseekMessages,
        temperature: 0.5, // 降低温度以获得更一致的格式
        max_tokens: 4000,
        stream: true,
      };

      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      const response = await fetch(deepseekUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // 清除超时

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error("响应中没有内容");
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialLine = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 流结束但没有收到[DONE]标记，也视为完成
          onChunk(fullContent, true);
          return;
        }

        // 解码二进制数据并添加到累积器
        const chunk = decoder.decode(value, { stream: true });
        partialLine += chunk;

        // 处理可能包含多个事件的数据
        let lines = partialLine.split("\n");
        partialLine = lines.pop() || ""; // 保存最后一个不完整的行

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.trim() === "data: [DONE]") {
            // 确保内容包含合适的HTML结构
            onChunk(fullContent, true);
            return;
          }
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6); // 移除 "data: " 前缀
              const data = JSON.parse(jsonStr) as DeepseekStreamChunk;
              const content = data.choices[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                onChunk(fullContent, false);
              }
            } catch (e) {
              console.error("解析流式响应失败:", e);
            }
          }
        }
      }
    } catch (error) {
      lastError = error as Error;
      retries++;

      // 网络错误特殊处理
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("network"));

      if (isNetworkError && retries < MAX_RETRIES) {
        console.warn(`网络错误，正在进行第${retries}次重试...`);
        // 指数退避重试，等待时间随重试次数增加
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries))
        );
        continue;
      }

      // 如果是最后一次重试或非网络错误，则抛出
      console.error("调用Deepseek流式API时出错:", error);
      throw error;
    }
  }

  // 如果所有重试都失败
  if (lastError) {
    throw new Error(`多次重试后仍然失败: ${lastError.message}`);
  }
}
