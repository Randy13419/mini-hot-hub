import { CacheProvider } from "./types";

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl: number): void {
    this.store.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// 单例导出
export const cacheProvider = new MemoryCacheProvider();
