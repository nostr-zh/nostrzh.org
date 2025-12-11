export function Footer() {
  return (
    <footer className="py-12 bg-slate-100 dark:bg-slate-800/50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="mb-6">
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            NostrZH
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Nostr 中文社区 — 连接每一个自由表达的声音
        </p>
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="https://github.com/nostr-zh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            GitHub
          </a>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} NostrZH. 使用 Nostr
          协议构建去中心化社交。
        </p>
      </div>
    </footer>
  );
}
