/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 线上后端的真实 API 基准地址（如 https://mini-hot-hub.up.railway.app/api/v1） */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
