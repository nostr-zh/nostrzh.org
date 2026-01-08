import type { EventTemplate, NostrEvent } from "nostr-tools";
import { useState } from "react";
import CommentEditor from "./CommentEditor";
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
  const [parentEvent, setParentEvent] = useState<NostrEvent | null>(null);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-6 bg-linear-to-b from-purple-500 to-indigo-500 rounded-full"></span>
        评论
      </h2>

      {/* 评论表单 */}
      <CommentEditor
        url={url}
        articleAuthorPubkeys={articleAuthorPubkeys}
        parentEvent={parentEvent}
        clearParentEvent={() => setParentEvent(null)}
      />

      {/* 评论列表 */}
      <CommentList
        url={url}
        pubkey={articleAuthorPubkeys?.[0]}
        onClickReply={(evt) => setParentEvent(evt)}
      />
    </div>
  );
}
