import type { HotSearchResponse } from "../types";
import PlatformCard from "./PlatformCard";

interface CardGridProps {
  data: HotSearchResponse | null;
  loading: boolean;
  error: string | null;
  onRetry?: (platformId: string) => void;
  retryingId?: string | null;
}

export default function CardGrid({
  data,
  loading,
  error,
  onRetry,
  retryingId,
}: CardGridProps) {
  // 全局错误
  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <p className="text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  // 加载态 — 渲染骨架屏
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {["bilibili", "zhihu", "douyin"].map((id) => (
          <PlatformCard
            key={id}
            platform={{ id, name: "", status: "empty", items: [] }}
            loading
          />
        ))}
      </div>
    );
  }

  // 正常渲染 — 按平台注册表动态渲染卡片
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {data.platforms.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          onRetry={onRetry}
          retrying={retryingId === platform.id}
        />
      ))}
    </div>
  );
}
