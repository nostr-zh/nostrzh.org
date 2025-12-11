import { useState } from "react";

const RELAY_URL = "wss://relay.nostrzh.org/";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 text-sm cursor-pointer bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

export function Relays() {
  const jumbleUrl = `https://jumble.social?r=${encodeURIComponent(RELAY_URL)}`;

  return (
    <section id="relays" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-purple-100/50 via-transparent to-transparent dark:from-purple-900/20" />

      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            社区 Relay
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            连接到我们的 Relay，加入中文 Nostr 社区
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
              Nostr 中文社区 Relay
            </h3>
            <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-full">
              邀请制
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            邀请制中文社区 Relay，聚集 Nostr
            上的中文用户，打造高质量的中文社交空间。
          </p>

          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
            <code className="flex-1 text-sm text-purple-600 dark:text-purple-400 font-mono">
              {RELAY_URL}
            </code>
            <CopyButton text={RELAY_URL} />
          </div>

          <a
            href={jumbleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            使用 Jumble 浏览
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
