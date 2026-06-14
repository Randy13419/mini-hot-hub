import { useState } from "react";

// [预留] 搜索状态钩子 — 本期空实现，未来扩展用
export function useSearchQuery() {
  const [searchQuery, setSearchQuery] = useState("");
  return { searchQuery, setSearchQuery };
}
