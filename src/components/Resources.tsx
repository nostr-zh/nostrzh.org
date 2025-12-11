import type { ReactNode } from "react";

// Star icon for Awesome list
const StarIcon = () => (
  <svg
    className="w-5 h-5 text-slate-500 dark:text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

// Document icon for Protocol specs
const DocumentIcon = () => (
  <svg
    className="w-5 h-5 text-slate-500 dark:text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

// Book icon for Guide
const BookIcon = () => (
  <svg
    className="w-5 h-5 text-slate-500 dark:text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
);

// Device icon for Clients
const DeviceIcon = () => (
  <svg
    className="w-5 h-5 text-slate-500 dark:text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
);

interface Resource {
  title: string;
  description: string;
  url: string;
  icon: () => ReactNode;
}

const resources: Resource[] = [
  {
    title: "Awesome Nostr 中文",
    description: "中文开发者的 Nostr 作品集，收录优秀的中文 Nostr 项目和资源。",
    url: "https://github.com/nostr-zh/awesome-nostr-zh",
    icon: StarIcon,
  },
  {
    title: "Nostr 协议规范",
    description:
      "了解 Nostr 协议的技术细节，包括 NIP（Nostr Implementation Possibilities）。",
    url: "https://github.com/nostr-protocol/nips",
    icon: DocumentIcon,
  },
  {
    title: "Nostr.how",
    description: "Nostr 入门指南，帮助新手快速上手 Nostr 生态。",
    url: "https://nostr.how/zh",
    icon: BookIcon,
  },
  {
    title: "Nostr 客户端",
    description: "发现各种 Nostr 客户端，选择最适合你的应用。",
    url: "https://nostrapps.com/",
    icon: DeviceIcon,
  },
];

export function Resources() {
  return (
    <section id="resources" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-slate-900" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-100/40 dark:bg-purple-900/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
            资源与链接
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            探索更多 Nostr 相关资源
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <resource.icon />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                    {resource.title}
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
