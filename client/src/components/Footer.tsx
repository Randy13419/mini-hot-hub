export default function Footer() {
  return (
    <footer className="mt-8 border-t border-[var(--border-card)] py-6 text-center text-xs leading-relaxed text-[var(--text-muted)]">
      <p>本站为个人学习项目，仅供学习交流使用，非商业用途</p>
      <p className="mt-1">
        数据均来源于各平台（B站、知乎、抖音）公开信息，非官方数据，不代表平台立场
      </p>
      <p className="mt-1">
        数据每 5 分钟自动更新（与缓存周期一致） · 如有侵权或违规请联系：example@email.com
      </p>
    </footer>
  );
}
