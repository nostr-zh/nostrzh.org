import type { NostrEvent } from "nostr-tools";

export type TComment = {
  event: NostrEvent;
  children: TComment[];
};
