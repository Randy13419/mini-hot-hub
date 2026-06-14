# Day 17 打卡：容错、降级与合规完善

---

## 📸 截图：失败态 + 恢复后对比

### 失败态（MOCK_FAIL_BILIBILI=1）

> 启动命令：`MOCK_FAIL_BILIBILI=1 npm run dev`
>
> B站卡片显示「加载失败」，出现「重新加载」按钮。

（此处粘贴失败态截图）

### 恢复后

> 去掉 MOCK_FAIL 环境变量重启后，B站恢复正常展示。

（此处粘贴恢复后截图）

---

## ✅ 今日完成内容

### Step 1：手动模拟失败

在 `server/src/config.ts` 增加了 `MOCK_FAIL` 开关：

```typescript
// 用法：MOCK_FAIL_BILIBILI=1 npm run dev
const MOCK_PLATFORMS = ["bilibili", "zhihu", "douyin"] as const;
export const MOCK_FAIL: Record<string, boolean> = {};
for (const p of MOCK_PLATFORMS) {
  if (process.env[`MOCK_FAIL_${p.toUpperCase()}`] === "1") {
    MOCK_FAIL[p] = true;
  }
}
```

在 `server/src/controller/hotSearch.ts` 的抓取流程中插入检查：

```typescript
if (MOCK_FAIL[adapter.id]) {
  throw new Error(`[MOCK] ${adapter.name} 模拟失败`);
}
```

验证结果：设置 `MOCK_FAIL_BILIBILI=1` 后，B站卡片正确显示 error 状态，知乎和抖音不受影响。

### Step 2：重试按钮

**后端**：新增 `POST /api/v1/hot-search/retry/:platformId`，清除该平台缓存后重新抓取。

**前端**：
- `PlatformCard` 错误/空状态新增「重新加载」按钮
- 点击后仅重试失败的平台，不影响其他卡片

### Step 3：合规页脚

页脚包含课程要求的四项内容：

- ✅ 本站为个人学习项目，仅供学习交流使用，非商业用途
- ✅ 数据来源于各平台公开信息，非官方
- ✅ 更新频率约 5 分钟（与 CACHE_TTL=300s 一致）
- ✅ 如有侵权或违规请联系：example@email.com

---

## 💬 心得：真实热榜项目和纯展示页有何不同？

纯展示页用的是 Mock 数据，永远不会出错，开发时只关注「页面好不好看」。

真实热榜项目面对的是不可控的上游接口——可能超时、可能改版、可能触发反爬。这次实操中就遇到了 TopHub 返回验证码页面的情况，不得不把知乎适配器切换到官方 API。这让我理解了适配器模式的价值：数据源可以随时替换，只要接口契约不变，上层代码不受影响。

另外，容错是必须的。单个平台挂了不能让整个页面白屏，后端用 `Promise.allSettled()` 隔离失败，前端按平台独立渲染，加上重试按钮让用户可以主动恢复——这些都是纯展示页不需要考虑的。

合规文案也不是可选项，数据来自第三方平台，上线前必须有清晰的免责声明。
