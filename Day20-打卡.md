# Day 20 打卡：部署上线 · 项目正式公网可访问 🚀

> Day 19 把项目改造到「上云就绪」，Day 20 终于把它真正推上公网——前端上 Vercel，后端上 Railway，三平台热搜数据通过 HTTPS 暴露给全世界。这一天没有写任何新业务代码，但踩的坑比前 19 天加起来都多，也最深刻。

---

## 🎯 今日目标

把 `mini-hot-hub` 从「本地能跑」变成「全球可访问」：拿到两个 HTTPS 域名，前后端串联打通，最终线上能看到 B站/知乎/抖音三平台实时热搜。

---

## 🌐 最终交付物（线上地址）

| 资源 | 地址 | 状态 |
|------|------|------|
| **GitHub 仓库** | https://github.com/Randy13419/mini-hot-hub | ✅ 已推送 |
| **前端（Vercel）** | https://mini-hot-hub-eight-delta.vercel.app/ | ✅ 三平台数据正常 |
| **后端（Railway）** | https://mini-hot-hub-production-c2a2.up.railway.app/api/v1/hot-search | ✅ 返回三平台 JSON |

打开前端链接，桌面端三列卡片、移动端单列堆叠，三平台实时热搜、热度色彩映射、最后更新时间呼吸灯，全部按 PRD 要求正常工作。从今天起，任何人都能通过 HTTPS 访问这个项目。

---

## 🏗️ 部署过程记录（按时间顺序）

### Step 1：代码首次送进 GitHub

Day19 之前项目一直只有本地 git，零提交、无远程。今天第一次走完整链路：

1. **`.gitignore` 三连验证**：根 + client + server 三层忽略 `.env` / `node_modules` / `dist`。用 `git add -n . | findstr "..."` 三次过滤验证，确认密钥和几百 MB 依赖不会被误提交。
2. **首个 commit**：用 `git commit -F 文件 --cleanup=verbatim` 提交多行 message（带 `#: 标记` 的踩坑复盘）。`--cleanup=verbatim` 关键——git 默认会删 `#` 开头的行，不加这参数我写的复盘会被静默吃掉。
3. **GitHub 建仓踩坑**：第一次点 Create 报 `Repository creation failed.`（无理由），刷新重试就成功了——GitHub 偶发的瞬时故障。
4. **隐私邮箱冲突预警**：我 GitHub 开了「Keep my email addresses private」，本地 commit 用真实邮箱会被拒。提前用 `git config user.email "199432573+Randy13419@users.noreply.github.com"` 改成 noreply，再 `git commit --amend --reset-author` 重置作者，避免 push 被拒。

> 💡 **认知点**：`commit` 只在本地 `.git/` 文件夹，`push` 才真正寄到 GitHub。中间有一道「生死分界线」——这道线就是远程仓库。今天的核心动作就是跨过它。

### Step 2：后端部署到 Railway

Railway 是「进程托管平台」——帮你 `npm install` + `npm start`，并把端口通过 `process.env.PORT` 喂给你的进程。

1. 导入 GitHub 仓库 → 配置 **Root Directory = `server`**（后端在子目录，必须显式指定，否则 Railway 在根目录找不到 package.json）。
2. 加环境变量：`CACHE_TTL=300`、`CLIENT_ORIGIN=*`（暂时，Step 4 回填）。**`PORT` 不填**——Railway 自动注入。
3. Settings → Networking → Generate Domain → 拿到 `https://mini-hot-hub-production-c2a2.up.railway.app`。
4. **验证**：浏览器打开 `/api/v1/hot-search`，返回三平台真实 JSON（B站「汉密尔顿夺冠」等）。✅

### Step 3：前端部署到 Vercel

Vercel 是「静态托管 CDN」——把 `dist/` 静态文件丢到 CDN，访问时直接发文件。

1. 用 GitHub 登录 → Import 仓库 → **Root Directory = `client`**（和 Railway 的 `server` 反过来，两个平台各取所长）。
2. Framework Preset 自动识别为 Vite，Build Command `npm run build`，Output Directory `dist`。
3. Deploy → 拿到 `https://mini-hot-hub-eight-delta.vercel.app/`。
4. **首次打开**：页面出来了，但卡片**加载失败**——这就是阶段 0 讨论的「Vercel 没有 Vite proxy」的铁证。

### Step 4：环境变量互填（前后端串联）

两个平台互为依赖（前端域名要进后端 CORS，后端域名要进前端配置），必须「先各自上线拿域名，再互相回填」：

1. Vercel 加 `VITE_API_BASE = https://mini-hot-hub-production-c2a2.up.railway.app/api/v1`（**末尾不带 `/hot-search`**——代码会自动拼，多写会变成 `/hot-search/hot-search` → 404）。
2. Redeploy 让环境变量生效。
3. Railway 把 `CLIENT_ORIGIN` 从 `*` 改成真实 Vercel 域名，锁紧 CORS 白名单（呼应 Day17 合规要求）。

---

## 🕳️ 踩坑记录（今天最宝贵的部分）

### 坑 1：tsx 在 devDependencies → Railway 起不来

**现象**：本地 `npm start` 能跑，但 Railway 部署后 `npm start` 找不到 `tsx` 命令。

**根因**：`package.json` 里 `tsx` 写在 `devDependencies`，Railway 在 production 模式下**不装 devDependencies** → 全局没有 `tsx` → 服务起不来 → 502。

**验证方法**：本地用 `npm install --omit=dev` 模拟 Railway 的生产安装环境，确认修复有效（只装 dependencies，tsx 照样可用，服务正常启动，API 返回真实数据）。

**修法**：把 `tsx` 从 `devDependencies` 挪到 `dependencies`。1 行改动，零风险。

> 💡 **教训**：`dependencies` vs `devDependencies` 不是装饰品——它决定了**运行时**到底有没有这个包。任何被 `start` 脚本依赖的包，都必须在 `dependencies` 里。

### 坑 2：Vercel 构建缓存导致环境变量不生效 ⭐ 今日最大坑

**现象**：在 Vercel 加了 `VITE_API_BASE` → Redeploy → 状态显示 Ready（绿色）→ 但卡片还是加载失败。

**诊断过程**（这一步最有价值）：
1. 直接下载 Vercel 线上的 JS 文件（`/assets/index-xxx.js`）。
2. 用正则搜 `railway` 关键词——**0 次出现**。
3. 搜 `/api/v1`——只有一处，是 `var ee="/api/v1"`（默认回退值）。
4. 对比 JS hash：Redeploy 前后都是 `DNWg71qm`，**没变**。

**根因**：Vite 在 `npm run build` 时会把 `import.meta.env.VITE_xxx` **静态替换**成当时的值。但 Vercel 检测到「代码 + 依赖都没变」时，会**复用旧的构建产物**，根本不重新跑 `npm run build`——环境变量的新值永远不会写进新 JS。Redeploy 的 `Use existing Build Cache` 选项也会触发同样问题。

**尝试过的失败方案**：
- ❌ Redeploy（带缓存）→ JS hash 没变
- ❌ push 一个空 commit 触发新构建 → Vercel 还是检测到代码没变 → 复用缓存

**最终解法**：**真的改一行代码**——把 Railway 地址作为生产环境硬编码回退值写进 `api.ts`：
```ts
const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.PROD
      ? "https://mini-hot-hub-production-c2a2.up.railway.app/api/v1"
      : "/api/v1");
```
代码真改了，Vercel 必须重建。push 后 JS hash 从 `DNWg71qm` 变成 `DMwQlZcW`，`railway.app/api/v1` 关键词进 JS，全链路打通。

> 💡 **认知点**：
> 1. 环境变量是「构建时注入」，不是「运行时读取」。改了变量必须触发**全新构建**（不是带缓存的 Redeploy）。
> 2. **「看 Ready 绿色就以为生效」是错觉**——真正可靠的判断方法是**检查 JS hash 是否变化 + 关键词是否进 JS**，比看 UI 状态靠谱 100 倍。
> 3. 当缓存机制顽固到绕不过去时，**改代码强制重建**是终极杀手锏。

### 坑 3：Windows cmd 尾随空格（Day19 的坑今天又踩了一次）

设置环境变量时用 `set X=Y && npm start`，`&&` 前的空格被当成变量值的一部分。今天测 CORS 时也差点被这个坑——Railway 网页填变量不会有这个问题（UI 填的是精确字符串），但本地测试要小心。

### 坑 4：GitHub 网络抽风

`git push` 多次出现 `Failed to connect to github.com port 443` / `Connection was reset`。这是中国大陆访问 github.com 的常见网络波动。最终靠重试 + 代理解决。

> 💡 这是国内开发者绕不开的现实问题。长期方案：配代理 / 用 SSH 协议（`git@github.com:...`）/ 用加速服务。

---

## 💭 心得：从「能跑」到「能让别人用」

18 天主路径让我把项目做出来，Day 19 让代码「能适应任意环境」，Day 20 终于让项目「能被全世界访问」。这是从「个人玩具」到「真正的产品」的质变——哪怕只是个学习项目。

今天最大的收获不是「部署成功了」，而是「**学会了怎么排查一个看不见的问题**」。环境变量不生效那个坑，UI 一切正常（绿色 Ready），但实际没生效。如果不是停下来**直接下载 JS 文件 grep 关键词**，我可能会一直 Redeploy、一直自欺欺人地「以为生效了」。

这让我想到 Day19 写过的那句「**文档说通过 ≠ 真的通过**」——今天升级成「**UI 显示成功 ≠ 真的成功**」。验证不能停留在「看起来对」，必须用底层手段（抓文件、看内容、grep 关键词）确认「**事实上对**」。这种「不信任表象、直接验证本质」的习惯，是今天最值钱的方法论。

第二个收获是**部署的本质**。Vercel 和 Railway 之所以能托管你的代码，不是魔法，而是它们帮你做了三件事：① 24 小时开机；② 提供公网 IP 和 HTTPS 域名；③ 在它们的服务器上替你跑 `npm install` + `npm run build` + `npm start`。理解了这一点，所有的「环境变量」「构建缓存」「Root Directory」配置就都有了落点——它们都是在告诉平台「**你要怎么帮我跑这份代码**」。

第三个收获是 git 的「四层流转」模型——`工作区 → 暂存区 → 本地仓库 → 远程仓库`，每一步都有对应的撤销手段，每一步之间都有明确的「分界线」。`commit` 只在本地、`push` 才上云——这道分界线一旦跨过，代码就有了云端备份和版本历史。今天跨过它，是整个项目最重要的一步。

最后感慨一句：部署这件事，**踩坑不可怕，不知道自己踩坑才可怕**。今天每一个坑都教会我一种新的诊断视角——`grep JS 文件`、`对比 hash`、`--omit=dev 模拟生产`、`curl 模拟带 Origin 的浏览器请求`——这些工具组合起来，比任何「部署教程」都管用。下次再部署任何全栈项目，我有信心独立搞定了。

---

## ✅ 打卡要求核对

- [x] 前端部署到公网（Vercel HTTPS）—— https://mini-hot-hub-eight-delta.vercel.app/
- [x] 后端部署到公网（Railway HTTPS）—— https://mini-hot-hub-production-c2a2.up.railway.app/api/v1/hot-search
- [x] 可分享的 HTTPS 链接（线上三平台数据正常）
- [x] 部署过程文字记录（≥200 字）+ 踩坑（本文件）

---

## 🚀 下一步

Day 20 把项目送上了公网，Day 21 是教程的最后一天（项目总结 / 复盘）。三平台数据已经稳定运行，域名可以分享给任何人。从 Day 1 的「10 分钟搭个雏形」到 Day 20 的「全球可访问」，21 天走完了一个全栈项目从零到上线的完整闭环。最后一天，收官。🎯
