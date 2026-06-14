import 'dotenv/config';   // 本地开发：从 .env 读取环境变量(不覆盖平台注入的 process.env)
import express from "express";
import cors from "cors";
import apiRouter from "./routes/api";
import { API_PREFIX, PORT, CLIENT_ORIGIN } from "./config";

const app = express();

// CORS 白名单：本地允许所有来源（CLIENT_ORIGIN 默认 "*"）；生产环境按来源精确校验
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

// JSON 解析
app.use(express.json());

// 挂载 API 路由 — 统一 /api/v1/ 前缀
app.use(API_PREFIX, apiRouter);

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}${API_PREFIX}/hot-search`);
});
