import type { EventTemplate, NostrEvent, VerifiedEvent } from "nostr-tools";

declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: EventTemplate) => Promise<VerifiedEvent>;
    };
  }
}

export type TComment = {
  event: NostrEvent;
  children: TComment[];
};
