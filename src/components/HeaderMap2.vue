<template>
  <div>
    <!-- 小地图容器（点击时展开） -->
    <div class="headerMapBox" :class="{ 'disabled': disabled }" @click="handleMapClick">
      <div id="mini-map-tx" class="miniMap"></div>
      <div class="locationInfo" v-if="currentLocation">
        <i class="locationIcon">📍</i>
        <span class="locationText">{{ currentLocation }}</span>
      </div>
      <!-- 加载中遮罩 -->
      <div v-if="disabled" class="loadingOverlay">
        <span>加载中...</span>
      </div>
    </div>

    <!-- 全屏地图弹窗 - 添加点击空白处关闭 -->
    <div class="fullmapModal" v-if="showFullMap" @click="closeMapOnBlankClick">
      <div class="fullmapContent" @click.stop>
        <div class="fullmapHeader">
          <h3>地点搜索</h3>
          <button class="closeBtn" @click="closeMap">&times;</button>
        </div>

        <!-- 搜索框 -->
        <div class="searchContainer">
          <div class="searchBox">
            <input type="text" v-model="searchKeyword" @keyup.enter="searchPlaces" placeholder="搜索地点、景点、地址"
              class="searchInput" />
            <button class="searchBtn" @click="searchPlaces">
              <i class="searchIcon"></i>
            </button>
          </div>
          <div class="searchStatus" v-if="isSearching">正在搜索...</div>
        </div>

        <div class="mapSearchContainer">
          <!-- 搜索结果列表 -->
          <div class="searchResults" v-if="searchResults.length > 0">
            <div v-for="(item, index) in searchResults" :key="index" class="searchResultItem"
              @click="selectSearchResult(item)">
              <div class="resultName">{{ item.title }}</div>
              <div class="resultAddress">{{ item.address }}</div>
            </div>
          </div>

          <!-- 地图区域 -->
          <div id="full-map-tx" class="fullMap"></div>
        </div>

        <div class="fullmapFooter">
          <div class="locationDetail">
            <p><i class="locationIcon"></i> <strong>{{ selectedLocation || currentLocation }}</strong></p>
            <p v-if="selectedAddress || fullAddress">{{ selectedAddress || fullAddress }}</p>
          </div>
          <button class="confirmBtn" @click="confirmSelection" :disabled="!selectedLocation">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { loadTxMapAPI, isTxMapLoaded, reverseGeocode, searchPlace, getCurrentCity } from '@/api/txmapApi';
import { ElMessage } from 'element-plus';

// 定义 props
interface Props {
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

// 定义事件
const emit = defineEmits(['locationSelected']);

// 基础状态变量
const currentLocation = ref<string>('正在定位...');
const fullAddress = ref<string>('');
const showFullMap = ref<boolean>(false);
const searchKeyword = ref<string>('');
const searchResults = ref<any[]>([]);
const selectedLocation = ref<string>('');
const selectedAddress = ref<string>('');
const isSearching = ref<boolean>(false);
const notificationTimer = ref<number | null>(null);

// 地图实例变量
let miniMap: any = null;
let fullMapInstance: any = null;
let marker: any = null;
let currentCoords = ref<{ lat: number, lng: number } | null>(null);

// 初始化小型地图
const initMiniMap = () => {
  if (typeof TMap === 'undefined') {
    console.error('TMap is not loaded');
    return;
  }

  const container = document.getElementById('mini-map-tx');
  if (!container) {
    console.error('小地图容器未找到');
    return;
  }

  // 创建小型地图实例
  const center = new TMap.LatLng(39.916527, 116.397128);
  miniMap = new TMap.Map(container, {
    center: center,
    zoom: 12, // 降低缩放级别，显示更大范围
    draggable: false,
    scrollable: false,
    doubleClickZoom: false,
    mapStyleId: 'style1', // 使用简洁风格
    baseMap: {
      type: 'vector'
    },
    viewMode: '2D',
    showControl: false, // 隐藏控件
    boundary: null // 不限制边界
  });

  // 使用 IP 定位获取当前城市
  getCurrentCity().then((result: any) => {
    const location = result.result.location;
    currentCoords.value = { lat: location.lat, lng: location.lng };

    // 更新小地图中心点
    const newCenter = new TMap.LatLng(location.lat, location.lng);
    miniMap.setCenter(newCenter);

    // 添加标记
    new TMap.MultiMarker({
      map: miniMap,
      geometries: [{
        position: newCenter
      }]
    });

    // 获取地址信息
    getAddressFromLocation(location.lat, location.lng);
  }).catch((error: any) => {
    console.error('获取城市信息失败:', error);
    currentCoords.value = { lat: 39.916527, lng: 116.397128 };
    currentLocation.value = '北京市';
  });
};

// 初始化大地图
const initFullMap = () => {
  if (typeof TMap === 'undefined') {
    console.error('TMap is not loaded');
    return;
  }

  const container = document.getElementById('full-map-tx');
  if (!container) {
    console.error('大地图容器未找到');
    return;
  }

  const center = currentCoords.value
    ? new TMap.LatLng(currentCoords.value.lat, currentCoords.value.lng)
    : new TMap.LatLng(39.916527, 116.397128);

  fullMapInstance = new TMap.Map(container, {
    center: center,
    zoom: 13,
    mapStyleId: 'style1'
  });

  // 添加当前位置标记
  if (currentCoords.value) {
    marker = new TMap.MultiMarker({
      map: fullMapInstance,
      geometries: [{
        position: center
      }]
    });
  }
};

// 根据经纬度获取地址信息
const getAddressFromLocation = (lat: number, lng: number) => {
  reverseGeocode({ lat, lng }).then((result: any) => {
    if (result && result.result) {
      const addressInfo = result.result;
      const addressComponent = addressInfo.address_component;

      // 简短地址显示在小地图上
      currentLocation.value = addressComponent.district || addressComponent.city || '当前位置';
      // 完整地址用于大地图弹窗
      fullAddress.value = addressInfo.address;
    } else {
      currentLocation.value = '未知位置';
    }
  }).catch((error) => {
    console.error('逆地理编码失败:', error);
    currentLocation.value = '未知位置';
  });
};

// 搜索地点
const searchPlaces = () => {
  if (!searchKeyword.value || !currentCoords.value) {
    return;
  }

  // 检查是否包含汉字
  const hasChineseChar = /[\u4e00-\u9fa5]/.test(searchKeyword.value);
  if (!hasChineseChar) {
    showSelectedNotification("请输入包含中文的关键词");
    return;
  }

  isSearching.value = true;

  // 使用腾讯地图 WebService API 搜索
  searchPlace(searchKeyword.value, currentCoords.value, 10000).then((result: any) => {
    isSearching.value = false;

    if (result && result.data) {
      const pois = result.data;

      // 转换为统一格式
      searchResults.value = pois.map((poi: any) => ({
        title: poi.title,
        address: poi.address,
        point: { lat: poi.location.lat, lng: poi.location.lng }
      }));

      if (pois.length === 0) {
        showSelectedNotification("未找到相关地点");
      }
    } else {
      searchResults.value = [];
      showSelectedNotification("未找到相关地点");
    }
  }).catch((error: any) => {
    console.error('搜索失败:', error);
    isSearching.value = false;
    searchResults.value = [];
    showSelectedNotification("搜索失败，请重试");
  });
};

// 选择搜索结果
const selectSearchResult = (item: any) => {
  if (!fullMapInstance || typeof TMap === 'undefined') {
    console.error('地图未初始化');
    return;
  }

  // 清除之前的标记
  if (marker) {
    marker.setMap(null);
  }

  // 创建新标记
  const position = new TMap.LatLng(item.point.lat, item.point.lng);
  marker = new TMap.MultiMarker({
    map: fullMapInstance,
    geometries: [{
      position: position
    }]
  });

  // 调整地图视野
  fullMapInstance.setCenter(position);
  fullMapInstance.setZoom(15);

  // 更新选中的位置信息
  selectedLocation.value = item.title;
  selectedAddress.value = item.address;

  // 更新坐标信息
  currentCoords.value = {
    lat: item.point.lat,
    lng: item.point.lng
  };

  // 更新小地图
  if (miniMap) {
    const miniCenter = new TMap.LatLng(item.point.lat, item.point.lng);
    miniMap.setCenter(miniCenter);
  }

  // 更新当前显示的位置
  currentLocation.value = item.title;

  // 高亮显示此搜索结果
  highlightSelectedResult(item);
};

// 确认选择
const confirmSelection = () => {
  if (!selectedLocation.value) {
    showSelectedNotification("请先选择一个地点");
    return;
  }

  // 发送事件给父组件，由父组件决定如何处理
  emit('locationSelected', {
    name: selectedLocation.value,
    address: selectedAddress.value || fullAddress.value,
    coords: currentCoords.value
  });

  // 关闭地图弹窗
  showFullMap.value = false;

  // 清空选择状态
  selectedLocation.value = '';
  selectedAddress.value = '';
  searchResults.value = [];
  searchKeyword.value = '';
};

// 高亮显示选中的搜索结果
const highlightSelectedResult = (item: any) => {
  const resultItems = document.querySelectorAll('.searchResultItem');
  resultItems.forEach(el => el.classList.remove('selected'));

  resultItems.forEach((el, index) => {
    if (index < searchResults.value.length) {
      const result = searchResults.value[index];
      if (result.title === item.title && result.address === item.address) {
        el.classList.add('selected');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
};



// 修改showSelectedNotification函数
const showSelectedNotification = (text: string) => {
  // 如果有之前的计时器，清除它
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
    notificationTimer.value = null;
  }
};

// 处理地图点击
const handleMapClick = async () => {
  if (props.disabled) {
    ElMessage.warning('编辑器正在加载中，请稍候...');
    return;
  }

  // 首次点击时初始化小地图
  if (!isMiniMapInitialized.value) {
    await lazyInitMiniMap();
  }

  openFullMap();
};

// 打开全屏地图
const openFullMap = () => {
  showFullMap.value = true;
};

// 点击空白处关闭地图
const closeMapOnBlankClick = (e: MouseEvent) => {
  // 确保点击的是弹窗背景而不是内容
  if ((e.target as HTMLElement).classList.contains('fullmapModal')) {
    closeMap();
  }
};

// 简化关闭地图方法
const closeMap = () => {
  showFullMap.value = false;
};

// 监听弹窗显示状态
watch(showFullMap, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      initFullMap();
    }, 100);
  }
});

// 标记是否已初始化小地图
const isMiniMapInitialized = ref(false);

// 延迟初始化小地图（只有在用户点击时才初始化）
const lazyInitMiniMap = () => {
  if (isMiniMapInitialized.value) {
    return Promise.resolve();
  }

  return loadTxMapAPI(() => {
    console.log('腾讯地图 API 加载完成，初始化小地图');
    initMiniMap();
    isMiniMapInitialized.value = true;
  }).catch((error: any) => {
    console.error('腾讯地图 API 加载失败:', error);
    currentLocation.value = '地图加载失败';
  });
};

// 组件挂载时不再自动初始化
onMounted(() => {
  // 不再自动加载地图，改为延迟加载
  console.log('HeaderMap2 组件已挂载，等待用户点击时再加载地图');
});

// 组件卸载时清理
onUnmounted(() => {
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
    notificationTimer.value = null;
  }

  // 清理地图实例
  if (miniMap) {
    miniMap.destroy && miniMap.destroy();
    miniMap = null;
  }
  if (fullMapInstance) {
    fullMapInstance.destroy && fullMapInstance.destroy();
    fullMapInstance = null;
  }
});
</script>

<style scoped>
/* 小地图样式 */
.headerMapBox {
  position: relative;
  width: 100px;
  height: 50px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.headerMapBox:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 禁用状态 */
.headerMapBox.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.headerMapBox.disabled:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

/* 加载中遮罩 */
.loadingOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  z-index: 10;
}

.miniMap {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 确保地图内容完整显示 */
.miniMap :deep(.tmap-container) {
  width: 100% !important;
  height: 100% !important;
}

.locationInfo {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 3px 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.locationIcon {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="%234e6ef2" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192.02 85.961 192.02 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.53 0z"></path></svg>');
  background-size: cover;
}

.locationText {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

/* 全屏地图弹窗样式 */
.fullmapModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.fullmapContent {
  width: 80%;
  max-width: 900px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fullmapHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.fullmapHeader h3 {
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

/* 搜索框样式 */
.searchContainer {
  position: relative;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
}

.searchBox {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.searchInput {
  flex: 1;
  border: none;
  padding: 10px 15px;
  font-size: 14px;
  outline: none;
}

.searchBtn {
  background: #4e6ef2;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.searchIcon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>');
  background-size: cover;
}

/* 搜索结果和地图容器样式 */
.mapSearchContainer {
  display: flex;
  height: 500px;
  position: relative;
  overflow: hidden;
}

.searchResults {
  width: 300px;
  height: 100%;
  overflow-y: auto;
  background: white;
  border-right: 1px solid #eee;
}

.fullMap {
  flex: 1;
  width: 100%;
}

.searchResultItem {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.searchResultItem:hover {
  background-color: #f5f5f5;
}

.searchResultItem.selected {
  background-color: #e6f0ff;
  border-left: 3px solid #4e6ef2;
}

.resultName {
  font-weight: bold;
  margin-bottom: 5px;
}

.resultAddress {
  font-size: 12px;
  color: #666;
}

.fullMap {
  flex: 1;
  width: 100%;
}

.fullmapFooter {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.locationDetail {
  flex: 1;
}

.locationDetail p {
  margin: 5px 0;
  color: #333;
}

.locationDetail .locationIcon {
  width: 14px;
  height: 14px;
}

.confirmBtn {
  padding: 10px 30px;
  background: #4e6ef2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.confirmBtn:hover:not(:disabled) {
  background: #3d5fd1;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(78, 110, 242, 0.3);
}

.confirmBtn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 搜索状态指示器样式 */
.searchStatus {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
}
</style>