export const CACHE_TTL = 300;           // 缓存有效期（秒）
export const ADAPTER_TIMEOUT = 5000;    // 单平台请求超时（毫秒）
export const API_PREFIX = "/api/v1";    // API 路由前缀
// 后端端口：优先读取云平台注入的 process.env.PORT，本地回退到 3001
export const PORT = Number(process.env.PORT) || 3001;

// CORS 白名单：线上前端的真实域名（由部署平台注入）。
// 本地开发不设时回退到 "*"（允许所有来源），生产环境务必配置具体域名以防非法调用。
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

// Day 17：MOCK_FAIL 开关 — 开发环境模拟单平台失败
// 用法：MOCK_FAIL_BILIBILI=1 MOCK_FAIL_ZHIHU=1 npm run dev
const MOCK_PLATFORMS = ["bilibili", "zhihu", "douyin"] as const;
export const MOCK_FAIL: Record<string, boolean> = {};
for (const p of MOCK_PLATFORMS) {
  if (process.env[`MOCK_FAIL_${p.toUpperCase()}`] === "1") {
    MOCK_FAIL[p] = true;
  }
}
