import { useState, useEffect, useCallback } from "react";
import type { HotSearchResponse } from "../types";
import { fetchHotSearch, retryPlatform } from "../services/api";

export function useHotSearch() {
  const [data, setData] = useState<HotSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchHotSearch();
      setData(result);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  // 全页刷新
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // 单平台重试
  const retryPlatformById = useCallback(async (platformId: string) => {
    setRetryingId(platformId);
    try {
      const updated = await retryPlatform(platformId);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          platforms: prev.platforms.map((p) =>
            p.id === platformId ? updated : p
          ),
        };
      });
    } catch {
      // 重试失败保持当前状态
    } finally {
      setRetryingId(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh, retryPlatformById, retryingId };
}
