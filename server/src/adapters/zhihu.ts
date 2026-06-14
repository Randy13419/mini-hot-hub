import axios from "axios";
import { PlatformAdapter } from "./types";
import { HotItem } from "../types";

export class ZhihuAdapter implements PlatformAdapter {
  readonly id = "zhihu";
  readonly name = "知乎";

  async fetch(): Promise<HotItem[]> {
    const response = await axios.get(
      "https://api.zhihu.com/topstory/hot-list?limit=10",
      {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      }
    );

    const list = response.data.data ?? [];
    return list.slice(0, 10).map((item: any, index: number) => {
      const target = item.target ?? {};
      // detail_text 格式如 "467 万热度"
      const detailText: string = item.detail_text ?? "";
      const hotMatch = detailText.match(/([\d.]+)\s*万?\s*热度/);
      let hotRaw = 0;
      if (hotMatch) {
        const num = parseFloat(hotMatch[1]);
        hotRaw = detailText.includes("万") ? Math.round(num * 10000) : Math.round(num);
      }

      return {
        rank: index + 1,
        title: target.title ?? "",
        hotValue: String(hotRaw),
        hotRaw,
        url: target.url
          ? target.url.replace("api.zhihu.com", "www.zhihu.com")
          : "",
        category: item.card_label?.type,
      };
    });
  }
}
