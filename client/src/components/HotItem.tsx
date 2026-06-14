import type { HotItem as HotItemType } from "../types";
import { getHotColorGradient } from "../utils/colorMapper";

interface HotItemProps {
  item: HotItemType;
}

export default function HotItem({ item }: HotItemProps) {
  const gradient = getHotColorGradient(item.hotRaw);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--border-card)]"
    >
      <span className="w-5 shrink-0 text-center text-xs text-[var(--text-secondary)]">
        {item.rank}
      </span>
      <span className="flex-1 truncate text-[var(--text-primary)] group-hover:text-white">
        {item.title}
      </span>
      <span
        className={`shrink-0 bg-gradient-to-r ${gradient} bg-clip-text text-xs font-medium text-transparent`}
      >
        {item.hotValue}
      </span>
    </a>
  );
}
