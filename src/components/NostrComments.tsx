import dayjs from "dayjs";
import type { EventTemplate, NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BIG_RELAY_URLS } from "../constants";
import { formatDate } from "../lib/date";
import client from "../services/client.service";
import {
  formatPubkey,
  generateImageByPubkey,
  getNostrProfileUrl,
  type TProfile,
} from "../lib/nostr";

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
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `https://nostrzh.org/blog/${articleSlug}`;

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let relays = BIG_RELAY_URLS;
      if (articleAuthorPubkeys && articleAuthorPubkeys.length > 0) {
        const relayList = await client.fetchRelayList(articleAuthorPubkeys[0]);
        relays = relayList.read.slice(0, 5);
      }
      const events: NostrEvent[] = [];
      await client.fetchEvents(
        relays,
        {
          kinds: [kinds.Comment],
          "#I": [url],
          "#i": [url],
          limit: 200,
        },
        {
          onevent: (evt) => {
            events.push(evt);
            events.sort((a, b) => b.created_at - a.created_at);
            setEvents([...events]);
          },
        }
      );
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("加载评论失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [articleAuthorPubkeys, url]);

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

        const relayLists = await client.fetchRelayLists(
          (articleAuthorPubkeys ?? []).concat(commenterPubkey)
        );
        let relays = Array.from(
          new Set(
            relayLists.flatMap((list) => {
              if (list.pubkey === commenterPubkey) {
                return list.write.slice(0, 8);
              } else {
                return list.read.slice(0, 4);
              }
            })
          )
        );
        if (relays.length === 0) {
          relays = BIG_RELAY_URLS;
        }

        await client.publishEvent(relays, signedEvent);

        // 清空输入框
        setCommentText("");
        setEvents((prevEvents) => [signedEvent, ...prevEvents]);
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
    <div className="mt-12">
      <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-6 bg-linear-to-b from-purple-500 to-indigo-500 rounded-full"></span>
        评论
        <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
          {events.length} 条
        </span>
      </h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmitComment} className="mb-12">
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            还没有评论，来发表第一条吧
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {events.map((evt) => (
            <NostrComment key={evt.id} comment={evt} />
          ))}
          {
            <div className="text-center">
              <a
                href={`https://jumble.social/external-content?id=${encodeURIComponent(
                  url
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                查看更多评论
              </a>
            </div>
          }
        </div>
      )}
    </div>
  );
}

function NostrComment({ comment }: { comment: NostrEvent }) {
  const [profile, setProfile] = useState<TProfile | null>(null);
  const defaultAvatar = useMemo(
    () => generateImageByPubkey(comment.pubkey),
    [comment.pubkey]
  );

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await client.fetchProfile(comment.pubkey);
      setProfile(profile);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.id]);

  return (
    <div className="flex items-start gap-3">
      {/* 头像 */}
      <div className="shrink-0">
        <img
          src={profile?.avatar ?? defaultAvatar}
          className="size-10 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />
      </div>

      {/* 评论内容 */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2 mb-1">
          {profile ? (
            <a
              href={getNostrProfileUrl(profile.pubkey)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-700 dark:text-slate-200 
                         hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {profile.username}
            </a>
          ) : (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {formatPubkey(comment.pubkey)}
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatDate(comment.created_at)}
          </span>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
