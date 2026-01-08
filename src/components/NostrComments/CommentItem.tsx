import type { NostrEvent } from "nostr-tools";
import { formatDate } from "../../lib/date";
import type { TComment } from "../../types";
import Avatar from "./Avatar";
import Username from "./Username";

export default function CommentItem({
  comment,
  onClickReply,
}: {
  comment: TComment;
  onClickReply: (commentEvent: NostrEvent) => void;
}) {
  const { event, children } = comment;

  return (
    <div className="pt-6">
      <div className="flex items-start gap-3 relative">
        <Avatar pubkey={event.pubkey} />

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-baseline gap-2 mb-1">
            <Username pubkey={event.pubkey} />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
            {event.content}
          </p>

          <div className="flex items-center text-xs gap-2">
            <span className="text-slate-400 dark:text-slate-500">
              {formatDate(event.created_at)}
            </span>
            <button
              className="text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
              onClick={() => onClickReply(event)}
            >
              回复
            </button>
          </div>
        </div>

        {children.length > 0 && (
          <div className="absolute left-5 top-11 bottom-0 w-2 border-l border-slate-200 dark:border-slate-700" />
        )}
      </div>
      {children.length > 0 && (
        <>
          {children.map((child, index) => (
            <div className="pl-8 relative">
              <div className="absolute left-5 top-0 h-11 w-2 rounded-bl-lg border-l border-b border-slate-200 dark:border-slate-700" />
              {index < children.length - 1 && (
                <div className="absolute left-5 top-0 bottom-0 w-2 border-l border-slate-200 dark:border-slate-700" />
              )}
              <CommentItem
                key={child.event.id}
                comment={child}
                onClickReply={onClickReply}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
