import { Router } from "express";
import { getHotSearch, clearPlatformCache } from "../controller/hotSearch";

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

// POST /api/v1/hot-search/retry/:platformId — 单平台重试（清缓存 + 重新抓取）
router.post("/hot-search/retry/:platformId", async (req, res) => {
  try {
    const { platformId } = req.params;
    clearPlatformCache(platformId);
    const data = await getHotSearch();
    const platform = data.platforms.find((p) => p.id === platformId);
    if (platform) {
      res.json(platform);
    } else {
      res.status(404).json({ error: `未知平台: ${platformId}` });
    }
  } catch {
    res.status(500).json({ error: "重试失败" });
  }
});

export default router;
