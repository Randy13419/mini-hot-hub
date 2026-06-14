import type { HotSearchResponse, PlatformResult } from "../types";

// API 基准地址：线上由 VITE_API_BASE 注入（指向 Railway 后端）；
// 本地开发不设时回退到 "/api/v1"，由 Vite 代理转发到 localhost:3001。
// 注：生产环境直接硬编码 Railway 后端地址，避免 Vercel 构建缓存导致环境变量不生效。
const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.PROD
      ? "https://mini-hot-hub-production-c2a2.up.railway.app/api/v1"
      : "/api/v1");

export async function fetchHotSearch(): Promise<HotSearchResponse> {
  const response = await fetch(`${API_BASE}/hot-search`);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json();
}

// 单平台重试 — 清除缓存并重新抓取
export async function retryPlatform(platformId: string): Promise<PlatformResult> {
  const response = await fetch(`${API_BASE}/hot-search/retry/${platformId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json();
}
