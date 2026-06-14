import { PlatformAdapter } from "./types";
import { BilibiliAdapter } from "./bilibili";
import { ZhihuAdapter } from "./zhihu";
import { DouyinAdapter } from "./douyin";

class PlatformRegistry {
  private adapters = new Map<string, PlatformAdapter>();

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  getById(id: string): PlatformAdapter | undefined {
    return this.adapters.get(id);
  }
}

export const platformRegistry = new PlatformRegistry();

// 注册所有平台适配器
platformRegistry.register(new BilibiliAdapter());
platformRegistry.register(new ZhihuAdapter());
platformRegistry.register(new DouyinAdapter());
