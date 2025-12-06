<template>
  <div>
    <!-- 小地图容器（点击时展开） -->
    <div class="headerMapBox" @click="showFullMap = true">
      <div id="mini-map" class="miniMap"></div>
      <div class="locationInfo" v-if="currentLocation">
        <i class="locationIcon"></i>
        <span class="locationText">{{ currentLocation }}</span>
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
          <div id="full-map" class="fullMap"></div>
        </div>

        <div class="fullmapFooter">
          <div class="locationDetail">
            <p><i class="locationIcon"></i> <strong>{{ selectedLocation || currentLocation }}</strong></p>
            <p v-if="selectedAddress || fullAddress">{{ selectedAddress || fullAddress }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useLocationStore } from '@/stores/location';
import { loadBaiduMapAPI, isBaiduMapLoaded } from '@/api/baiduApi';

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
let localSearch: any = null;
let currentCoords = ref<{ lng: number, lat: number } | null>(null);

const locationStore = useLocationStore();

// 初始化小型地图
const initMiniMap = () => {
  if (typeof BMap === 'undefined') {
    console.error('BMap is not loaded');
    return;
  }

  // 创建小型地图实例
  miniMap = new BMap.Map('mini-map');
  miniMap.enableScrollWheelZoom(false);
  miniMap.disableDragging();
  miniMap.disableDoubleClickZoom();
  miniMap.disablePinchToZoom();
  miniMap.setMapStyle({ style: 'light' });

  // 设置默认位置(北京)
  miniMap.centerAndZoom(new BMap.Point(116.404, 39.915), 12);

  // 获取当前城市
  const myCity = new BMap.LocalCity();
  myCity.get((result: { name: string; center: any; }) => {
    const point = result.center;
    currentCoords.value = { lng: point.lng, lat: point.lat };

    // 创建标记
    marker = new BMap.Marker(point);
    miniMap.addOverlay(marker);
    miniMap.centerAndZoom(point, 12);

    // 获取地址信息
    getAddressFromLocation(point.lng, point.lat);
  });
};

// 初始化大地图
const initFullMap = () => {
  if (typeof BMap === 'undefined' || !currentCoords.value) return;

  // 创建完整地图实例
  fullMapInstance = new BMap.Map('full-map');
  fullMapInstance.enableScrollWheelZoom(true);

  // 添加地图控件
  fullMapInstance.addControl(new BMap.NavigationControl());
  fullMapInstance.addControl(new BMap.ScaleControl());

  // 设置地图中心点和缩放级别
  fullMapInstance.centerAndZoom(new BMap.Point(currentCoords.value.lng, currentCoords.value.lat), 14);

  // 创建标记
  const fullMapMarker = new BMap.Marker(new BMap.Point(currentCoords.value.lng, currentCoords.value.lat));
  fullMapInstance.addOverlay(fullMapMarker);

  // 初始化搜索插件
  localSearch = new BMap.LocalSearch(fullMapInstance, {
    renderOptions: {
      map: fullMapInstance,
      autoViewport: false,
      selectFirstResult: false
    },
    pageCapacity: 8,
    onSearchComplete: (results: any) => {
      isSearching.value = false;

      try {
        if (results && localSearch.getStatus() === BMAP_STATUS_SUCCESS) {
          const pois: any[] = [];
          const numPois = results.getCurrentNumPois ? results.getCurrentNumPois() : 0;

          for (let i = 0; i < numPois; i++) {
            pois.push(results.getPoi(i));
          }

          searchResults.value = pois;

          // 移除自动选择第一个结果的代码
          if (pois.length === 0) {
            showSelectedNotification("未找到相关地点");
          }
        } else {
          searchResults.value = [];
          showSelectedNotification("搜索失败，请重试");
        }
      } catch (error) {
        console.error('处理搜索结果时出错:', error);
        searchResults.value = [];
      }
    }
  });
};

// 根据经纬度获取地址信息
const getAddressFromLocation = (lng: number, lat: number) => {
  const geocoder = new BMap.Geocoder();
  geocoder.getLocation(new BMap.Point(lng, lat), function (result) {
    if (result) {
      // 简短地址显示在小地图上
      currentLocation.value = result.addressComponents.district || result.addressComponents.city || '当前位置';
      // 完整地址用于大地图弹窗
      fullAddress.value = result.address;
    } else {
      currentLocation.value = '未知位置';
    }
  });
};

// 搜索地点
const searchPlaces = () => {
  if (!searchKeyword.value || !localSearch) {
    return;
  }

  // 检查是否包含汉字
  const hasChineseChar = /[\u4e00-\u9fa5]/.test(searchKeyword.value);
  if (!hasChineseChar) {
    showSelectedNotification("请输入包含中文的关键词");
    return;
  }

  isSearching.value = true;
  localSearch.search(searchKeyword.value);
};

// 选择搜索结果
const selectSearchResult = (item: any) => {
  // 清除之前的标记
  fullMapInstance.clearOverlays();

  // 创建新标记
  const point = new BMap.Point(item.point.lng, item.point.lat);
  const newMarker = new BMap.Marker(point);
  fullMapInstance.addOverlay(newMarker);

  // 调整地图视野
  fullMapInstance.centerAndZoom(point, 15);

  // 更新选中的位置信息
  selectedLocation.value = item.title;
  selectedAddress.value = item.address;

  // 更新坐标信息
  currentCoords.value = {
    lng: item.point.lng,
    lat: item.point.lat
  };

  // 高亮显示此搜索结果
  highlightSelectedResult(item);

  // 短暂延迟后自动关闭地图并添加标签
  setTimeout(() => {
    // 直接使用全局状态添加标签
    locationStore.addLocationTag({
      name: selectedLocation.value,
      address: selectedAddress.value || fullAddress.value,
      coords: currentCoords.value
    });

    // 关闭地图弹窗
    showFullMap.value = false;
  }, 300);
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
  // 不显示通知，保留函数以避免代码错误
  console.log('位置选择:', text);
  // 如果有之前的计时器，清除它
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
    notificationTimer.value = null;
  }
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

// 组件挂载时初始化地图
onMounted(async () => {
  try {
    // 使用统一的 API 加载函数
    if (!isBaiduMapLoaded('2d')) {
      // 定义回调函数
      window.initBMap = () => {
        initMiniMap();
      };

      await loadBaiduMapAPI('2d', window.initBMap);
    } else {
      initMiniMap();
    }
  } catch (error) {
    console.error('百度地图加载失败:', error);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
    notificationTimer.value = null;
  }
});
</script>

<style scoped>
/* 小地图样式 */
.headerMapBox {
  position: relative;
  width: 90px;
  height: 100%;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
}

.miniMap {
  width: 100%;
  height: 100%;
  min-height: 30px;
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
  height: 80%;
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
  flex: 1;
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
}

.locationDetail p {
  margin: 5px 0;
  color: #333;
}

.locationDetail .locationIcon {
  width: 14px;
  height: 14px;
}

/* 搜索状态指示器样式 */
.searchStatus {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
}
</style>