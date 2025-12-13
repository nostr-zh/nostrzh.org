import { Link } from "react-router-dom";
import { getAllPosts } from "../lib/blog";
import { getNostrProfileUrl, getPubkeyFromName } from "../lib/nostr";

export function BlogList() {
  const posts = getAllPosts();

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-800 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {posts.map((post) => {
            return (
              <article
                key={post.slug}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  {post.authors.map((author, index) => {
                    const authorPubkey = getPubkeyFromName(author);
                    return (
                      <>
                        {authorPubkey ? (
                          <a
                            href={getNostrProfileUrl(authorPubkey)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {author}
                          </a>
                        ) : (
                          <span>{author}</span>
                        )}
                        {index < post.authors.length - 1 && <span>&</span>}
                      </>
                    );
                  })}
                  <span>•</span>
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {post.description && (
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {post.description}
                  </p>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-block mt-4 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  阅读全文 →
                </Link>
              </article>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">暂无文章</p>
          </div>
        )}
      </div>
    </section>
  );
}
