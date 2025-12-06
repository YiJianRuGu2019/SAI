// 腾讯地图API配置和加载管理
import API_KEYS from '@/api/apiKeys.js'

const TXMAP_API_CONFIG = {
  get key () {
    return API_KEYS.TENCENT_MAP
  },
  version: '2.exp',  // JavaScript API 版本
  libraries: 'geometry,service',
  // WebService API 前缀（统一）
  apiBaseUrl: 'https://apis.map.qq.com'
};

// 腾讯地图加载状态
let txMapLoadingPromise = null;
let txMapLoaded = false;

/**
 * 检查腾讯地图是否已加载
 * @returns {boolean}
 */
export function isTxMapLoaded () {
  return txMapLoaded && typeof TMap !== 'undefined';
}

/**
 * 加载腾讯地图API
 * @param {Function} callback - 加载完成后的回调函数
 * @returns {Promise}
 */
export function loadTxMapAPI (callback) {
  // 如果已经加载，直接返回
  if (isTxMapLoaded()) {
    if (callback) callback();
    return Promise.resolve();
  }

  // 如果正在加载，返回现有的 Promise
  if (txMapLoadingPromise) {
    return txMapLoadingPromise;
  }

  // 创建新的加载 Promise
  txMapLoadingPromise = new Promise((resolve, reject) => {
    // 创建全局回调函数
    window.initTxMap = () => {
      txMapLoaded = true;
      console.log('腾讯地图API加载成功');
      if (callback) callback();
      resolve();
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    // 使用正确的腾讯地图 JavaScript API v2.1 URL
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${TXMAP_API_CONFIG.key}&callback=initTxMap`;

    script.onload = () => {
      console.log('腾讯地图脚本加载完成');
    };

    script.onerror = (error) => {
      console.error('腾讯地图API加载失败:', error);
      txMapLoadingPromise = null;
      reject(new Error('腾讯地图API加载失败，请检查网络或API Key'));
    };

    // 添加到页面
    document.head.appendChild(script);
    console.log('开始加载腾讯地图API:', script.src);
  });

  return txMapLoadingPromise;
}

/**
 * 创建腾讯地图实例
 * @param {string} containerId - 地图容器ID
 * @param {Object} options - 地图配置选项
 * @returns {Object} 地图实例
 */
export function createTxMap (containerId, options = {}) {
  if (!isTxMapLoaded()) {
    console.error('腾讯地图API未加载');
    return null;
  }

  const defaultOptions = {
    center: new qq.maps.LatLng(39.916527, 116.397128), // 默认北京
    zoom: 12,
    disableDefaultUI: false,
    ...options
  };

  const map = new qq.maps.Map(document.getElementById(containerId), defaultOptions);
  return map;
}

/**
 * 创建标记点
 * @param {Object} map - 地图实例
 * @param {Object} position - 位置 {lat, lng}
 * @param {Object} options - 标记配置
 * @returns {Object} 标记实例
 */
export function createMarker (map, position, options = {}) {
  if (!isTxMapLoaded()) {
    console.error('腾讯地图API未加载');
    return null;
  }

  const marker = new qq.maps.Marker({
    position: new qq.maps.LatLng(position.lat, position.lng),
    map: map,
    ...options
  });

  return marker;
}

/**
 * 关键词输入提示 - 使用 WebService API
 * @param {string} keyword - 搜索关键词
 * @param {Object} location - 中心点坐标 {lat, lng}（可选）
 * @returns {Promise}
 */
export function getSuggestion (keyword, location = null) {
  const url = `${TXMAP_API_CONFIG.apiBaseUrl}/ws/place/v1/suggestion`;
  const params = {
    keyword: keyword,
    key: TXMAP_API_CONFIG.key,
    output: 'jsonp',
    callback: 'suggestionCallback'
  };

  // 如果提供了位置，添加 region 参数
  if (location) {
    params.location = `${location.lat},${location.lng}`;
  }

  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryString}`;

  console.log('🗺️ [腾讯地图API] 关键词输入提示:', fullUrl);

  return new Promise((resolve, reject) => {
    // 创建 JSONP 回调
    window.suggestionCallback = (result) => {
      console.log('✅ [腾讯地图API] 关键词提示响应:', result);
      if (result.status === 0) {
        resolve(result);
      } else {
        console.error('❌ [腾讯地图API] 关键词提示失败:', result);
        reject(new Error(result.message || '获取提示失败'));
      }
      delete window.suggestionCallback;
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = fullUrl;
    script.onerror = () => {
      console.error('❌ [腾讯地图API] 关键词提示请求失败');
      reject(new Error('获取提示请求失败'));
      delete window.suggestionCallback;
    };
    document.head.appendChild(script);

    // 清理 script 标签
    setTimeout(() => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    }, 1000);
  });
}

/**
 * 地点搜索 - 使用 WebService API
 * @param {string} keyword - 搜索关键词
 * @param {Object} location - 中心点坐标 {lat, lng}
 * @param {number} radius - 搜索半径（米）
 * @returns {Promise}
 */
export function searchPlace (keyword, location, radius = 5000) {
  const url = `${TXMAP_API_CONFIG.apiBaseUrl}/ws/place/v1/search`;
  const callbackName = `txMapCallback_${Date.now()}`;
  const params = new URLSearchParams({
    keyword: keyword,
    boundary: `nearby(${location.lat},${location.lng},${radius})`,
    key: TXMAP_API_CONFIG.key,
    output: 'jsonp',
    callback: callbackName
  });

  const fullUrl = `${url}?${params.toString()}`;
  console.log('🗺️ [腾讯地图API] 地点搜索:', fullUrl);

  return new Promise((resolve, reject) => {
    // 创建 JSONP 回调
    window[callbackName] = (result) => {
      console.log('✅ [腾讯地图API] 地点搜索响应:', result);
      if (result.status === 0) {
        resolve(result);
      } else {
        console.error('❌ [腾讯地图API] 地点搜索失败:', result);
        reject(new Error(result.message || '搜索失败'));
      }
      delete window[callbackName];
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = fullUrl;
    script.onerror = () => {
      console.error('❌ [腾讯地图API] 地点搜索请求失败');
      reject(new Error('搜索请求失败'));
      delete window[callbackName];
    };
    document.head.appendChild(script);

    // 清理 script 标签
    setTimeout(() => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    }, 1000);
  });
}

/**
 * 获取静态地图 - 使用 WebService API
 * @param {Object} options - 地图配置
 *   - center: 中心点坐标，可以是字符串 "lat,lng" 或对象 {lat, lng}
 *   - zoom: 缩放级别
 *   - size: 地图尺寸 "width*height"
 *   - markers: 标记点，格式 "lat,lng"
 * @returns {string} 静态地图 URL
 */
export function getStaticMap (options) {
  const url = `${TXMAP_API_CONFIG.apiBaseUrl}/ws/staticmap/v2/`;

  // 处理 center 参数，支持字符串和对象两种格式
  let centerStr;
  if (typeof options.center === 'string') {
    centerStr = options.center;
  } else if (options.center && options.center.lat && options.center.lng) {
    centerStr = `${options.center.lat},${options.center.lng}`;
  } else {
    console.error('❌ [腾讯地图API] center 参数格式错误:', options.center);
    return '';
  }

  const params = {
    center: centerStr,
    zoom: options.zoom || 12,
    size: options.size || '900*583',
    key: TXMAP_API_CONFIG.key
  };

  // 如果有标记点
  if (options.markers) {
    params.markers = options.markers;
  }

  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryString}`;

  console.log('🗺️ [腾讯地图API] 静态地图:', fullUrl);

  return fullUrl;
}

/**
 * 逆地理编码 - 坐标转地址（使用 WebService API）
 * @param {Object} latLng - 坐标 {lat, lng}
 * @returns {Promise}
 */
export function reverseGeocode (latLng) {
  const url = `${TXMAP_API_CONFIG.apiBaseUrl}/ws/geocoder/v1/`;

  // 使用 JSONP 方式调用
  const callbackName = `txMapCallback_${Date.now()}`;
  const params = new URLSearchParams({
    location: `${latLng.lat},${latLng.lng}`,
    key: TXMAP_API_CONFIG.key,
    output: 'jsonp',
    callback: callbackName
  });

  const fullUrl = `${url}?${params.toString()}`;
  console.log('🗺️ [腾讯地图API] 逆地理编码:', fullUrl);

  return new Promise((resolve, reject) => {
    // 创建 JSONP 回调
    window[callbackName] = (result) => {
      console.log('✅ [腾讯地图API] 逆地理编码响应:', result);
      if (result.status === 0) {
        resolve(result);
      } else {
        console.error('❌ [腾讯地图API] 逆地理编码失败:', result);
        reject(new Error(result.message || '逆地理编码失败'));
      }
      // 清理回调函数
      delete window[callbackName];
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = fullUrl;
    script.onerror = () => {
      console.error('❌ [腾讯地图API] 逆地理编码请求失败');
      reject(new Error('逆地理编码请求失败'));
      delete window[callbackName];
    };
    document.head.appendChild(script);

    // 清理 script 标签
    setTimeout(() => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    }, 1000);
  });
}

/**
 * 获取当前城市信息（使用 IP 定位）
 * @param {string} ip - IP 地址（可选，不传则自动识别请求来源 IP）
 * @returns {Promise}
 */
export function getCurrentCity (ip = null) {
  const url = `${TXMAP_API_CONFIG.apiBaseUrl}/ws/location/v1/ip`;
  const callbackName = `txMapCallback_${Date.now()}`;
  const params = {
    key: TXMAP_API_CONFIG.key,
    output: 'jsonp',
    callback: callbackName
  };

  // 如果指定了 IP 地址
  if (ip) {
    params.ip = ip;
  }

  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryString}`;

  console.log('🗺️ [腾讯地图API] IP定位:', fullUrl);

  return new Promise((resolve, reject) => {
    // 创建 JSONP 回调
    window[callbackName] = (result) => {
      console.log('✅ [腾讯地图API] IP定位响应:', result);
      if (result.status === 0) {
        resolve(result);
      } else {
        console.error('❌ [腾讯地图API] IP定位失败:', result);
        reject(new Error(result.message || '获取城市信息失败'));
      }
      delete window[callbackName];
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = fullUrl;
    script.onerror = () => {
      console.error('❌ [腾讯地图API] IP定位请求失败');
      reject(new Error('获取城市信息请求失败'));
      delete window[callbackName];
    };
    document.head.appendChild(script);

    // 清理 script 标签
    setTimeout(() => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    }, 1000);
  });
}

export default {
  loadTxMapAPI,
  isTxMapLoaded,
  createTxMap,
  createMarker,
  getSuggestion,
  searchPlace,
  getStaticMap,
  reverseGeocode,
  getCurrentCity
};

