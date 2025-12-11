const KeyIcon = () => (
  <svg
    className="w-5 h-5 text-purple-600 dark:text-purple-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    className="w-5 h-5 text-purple-600 dark:text-purple-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>
);

const CodeIcon = () => (
  <svg
    className="w-5 h-5 text-purple-600 dark:text-purple-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    className="w-5 h-5 text-purple-600 dark:text-purple-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
);

export function About() {
  const features = [
    {
      icon: KeyIcon,
      title: "真正的所有权",
      description: "你的身份由密钥对定义，没有人可以封禁你的账户。",
    },
    {
      icon: GlobeIcon,
      title: "去中心化",
      description: "数据分布在多个 Relay 上，没有单点故障，更抗审查。",
    },
    {
      icon: CodeIcon,
      title: "简洁协议",
      description: "基于 WebSocket 和 JSON，简单易懂，易于开发。",
    },
    {
      icon: LinkIcon,
      title: "互操作性",
      description: "一个身份通行所有 Nostr 应用，无需重复注册。",
    },
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-slate-900" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-100/60 via-transparent to-transparent dark:from-indigo-900/20 blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            什么是 Nostr？
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Nostr（Notes and Other Stuff Transmitted by
            Relays）是一个简洁、开放的协议，
            旨在创建一个抗审查的全球社交网络。它不依赖任何中心化服务器，
            你的身份和数据完全由你自己掌控。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
                <feature.icon />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            如何开始？
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              选择一个{" "}
              <a
                href='"https://nostrapps.com/"'
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-purple-500 transition-colors"
              >
                Nostr 客户端
              </a>
            </li>
            <li>生成或导入你的密钥对（私钥务必安全保管！）</li>
            <li>连接到 Relay，开始发布和订阅内容</li>
            <li>加入我们的中文社区 Relay，与更多中文用户交流</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
