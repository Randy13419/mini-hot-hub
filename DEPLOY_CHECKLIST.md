# 部署前检查表 & 环境变量清单（Day 19）

> 上云前一天的自查清单。明天后端部署到 **Railway**、前端部署到 **Vercel**，两组服务分离运行，靠以下环境变量"对暗号"。

---

## 一、部署前检查表（逐项确认）

| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | 前端生产构建 `npm run build` | ✅ 已确认 | `client/dist/` 含 `index.html` + 压缩 JS/CSS（本次重构建：JS 399.41 kB / gzip 120.97 kB） |
| 2 | 后端可由 `npm run start` 拉起 | ✅ 已确认 | `tsx src/app.ts` 启动 Express |
| 3 | 后端端口动态绑定 `process.env.PORT` | ✅ 已修复 | `config.ts`：`Number(process.env.PORT) \|\| 3001`（实测注入 PORT=9876 后监听 9876） |
| 4 | 后端 CORS 中间件就位 | ✅ 已重验证 | `app.ts`：函数式白名单 `origin` 回调 |
| 5 | 后端读取 `CLIENT_ORIGIN` 白名单 | ✅ 已重验证 | 三场景实测全过：白名单内回显头 / 白名单外不下发头 / 无 Origin 放行 |
| 6 | 前端读取 `VITE_API_BASE` | ✅ 已接入 | `api.ts`：`import.meta.env.VITE_API_BASE \|\| "/api/v1"` |
| 7 | 无残留 `localhost:3001` 硬编码到前端 | ✅ 已确认 | 前端只用相对路径 `/api/v1`，无硬编码域名（`localhost:3001` 仅在 `vite.config.ts` 的 dev proxy 里） |
| 8 | `.env` 已被 gitignore | ✅ 已加固 | 根目录 + `client/`（本次补 `.env`）+ 新增 `server/.gitignore` 三层覆盖 |

---

## 二、环境变量清单

### 后端（Railway）所需变量

| 变量名 | 含义 | 本地默认 | 线上取值 | 由谁注入 |
|--------|------|----------|----------|----------|
| `PORT` | 后端云服务器监听端口 | `3001`（代码回退） | 平台分配的端口（如 `3001`/动态） | **Railway 自动注入**，无需手动填 |
| `CLIENT_ORIGIN` | 线上前端真实域名，用于配置 CORS 白名单 | `*`（允许所有来源） | `https://你的应用.vercel.app` | **手动**在 Railway 后台填写 |

**`PORT` 说明**：云平台不会让你自己选端口，它启动容器时通过 `PORT` 环境变量告诉你"请监听这个口"。代码必须读 `process.env.PORT`，否则平台健康检查连不上 → 部署失败。

**`CLIENT_ORIGIN` 说明**：浏览器有同源策略——Vercel 前端（域名 A）请求 Railway 后端（域名 B）属于跨域。后端必须在响应头里通过 CORS 声明"我允许域名 A 调用"，否则浏览器拦截。把白名单锁成你自己的前端域名，可防止别的网站盗用你的接口。

### 前端（Vercel）所需变量

| 变量名 | 含义 | 本地默认 | 线上取值 | 由谁注入 |
|--------|------|----------|----------|----------|
| `VITE_API_BASE` | 线上后端真实 API 基准地址 | `/api/v1`（走 Vite 代理） | `https://你的应用.up.railway.app/api/v1` | **手动**在 Vercel 后台填写 |

**`VITE_API_BASE` 说明**：本地开发时，Vite 的 `server.proxy` 把 `/api` 请求转发到 `localhost:3001`，所以前端用相对路径就行。但 Vercel 是**纯静态托管**，没有任何代理服务器——前端打包成静态文件后，请求必须**直奔** Railway 的真实地址。这就是上线时必须注入 `VITE_API_BASE` 的原因。

> ⚠️ 只有 `VITE_` 前缀的变量才会被打进前端产物。命名前缀写错，变量就进不了代码。

---

## 三、上线当天的填值顺序（避免踩坑）

1. **先部署后端（Railway）** → 拿到后端真实域名，如 `https://mini-hot-hub.up.railway.app`
2. **再部署前端（Vercel）**：
   - `VITE_API_BASE` = `https://mini-hot-hub.up.railway.app/api/v1`
3. **回后端（Railway）补 CORS 白名单**：
   - `CLIENT_ORIGIN` = `https://你的应用.vercel.app`
4. 二者互为依赖（前端地址要进后端 CORS，后端地址要进前端配置），所以**先各自上线拿域名，再互相回填变量**。

---

## 四、对应代码位置速查

| 变量 | 读取位置 | 文件 |
|------|----------|------|
| `PORT` | `config.ts` | `server/src/config.ts:5` |
| `CLIENT_ORIGIN` | `config.ts` → `app.ts` 中间件 | `server/src/config.ts:9` / `server/src/app.ts` |
| `VITE_API_BASE` | `api.ts` | `client/src/services/api.ts:5` |

> 参考变量模板：`server/.env.example` 与 `client/.env.example`（可提交，仅作说明）。

---

## 五、Day 19 重验证记录（CORS 三场景实测）

> Day 19 文档初稿曾声称 CORS "已实测全过"，但首次重验证时响应头里**完全没有** `Access-Control-Allow-Origin`。排查后定位为**测试环境假阴性**，而非代码缺陷。

### 根因
Windows cmd 的 `set X=Y &&` 链会让环境变量值带上**尾随空格**：
- 实际注入：`CLIENT_ORIGIN = "https://test-app.vercel.app "`（末尾多一个空格）
- 请求 Origin：`"https://test-app.vercel.app"`（无空格）
- 两者 `===` 比较失败 → 走 `callback(null, false)` → cors 不下发头

改用 PowerShell `$env:CLIENT_ORIGIN='...'`（无尾随空格）后，三场景全部正确：

| 场景 | Origin | 预期 | 实测结果 |
|------|--------|------|----------|
| 白名单内 | `https://test-app.vercel.app` | 下发 `Access-Control-Allow-Origin` | ✅ `Access-Control-Allow-Origin: https://test-app.vercel.app` |
| 白名单外 | `https://evil-site.com` | 不下发头 | ✅ 响应头无 `Access-Control-*`（服务端拒绝） |
| 无 Origin | —（curl / 服务端调用） | 正常放行 | ✅ HTTP 200，无 AC 头（无需白名单） |

### 结论
代码本身正确，**Railway 后台填环境变量时不会有尾随空格问题**。但这次教训值得记下：
1. 在 Windows cmd 验证带 `&&` 链的环境变量时，务必检查尾随空格
2. 验证服务端行为时，先用探针日志确认中间件回调是否真的被触发，再下结论
3. 排错时优先用最小复现脚本（独立 Express 实例）剥离干扰项
