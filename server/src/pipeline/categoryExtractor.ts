import { PipelineMiddleware } from "./types";

// 分类提取中间件 — 本期保留 category 字段，不做额外处理
export const categoryExtractor: PipelineMiddleware = (items) =>
  items.map((item) => ({
    ...item,
    // category 已由 Adapter 提取，此中间件预留未来扩展
  }));
