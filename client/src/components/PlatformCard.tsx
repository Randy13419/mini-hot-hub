import { useRef, type MouseEvent } from "react";
import type { PlatformResult } from "../types";
import { getHotColorGradient } from "../utils/colorMapper";

interface PlatformCardProps {
  platform: PlatformResult;
  loading?: boolean;
  onRetry?: (platformId: string) => void;
  retrying?: boolean;
}

// 平台主题色
const PLATFORM_COLORS: Record<string, string> = {
  bilibili: "#00a1d6",
  zhihu: "#0066ff",
  douyin: "#fe2c55",
};

function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
  e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
}

export default function PlatformCard({
  platform,
  loading,
  onRetry,
  retrying,
}: PlatformCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const accent = PLATFORM_COLORS[platform.id] ?? "#3b82f6";

  if (loading) {
    return (
      <div className="card-glow rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5">
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-[var(--text-muted)]" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-[var(--text-muted)]"
              style={{ width: `${60 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-glow rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-blue-500/5"
      onMouseMove={handleMouseMove}
      ref={cardRef}
    >
      {/* 平台标题栏 */}
      <div className="mb-4 flex items-center gap-2.5 border-b border-[var(--border-card)] pb-3">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {platform.name}
        </h2>
        {platform.status === "success" && (
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {platform.items.length} 条
          </span>
        )}
      </div>

      {/* 错误 / 空状态 + 重试按钮 */}
      {platform.status !== "success" && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            {platform.errorMessage ?? "暂无数据"}
          </p>
          {onRetry && (
            <button
              onClick={() => onRetry(platform.id)}
              disabled={retrying}
              className="rounded-md border border-[var(--border-card)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-all duration-200 hover:border-blue-500 hover:text-blue-400 hover:shadow-sm hover:shadow-blue-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retrying ? "重试中…" : "重新加载"}
            </button>
          )}
        </div>
      )}

      {/* 热搜列表 */}
      {platform.status === "success" && (
        <ul className="space-y-1">
          {platform.items.map((item) => {
            const gradient = getHotColorGradient(item.hotRaw);
            const isTop3 = item.rank <= 3;
            // 隐藏空热度值
            const hasHeat = item.hotValue && item.hotValue !== "--" && item.hotRaw > 0;

            return (
              <li key={item.rank}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hot-link group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-200 hover:bg-white/[0.04]"
                >
                  {/* 排名序号 */}
                  {isTop3 ? (
                    <span className={`rank-badge rank-${item.rank}`}>
                      {item.rank}
                    </span>
                  ) : (
                    <span className="w-5 shrink-0 text-center text-xs text-[var(--text-muted)]">
                      {item.rank}
                    </span>
                  )}

                  {/* 标题 */}
                  <span className="flex-1 truncate text-[var(--text-primary)] transition-colors duration-200 group-hover:text-white">
                    {item.title}
                  </span>

                  {/* 热度值 — 渐变色（空值隐藏） */}
                  {hasHeat && (
                    <span
                      className={`shrink-0 bg-gradient-to-r ${gradient} bg-clip-text text-xs font-semibold text-transparent transition-opacity duration-200 group-hover:opacity-80`}
                    >
                      {item.hotValue}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
