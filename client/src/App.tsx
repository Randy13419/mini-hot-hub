import { useEffect } from "react";
import Navbar from "./components/Navbar";
import CardGrid from "./components/CardGrid";
import Footer from "./components/Footer";
import { useHotSearch } from "./hooks/useHotSearch";

function App() {
  const { data, loading, error, refresh, retryPlatformById, retryingId } =
    useHotSearch();

  // 动态更新页面标题
  useEffect(() => {
    if (!data) return;
    const total = data.platforms.reduce(
      (sum, p) => sum + (p.status === "success" ? p.items.length : 0),
      0
    );
    document.title = `今日热搜 · ${total} 条热榜`;
  }, [data]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      {/* 加载进度条 */}
      {loading && <div className="loading-bar" />}

      <Navbar lastUpdated={data?.lastUpdated} onRefresh={refresh} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <CardGrid
          data={data}
          loading={loading}
          error={error}
          onRetry={retryPlatformById}
          retryingId={retryingId}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
