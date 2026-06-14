// 单条热搜数据 — 贯穿 Adapter → Pipeline → API → 前端
export interface HotItem {
  rank: number;
  title: string;
  hotValue: string;     // 格式化后的展示值，如 "1.5万"
  hotRaw: number;       // 原始数值，前端着色用
  url: string;          // 跳转链接
  category?: string;    // 分类字段，本期保留不渲染
}

// 单平台聚合结果
export interface PlatformResult {
  id: string;           // 平台标识，如 "bilibili"
  name: string;         // 显示名称，如 "B站"
  status: "success" | "error" | "empty";
  items: HotItem[];
  errorMessage?: string;
}

// API 响应结构
export interface HotSearchResponse {
  lastUpdated: string;  // ISO 8601 时间戳
  platforms: PlatformResult[];
}
