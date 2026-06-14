import { PipelineMiddleware } from "./types";
import { HotItem } from "../types";
import { formatter } from "./formatter";
import { colorMapper } from "./colorMapper";
import { categoryExtractor } from "./categoryExtractor";

// 中间件链配置 — 调整顺序或新增中间件只需改此数组
const middlewares: PipelineMiddleware[] = [
  formatter,
  colorMapper,
  categoryExtractor,
];

export function runPipeline(data: HotItem[]): HotItem[] {
  return middlewares.reduce((acc, middleware) => middleware(acc), data);
}
