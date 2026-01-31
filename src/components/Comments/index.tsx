import { NostrComments } from "nostr-comments";

interface CommentsProps {
  articleSlug: string;
  articleAuthorPubkeys?: string[];
}

export default function Comments({
  articleSlug,
  articleAuthorPubkeys,
}: CommentsProps) {
  const url = `https://nostrzh.org/blog/${articleSlug}`;

  return (
    <NostrComments url={url} locale="zh" mention={articleAuthorPubkeys?.[0]} />
  );
}
