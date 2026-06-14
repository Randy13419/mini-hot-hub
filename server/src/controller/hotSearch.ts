import { platformRegistry } from "../adapters/registry";
import { cacheProvider } from "../cache/memoryCache";
import { runPipeline } from "../pipeline/index";
import { HotSearchResponse, PlatformResult, HotItem } from "../types";
import { CACHE_TTL, ADAPTER_TIMEOUT, MOCK_FAIL } from "../config";

// 记录最后一次实际抓取的时间，缓存期内保持不变
let lastFetchTime = new Date().toISOString();

export async function getHotSearch(): Promise<HotSearchResponse> {
  const adapters = platformRegistry.getAll();
  let anyFresh = false; // 是否有平台真正重新抓取了数据

  // 并发请求所有平台，单个失败不影响其他
  const results = await Promise.allSettled(
    adapters.map(async (adapter): Promise<PlatformResult> => {
      const cacheKey = `cache:${adapter.id}:hot-search`;

      // 1. 检查缓存
      const cached = cacheProvider.get<PlatformResult>(cacheKey);
      if (cached) return cached;

      // 缓存未命中，标记为本次需要刷新时间
      anyFresh = true;

      // 1.5 MOCK_FAIL 模拟失败
      if (MOCK_FAIL[adapter.id]) {
        throw new Error(`[MOCK] ${adapter.name} 模拟失败`);
      }

      // 2. 缓存未命中 → 抓取（带超时）
      const rawItems: HotItem[] = await withTimeout(
        adapter.fetch(),
        ADAPTER_TIMEOUT
      );

      // 3. 空数据兜底
      if (!rawItems || rawItems.length === 0) {
        return {
          id: adapter.id,
          name: adapter.name,
          status: "empty",
          items: [],
          errorMessage: "暂无数据",
        };
      }

      // 4. 经 Pipeline 处理
      const processed = runPipeline(rawItems);

      // 5. 组装结果并写入缓存
      const result: PlatformResult = {
        id: adapter.id,
        name: adapter.name,
        status: "success",
        items: processed,
      };

      cacheProvider.set(cacheKey, result, CACHE_TTL);
      return result;
    })
  );

  // 6. 汇总 — 将 rejected 的平台转为 error 状态
  const platforms: PlatformResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const adapter = adapters[index];
    anyFresh = true; // 失败重试也算刷新
    return {
      id: adapter.id,
      name: adapter.name,
      status: "error",
      items: [],
      errorMessage: "加载失败",
    };
  });

  // 7. 只有真正抓取了数据才更新时间戳
  if (anyFresh) {
    lastFetchTime = new Date().toISOString();
  }

  return {
    lastUpdated: lastFetchTime,
    platforms,
  };
}

// 清除指定平台缓存（用于单平台重试）
export function clearPlatformCache(platformId: string): void {
  cacheProvider.invalidate(`cache:${platformId}:hot-search`);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
