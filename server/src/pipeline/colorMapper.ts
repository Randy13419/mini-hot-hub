import { PipelineMiddleware } from "./types";

// Pipeline 层仅标注量级信息，具体渲染由前端完成
export const colorMapper: PipelineMiddleware = (items) =>
  items.map((item) => ({
    ...item,
    // 着色逻辑由前端 colorMapper.ts 根据 hotRaw 判断
  }));
