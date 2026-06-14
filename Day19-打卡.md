# Day 19 打卡：准备部署 · 构建与环境变量就绪

> Day 19～21 是 3 天缓冲带，以**部署上线**为主。Day 19 的主题是「准备部署」：完成生产构建、确认后端入口、梳理部署前检查表与环境变量清单，让项目真正达到「上云就绪」状态。
>
> 本次打卡对 Day 19 的全部交付物做了**重验证**——不只是看文档结论，而是真正跑一遍构建、起一次服务、发三个真实请求，确认每一项都站得住。

## 🎯 今日目标

了解部署流程，完成构建与文档——前端能打包出静态资源，后端能被平台拉起，两组环境变量的含义全部明确并落地到代码。

---

## 🏗️ Step 1：前端生产构建确认

清掉旧 `dist/` 后重新 `cd client && npm run build`（`tsc -b && vite build`），确保是真实构建而非读缓存：

```
> client@0.0.0 build
> tsc -b && vite build

vite v8.0.16 building client environment for production...
✓ 24 modules transformed.
dist/index.html                   0.49 kB │ gzip:   0.34 kB
dist/assets/index-BlvsEASi.css   21.70 kB │ gzip:   5.01 kB
dist/assets/index-BGjOOthP.js   399.41 kB │ gzip: 120.97 kB

✓ built in 185ms
```

构建完全成功，无 TypeScript 错误，无 Vite 警告。`client/dist/` 已重新生成，这就是明天要托管给 Vercel 的**全部资产**：

| 文件 | 大小 | gzip |
|------|------|------|
| `index.html` | 0.49 kB | 0.34 kB |
| `assets/index-BlvsEASi.css` | 21.70 kB | 5.01 kB |
| `assets/index-BGjOOthP.js` | 399.41 kB | 120.97 kB |
| `favicon.svg` / `icons.svg` | 静态资源 | — |

> ✅ `index.html` + 带 hash 的压缩 JS/CSS 都在——Vite 生产构建的标准产物。

---

## 🚀 Step 2：后端环境入口确认

入口文件 `server/src/app.ts` 可由 `npm run start`（`tsx src/app.ts`）正常拉起。`config.ts` 中端口已动态绑定：

```ts
export const PORT = Number(process.env.PORT) || 3001;
```

**实测**注入 `PORT=9876` 后启动，日志确认监听在 9876：

```
🚀 Server running at http://localhost:9876
📡 API endpoint: http://localhost:9876/api/v1/hot-search
```

`curl http://localhost:9876/api/v1/hot-search` 返回 HTTP 200 + 三平台 JSON 数据。

> **为什么这一步对部署至关重要**：云平台不会让你自选端口，它通过 `process.env.PORT` 把端口「喂」给你的进程。写死 3001 → 平台健康检查连不上 → 部署失败。这是 Node 服务上云的第一条铁律。

---

## 🔒 Step 3：CORS 函数式白名单 — 重验证三场景（重点）

这一步是本次打卡**最费工夫**的部分。Day 19 初稿曾声称 CORS "已实测全过"，但我重验证时发现响应头里**完全没有** `Access-Control-Allow-Origin`——文档结论与实测不符。必须查清楚到底哪边错了。

### 排查过程

1. **对比最小复现**：写了一个独立的 `express + cors` 脚本（逻辑与 `app.ts` 一致），CORS **完全正常**，头正确下发。
2. **加探针日志**：在真实 `app.ts` 的 `origin` 回调里打印 `origin` 和 `CLIENT_ORIGIN`，重启服务再请求。
3. **定位根因**：探针日志显示——

   ```
   [cors] check origin= "https://test-app.vercel.app" CLIENT_ORIGIN= "https://test-app.vercel.app "
   ```

   注意 `CLIENT_ORIGIN` 末尾有一个**多余的空格**！

4. **根因**：Windows cmd 的 `set CLIENT_ORIGIN=https://test-app.vercel.app && npm run start` 链中，`&&` 前的空格被当作变量值的一部分。导致 `"https://test-app.vercel.app "` `!==` `"https://test-app.vercel.app"`，永远走 REJECT 分支。
5. **改用 PowerShell `$env:CLIENT_ORIGIN='...'`**（无尾随空格）重启，三场景全过。

### 三场景实测结果

| 场景 | Origin | 预期 | 实测结果 |
|------|--------|------|----------|
| 白名单内 | `https://test-app.vercel.app` | 下发 `Access-Control-Allow-Origin` | ✅ `Access-Control-Allow-Origin: https://test-app.vercel.app` |
| 白名单外 | `https://evil-site.com` | 不下发头（服务端拒绝） | ✅ 响应头无 `Access-Control-*` |
| 无 Origin | —（curl / 服务端调用） | 正常放行 | ✅ HTTP 200，无 AC 头（无需白名单） |

### 代码（已确认正确，未改动）

```ts
app.use(
  cors({
    origin: (origin, callback) => {
      // 放行：无 Origin（同源/服务端调用，如 curl）、开发模式 "*"、或来源命中白名单
      if (!origin || CLIENT_ORIGIN === "*" || origin === CLIENT_ORIGIN) {
        callback(null, true);
      } else {
        // 来源不在白名单 → 不下发 allow-origin 头，浏览器自动拦截
        callback(null, false);
      }
    },
  })
);
```

> **关键结论**：代码本身正确，**Railway 后台填环境变量时不会有尾随空格问题**（平台 UI 填入的是精确字符串）。这次假阴性纯粹是本地测试环境引入的。
>
> 教训：
> 1. Windows cmd `set X=Y &&` 链会让变量带上尾随空格，验证带空格敏感的字符串时务必检查
> 2. 验证服务端行为时，先用探针日志确认中间件回调**是否真的被触发**，再下结论
> 3. 排错优先用最小复现脚本（独立 Express 实例）剥离干扰项——它能快速告诉你"问题是代码还是环境"

---

## 📋 Step 4：部署前检查表 & 环境变量清单

### 部署前检查表（8 项，全部重验证）

| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | 前端生产构建 | ✅ 已重构建 | `npm run build` 通过，JS 399.41 kB / gzip 120.97 kB |
| 2 | 后端可由 `npm run start` 拉起 | ✅ 已确认 | `tsx src/app.ts` 启动 Express 正常 |
| 3 | 后端端口动态绑定 `process.env.PORT` | ✅ 已实测 | 注入 PORT=9876 → 监听 9876 |
| 4 | 后端 CORS 中间件就位 | ✅ 已重验证 | `app.ts`：函数式白名单 `origin` 回调 |
| 5 | 后端读取 `CLIENT_ORIGIN` 白名单 | ✅ 已重验证 | 三场景实测全过（白名单内回显 / 外拒绝 / 无 Origin 放行） |
| 6 | 前端读取 `VITE_API_BASE` | ✅ 已确认 | `api.ts`：`import.meta.env.VITE_API_BASE \|\| "/api/v1"` |
| 7 | 无残留 `localhost` 硬编码到前端 | ✅ 已确认 | 前端只用相对路径，`localhost:3001` 仅在 `vite.config.ts` 的 dev proxy 里 |
| 8 | `.env` 已被 gitignore | ✅ 本次已加固 | 三层覆盖：根 + client（本次补 `.env`）+ 新增 `server/.gitignore` |

### 本次额外修复：.gitignore 加固

排查时发现 `client/.gitignore` 只忽略了 `*.local`，**没有显式忽略 `.env`**——一旦把 `.env.example` 复制成 `.env`，线上 `VITE_API_BASE` 就会被误提交。本次补上：

```diff
# client/.gitignore
 node_modules
 dist
 dist-ssr
 *.local
+
+# Environment variables (含 VITE_API_BASE 等线上配置，禁止提交)
+.env
+.env.local
+.env.*.local
```

并新增 `server/.gitignore`（独立忽略 `.env`，不依赖根目录覆盖，Railway 从 server/ 部署时更稳妥）。

### 环境变量清单

**后端（Railway）所需变量：**

| 变量 | 含义 | 本地默认 | 线上取值 | 由谁注入 |
|------|------|----------|----------|----------|
| `PORT` | 后端监听端口 | `3001`（代码回退） | 平台分配的端口 | **Railway 自动注入** |
| `CLIENT_ORIGIN` | 线上前端域名，配置 CORS 白名单 | `*`（允许所有来源） | `https://xxx.vercel.app` | 手动填写 |
| `CACHE_TTL` | 缓存有效期（秒） | `300`（当前硬编码） | 可选配 300/600 | 可选 |

**前端（Vercel）所需变量：**

| 变量 | 含义 | 本地默认 | 线上取值 | 由谁注入 |
|------|------|----------|----------|----------|
| `VITE_API_BASE` | 线上后端真实 API 基准地址 | `/api/v1`（走 Vite 代理） | `https://xxx.up.railway.app/api/v1` | 手动填写 |

> ⚠️ 只有 `VITE_` 前缀的变量才会被打进前端产物，前缀写错变量就进不了代码。

### 上线当天的填值顺序

两者互为依赖（前端地址要进后端 CORS，后端地址要进前端配置），所以**先各自上线拿域名，再互相回填**：

1. **先部署后端（Railway）** → 拿到后端域名 `https://mini-hot-hub.up.railway.app`
2. **部署前端（Vercel）**：`VITE_API_BASE` = `https://mini-hot-hub.up.railway.app/api/v1`
3. **回后端补 CORS**：`CLIENT_ORIGIN` = `https://你的应用.vercel.app`

---

## 💭 心得：从「本地能跑」到「上线能用」的鸿沟

本地能跑 ≠ 上线能用。这二者之间隔着一道「环境」的鸿沟，而今天做的全部准备工作，本质上都是在**把代码里那些「只认本地环境」的假设，改造成「能适应任意环境」的契约**。

最典型的是端口。本地写死 3001 天经地义，但云平台有自己的规矩——它给你一个端口，你得照着听。`Number(process.env.PORT) || 3001` 这一行，就是把「我的代码」和「平台的环境」对接的接头。环境变量就是这份契约的具体条款：`PORT`、`CLIENT_ORIGIN`、`VITE_API_BASE`，每一个变量都是本地与云端之间的一个「插槽」。

CORS 则是另一堂更曲折的课。本地开发时，Vite 的 `server.proxy` 把 `/api` 静默转发到 `localhost:3001`，前端用相对路径就能拿到数据——**这套机制把跨域问题彻底藏起来了**。可一旦前端搬到 Vercel、后端搬到 Railway，两个不同域名之间的请求立刻被浏览器拦下。这次我特意把 CORS 写成**函数式白名单**而不是简单的静态字符串，并在服务端就拒绝非法来源——因为「配置 CORS 白名单、防止非法调用」不只是一句文档口号，它必须能在服务端被验证。

而这次重验证最大的收获，是**「文档说通过」不等于「真的通过」**。Day 19 初稿写下"CORS 已实测全过"时，很可能那次测试就被 Windows cmd 的尾随空格骗了——响应没报错、API 返回 200，于是想当然以为 CORS 生效。可实际上头根本没下发，只是恰好没人在跨域场景下调过。如果不是这次重验证，这个假阴性会一路带到 Day 20 部署，上线后才发现前端调不通后端——那时排查成本会高得多。

排错的过程也给了我两条具体的方法论：**先用探针日志确认中间件回调是否真的被触发**（而不是只看 HTTP 状态码），**再用最小复现脚本剥离干扰项**（独立 Express 实例能快速告诉你"问题在代码还是环境"）。这两招比盲目改代码有效得多。

最后还顺手补了一个 `.gitignore` 隐患——`client/` 没显式忽略 `.env`。这种"现在没 `.env` 文件所以没事"的侥幸，往往就是日后密钥泄露的开端。**预防性的安全加固，永远比事后补救便宜。**

18 天主路径让我把东西做出来，而 Day 19 让我明白：**部署不是把代码丢上去那么简单，它要求代码从「在某一台机器上恰好能跑」进化到「在任何机器上都能跑」，并且每一项声称"就绪"的能力，都要经得起真实请求的检验。** 明天就是真正把它推上公网、让全世界都能访问的时刻了。🚀
