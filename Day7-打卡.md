# Day 7 打卡：初始化 Monorepo 项目，从零到三平台真实数据跑通

---

## 📸 本地首页截图

> 请将浏览器打开 `http://localhost:5173`，截取全屏截图贴在此处。
>
> **截图要点**：能看到三张卡片并排（B站/知乎/抖音），前三名序号有金银铜徽章，热度值带渐变色，深色背景高级感。

（此处粘贴你的本地首页截图）

---

## 🛠️ 今日完成内容

### 1. 项目初始化

- 在 `mini-hot-hub/` 根目录执行 `git init`，创建 `.gitignore`
- 读取项目三大文档（PRD.md、TECH_DESIGN.md、AGENTS.md），严格按照文档架构搭建 Monorepo

### 2. 前端工程（client/）

- 使用 **Vite 6 + React 18 + TypeScript** 初始化前端骨架
- 配置 **Tailwind CSS 4**（使用 `@tailwindcss/vite` 插件 + `@import "tailwindcss"`）
- 按照 TECH_DESIGN 创建完整目录结构：components / hooks / services / types / utils
- 配置 Vite 代理：`/api` → `http://localhost:3001`

### 3. 后端工程（server/）

- 使用 **Node.js + Express 5 + TypeScript**（tsx 运行器）初始化后端
- 安装 **axios + cheerio** 用于数据抓取和 HTML 解析
- 实现三层架构：Adapter 层 → Pipeline 层 → Controller 层
- 实现内存缓存（MemoryCacheProvider，TTL = 300s）

### 4. 三平台真实数据全部跑通

| 平台 | 数据源 | 状态 |
|------|--------|------|
| B站 | Bilibili 官方 API（`api.bilibili.com`） | ✅ 10 条真实热搜 |
| 知乎 | TopHub 聚合页 HTML 解析（`tophub.today` + cheerio） | ✅ 10 条真实热搜 |
| 抖音 | 抖音热榜 API（`douyin.com/aweme/v1/...`） | ✅ 10 条真实热搜 |

---

## 💬 调教动效与数据的 Prompt 记录

### Prompt 1：初始化 Monorepo

```
请严格读取我根目录下的 PRD.md、TECH_DESIGN.md 和 AGENTS.md。你现在是我的全栈架构师助手，请帮我初始化这个 Monorepo 项目。
请在根目录下创建 client/ 文件夹，使用 Vite 6 + React 18 + TypeScript 初始化前端骨架，并配置好 Tailwind CSS 4。
请在根目录下创建 server/ 文件夹，使用 Node.js + Express 初始化后端空壳，并安装好 axios 和 cheerio。
请确保两边各自生成独立的 package.json 且项目能够正常跑通启动。
```

**效果**：AI 一次性完成了 client/ 和 server/ 的搭建，包括所有目录结构、类型定义、组件骨架、Express 路由、缓存层、Pipeline 中间件链。构建报了一个 `import type` 的错误，我手动修正后 `vite build` 通过。

### Prompt 2：验证本地效果

```
打开浏览器 http://localhost:5173，疯狂用眼睛和鼠标去品鉴：在桌面端是不是 3 列并排？卡片底色够不够高级？前三名序号亮起来了吗？鼠标滑过去有没有光晕跟着走？
```

**效果**：这个 Prompt 触发了我对 UI 细节的全面审视，发现四个需要补足的点：
1. 前三名序号没有高亮 → 加入了 `rank-badge` 金银铜徽章（CSS 渐变 + 圆角方块）
2. 鼠标悬停没有光晕 → 实现了 `card-glow` 效果（CSS `::before` 伪元素 + JS `mousemove` 事件追踪鼠标坐标）
3. 导航栏呼吸灯不够明显 → 改为绿色脉冲 + `shadow-lg shadow-emerald-400/50` 发光
4. 热度值没有渐变色 → 通过 `getHotColorGradient()` 工具函数，按热度量级映射 Tailwind 渐变类

### Prompt 3：修复知乎和抖音数据

```
B站有了，知乎和抖音显示加载失败
```

**效果**：AI 排查后发现知乎 API 全部返回 401/403（反爬策略），最终找到 `tophub.today` 作为数据源，用 `cheerio` 解析 HTML 表格提取标题和热度。抖音则是缺少 `aid` 参数，补上后 API 立刻通了。

**关键收获**：真实数据抓取从来不是一次就通的，每个平台都有不同的反爬策略，需要有耐心地逐个排查。

---

## 🧠 深度思考：AGENTS.md 约束的作用与价值

### 为什么 AGENTS.md 是项目开发中最重要的"隐形护栏"？

今天的开发过程让我深刻体会到了 AGENTS.md 的价值。它不仅仅是一份"规则文档"，更像是给 AI 的**行为边界和判断基准**。

**第一，它防止了"过度设计"的冲动。**

AI 的天性是把事情做"完整"——你让它做一个热榜页，它可能顺手把搜索功能、用户登录、分类筛选全做了。但 AGENTS.md 里明确写着禁忌清单：**严禁添加搜索框、严禁添加用户系统、严禁实现分类 Tab**。这让我在整个开发过程中，AI 始终保持在 MVP 的边界内，一次都没有"越界"。

**第二，它统一了前后端的数据契约。**

AGENTS.md 引用了 TECH_DESIGN 中定义的 JSON 接口结构，AI 在生成前端组件和后端路由时，都严格遵守了 `HotItem`、`PlatformResult`、`HotSearchResponse` 这套类型定义。前端渲染时用的字段名和后端返回的字段名**完全一致**——这在没有 AGENTS.md 的情况下几乎不可能自然发生。

**第三，它建立了可扩展的架构意识。**

AGENTS.md 虽然说"本期不做"，但明确要求"架构必须预留"。比如：
- 搜索功能 → 预留了 `useSearchQuery` 空实现 + Navbar 搜索框占位
- 用户系统 → 预留了 `/api/v1/` 路由前缀 + 头像占位
- 新平台 → 通过 `PlatformRegistry` 注册表，新增平台只需一个适配器文件
- 持久化 → `CacheProvider` 接口抽象，可无缝替换为 Redis

这种"本期不做但架构预留"的思路，让我理解了什么叫**好的技术债管理**——不是不做，而是不急着做，但给未来留好接口。

**第四，它让"单平台容错"成为本能。**

AGENTS.md 要求"单平台失败不影响其他平台"，这个约束直接体现在了后端使用 `Promise.allSettled()` 而非 `Promise.all()` 的设计选择上。今天知乎 401、抖音返回空数据时，B站的卡片依然正常渲染——正是因为 AGENTS.md 的约束让 AI 在代码生成阶段就做好了容错设计。

### 三份文档的分工总结

| 文档 | 解决什么问题 | 类比 |
|------|-------------|------|
| PRD.md | 做什么、不做什么 | 产品经理的需求文档 |
| TECH_DESIGN.md | 怎么做、数据长什么样 | 架构师的技术方案 |
| AGENTS.md | AI 该遵守什么规则 | 给开发团队的开发规范 |

没有 PRD，AI 不知道目标；没有 TECH_DESIGN，AI 不知道结构；没有 AGENTS.md，AI 不知道边界。**三份文档缺一不可，构成了 AI 协作开发的"铁三角"。**

---

## 📝 今日总结

今天的核心收获是：**文档先行，代码后行**。PRD → TECH_DESIGN → AGENTS → 初始化项目，这个顺序不是随意的，而是让每一层为下一层提供约束和依据。当 AI 拿到三份文档后，它生成的代码质量和架构合理性远超"直接让 AI 写代码"。

同时，知乎数据源的排查过程让我理解了真实世界开发的复杂性——API 会变、接口会封、数据格式会改。**这正是需要后端中转和缓存机制的原因**，也是 PRD 中"单平台容错"要求存在的意义。

> **一句话总结 Day 7**：文档是灯塔，代码是航船。没有灯塔的航船，只会原地打转。

---

*Day 7 完成 ✅ · 三平台真实数据跑通 · 前后端架构搭建完毕 · 准备进入 Day 8 卡片网格优化*
