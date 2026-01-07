import { pool } from "@nostr/gadgets/global";
import { loadRelayList } from "@nostr/gadgets/lists";
import dayjs from "dayjs";
import type { EventTemplate, NostrEvent } from "nostr-tools";
import { useCallback, useState } from "react";
import { DEFAULT_RELAY_URLS } from "../../constants";
import CommentList from "./CommentList";

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: EventTemplate) => Promise<NostrEvent>;
    };
  }
}

interface NostrCommentsProps {
  articleSlug: string;
  articleAuthorPubkeys?: string[];
}

export function NostrComments({
  articleSlug,
  articleAuthorPubkeys,
}: NostrCommentsProps) {
  const url = `https://nostrzh.org/blog/${articleSlug}`;
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!commentText.trim()) {
        setError("请输入评论内容");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // 检查是否有 NIP-07 扩展 (如 Alby, nos2x 等)
        if (!window.nostr) {
          setError("请安装 Nostr 浏览器扩展（如 Alby 或 nos2x）来发布评论");
          setIsSubmitting(false);
          return;
        }

        const tags = [
          ["I", url],
          ["K", "web"],
          ["i", url],
          ["k", "web"],
        ];

        if (articleAuthorPubkeys && articleAuthorPubkeys.length > 0) {
          articleAuthorPubkeys.forEach((pubkey) => {
            tags.push(["p", pubkey]);
          });
        }

        // 创建评论事件
        const event = {
          kind: 1111,
          created_at: dayjs().unix(),
          tags,
          content: commentText,
        };

        // 使用扩展签名
        const signedEvent = await window.nostr.signEvent(event);

        const commenterPubkey = signedEvent.pubkey;

        // const relayLists = await client.fetchRelayLists(
        //   (articleAuthorPubkeys ?? []).concat(commenterPubkey)
        // );
        const relayLists = await Promise.all(
          (articleAuthorPubkeys ?? [])
            .concat(commenterPubkey)
            .map(async (pubkey) => {
              const list = await loadRelayList(pubkey);
              return { pubkey, list };
            })
        );
        let relays = Array.from(
          new Set(
            relayLists.flatMap(({ pubkey, list }) => {
              if (pubkey === commenterPubkey) {
                return list.items
                  .filter((item) => item.write)
                  .slice(0, 8)
                  .map((item) => item.url);
              } else {
                return list.items
                  .filter((item) => item.read)
                  .slice(0, 4)
                  .map((item) => item.url);
              }
            })
          )
        );
        if (relays.length === 0) {
          relays = DEFAULT_RELAY_URLS;
        }

        pool.publish(relays, signedEvent);

        // 清空输入框
        setCommentText("");
      } catch (err) {
        console.error("Failed to submit comment:", err);
        setError("发布评论失败，请稍后重试");
      } finally {
        setIsSubmitting(false);
      }
    },
    [commentText, url, articleAuthorPubkeys]
  );

  return (
    <div className="mt-6">
      <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-6 bg-linear-to-b from-purple-500 to-indigo-500 rounded-full"></span>
        评论
      </h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="分享你的想法..."
            rows={3}
            className="w-full px-5 pt-4 rounded-2xl
                     bg-slate-50 dark:bg-slate-800/50 
                     text-slate-900 dark:text-white
                     border-0 ring-1 ring-slate-200 dark:ring-slate-700
                     focus:outline-none focus:ring-2 
                     focus:ring-purple-500/80 dark:focus:ring-purple-400/80
                     placeholder-slate-400 dark:placeholder-slate-500
                     transition-colors duration-200"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 justify-between mt-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            发布评论，需要安装 Nostr 浏览器扩展（如{" "}
            <a
              href="https://github.com/fiatjaf/nos2x"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              nos2x
            </a>{" "}
            或{" "}
            <a
              href="https://getalby.com/alby-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Alby
            </a>
            ）
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="px-5 py-2 cursor-pointer shrink-0 bg-linear-to-r from-purple-500/80 to-indigo-500/80 
                     hover:from-purple-500 hover:to-indigo-500
                     disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700
                     text-white text-sm font-medium rounded-xl transition-all duration-200
                     disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 disabled:shadow-none"
          >
            {isSubmitting ? "发布中..." : "发布"}
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      <CommentList url={url} pubkey={articleAuthorPubkeys?.[0]} />
    </div>
  );
}
