import { HotItem } from "../types";

// 中间件签名：接收数据，返回处理后的数据
export type PipelineMiddleware = (data: HotItem[]) => HotItem[];
