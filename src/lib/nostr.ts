import {
  nip19,
  type EventTemplate,
  type NostrEvent,
  type VerifiedEvent,
} from "nostr-tools";
import WellKnownNostr from "../../public/.well-known/nostr.json";
import { BIG_RELAY_URLS } from "../constants";
import { isOnionUrl, isWebsocketUrl, normalizeUrl } from "./url";

export type TMailboxRelayScope = "read" | "write" | "both";
export type TMailboxRelay = {
  url: string;
  scope: TMailboxRelayScope;
};
export type TRelayList = {
  pubkey: string;
  write: string[];
  read: string[];
  originalRelays: TMailboxRelay[];
};

export type TProfile = {
  username: string;
  pubkey: string;
  npub: string;
  avatar?: string;
  nip05?: string;
};

export type TNip07 = {
  getPublicKey: () => Promise<string>;
  signEvent: (draftEvent: EventTemplate) => Promise<VerifiedEvent>;
  nip04?: {
    encrypt?: (pubkey: string, plainText: string) => Promise<string>;
    decrypt?: (pubkey: string, cipherText: string) => Promise<string>;
  };
};

export function getPubkeyFromName(name: string): string | null {
  return (WellKnownNostr.names as Record<string, string>)[name] || null;
}

export function getNostrProfileUrl(pubkey: string): string {
  return `https://jumble.social/users/${pubkey}`;
}

export function pubkeyToNpub(pubkey: string) {
  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return null;
  }
}

export function formatNpub(npub: string, length = 12) {
  if (length < 12) {
    length = 12;
  }

  if (length >= 63) {
    return npub;
  }

  const prefixLength = Math.floor((length - 5) / 2) + 5;
  const suffixLength = length - prefixLength;
  return npub.slice(0, prefixLength) + "..." + npub.slice(-suffixLength);
}

export function formatPubkey(pubkey: string) {
  const npub = pubkeyToNpub(pubkey);
  if (npub) {
    return formatNpub(npub);
  }
  return pubkey.slice(0, 4) + "..." + pubkey.slice(-4);
}

export function userIdToPubkey(userId: string, throwOnInvalid = false): string {
  if (userId.startsWith("npub1") || userId.startsWith("nprofile1")) {
    try {
      const { type, data } = nip19.decode(userId);
      if (type === "npub") {
        return data;
      } else if (type === "nprofile") {
        return data.pubkey;
      }
    } catch (error) {
      if (throwOnInvalid) {
        throw new Error("Invalid id");
      }
      console.error("Error decoding userId:", userId, "error:", error);
    }
  }
  return userId;
}

export function getProfileFromEvent(event: NostrEvent): TProfile {
  try {
    const profileObj = JSON.parse(event.content);
    const username =
      profileObj.display_name?.trim() ||
      profileObj.name?.trim() ||
      profileObj.nip05?.split("@")[0]?.trim();

    return {
      pubkey: event.pubkey,
      npub: pubkeyToNpub(event.pubkey) ?? "",
      avatar: profileObj.picture,
      username: username || formatPubkey(event.pubkey),
      nip05: profileObj.nip05,
    };
  } catch (err) {
    console.error(event.content, err);
    return {
      pubkey: event.pubkey,
      npub: pubkeyToNpub(event.pubkey) ?? "",
      username: formatPubkey(event.pubkey),
    };
  }
}

export function getRelayListFromEvent(
  event?: NostrEvent | null
): Omit<TRelayList, "pubkey"> {
  if (!event) {
    return { write: BIG_RELAY_URLS, read: BIG_RELAY_URLS, originalRelays: [] };
  }

  const relayList = { write: [], read: [], originalRelays: [] } as Omit<
    TRelayList,
    "pubkey"
  >;
  event.tags.filter(tagNameEquals("r")).forEach(([, url, type]) => {
    if (!url || !isWebsocketUrl(url)) return;

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return;

    const scope =
      type === "read" ? "read" : type === "write" ? "write" : "both";
    relayList.originalRelays.push({ url: normalizedUrl, scope });

    if (isOnionUrl(normalizedUrl)) return;

    if (type === "write") {
      relayList.write.push(normalizedUrl);
    } else if (type === "read") {
      relayList.read.push(normalizedUrl);
    } else {
      relayList.write.push(normalizedUrl);
      relayList.read.push(normalizedUrl);
    }
  });

  // If there are too many relays, use the default BIG_RELAY_URLS
  // Because they don't know anything about relays, their settings cannot be trusted
  return {
    write:
      relayList.write.length && relayList.write.length <= 8
        ? relayList.write
        : BIG_RELAY_URLS,
    read:
      relayList.read.length && relayList.write.length <= 8
        ? relayList.read
        : BIG_RELAY_URLS,
    originalRelays: relayList.originalRelays,
  };
}

export function tagNameEquals(tagName: string) {
  return (tag: string[]) => tag[0] === tagName;
}

export function filterOutBigRelays(relayUrls: string[]) {
  return relayUrls.filter((url) => !BIG_RELAY_URLS.includes(url));
}

// Legacy compare function for sorting compatibility
// If return 0, it means the two events are equal.
// If return a negative number, it means `b` should be retained, and `a` should be discarded.
// If return a positive number, it means `a` should be retained, and `b` should be discarded.
export function compareEvents(a: NostrEvent, b: NostrEvent): number {
  if (a.created_at !== b.created_at) {
    return a.created_at - b.created_at;
  }
  // In case of replaceable events with the same timestamp, the event with the lowest id (first in lexical order) should be retained, and the other discarded.
  if (a.id !== b.id) {
    return a.id < b.id ? 1 : -1;
  }
  return 0;
}

// Returns the event that should be retained when comparing two events
export function getRetainedEvent(a: NostrEvent, b: NostrEvent): NostrEvent {
  if (compareEvents(a, b) > 0) {
    return a;
  }
  return b;
}

const pubkeyImageCache = new Map<string, string>();
export function generateImageByPubkey(pubkey: string): string {
  if (pubkeyImageCache.has(pubkey)) {
    return pubkeyImageCache.get(pubkey)!;
  }

  const paddedPubkey = pubkey.padEnd(2, "0");

  // Split into 3 parts for colors and the rest for control points
  const colors: string[] = [];
  const controlPoints: string[] = [];
  for (let i = 0; i < 11; i++) {
    const part = paddedPubkey.slice(i * 6, (i + 1) * 6);
    if (i < 3) {
      colors.push(`#${part}`);
    } else {
      controlPoints.push(part);
    }
  }

  // Generate SVG with multiple radial gradients
  const gradients = controlPoints
    .map((point, index) => {
      const cx = parseInt(point.slice(0, 2), 16) % 100;
      const cy = parseInt(point.slice(2, 4), 16) % 100;
      const r = (parseInt(point.slice(4, 6), 16) % 35) + 30;
      const c = colors[index % (colors.length - 1)];

      return `
        <radialGradient id="grad${index}-${pubkey}" cx="${cx}%" cy="${cy}%" r="${r}%">
          <stop offset="0%" style="stop-color:${c};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${c};stop-opacity:0" />
        </radialGradient>
        <rect width="100%" height="100%" fill="url(#grad${index}-${pubkey})" />
      `;
    })
    .join("");

  const image = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${colors[2]}" fill-opacity="0.3" />
      ${gradients}
    </svg>
  `;
  const imageData = `data:image/svg+xml;base64,${btoa(image)}`;

  pubkeyImageCache.set(pubkey, imageData);

  return imageData;
}
