# Day 18 打卡：体验优化与文档收尾

## 📋 已完成的优化项（5 项）

### 1. ✅ 相对时间显示「3 分钟前」
- 新增 `utils/formatRelativeTime.ts` 工具函数
- 支持"刚刚"、"X 分钟前"、"X 小时前"、"X 天前"等中文相对时间
- Navbar 中的更新时间从绝对时间（如 14:30:25）改为相对时间（如 "3 分钟前"）
- 添加每分钟自动刷新相对时间文案的定时器

### 2. ✅ 卡片 hover 和链接 hover 样式优化
- 卡片 hover 时边框颜色变化（新增 `--border-hover` 变量）
- 链接 hover 时左侧出现蓝色高亮条动画（`.hot-link::before`）
- 按钮 hover 添加 shadow 发光效果和 active 缩放反馈
- 所有过渡时间统一为 200ms，交互更流畅

### 3. ✅ 站点 favicon 和动态 title
- 替换原有 favicon 为自定义火焰图标（贴合"热搜"主题）
- 实现动态 title：页面标题随数据更新变化，如"今日热搜 · 30 条热榜"
- 标题在数据加载后自动更新

### 4. ✅ 空 heat 字段隐藏
- 当热搜条目的 `hotValue` 为空、"--" 或 `hotRaw <= 0` 时，不渲染热度标签
- 避免显示无意义的占位文本

### 5. ✅ 整页 Loading 优化
- 添加顶部加载进度条（蓝紫渐变色，1.5s 动画）
- 加载时在页面最顶部显示，数据加载完成后自动消失
- 优化移动端卡片间距（`px-4 sm:px-6` 响应式 padding）

## 🏗️ npm run build 结果

```
> client@0.0.0 build
> tsc -b && vite build

✓ 24 modules transformed.
dist/index.html                   0.49 kB
dist/assets/index-BlvsEASi.css   21.70 kB
dist/assets/index-DNWg71qm.js   198.61 kB

✓ built in 184ms
```

构建完全成功，无 TypeScript 错误，无 Vite 警告。

## 📝 部署前检查表

| 序号 | 检查项 | 状态 | 说明 |
|------|--------|------|------|
| 1 | 前端构建成功 | ✅ | `cd client && npm run build` 通过 |
| 2 | `dist/` 目录生成 | ✅ | 包含 index.html、CSS、JS |
| 3 | 后端本地启动正常 | ✅ | `npm run dev` 正常运行在 3001 端口 |
| 4 | API 代理配置正确 | ✅ | Vite dev proxy: `/api` → `localhost:3001` |
| 5 | CORS 配置 | ⏳ | 部署时需设置 `CLIENT_ORIGIN` 环境变量 |
| 6 | 环境变量清单 | 📋 | 见下方 |
| 7 | 生产 API 地址 | ⏳ | 需设置 `VITE_API_BASE` 为 Railway 后端地址 |
| 8 | Favicon 可访问 | ✅ | `public/favicon.svg` 已打包到 dist |

### 环境变量清单

**后端（Railway）：**
| 变量 | 说明 | 示例值 |
|------|------|--------|
| PORT | 后端端口 | 3001 |
| CACHE_TTL | 缓存秒数 | 300（默认） |
| CLIENT_ORIGIN | 前端域名（CORS） | https://xxx.vercel.app |

**前端（Vercel）：**
| 变量 | 说明 | 示例值 |
|------|------|--------|
| VITE_API_BASE | 后端 API 地址 | https://xxx.up.railway.app |

### 项目结构
```
mini-hot-hub/
├── client/           # React + Vite + Tailwind 前端
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/   # Navbar, PlatformCard, CardGrid, HotItem, Footer
│   │   ├── hooks/        # useHotSearch, useSearchQuery
│   │   ├── services/     # api.ts
│   │   ├── utils/        # colorMapper, formatRelativeTime
│   │   ├── types/        # index.ts
│   │   └── index.css     # 设计 Token + 动画
│   └── vite.config.ts    # proxy → localhost:3001
└── server/           # Express 后端
    └── src/
        ├── adapters/     # bilibili, zhihu, douyin
        ├── cache/        # 内存缓存
        ├── config.ts     # 端口、TTL 配置
        └── routes/       # /api/v1/hot-search
```

## 💭 自评：主路径 18 天最大收获

在这 18 天的 Vibe Coding 主路径学习中，我最大的收获是**完整体验了从 0 到 1 的 AI 协作产品开发流程**。

以前写代码是从「打开编辑器」开始，现在是从「Research → PRD → Tech Design → AGENTS → Build」的系统性流程开始。每一天都有明确的目标和交付物，每一天都在前一天的基础上迭代。从 Day 7 的 PRD 文档，到 Day 16 的三平台聚合，再到今天的体验优化，整个项目从一个想法变成了一组完整的功能。

技术层面，我学会了：如何用 Vibe Coding 的方式组织提示词、如何设计前后端分离架构、如何处理多平台数据获取和缓存、如何用 CSS 变量体系构建深色主题、以及如何优化用户体验（加载状态、错误重试、相对时间等）。更重要的是，我体会到了**「先跑通，再优化」**的迭代思维——18 天的主路径不是追求完美，而是追求每一步都有可运行的产出。

接下来的 3 天缓冲期，我将专注于部署上线，让这个项目真正跑在公网上！🚀
