import { MDXProvider } from "@mdx-js/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBlogPost } from "../lib/blog";
import { getNostrProfileUrl, getPubkeyFromName } from "../lib/nostr";
import { NostrComments } from "./NostrComments";

// MDX 组件样式映射
const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-4"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="text-3xl font-semibold text-slate-900 dark:text-white mt-8 mb-4"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="text-2xl font-semibold text-slate-900 dark:text-white mt-6 mb-3"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      className="text-xl font-semibold text-slate-900 dark:text-white mt-4 mb-2"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-purple-600 dark:text-purple-400 hover:underline"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-slate-700 dark:text-slate-300" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 italic text-slate-600 dark:text-slate-400 my-4"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => {
    const isInline = !props.className;
    if (isInline) {
      return (
        <code
          className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400"
          {...props}
        />
      );
    }
    return (
      <code
        className="block bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono"
        {...props}
      />
    );
  },
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm"
      {...props}
    />
  ),
  hr: () => <hr className="border-slate-300 dark:border-slate-700 my-8" />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong
      className="font-semibold text-slate-900 dark:text-white"
      {...props}
    />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props} />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-4">
      <table
        className="min-w-full border-collapse border border-slate-300 dark:border-slate-700"
        {...props}
      />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border border-slate-300 dark:border-slate-700 px-4 py-2"
      {...props}
    />
  ),
};

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <NotFound />;
  }

  const post = getBlogPost(slug);

  if (!post) {
    return <NotFound />;
  }

  const { Component, frontmatter } = post;

  return (
    <article className="py-20 bg-slate-50 dark:bg-slate-800 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          onClick={() => navigate(-1)}
          className="inline-flex items-center cursor-pointer text-purple-600 dark:text-purple-400 hover:underline mb-8"
        >
          ← 返回
        </a>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {frontmatter.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {frontmatter.authors.map((author, index) => {
              const authorPubkey = getPubkeyFromName(author);

              return (
                <>
                  {authorPubkey ? (
                    <a
                      key={author}
                      href={getNostrProfileUrl(authorPubkey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {author}
                    </a>
                  ) : (
                    <span key={author}>{author}</span>
                  )}
                  {index < frontmatter.authors.length - 1 && <span>&</span>}
                </>
              );
            })}
            <span>•</span>
            <time dateTime={frontmatter.date}>
              {new Date(frontmatter.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {frontmatter.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <MDXProvider components={components}>
            <Component />
          </MDXProvider>
        </div>

        <div className="mt-12 pt-4 border-t border-slate-300 dark:border-slate-700">
          <a
            onClick={() => navigate(-1)}
            className="inline-flex items-center cursor-pointer text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← 返回
          </a>
        </div>

        {/* Nostr 评论区 */}
        <NostrComments
          articleSlug={slug}
          articleAuthorPubkeys={
            frontmatter.authors
              .map((author) => getPubkeyFromName(author))
              .filter(Boolean) as string[]
          }
        />
      </div>
    </article>
  );
}

function NotFound() {
  return (
    <div className="py-20 bg-slate-50 dark:bg-slate-800 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          文章未找到
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          抱歉，您访问的文章不存在。
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline"
        >
          ← 返回博客列表
        </Link>
      </div>
    </div>
  );
}
