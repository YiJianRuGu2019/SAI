import { defineStore } from "pinia";
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";

export interface Message {
  id: string;
  content: string;
  role: string;
  timestamp?: number;
}

// 定义Chat接口
export interface Chat {
  id: string;
  messages: Message[];
  createdAt: Date;
  title: string;
}

// 使用选项式 API 定义 store
export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: [] as Message[],
    loading: false,
    pendingQuestion: "" as string,
    pendingSource: "landing" as "chat" | "landing",
    chats: [] as Chat[],
    currentChatId: null as string | null,
  }),

  actions: {
    addMessage(message: Omit<Message, "id" | "timestamp">) {
      this.messages.push({
        id: uuidv4(),
        role: message.role,
        content: message.content,
        timestamp: Date.now(),
      });
    },

    // 添加更新消息内容的方法
    updateMessage(index: number, newContent: string) {
      if (index >= 0 && index < this.messages.length) {
        this.messages[index].content = newContent;
        // 可选：更新时间戳表示消息已被编辑
        this.messages[index].timestamp = Date.now();
      }
    },

    setLoading(status: boolean) {
      this.loading = status;
    },

    clearMessages() {
      this.messages = [];
    },

    setPendingQuestion(
      question: string,
      source: "chat" | "landing" = "landing"
    ) {
      this.pendingQuestion = question;
      this.pendingSource = source;
    },

    consumePendingQuestion() {
      const question = this.pendingQuestion;
      const source = this.pendingSource;
      this.pendingQuestion = "";
      // 不重置pendingSource，保持最后一次的值
      return { question, source };
    },

    resetCurrentChat() {
      // 清空当前消息
      this.clearMessages();

      // 创建新聊天
      const newChatId = Date.now().toString();

      this.chats.push({
        id: newChatId,
        messages: [],
        createdAt: new Date(),
        title: "新对话",
      });

      this.currentChatId = newChatId;
      this.pendingQuestion = "";
    },

    addUserMessage(content: string) {
      this.messages.push({
        id: uuidv4(),
        content,
        role: "user",
        timestamp: Date.now(),
      });
    },

    saveMessages() {
      // 如果需要持久化，可以实现这里
      localStorage.setItem("chatMessages", JSON.stringify(this.messages));
    },
  },
});
