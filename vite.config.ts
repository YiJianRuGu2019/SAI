import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Element Plus 组件
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
    }),
    // 自动注册 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "src/components.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    // 模拟 process.env 对象
    "process.env": {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      BASE_URL: JSON.stringify(process.env.BASE_URL || "/"),
    },
    // 添加 Vue 功能标志以解决警告
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
  // 开发服务器配置
  server: {
    port: 30001,
    open: true,
    // 代理 API 请求
    proxy: {
      "/api/doubao": {
        target: "https://ark.cn-beijing.volces.com/api/v3",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, ""),
        headers: {
          Origin: "https://ark.cn-beijing.volces.com",
        },
      },
      "/api/grok": {
        target: "https://api.x.ai/v1",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, ""),
        headers: {
          Origin: "https://api.x.ai",
        },
      },
    },
  },
  // 构建选项
  build: {
    // 输出目录
    outDir: "dist",
    // 启用/禁用 CSS 代码拆分
    cssCodeSplit: true,
    // 生成 sourcemap
    sourcemap: false,
    // 启用/禁用 brotli 压缩大小报告
    // brotliSize: false,
    // chunk 大小警告的限制
    chunkSizeWarningLimit: 2000,
  },
  // CSS 预处理器配置
  css: {
    preprocessorOptions: {
      scss: {
        // 如果您有全局 SCSS 变量
        // additionalData: `@import "@/styles/variables.scss";`
      },
    },
  },
});
