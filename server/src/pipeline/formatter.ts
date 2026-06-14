import { PipelineMiddleware } from "./types";

function formatHotValue(raw: number): string {
  if (raw >= 10000) {
    return `${(raw / 10000).toFixed(1)}万`;
  }
  return String(raw);
}

export const formatter: PipelineMiddleware = (items) =>
  items.map((item) => ({
    ...item,
    hotValue: formatHotValue(item.hotRaw),
  }));
