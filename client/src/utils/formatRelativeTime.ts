/**
 * 将 ISO 时间字符串转换为相对时间描述，如 "刚刚"、"3 分钟前"、"1 小时前"
 */
export function formatRelativeTime(iso?: string): string {
  if (!iso) return "--";

  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = now - target;

  // 未来时间（时钟偏移）直接返回 "刚刚"
  if (diff < 0) return "刚刚";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  // 超过 7 天回退到日期格式
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
