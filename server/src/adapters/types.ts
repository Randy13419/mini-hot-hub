import { HotItem } from "../types";

export interface PlatformAdapter {
  readonly id: string;            // 平台标识
  readonly name: string;          // 显示名称
  fetch(): Promise<HotItem[]>;    // 抓取并返回标准化数据
}
