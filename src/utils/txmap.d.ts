// 腾讯地图 JavaScript API GL v1.exp 类型声明
declare namespace TMap {
  class Map {
    constructor(container: HTMLElement | string, options?: any);
    setCenter(latLng: LatLng): void;
    getCenter(): LatLng;
    setZoom(zoom: number): void;
    getZoom(): number;
    panTo(latLng: LatLng): void;
    destroy(): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat: number;
    lng: number;
    equals(other: LatLng): boolean;
  }

  class MultiMarker {
    constructor(options: {
      map: Map;
      geometries: Array<{
        position: LatLng;
        id?: string;
      }>;
    });
    setMap(map: Map | null): void;
    updateGeometries(geometries: any[]): void;
  }

  class InfoWindow {
    constructor(options: any);
    open(): void;
    close(): void;
    setMap(map: Map | null): void;
  }
}

// 全局初始化回调声明
interface Window {
  initTxMap?: () => void;
  initBMap?: () => void;
  TMap?: typeof TMap;
}

// 声明全局 TMap 对象
declare const TMap: typeof TMap;
