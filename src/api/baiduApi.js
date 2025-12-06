/**
 * 百度地图 API 配置和初始化模块
 * 统一管理百度地图的 API Key、加载和初始化逻辑
 */
import API_KEYS from '@/api/apiKeys.js'

const BAIDU_MAP_CONFIG = {
  // API Key
  get AK () {
    return API_KEYS.BAIDU_MAP
  },
  // 2D 地图 API URL
  get API_2D_URL () {
    return `https://api.map.baidu.com/api?v=3.0&ak=${API_KEYS.BAIDU_MAP}&s=1`
  },
  // 3D 地图 API URL (GL 版本)
  get API_3D_URL () {
    return `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${API_KEYS.BAIDU_MAP}`
  },
};

/**
 * 加载百度地图 API 脚本
 * @param {string} type - 地图类型: '2d' 或 '3d'，默认为 '2d'
 * @param {function} callback - 加载完成后的回调函数
 * @returns {Promise} 返回 Promise，加载完成时 resolve
 */
export function loadBaiduMapAPI (type = '2d', callback = null) {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    const isLoaded = type === '2d' ? typeof BMap !== 'undefined' : typeof BMapGL !== 'undefined';

    if (isLoaded) {
      console.log(`✅ 百度地图 ${type.toUpperCase()} API 已加载`);
      if (callback) callback();
      resolve();
      return;
    }

    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';

      // 根据类型选择 API URL
      if (type === '3d') {
        script.src = BAIDU_MAP_CONFIG.API_3D_URL;
      } else {
        script.src = BAIDU_MAP_CONFIG.API_2D_URL;
        if (callback) {
          script.src += `&callback=${callback.name || 'initBMap'}`;
        }
      }

      script.async = true;
      script.onerror = () => {
        console.error(`❌ 百度地图 ${type.toUpperCase()} API 加载失败`);
        reject(new Error(`Failed to load Baidu Map ${type} API`));
      };

      script.onload = () => {
        console.log(`✅ 百度地图 ${type.toUpperCase()} API 加载成功`);
        if (callback && type === '3d') {
          callback();
        }
        resolve();
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('加载百度地图 API 时出错:', error);
      reject(error);
    }
  });
}

/**
 * 检查百度地图 API 是否已加载
 * @param {string} type - 地图类型: '2d' 或 '3d'
 * @returns {boolean} 是否已加载
 */
export function isBaiduMapLoaded (type = '2d') {
  if (type === '2d') {
    return typeof BMap !== 'undefined';
  } else if (type === '3d') {
    return typeof BMapGL !== 'undefined';
  }
  return false;
}

/**
 * 获取百度地图 API 配置
 * @returns {object} 配置对象
 */
export function getBaiduMapConfig () {
  return { ...BAIDU_MAP_CONFIG };
}

/**
 * 获取百度地图 API Key
 * @returns {string} API Key
 */
export function getBaiduMapAK () {
  return BAIDU_MAP_CONFIG.AK;
}

/**
 * 创建百度地图实例
 * @param {string|HTMLElement} container - 地图容器 ID 或 DOM 元素
 * @param {object} options - 地图选项
 * @returns {object} 地图实例
 */
export function createBaiduMap (container, options = {}) {
  if (!isBaiduMapLoaded('2d')) {
    console.error('❌ BMap API 未加载');
    return null;
  }

  try {
    const map = new BMap.Map(container, options);
    console.log('✅ 百度地图实例创建成功');
    return map;
  } catch (error) {
    console.error('创建百度地图实例失败:', error);
    return null;
  }
}

/**
 * 创建百度地图 3D 实例
 * @param {string|HTMLElement} container - 地图容器 ID 或 DOM 元素
 * @param {object} options - 地图选项
 * @returns {object} 地图实例
 */
export function createBaiduMap3D (container, options = {}) {
  if (!isBaiduMapLoaded('3d')) {
    console.error('❌ BMapGL API 未加载');
    return null;
  }

  try {
    const map = new BMapGL.Map(container, options);
    console.log('✅ 百度地图 3D 实例创建成功');
    return map;
  } catch (error) {
    console.error('创建百度地图 3D 实例失败:', error);
    return null;
  }
}

export default {
  loadBaiduMapAPI,
  isBaiduMapLoaded,
  getBaiduMapConfig,
  getBaiduMapAK,
  createBaiduMap,
  createBaiduMap3D,
  BAIDU_MAP_CONFIG,
};

