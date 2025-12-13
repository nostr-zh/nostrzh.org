import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-purple-600 dark:text-purple-400"
        >
          NostrZH
        </Link>
        <nav className="flex items-center gap-6">
          {isHome ? (
            <>
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
            </>
          ) : (
            <Link
              to="/"
              className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              首页
            </Link>
          )}
          <Link
            to="/blog"
            className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            博客
          </Link>
        </nav>
      </div>
    </header>
  );
}
