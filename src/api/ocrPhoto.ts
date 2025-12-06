import API_KEYS from "@/api/apiKeys.js";
// OCR图片识别模块
// 定义结果类型
export interface OCRResult {
  success: boolean;
  text: string;
  error?: string;
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// 验证文件
export function validateImageFile(file: File): boolean {
  // 检查文件类型
  const acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!acceptedTypes.includes(file.type)) {
    ElMessage.error("只支持 JPG、PNG、GIF 和 WEBP 格式的图片");
    return false;
  }

  // 检查文件大小 (限制为 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error("图片大小不能超过 10MB");
    return false;
  }

  return true;
}

// OCR处理函数
export async function processImageOCR(file: File): Promise<string> {
  try {
    // 创建FormData对象直接发送文件
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "chs"); // 中文简体 + 英文
    formData.append("apikey", API_KEYS.OCR); // 使用统一配置的API密钥
    formData.append("OCREngine", "2"); // 使用更新的OCR引擎
    formData.append("scale", "true"); // 自动缩放
    formData.append("isTable", "false"); // 不检测表格

    // 发送OCR请求
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR API 请求失败: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "识别过程出错");
    }

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      return result.ParsedResults[0].ParsedText || "";
    } else {
      return "未识别到文字";
    }
  } catch (error) {
    console.error("OCR 处理错误:", error);
    throw error;
  }
}
