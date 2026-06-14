import axios from "axios";
import { PlatformAdapter } from "./types";
import { HotItem } from "../types";

export class BilibiliAdapter implements PlatformAdapter {
  readonly id = "bilibili";
  readonly name = "B站";

  async fetch(): Promise<HotItem[]> {
    const response = await axios.get(
      "https://api.bilibili.com/x/web-interface/search/square",
      {
        timeout: 5000,
        params: { limit: 10 },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Referer": "https://www.bilibili.com",
        },
      }
    );

    // 热搜接口：data.trending.list，按 heat_score 降序
    const list = response.data.data.trending.list;

    return list.slice(0, 10).map((item: any, index: number) => ({
      rank: index + 1,
      title: item.show_name || item.keyword,
      hotValue: String(item.heat_score),
      hotRaw: item.heat_score,
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword)}`,
      category: item.icon ? "hot" : undefined,
    }));
  }
}
