import axios from "axios";
import { PlatformAdapter } from "./types";
import { HotItem } from "../types";

export class DouyinAdapter implements PlatformAdapter {
  readonly id = "douyin";
  readonly name = "抖音";

  async fetch(): Promise<HotItem[]> {
    const response = await axios.get(
      "https://www.douyin.com/aweme/v1/web/hot/search/list/?aid=6383&cookie_enabled=true",
      {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Referer": "https://www.douyin.com/hot",
        },
      }
    );

    const wordList = response.data.data?.word_list ?? [];
    return wordList.slice(0, 10).map((item: any, index: number) => ({
      rank: index + 1,
      title: item.word,
      hotValue: String(item.hot_value ?? 0),
      hotRaw: item.hot_value ?? 0,
      url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
      category: item.tag,
    }));
  }
}
