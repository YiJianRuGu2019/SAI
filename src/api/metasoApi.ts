// 秘塔AI搜索API服务
import API_KEYS from "@/api/apiKeys.js";

export interface MetasoSearchRequest {
  q: string; // 搜索查询
  scope?: string; // 搜索范围，默认为 'webpage'
  includeSummary?: boolean; // 是否包含摘要，默认为 false
  size?: number; // 返回结果数量，默认为 10
  includeRawContent?: boolean; // 是否包含原始内容，默认为 false
  conciseSnippet?: boolean; // 是否使用简洁摘要，默认为 false
  format?: string; // 响应格式，默认为 'chat_completions'
}

// 秘塔AI实际返回的网页结果格式
export interface MetasoWebpage {
  title: string;
  link: string;
  score: string; // 'high', 'medium', 'low'
  snippet: string;
  position: number;
  authors?: string[];
  date?: string;
}

// 秘塔AI实际返回的图片结果格式
export interface MetasoImage {
  title: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  score?: string;
  position: number;
  sourceUrl?: string;
}

// 秘塔AI实际API响应格式
export interface MetasoApiResponse {
  credits: number;
  searchParameters: {
    q: string;
    scope: string;
    size: number;
    includeSummary: boolean;
    includeRawContent: boolean;
    conciseSnippet: boolean;
    format: string;
  };
  webpages?: MetasoWebpage[]; // 网页搜索结果
  documents?: MetasoWebpage[]; // 文档搜索结果
  scholars?: MetasoWebpage[]; // 学术搜索结果
  videos?: MetasoWebpage[]; // 视频搜索结果
  images?: MetasoImage[]; // 图片搜索结果
  total: number;
  [key: string]: any; // 支持动态字段访问
}

// 统一的搜索结果格式（用于前端展示）
export interface MetasoSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
  score?: string;
  position?: number;
  authors?: string[];
}

export interface MetasoSearchResponse {
  results: MetasoSearchResult[];
  images?: MetasoImage[]; // 图片搜索结果
  total: number;
  searchTime: number;
  query: string;
  credits?: number;
}

// 秘塔AI API配置
const METASO_API_CONFIG = {
  baseUrl: "https://metaso.cn/api/v1/search",
  getHeaders: () => ({
    Authorization: `Bearer ${API_KEYS.METASO}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  }),
};

/**
 * 调用秘塔AI搜索API
 * @param searchParams 搜索参数
 * @returns Promise<MetasoSearchResponse>
 */
export async function searchWithMetaso(
  searchParams: MetasoSearchRequest
): Promise<MetasoSearchResponse> {
  const startTime = Date.now();

  try {
    // 构建请求参数
    const requestData = {
      q: searchParams.q,
      scope: searchParams.scope || "webpage",
      includeSummary: searchParams.includeSummary || false,
      size: searchParams.size || 10,
      includeRawContent: searchParams.includeRawContent || false,
      conciseSnippet: searchParams.conciseSnippet || false,
    };

    console.log("发送秘塔AI搜索请求:", requestData);

    const response = await fetch(METASO_API_CONFIG.baseUrl, {
      method: "POST",
      headers: METASO_API_CONFIG.getHeaders(),
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(
        `秘塔AI搜索API请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data: MetasoApiResponse = await response.json();
    const searchTime = (Date.now() - startTime) / 1000;

    // 调试：打印完整的API响应数据
    console.log("完整API响应数据:", data);
    console.log("API响应中的所有字段:", Object.keys(data));

    // 处理响应数据，转换为统一格式
    // 根据scope动态获取对应的数据字段
    const scope = searchParams.scope || "webpage";

    // 创建字段映射，处理可能的字段名差异
    const fieldMapping: Record<string, string> = {
      webpage: "webpages",
      document: "documents",
      scholar: "scholars",
      video: "videos",
      image: "images",
    };

    const actualField = fieldMapping[scope] || scope;
    const sourceData = data[actualField] || [];

    console.log(`请求的scope: ${scope}`);
    console.log(`映射到的字段: ${actualField}`);
    console.log(`从 data.${actualField} 获取数据:`, sourceData);
    console.log(`数据长度: ${sourceData.length}`);

    // 处理图片搜索结果
    if (scope === "image" && data.images) {
      return {
        results: [], // 图片搜索时results为空
        images: data.images,
        total: data.total || data.images.length,
        searchTime: searchTime,
        query: searchParams.q,
        credits: data.credits,
      };
    }

    // 处理其他类型的搜索结果
    const processedResults: MetasoSearchResult[] = sourceData.map(
      (item: any) => ({
        title: item.title || "无标题",
        url: item.link || "",
        snippet: item.snippet || "无摘要",
        publishedDate: item.date,
        source: extractDomainFromUrl(item.link),
        score: item.score,
        position: item.position,
        authors: item.authors,
      })
    );

    return {
      results: processedResults,
      total: data.total || processedResults.length,
      searchTime: searchTime,
      query: searchParams.q,
      credits: data.credits,
    };
  } catch (error) {
    console.error("秘塔AI搜索API调用失败:", error);

    // 返回错误响应
    return {
      results: [],
      total: 0,
      searchTime: (Date.now() - startTime) / 1000,
      query: searchParams.q,
    };
  }
}

/**
 * 从URL中提取域名作为来源
 * @param url 完整URL
 * @returns 域名
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "未知来源";
  }
}

/**
 * 快速搜索函数，使用默认参数
 * @param query 搜索查询
 * @returns Promise<MetasoSearchResponse>
 */
export async function quickSearch(
  query: string
): Promise<MetasoSearchResponse> {
  return searchWithMetaso({
    q: query,
    scope: "webpage",
    includeSummary: false,
    size: 10,
    includeRawContent: false,
    conciseSnippet: false,
  });
}

/**
 * 详细搜索函数，包含摘要和原始内容
 * @param query 搜索查询
 * @param size 结果数量
 * @returns Promise<MetasoSearchResponse>
 */
export async function detailedSearch(
  query: string,
  size: number = 10
): Promise<MetasoSearchResponse> {
  return searchWithMetaso({
    q: query,
    scope: "webpage",
    includeSummary: true,
    size: size,
    includeRawContent: true,
    conciseSnippet: true,
  });
}

/**
 * 图片搜索函数
 * @param query 搜索查询
 * @param size 结果数量
 * @returns Promise<MetasoSearchResponse>
 */
export async function imageSearch(
  query: string,
  size: number = 20
): Promise<MetasoSearchResponse> {
  return searchWithMetaso({
    q: query,
    scope: "image",
    includeSummary: false,
    size: size,
    includeRawContent: false,
    conciseSnippet: false,
  });
}
