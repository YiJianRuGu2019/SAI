// 百度地图API类型声明
declare namespace BMap {
  class Map {
    constructor(container: string | HTMLElement);
    centerAndZoom(center: Point, zoom: number): void;
    addOverlay(overlay: Overlay): void;
    removeOverlay(overlay: Overlay): void;
    clearOverlays(): void;
    addControl(control: Control): void;
    removeControl(control: Control): void;
    setMapStyle(style: any): void;
    enableScrollWheelZoom(enable: boolean): void;
    disableDragging(): void;
    enableDragging(): void;
    disableDoubleClickZoom(): void;
    disablePinchToZoom(): void;
  }

  class Point {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Marker implements Overlay {
    constructor(point: Point, options?: any);
    setPosition(point: Point): void;
    getPosition(): Point;
  }

  interface Overlay {
    // 基础覆盖物接口
  }

  class Control {
    // 基础控件类
  }

  class NavigationControl extends Control {
    constructor(options?: any);
  }

  class ScaleControl extends Control {
    constructor(options?: any);
  }

  class Geolocation {
    constructor();
    getCurrentPosition(callback: (result: GeolocationResult) => void, options?: any): void;
    getStatus(): number;
  }

  interface GeolocationResult {
    point: Point;
    address: string;
  }

  class Geocoder {
    constructor();
    getLocation(point: Point, callback: (result: GeocoderResult) => void): void;
  }

  interface GeocoderResult {
    address: string;
    addressComponents: {
      city: string;
      district: string;
      province: string;
      street: string;
      streetNumber: string;
    };
    point: Point;
  }

  class LocalSearch {
    constructor(map: Map | string, options?: any);
    search(keyword: string): void;
    getStatus(): number;
    getResults(): LocalSearchResult;
    enableAutoViewport(): void;
    disableAutoViewport(): void;
  }

  interface LocalSearchResult {
    getCurrentNumPois(): number;
    getPoi(i: number): {
      title: string;
      address: string;
      point: Point;
    };
  }

  // 添加 LocalCity 类定义
  class LocalCity {
    constructor();
    get(callback: (result: { name: string; center: Point }) => void): void;
  }

  // 添加 Autocomplete 类定义
  interface AutocompleteSuggestion {
    business?: string;
    name?: string;
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    point?: Point;
  }

  interface AutocompleteResult {
    item: {
      value: AutocompleteSuggestion;
    };
    toItem?: AutocompleteSuggestion[];
  }

  class Autocomplete {
    constructor(options: {
      input: string | HTMLElement,
      location?: Map | Point | string
    });
    
    addEventListener(event: 'onconfirm', handler: (e: AutocompleteResult) => void): void;
    addEventListener(event: 'onhighlight', handler: (e: AutocompleteResult) => void): void;
    addEventListener(event: string, handler: Function): void;
    removeEventListener(event: string, handler: Function): void;
    show(): void;
    hide(): void;
    setLocation(location: Map | Point | string): void;
    dispose(): void;
  }
}

// 百度地图状态常量
declare const BMAP_STATUS_SUCCESS: number;
declare const BMAP_STATUS_CITY_LIST: number;
declare const BMAP_STATUS_UNKNOWN_LOCATION: number;
declare const BMAP_STATUS_UNKNOWN_ROUTE: number;
declare const BMAP_STATUS_INVALID_KEY: number;
declare const BMAP_STATUS_INVALID_REQUEST: number;

// 全局初始化回调声明
interface Window {
  initBMap?: () => void;
} 