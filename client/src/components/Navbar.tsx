import { useEffect, useState } from "react";
import { formatRelativeTime } from "../utils/formatRelativeTime";

interface NavbarProps {
  lastUpdated?: string;
  onRefresh?: () => void;
}

export default function Navbar({ lastUpdated, onRefresh }: NavbarProps) {
  // 每分钟刷新相对时间文案
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const relativeTime = formatRelativeTime(lastUpdated);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-card)] bg-[var(--bg-navbar)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* 左侧标题 + 呼吸灯 */}
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow shadow-lg shadow-emerald-400/50" />
          今日热搜
        </h1>

        {/* 中间：最后更新时间 + 全页刷新按钮 */}
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{lastUpdated ? relativeTime : "加载中…"}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-2 rounded-md border border-[var(--border-card)] px-2 py-0.5 text-xs text-[var(--text-muted)] transition-all duration-200 hover:border-blue-500 hover:text-blue-400 hover:shadow-sm hover:shadow-blue-500/20 active:scale-95"
              title="刷新全页数据"
            >
              刷新
            </button>
          )}
        </div>

        {/* [预留] 搜索框占位 */}
        <div className="hidden md:block w-48" />

        {/* 右侧：[预留] 用户头像占位 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--text-muted)] text-xs text-[var(--text-secondary)]">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
          </svg>
        </div>
      </div>
    </nav>
  );
}
