# 【今日热搜】技术设计文档 (Tech Design)

> **关联文档**: `prd.md`
> **版本**: V1.0 MVP
> **日期**: 2026-06-07
> **状态**: 待开发

---

## 1. 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|---------|
| 前端框架 | React 18 + TypeScript | 组件化开发，生态成熟，类型安全 |
| 样式方案 | Tailwind CSS 4 | 原子化 CSS，快速实现深色主题与响应式布局 |
| 构建工具 | Vite 6 | 极速 HMR，开箱即用 |
| 后端框架 | Node.js + Express | 轻量、与前端同语言，适合 MVP 快速迭代 |
| HTTP 客户端 | axios | 请求超时控制、拦截器支持完善 |
| 数据抓取 | cheerio（HTML 解析）| 轻量级服务端 DOM 解析，无头浏览器开销 |

---

## 2. 项目结构

```
hot-search/
├── client/                          # 前端工程
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # 顶部导航栏（标题 + 最后更新 + 搜索占位 + 用户占位）
│   │   │   ├── CardGrid.tsx         # 卡片网格容器（动态渲染 N 张卡片）
│   │   │   ├── PlatformCard.tsx     # 单平台卡片（热搜列表 + 状态提示）
│   │   │   ├── HotItem.tsx          # 单条热搜（标题 + 热度 + 跳转链接）
│   │   │   └── Footer.tsx           # 底部免责声明
│   │   ├── hooks/
│   │   │   ├── useHotSearch.ts      # 数据获取 Hook
│   │   │   └── useSearchQuery.ts    # [预留] 搜索状态钩子（空实现）
│   │   ├── services/
│   │   │   └── api.ts               # API 调用封装
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript 类型定义
│   │   ├── utils/
│   │   │   └── colorMapper.ts       # 热度值 → 渐变色映射
│   │   ├── App.tsx                  # 根组件
│   │   └── main.tsx                 # 入口
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # 后端工程
│   ├── src/
│   │   ├── adapters/                # Platform Adapter 层
│   │   │   ├── types.ts             # PlatformAdapter 接口定义
│   │   │   ├── registry.ts          # PlatformRegistry 平台注册表
│   │   │   ├── bilibili.ts          # B站适配器
│   │   │   ├── zhihu.ts             # 知乎适配器
│   │   │   └── douyin.ts            # 抖音适配器
│   │   ├── cache/                   # Cache 抽象层
│   │   │   ├── types.ts             # CacheProvider 接口定义
│   │   │   └── memoryCache.ts       # MemoryCacheProvider 实现
│   │   ├── pipeline/                # Data Pipeline 层
│   │   │   ├── types.ts             # Middleware 签名定义
│   │   │   ├── formatter.ts         # 数字格式化中间件
│   │   │   ├── colorMapper.ts       # 热度着色中间件
│   │   │   ├── categoryExtractor.ts # 分类提取中间件
│   │   │   └── index.ts             # Pipeline 组装入口
│   │   ├── routes/
│   │   │   └── api.ts               # /api/v1/ 路由定义
│   │   ├── controller/
│   │   │   └── hotSearch.ts         # AggregationController
│   │   ├── types/
│   │   │   └── index.ts             # 共享类型定义
│   │   ├── config.ts                # 配置项集中管理
│   │   └── app.ts                   # Express 应用入口
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                     # Monorepo 根配置（可选）
└── README.md
```

---

## 3. 核心类型定义

### 3.1 共享类型 (`server/src/types/index.ts`)

```typescript
// 单条热搜数据 — 贯穿 Adapter → Pipeline → API → 前端
export interface HotItem {
  rank: number;
  title: string;
  hotValue: string;     // 格式化后的展示值，如 "1.5万"
  hotRaw: number;       // 原始数值，前端着色用
  url: string;          // 跳转链接
  category?: string;    // 分类字段，本期保留不渲染
}

// 单平台聚合结果
export interface PlatformResult {
  id: string;           // 平台标识，如 "bilibili"
  name: string;         // 显示名称，如 "B站"
  status: "success" | "error" | "empty";
  items: HotItem[];
  errorMessage?: string; // status 为 error/empty 时展示
}

// API 响应结构
export interface HotSearchResponse {
  lastUpdated: string;  // ISO 8601 时间戳
  platforms: PlatformResult[];
}
```

### 3.2 Platform Adapter 接口 (`server/src/adapters/types.ts`)

```typescript
import { HotItem } from "../types";

export interface PlatformAdapter {
  readonly id: string;            // 平台标识
  readonly name: string;          // 显示名称
  fetch(): Promise<HotItem[]>;    // 抓取并返回标准化数据
}
```

### 3.3 Cache Provider 接口 (`server/src/cache/types.ts`)

```typescript
export interface CacheProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl: number): void;
  invalidate(key: string): void;
}
```

### 3.4 Pipeline Middleware 签名 (`server/src/pipeline/types.ts`)

```typescript
import { HotItem } from "../types";

// 中间件：接收数据，返回处理后的数据
export type PipelineMiddleware = (data: HotItem[]) => HotItem[];
```

---

## 4. 各模块详细设计

### 4.1 Platform Adapter 层

#### 4.1.1 平台注册表 (`server/src/adapters/registry.ts`)

```typescript
import { PlatformAdapter } from "./types";

class PlatformRegistry {
  private adapters = new Map<string, PlatformAdapter>();

  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  getById(id: string): PlatformAdapter | undefined {
    return this.adapters.get(id);
  }
}

export const platformRegistry = new PlatformRegistry();
```

#### 4.1.2 适配器实现规范

每个适配器必须：

1. 实现 `PlatformAdapter` 接口
2. 在 `fetch()` 内完成 HTTP 请求 → HTML/JSON 解析 → 标准化为 `HotItem[]`
3. 自行处理目标平台的反爬策略（UA 伪装、请求间隔等）
4. 抛出异常时由上层 Controller 统一捕获

**B站适配器示例骨架** (`server/src/adapters/bilibili.ts`)：

```typescript
import axios from "axios";
import { PlatformAdapter } from "./types";
import { HotItem } from "../types";

export class BilibiliAdapter implements PlatformAdapter {
  readonly id = "bilibili";
  readonly name = "B站";

  async fetch(): Promise<HotItem[]> {
    const response = await axios.get("https://api.bilibili.com/x/web-interface/ranking/v2", {
      timeout: 5000,
      headers: { "User-Agent": "Mozilla/5.0 ..." },
    });
    return response.data.data.list.map((item, index) => ({
      rank: index + 1,
      title: item.title,
      hotValue: String(item.stat.view),  // Pipeline 会格式化
      hotRaw: item.stat.view,
      url: item.short_link_v2,
      category: item.rcmd_reason?.content,
    }));
  }
}
```

#### 4.1.3 注册入口

```typescript
// server/src/adapters/registry.ts 底部或独立 init 文件
import { platformRegistry } from "./registry";
import { BilibiliAdapter } from "./bilibili";
import { ZhihuAdapter } from "./zhihu";
import { DouyinAdapter } from "./douyin";

platformRegistry.register(new BilibiliAdapter());
platformRegistry.register(new ZhihuAdapter());
platformRegistry.register(new DouyinAdapter());
```

> **扩展方式**：新增平台 = 创建 `weibo.ts` 实现 `PlatformAdapter` + 在注册入口加一行 `register`。

---

### 4.2 Data Pipeline 层

#### 4.2.1 Pipeline 组装 (`server/src/pipeline/index.ts`)

```typescript
import { PipelineMiddleware } from "./types";
import { HotItem } from "../types";
import { formatter } from "./formatter";
import { colorMapper } from "./colorMapper";
import { categoryExtractor } from "./categoryExtractor";

// 中间件链配置 — 调整顺序或新增中间件只需改此数组
const middlewares: PipelineMiddleware[] = [
  formatter,
  colorMapper,
  categoryExtractor,
];

export function runPipeline(data: HotItem[]): HotItem[] {
  return middlewares.reduce((acc, middleware) => middleware(acc), data);
}
```

#### 4.2.2 Formatter 中间件 (`server/src/pipeline/formatter.ts`)

```typescript
import { PipelineMiddleware } from "./types";
import { HotItem } from "../types";

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
```

#### 4.2.3 ColorMapper 中间件 (`server/src/pipeline/colorMapper.ts`)

```typescript
import { PipelineMiddleware } from "./types";
import { HotItem } from "../types";

export interface ColorTier {
  min: number;
  max: number;
  gradient: string;  // CSS 渐变值
}

export const COLOR_TIERS: ColorTier[] = [
  { min: 0,      max: 9999,    gradient: "from-zinc-500 to-zinc-400"   },
  { min: 10000,  max: 99999,   gradient: "from-blue-500 to-cyan-400"   },
  { min: 100000, max: 999999,  gradient: "from-amber-500 to-orange-400"},
  { min: 1000000,max: Infinity, gradient: "from-red-500 to-rose-400"   },
];

export const colorMapper: PipelineMiddleware = (items) =>
  items.map((item) => ({
    ...item,
    // Pipeline 层仅标注 tier 信息，具体渲染由前端完成
  }));
```

> **说明**：着色逻辑的边界——Pipeline 层负责「将原始数值映射为量级区间标识」，前端负责「渲染具体渐变色值」。这样前端更换视觉风格时无需改后端。

---

### 4.3 Cache 层

#### 4.3.1 MemoryCacheProvider (`server/src/cache/memoryCache.ts`)

```typescript
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
```

---

### 4.4 Controller 层

#### 4.4.1 AggregationController (`server/src/controller/hotSearch.ts`)

```typescript
import { platformRegistry } from "../adapters/registry";
import { cacheProvider } from "../cache/memoryCache";
import { runPipeline } from "../pipeline";
import { HotSearchResponse, PlatformResult, HotItem } from "../types";
import { CACHE_TTL, ADAPTER_TIMEOUT } from "../config";

export async function getHotSearch(): Promise<HotSearchResponse> {
  const adapters = platformRegistry.getAll();

  // 并发请求所有平台，单个失败不影响其他
  const results = await Promise.allSettled(
    adapters.map(async (adapter): Promise<PlatformResult> => {
      const cacheKey = `cache:${adapter.id}:hot-search`;

      // 1. 检查缓存
      const cached = cacheProvider.get<PlatformResult>(cacheKey);
      if (cached) return cached;

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
    return {
      id: adapter.id,
      name: adapter.name,
      status: "error",
      items: [],
      errorMessage: "加载失败",
    };
  });

  return {
    lastUpdated: new Date().toISOString(),
    platforms,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
```

---

### 4.5 路由与配置

#### 4.5.1 API 路由 (`server/src/routes/api.ts`)

```typescript
import { Router } from "express";
import { getHotSearch } from "../controller/hotSearch";

const router = Router();

// GET /api/v1/hot-search
router.get("/hot-search", async (_req, res) => {
  try {
    const data = await getHotSearch();
    res.json(data);
  } catch {
    res.status(500).json({ error: "服务异常" });
  }
});

export default router;
```

#### 4.5.2 配置项 (`server/src/config.ts`)

```typescript
export const CACHE_TTL = 300;           // 缓存有效期（秒）
export const ADAPTER_TIMEOUT = 5000;    // 单平台请求超时（毫秒）
export const API_PREFIX = "/api/v1";    // API 路由前缀
export const PORT = 3001;               // 后端端口
```

---

### 4.6 前端组件设计

#### 4.6.1 组件树

```
App
├── Navbar                    # 顶部导航
│   ├── 标题 "今日热搜"
│   ├── 最后更新时间
│   ├── [预留] 搜索框占位
│   └── [预留] 用户头像占位
│
├── CardGrid                  # 卡片网格
│   └── PlatformCard × N      # 按平台注册表动态渲染
│       ├── 平台标题栏
│       ├── 加载中骨架屏
│       ├── 错误提示 / 空状态
│       └── HotItem 列表
│           └── HotItem × M
│               ├── 排名
│               ├── 标题（可点击，target="_blank"）
│               └── 热度值（渐变色标注）
│
└── Footer                    # 底部免责声明
```

#### 4.6.2 数据获取 Hook (`client/src/hooks/useHotSearch.ts`)

```typescript
import { useState, useEffect } from "react";
import { HotSearchResponse } from "../types";
import { fetchHotSearch } from "../services/api";

export function useHotSearch() {
  const [data, setData] = useState<HotSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchHotSearch();
        setData(result);
      } catch {
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { data, loading, error };
}
```

---

## 5. API 接口 JSON 契约（核心）

> 本节为前后端协作的**唯一契约来源**。前端开发者可直接根据此节开发，无需关心后端实现细节。

### 5.1 接口基本信息

| 项目 | 说明 |
|------|------|
| URL | `GET /api/v1/hot-search` |
| Method | GET |
| 请求参数 | 无 |
| 响应格式 | `application/json` |
| 字符编码 | UTF-8 |

### 5.2 响应状态码

| HTTP 状态码 | 含义 | 说明 |
|-------------|------|------|
| **200** | 成功 | 即使部分平台抓取失败，HTTP 层仍返回 200。由 JSON 内每个平台的 `status` 字段区分成功/失败 |
| **500** | 服务端异常 | 后端自身发生未捕获错误（如启动失败、内存溢出等），非第三方平台问题 |

> **设计原则**：第三方平台的失败不应导致 HTTP 5xx。前端只需要处理两种情况：200（解析 JSON 内容）和 非200（网络/服务异常）。

### 5.3 字段契约定义

#### 顶层结构

| 字段 | 类型 | 必返 | 说明 |
|------|------|------|------|
| `lastUpdated` | `string` | ✅ | ISO 8601 时间戳，表示数据最后更新时间，跟随缓存刷新周期同步变动 |
| `platforms` | `PlatformResult[]` | ✅ | 平台数组，长度与注册平台数一致，顺序固定 |

#### PlatformResult 结构

| 字段 | 类型 | 必返 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 平台唯一标识，如 `"bilibili"` / `"zhihu"` / `"douyin"` |
| `name` | `string` | ✅ | 平台显示名称，如 `"B站"` / `"知乎"` / `"抖音"` |
| `status` | `enum` | ✅ | 平台数据状态，取值：`"success"` / `"error"` / `"empty"` |
| `items` | `HotItem[]` | ✅ | 热搜列表。status 非 success 时为空数组 `[]` |
| `errorMessage` | `string` | ❌ | 仅当 status 为 `error` 或 `empty` 时返回，前端直接展示 |

#### HotItem 结构

| 字段 | 类型 | 必返 | 说明 |
|------|------|------|------|
| `rank` | `number` | ✅ | 排名序号，从 1 开始 |
| `title` | `string` | ✅ | 热搜标题全文 |
| `hotValue` | `string` | ✅ | 格式化后的热度展示值（如 `"1.5万"` / `"3847"`），前端直接渲染此字段 |
| `hotRaw` | `number` | ✅ | 原始热度数值，前端用于着色映射判断 |
| `url` | `string` | ✅ | 跳转链接，前端以 `target="_blank"` 打开 |
| `category` | `string` | ❌ | 分类字段（本期保留，前端暂不渲染。未来用于 Tab 筛选） |

### 5.4 ✅ 接口成功返回（全部平台正常）

> 场景：三个平台 API 均响应正常，数据经 Pipeline 格式化后返回。

```json
{
  "lastUpdated": "2026-06-07T14:30:00.000Z",
  "platforms": [
    {
      "id": "bilibili",
      "name": "B站",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "2026年高考作文题目出炉",
          "hotValue": "153.6万",
          "hotRaw": 1536000,
          "url": "https://www.bilibili.com/video/BV1xx411c7mD",
          "category": "社会"
        },
        {
          "rank": 2,
          "title": "原神5.0版本前瞻直播",
          "hotValue": "102.4万",
          "hotRaw": 1024000,
          "url": "https://www.bilibili.com/video/BV2yy411d8nE",
          "category": "游戏"
        },
        {
          "rank": 3,
          "title": "国产大飞机C919商业运营满一周年",
          "hotValue": "48.7万",
          "hotRaw": 487000,
          "url": "https://www.bilibili.com/video/BV3zz411e9oF",
          "category": "科技"
        },
        {
          "rank": 4,
          "title": "暴雨预警：华南多地迎来强降雨",
          "hotValue": "1.5万",
          "hotRaw": 15230,
          "url": "https://www.bilibili.com/video/BV4aa411f0pG",
          "category": "社会"
        },
        {
          "rank": 5,
          "title": "周末推荐：五部高分冷门纪录片",
          "hotValue": "3847",
          "hotRaw": 3847,
          "url": "https://www.bilibili.com/video/BV5bb411g1qH",
          "category": "生活"
        }
      ]
    },
    {
      "id": "zhihu",
      "name": "知乎",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "如何评价2026年高考数学试卷难度？",
          "hotValue": "89.3万",
          "hotRaw": 893000,
          "url": "https://www.zhihu.com/question/660000001",
          "category": "教育"
        },
        {
          "rank": 2,
          "title": "AI 编程助手真的会取代程序员吗？",
          "hotValue": "56.2万",
          "hotRaw": 562000,
          "url": "https://www.zhihu.com/question/660000002",
          "category": "科技"
        },
        {
          "rank": 3,
          "title": "月入两万在一线城市是什么生活水平？",
          "hotValue": "12.8万",
          "hotRaw": 128000,
          "url": "https://www.zhihu.com/question/660000003",
          "category": "社会"
        },
        {
          "rank": 4,
          "title": "有哪些让你「相见恨晚」的厨房好物？",
          "hotValue": "8456",
          "hotRaw": 8456,
          "url": "https://www.zhihu.com/question/660000004",
          "category": "生活"
        },
        {
          "rank": 5,
          "title": "如何看待苹果发布全新折叠屏 iPhone？",
          "hotValue": "3.2万",
          "hotRaw": 32000,
          "url": "https://www.zhihu.com/question/660000005",
          "category": "科技"
        }
      ]
    },
    {
      "id": "douyin",
      "name": "抖音",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "高考第一天考生跑错考场交警火速护送",
          "hotValue": "210.5万",
          "hotRaw": 2105000,
          "url": "https://www.douyin.com/video/7400000000000000001",
          "category": "社会"
        },
        {
          "rank": 2,
          "title": "这首毕业歌唱哭了全场家长",
          "hotValue": "156.3万",
          "hotRaw": 1563000,
          "url": "https://www.douyin.com/video/7400000000000000002",
          "category": "情感"
        },
        {
          "rank": 3,
          "title": "00后毕业季花式合影创意大赏",
          "hotValue": "67.8万",
          "hotRaw": 678000,
          "url": "https://www.douyin.com/video/7400000000000000003",
          "category": "生活"
        },
        {
          "rank": 4,
          "title": "某地夜市美食测评合集",
          "hotValue": "9.1万",
          "hotRaw": 91000,
          "url": "https://www.douyin.com/video/7400000000000000004",
          "category": "美食"
        },
        {
          "rank": 5,
          "title": "萌宠金毛自己按电梯下楼遛弯",
          "hotValue": "6780",
          "hotRaw": 6780,
          "url": "https://www.douyin.com/video/7400000000000000005",
          "category": "宠物"
        }
      ]
    }
  ]
}
```

### 5.5 ❌ 接口失败返回（部分平台超时/挂掉）

> 场景：B站正常、知乎接口超时（>5s）、抖音接口返回 500 错误。
> HTTP 状态码仍为 **200**，由各平台 `status` 字段区分。
> 前端根据 `status` 对失败的卡片展示 `errorMessage`，**不影响其他平台正常渲染**。

```json
{
  "lastUpdated": "2026-06-07T14:30:00.000Z",
  "platforms": [
    {
      "id": "bilibili",
      "name": "B站",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "2026年高考作文题目出炉",
          "hotValue": "153.6万",
          "hotRaw": 1536000,
          "url": "https://www.bilibili.com/video/BV1xx411c7mD",
          "category": "社会"
        },
        {
          "rank": 2,
          "title": "原神5.0版本前瞻直播",
          "hotValue": "102.4万",
          "hotRaw": 1024000,
          "url": "https://www.bilibili.com/video/BV2yy411d8nE",
          "category": "游戏"
        },
        {
          "rank": 3,
          "title": "国产大飞机C919商业运营满一周年",
          "hotValue": "48.7万",
          "hotRaw": 487000,
          "url": "https://www.bilibili.com/video/BV3zz411e9oF",
          "category": "科技"
        },
        {
          "rank": 4,
          "title": "暴雨预警：华南多地迎来强降雨",
          "hotValue": "1.5万",
          "hotRaw": 15230,
          "url": "https://www.bilibili.com/video/BV4aa411f0pG",
          "category": "社会"
        },
        {
          "rank": 5,
          "title": "周末推荐：五部高分冷门纪录片",
          "hotValue": "3847",
          "hotRaw": 3847,
          "url": "https://www.bilibili.com/video/BV5bb411g1qH",
          "category": "生活"
        }
      ]
    },
    {
      "id": "zhihu",
      "name": "知乎",
      "status": "error",
      "errorMessage": "加载失败",
      "items": []
    },
    {
      "id": "douyin",
      "name": "抖音",
      "status": "error",
      "errorMessage": "加载失败",
      "items": []
    }
  ]
}
```

### 5.6 空状态返回（接口通了但无数据）

> 场景：B站正常、知乎接口通了但返回空列表、抖音正常。

```json
{
  "lastUpdated": "2026-06-07T14:30:00.000Z",
  "platforms": [
    {
      "id": "bilibili",
      "name": "B站",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "2026年高考作文题目出炉",
          "hotValue": "153.6万",
          "hotRaw": 1536000,
          "url": "https://www.bilibili.com/video/BV1xx411c7mD",
          "category": "社会"
        }
      ]
    },
    {
      "id": "zhihu",
      "name": "知乎",
      "status": "empty",
      "errorMessage": "暂无数据",
      "items": []
    },
    {
      "id": "douyin",
      "name": "抖音",
      "status": "success",
      "items": [
        {
          "rank": 1,
          "title": "高考第一天考生跑错考场交警火速护送",
          "hotValue": "210.5万",
          "hotRaw": 2105000,
          "url": "https://www.douyin.com/video/7400000000000000001",
          "category": "社会"
        }
      ]
    }
  ]
}
```

### 5.7 前端处理逻辑速查

```
前端收到 JSON 响应
│
├── HTTP 200
│   └── 遍历 platforms[]
│       │
│       ├── status === "success"
│       │   └── 渲染热搜列表，每条 HotItem 可点击跳转
│       │       ├── hotValue → 直接显示为热度文字
│       │       └── hotRaw → 传入 colorMapper 决定渐变色
│       │
│       ├── status === "error"
│       │   └── 卡片显示 errorMessage（如"加载失败"）
│       │
│       └── status === "empty"
│           └── 卡片显示 errorMessage（如"暂无数据"）
│
└── HTTP 非200
    └── 全局提示"网络异常，请稍后重试"
```

---

## 6. 热度色彩映射方案

| 热度区间 | hotRaw 范围 | Tailwind 渐变类 | 视觉效果 |
|---------|------------|----------------|---------|
| 万以下 | 0 ~ 9,999 | `from-zinc-500 to-zinc-400` | 灰白，低调 |
| 万级 | 10,000 ~ 99,999 | `from-blue-500 to-cyan-400` | 蓝青，温热 |
| 十万级 | 100,000 ~ 999,999 | `from-amber-500 to-orange-400` | 橙黄，火热 |
| 百万级 | 1,000,000+ | `from-red-500 to-rose-400` | 红玫瑰，爆热 |

> **前端判断逻辑**：根据 `hotRaw` 的值区间选择对应的 Tailwind 渐变类，无需依赖 `hotValue` 字符串。

---

## 7. 视觉设计 Token

> 基于「文明 7」高级感深色主题，所有组件共享以下设计变量。

```css
/* Tailwind 自定义主题扩展 */
:root {
  /* 背景层级 */
  --bg-base:       #0a0a0f;   /* 页面底色 */
  --bg-card:       #12121a;   /* 卡片背景 */
  --bg-navbar:     #0e0e16;   /* 导航栏 */

  /* 文字层级 */
  --text-primary:  #e4e4e7;   /* 主文字 */
  --text-secondary:#71717a;   /* 次要文字 */
  --text-muted:    #3f3f46;   /* 占位提示 */

  /* 边框与分割线 */
  --border-card:   #1e1e2a;   /* 卡片边框 */

  /* 呼吸灯动画 */
  --glow-color:    #3b82f6;   /* 蓝色呼吸光 */

  /* 圆角 */
  --radius-card:   12px;
  --radius-item:   8px;
}
```

---

## 8. 错误处理矩阵

| 场景 | 表现 | 实现层 |
|------|------|-------|
| 某平台 API 超时 (>5s) | 该卡片显示"加载失败"，其他正常 | Controller `Promise.allSettled` |
| 某平台 API 返回错误 | 该卡片显示"加载失败" | Controller catch |
| 某平台返回空数据 | 该卡片显示"暂无数据" (status=empty) | Controller 空数组判断 |
| 全部平台失败 | 三张卡片均显示错误 + 页面无崩溃 | 前端空状态兜底 |
| 前端网络异常 | 全局提示"网络异常，请稍后重试" | `useHotSearch` Hook |
| 缓存失效 | 自动重新抓取，用户无感知 | Cache 层透明切换 |

---

## 9. 启动与开发

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install

# 启动后端（默认端口 3001）
cd server && npm run dev

# 启动前端（默认端口 5173，自动代理到后端）
cd client && npm run dev
```

**前端 Vite 代理配置**（解决开发环境跨域）：

```typescript
// client/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

---

*本文档为 `prd.md` 的技术实现 companion，任何需求变更以 PRD 为准。*
