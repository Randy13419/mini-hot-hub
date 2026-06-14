// 热度色彩映射 — 根据 hotRaw 值区间返回 Tailwind 渐变类
export interface ColorTier {
  min: number;
  max: number;
  gradient: string;
}

export const COLOR_TIERS: ColorTier[] = [
  { min: 0,       max: 9999,      gradient: "from-zinc-500 to-zinc-400"    },
  { min: 10000,   max: 99999,     gradient: "from-blue-500 to-cyan-400"    },
  { min: 100000,  max: 999999,    gradient: "from-amber-500 to-orange-400" },
  { min: 1000000, max: Infinity,  gradient: "from-red-500 to-rose-400"     },
];

export function getHotColorGradient(hotRaw: number): string {
  const tier = COLOR_TIERS.find(
    (t) => hotRaw >= t.min && hotRaw <= t.max
  );
  return tier?.gradient ?? "from-zinc-500 to-zinc-400";
}
