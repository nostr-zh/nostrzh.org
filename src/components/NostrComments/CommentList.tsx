import type { NostrEvent } from "nostr-tools";
import { useComments } from "../../hooks/useComments";
import CommentItem from "./CommentItem";

export default function CommentList({
  url,
  pubkey,
  onClickReply,
}: {
  url: string;
  pubkey?: string;
  onClickReply: (commentEvent: NostrEvent) => void;
}) {
  const { comments, loading, loadingMore, loadMore, hasMore } = useComments({
    url,
    pubkey,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    <div className="text-center py-12">
      <p className="text-slate-400 dark:text-slate-500 text-sm">
        还没有评论，来发表第一条吧
      </p>
    </div>;
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem
          key={comment.event.id}
          comment={comment}
          onClickReply={onClickReply}
        />
      ))}
      {loadingMore ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : hasMore ? (
        <div className="text-center">
          <button
            onClick={() => loadMore()}
            className="inline-block mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            查看更多评论
          </button>
        </div>
      ) : null}
    </div>
  );
}
