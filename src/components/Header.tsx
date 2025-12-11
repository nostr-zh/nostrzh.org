export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="/"
          className="text-xl font-bold text-purple-600 dark:text-purple-400"
        >
          NostrZH
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#about"
            className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            关于
          </a>
          <a
            href="#relays"
            className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Relays
          </a>
          <a
            href="#resources"
            className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            资源
          </a>
        </nav>
      </div>
    </header>
  );
}
