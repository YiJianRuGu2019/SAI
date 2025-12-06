import { ref, nextTick } from "vue";
import { ElMessage } from "element-plus";

export default function useMessageEditor(
  chatStore: any,
  sendMessageFn: Function
) {
  // 状态变量
  const editingMessageId = ref<string | null>(null);
  const editingContent = ref("");
  const seamlessEditInput = ref<HTMLTextAreaElement | null>(null);

  // 计算光标位置
  function calculateTextPosition(
    textareaEl: HTMLTextAreaElement,
    posInfo: any
  ): number {
    try {
      const text = textareaEl.value;
      const lines = text.split("\n");

      // 确保行索引在有效范围内
      const lineIndex = Math.min(
        Math.max(0, posInfo.lineIndex),
        lines.length - 1
      );

      // 计算当前行之前的所有字符数
      let charCount = 0;
      for (let i = 0; i < lineIndex; i++) {
        charCount += lines[i].length + 1; // +1 是换行符
      }

      // 获取当前行
      const currentLine = lines[lineIndex];

      // 推测每个字符的平均宽度
      const avgCharWidth = posInfo.fontSize * 0.6;

      // 基于点击的X坐标计算字符位置
      const estimatedCharPos = Math.round(posInfo.relativeX / avgCharWidth);

      // 确保位置在当前行的有效范围内
      const charPos = Math.min(
        Math.max(0, estimatedCharPos),
        currentLine.length
      );

      // 返回最终位置
      return charCount + charPos;
    } catch (error) {
      console.error("计算文本位置失败:", error);
      // 如果出错，回退到将光标放在文本开头
      return 0;
    }
  }

  // 计算文本区域的行数 - 考虑内容长度和换行
  function computeRows(text: string): number {
    // 计算基本行数（根据换行符）
    const lineBreaks = text.split("\n").length;

    // 计算每行的平均字符数（假设平均每行约50个字符）
    const charsPerLine = 50;

    // 计算由于文本长度导致的额外行数（考虑自动换行）
    const textLines = Math.ceil(text.length / charsPerLine);

    // 取两者的较大值，并确保在2-10行之间
    const estimatedRows = Math.max(lineBreaks, textLines);
    return Math.min(Math.max(estimatedRows, 2), 10); // 最少2行，最多10行
  }

  // 开始编辑消息
  function startEditing(messageId: string, content: string, event: Event) {
    // 阻止事件冒泡
    event?.stopPropagation();

    // 保存点击的位置，用于后续设置光标
    const clickEvent = event as MouseEvent;
    const clickX = clickEvent.clientX;
    const clickY = clickEvent.clientY;

    // 找到原始消息元素，记录其高度和样式
    const originalMessage = event.currentTarget as HTMLElement;
    const originalHeight = originalMessage.offsetHeight;
    const originalWidth = originalMessage.offsetWidth;
    const originalClientWidth = originalMessage.clientWidth;

    // 获取原始消息的计算样式
    const computedStyle = window.getComputedStyle(originalMessage);
    const fontSize = computedStyle.fontSize;
    const color = computedStyle.color;
    const lineHeight = computedStyle.lineHeight;
    const fontFamily = computedStyle.fontFamily;
    const padding = computedStyle.padding;
    const paddingLeft = computedStyle.paddingLeft;
    const paddingRight = computedStyle.paddingRight;
    const margin = computedStyle.margin;
    const borderBox = computedStyle.boxSizing === "border-box";

    // 获取点击位置相对于原始消息内容的偏移量
    const messageRect = originalMessage.getBoundingClientRect();
    const relativeX = clickX - messageRect.left;
    const relativeY = clickY - messageRect.top;

    // 计算行高
    const lh = parseFloat(lineHeight) || parseFloat(fontSize) * 1.5;
    const clickedLineIndex = Math.floor(relativeY / lh);

    // 记录这个位置信息，用于后续设置光标
    const positionInfo = {
      relativeX,
      relativeY,
      lineIndex: clickedLineIndex,
      content,
      lineHeight: lh,
      fontSize: parseFloat(fontSize),
    };

    // 设置编辑状态
    editingMessageId.value = messageId;
    editingContent.value = content;

    // 使用nextTick确保DOM已更新，然后设置内容并聚焦
    nextTick(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const editModeEl = document.querySelector(".messageText.editMode");
      if (editModeEl instanceof HTMLElement) {
        // 设置与原始消息相同的尺寸和样式特性
        editModeEl.style.height = `${originalHeight}px`;
        editModeEl.style.width = `${originalWidth}px`;
        editModeEl.style.minWidth = `${originalWidth}px`;
        editModeEl.style.maxWidth = `${originalWidth}px`;
        editModeEl.style.boxSizing = computedStyle.boxSizing;
        editModeEl.style.padding = padding;
        editModeEl.style.paddingLeft = paddingLeft;
        editModeEl.style.paddingRight = paddingRight;
        editModeEl.style.margin = margin;
      }

      // 获取Element Plus的文本区域容器
      const editorInputEl = document.querySelector(".editorInput");
      if (editorInputEl instanceof HTMLElement) {
        editorInputEl.style.width = `${originalClientWidth}px`;
        editorInputEl.style.minWidth = `${originalClientWidth}px`;
        editorInputEl.style.maxWidth = `${originalClientWidth}px`;
        editorInputEl.style.boxSizing = "border-box";
      }

      const textareaEl = document.querySelector(
        ".editorInput .el-textarea__inner"
      );
      if (textareaEl instanceof HTMLTextAreaElement) {
        const textareaWidth = borderBox
          ? originalClientWidth
          : originalClientWidth -
            parseInt(paddingLeft || "0") -
            parseInt(paddingRight || "0");

        // 应用原始消息的字体样式
        textareaEl.style.cssText = `
          font-size: ${fontSize} !important;
          color: ${color} !important;
          line-height: ${lineHeight} !important;
          font-family: ${fontFamily} !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          height: ${originalHeight}px !important;
          width: ${textareaWidth}px !important;
          min-width: ${textareaWidth}px !important;
          max-width: ${textareaWidth}px !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow-y: hidden !important;
          box-sizing: border-box !important;
        `;

        // 确保应用了中文字体
        if (
          !fontFamily.includes("Source Han Serif CN") &&
          !fontFamily.includes("serif")
        ) {
          textareaEl.style.fontFamily =
            '"Source Han Serif CN", serif !important';
        }

        // 调整textarea容器的高度和宽度
        const textareaWrapper = textareaEl.closest(".el-textarea");
        if (textareaWrapper) {
          (textareaWrapper as HTMLElement).style.height = `${originalHeight}px`;
          (textareaWrapper as HTMLElement).style.width = `${textareaWidth}px`;
          (
            textareaWrapper as HTMLElement
          ).style.minWidth = `${textareaWidth}px`;
          (
            textareaWrapper as HTMLElement
          ).style.maxWidth = `${textareaWidth}px`;
          (textareaWrapper as HTMLElement).style.margin = "0";
          (textareaWrapper as HTMLElement).style.padding = "0";
          (textareaWrapper as HTMLElement).style.overflow = "hidden";
          (textareaWrapper as HTMLElement).style.boxSizing = "border-box";
        }

        // 聚焦文本区域
        textareaEl.focus();

        // 从点击位置计算光标位置并设置
        setTimeout(() => {
          const selectionIndex = calculateTextPosition(
            textareaEl,
            positionInfo
          );
          textareaEl.setSelectionRange(selectionIndex, selectionIndex);
        }, 0);
      }
    });
  }

  // 取消编辑
  function cancelEdit() {
    editingMessageId.value = null;
    editingContent.value = "";
  }

  // 点击其他区域时确认编辑
  function confirmEditOnBlur(event: FocusEvent) {
    // 检查是否点击了取消按钮（避免点击取消按钮时也触发保存）
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (
      relatedTarget &&
      (relatedTarget.classList.contains("el-button") ||
        relatedTarget.closest(".el-button"))
    ) {
      return;
    }

    // 自动保存
    const index = chatStore.messages.findIndex(
      (msg: any) => msg.id === editingMessageId.value
    );
    if (index !== -1) {
      // 只更新内容，不发送
      if (!editingContent.value.trim()) {
        ElMessage.warning("消息内容不能为空");
        return;
      }
      chatStore.updateMessage(index, editingContent.value.trim());
      cancelEdit();
      ElMessage.success({
        message: "消息已更新",
        duration: 1500,
      });
    }
  }

  // 发送编辑后的消息
  function sendEditedMessage(index: number) {
    if (!editingContent.value.trim()) {
      ElMessage.warning("消息内容不能为空");
      return;
    }

    // 获取当前正在编辑的消息
    const currentMessage = chatStore.messages[index];
    if (!currentMessage || currentMessage.role !== "user") {
      cancelEdit();
      return;
    }

    // 更新消息内容
    chatStore.updateMessage(index, editingContent.value.trim());

    // 关闭编辑模式
    cancelEdit();

    // 计算需要移除的消息数量 - 移除当前消息之后的所有消息
    const messagesToRemove = chatStore.messages.length - index - 1;
    if (messagesToRemove > 0) {
      // 移除后续消息
      for (let i = 0; i < messagesToRemove; i++) {
        chatStore.messages.pop();
      }
    }

    // 立即发送修改后的消息
    nextTick(() => {
      sendMessageFn(false); // 不添加新的用户消息，而是使用已经更新的消息
    });
  }

  return {
    editingMessageId,
    editingContent,
    seamlessEditInput,
    startEditing,
    cancelEdit,
    confirmEditOnBlur,
    sendEditedMessage,
    computeRows,
  };
}
