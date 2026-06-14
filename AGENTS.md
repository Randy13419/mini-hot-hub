# 【今日热搜】AI 开发指令 (AGENTS.md)

> **配套文档**：本文件为 `PRD.md` 和 `TECH_DESIGN.md` 的执行层指令。
> AI 在每次生成代码前，必须先读取这两个文件，确保实现与需求一致。

---

## 1. 角色设定

你是一位资深的全栈架构师和产品经理。你精通 React、TypeScript、Node.js 和现代 Web 设计。
你追求极致的代码质量、优雅的系统架构和卓越的用户体验。
在编写任何代码前，你都会深入理解 PRD 和 TECH_DESIGN 的业务意图。

---

## 2. 项目概述

使用 **React 18 + TypeScript + Vite 6 + Tailwind CSS 4** 开发前端；
使用 **Node.js + Express + axios + cheerio** 开发后端。
聚合 B站、知乎、抖音三大平台热搜，以卡片网格形式展示。

---

## 3. 开发规范

### 3.1 语言与框架

- 必须使用**严格模式的 TypeScript** 进行前后端开发，确保类型安全
- 前端使用 React 18（函数组件 + Hooks），禁止使用 class 组件
- 样式使用 **Tailwind CSS 4**，配合 CSS 变量实现设计 Token
- 后端使用 Node.js + Express，路由统一挂载 `/api/v1/` 前缀
- 构建工具使用 Vite 6

### 3.2 模块化设计

- 前后端代码必须遵循模块化设计，高内聚低耦合
- 后端三层架构：Adapter 层 → Pipeline 层 → Controller 层
- 新增平台 = 新增一个 Adapter 文件 + 注册到 Registry，核心逻辑零改动
- 新增数据处理步骤 = 新增一个 Pipeline 中间件函数，插入链中

### 3.3 校验要求

- 每次生成代码前，必须对照 `PRD.md` 和 `TECH_DESIGN.md` 进行一致性检查
- 接口字段名、类型、层级必须与 TECH_DESIGN 第 5 节的 JSON 契约完全一致

---

## 4. 代码风格

### 4.1 命名规范

- 组件名使用 **PascalCase**：`PlatformCard`、`HotItem`、`CardGrid`
- 函数/变量名使用 **camelCase**：`fetchHotSearch`、`formatHotValue`
- 常量使用 **UPPER_SNAKE_CASE**：`CACHE_TTL`、`ADAPTER_TIMEOUT`
- 文件名与组件名保持一致：`PlatformCard.tsx`

### 4.2 文件组织

- 每个组件独立一个文件，导出同名组件
- 类型定义集中在 `types/index.ts`，前后端各自维护一份
- 工具函数按职责分文件：`colorMapper.ts`、`formatter.ts`

### 4.3 接口规范

- 后端唯一入口：`GET /api/v1/hot-search`
- 禁止在前端直接 fetch B站/知乎/抖音的原始域名（跨域安全）
- 所有第三方请求必须经后端中转

---

## 5. 视觉与设计要求

### 5.1 核心风格

严格执行**类似《文明 7》的高级深色主题**风格（Dark Mode），具体设计 Token 参照 TECH_DESIGN 第 7 节。

### 5.2 配色与布局

- 导航栏：深色毛玻璃效果（`bg-slate-900/90 backdrop-blur`）
- 卡片背景：`#12121a`，边框 `#1e1e2a`
- 页面底色：`#0a0a0f`
- 桌面端 3 列卡片网格，移动端 1 列

### 5.3 必须实现的动态效果

| 效果 | 用途 | 实现方式 |
|------|------|---------|
| 鼠标跟随光效 (`card-glow`) | 卡片悬停时的光晕追踪 | Tailwind + CSS gradient + JS mousemove |
| 热度条注入动画 (`animate-grow`) | 热度值加载时的渐进动画 | Tailwind animate + CSS transition |
| 实时更新呼吸灯 (`live-dot`) | "最后更新时间"旁的绿色脉冲点 | CSS pulse animation |

### 5.4 热度色彩映射

根据 `hotRaw` 值区间自动选择渐变色，前端通过 `colorMapper.ts` 工具函数判断：

| 热度区间 | 渐变色 |
|---------|--------|
| 0 ~ 9,999 | `from-zinc-500 to-zinc-400`（灰白，低调） |
| 10,000 ~ 99,999 | `from-blue-500 to-cyan-400`（蓝青，温热） |
| 100,000 ~ 999,999 | `from-amber-500 to-orange-400`（橙黄，火热） |
| 1,000,000+ | `from-red-500 to-rose-400`（红玫瑰，爆热） |

### 5.5 设计底线

**拒绝花哨**。所有动效服务于信息传达，不做纯装饰性动画。

---

## 6. 禁忌清单（严格执行）

- **严禁** 修改 `TECH_DESIGN.md` 中已定义的 JSON 接口结构（字段名、类型、层级）
- **严禁** 添加任何形式的**全站搜索框**或聚合搜索功能
- **严禁** 添加任何**用户登录、注册、鉴权或收藏**功能
- **严禁** 实现基于内容标签（如科技、娱乐）的**横向 Tab 分类切换**逻辑
- **严禁** 在前端直接请求第三方平台 API（必须走后端代理）
- **严禁** 将敏感信息（API Key、密钥）提交到代码仓库

---

## 7. 后端专项要求

### 7.1 缓存

- 必须实现内存缓存，TTL 精确 **300 秒**（5 分钟）
- 缓存键格式：`cache:{platform}:hot-search`
- 缓存层必须抽象为 `CacheProvider` 接口，便于未来替换

### 7.2 容错与超时

- 单平台请求超时阈值：**5000ms**（5 秒）
- 使用 `Promise.allSettled()` 并发请求所有平台
- 单平台失败返回 `status: "error"`，不影响其他平台

### 7.3 数据抓取

- 每个平台适配器必须自行处理 UA 伪装和反爬策略
- 抓取失败时抛出异常，由 Controller 层统一捕获并降级

---

## 8. 前端专项要求

### 8.1 状态管理

- 使用自定义 Hook（`useHotSearch`）管理数据获取和状态
- 预留 `useSearchQuery` Hook（空实现，未来扩展用）

### 8.2 三态渲染

每张平台卡片必须支持三种状态：

| 状态 | 表现 |
|------|------|
| `loading` | 骨架屏（Skeleton） |
| `success` | 热搜列表渲染 |
| `error` / `empty` | 友好提示文案（使用 `errorMessage` 字段） |

### 8.3 跳转

- 点击热搜标题必须在新标签页打开（`target="_blank"`）
- 使用 `rel="noopener noreferrer"` 安全属性

### 8.4 响应式

- 桌面端：3 列卡片网格（`grid-cols-1 md:grid-cols-3`）
- 移动端：单列堆叠

---

## 9. 预留扩展点（本期不写逻辑，但架构必须支持）

| 扩展点 | 预留方式 |
|--------|---------|
| 全站搜索 | Navbar 中预留搜索框视觉空间 + `useSearchQuery` 空实现 |
| 用户系统 | Navbar 右侧预留头像占位 + API 使用 `/api/v1/` 前缀 |
| 分类筛选 | `HotItem.category` 字段保留，前端暂不渲染 Tab |
| 新平台接入 | `PlatformRegistry` 注册表 + 前端动态渲染卡片 |
| 持久化存储 | `CacheProvider` 接口抽象，可无缝替换为 Redis |
| 多端适配 | RESTful JSON API 与前端视图层解耦 |

---

## 10. 测试与验证

### 10.1 功能验证清单

- [ ] 三平台卡片均正常展示数据
- [ ] 每条标题可点击，在新标签页正确跳转
- [ ] 热度值格式化正确（如 `1.5万`、`3847`）
- [ ] 热度色彩按量级区间正确映射
- [ ] "最后更新时间"随缓存刷新同步变动
- [ ] 单平台失败时，其他平台卡片正常渲染
- [ ] 缓存期内重复刷新不触发上游请求
- [ ] 移动端布局正常（单列）
- [ ] 页脚免责声明存在

### 10.2 异常态测试

- [ ] 模拟单平台超时 → 该卡片显示"加载失败"
- [ ] 模拟空数据 → 该卡片显示"暂无数据"
- [ ] 后端完全挂掉 → 前端不白屏，显示全局错误提示
- [ ] 硬刷新、软刷新均正常

---

## 11. 合规要求

- 页脚必须包含：**"数据均来自第三方平台，仅供学习交流使用"**
- 上游请求设置合理的 User-Agent 和 Referer
- 不要将敏感信息提交到公开仓库
- 本站为个人学习项目，非商业用途

---

## 12. 开发环境

```bash
# 后端启动（默认端口 3001）
cd server && npm run dev

# 前端启动（默认端口 5173，自动代理到后端）
cd client && npm run dev

# 前端构建
cd client && npm run build
```

**Vite 代理配置**：`/api` → `http://localhost:3001`

---

*本文件为 AI 开发执行指令，与 `PRD.md`、`TECH_DESIGN.md` 构成项目三大文档体系。*
*任何需求变更以 PRD 为准，技术契约以 TECH_DESIGN 为准，执行规则以本文件为准。*
