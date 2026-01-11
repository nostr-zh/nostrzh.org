import { base64 } from "@scure/base";
import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  kinds,
  type EventTemplate,
  type UnsignedEvent,
  type VerifiedEvent,
} from "nostr-tools";
import { minePow } from "nostr-tools/nip13";
import { hashPayload } from "nostr-tools/nip98";
import { hexToBytes, utf8Encoder } from "nostr-tools/utils";

export type TNip07 = {
  getPublicKey: () => Promise<string>;
  signEvent: (draftEvent: EventTemplate) => Promise<VerifiedEvent>;
  nip04?: {
    encrypt?: (pubkey: string, plainText: string) => Promise<string>;
    decrypt?: (pubkey: string, cipherText: string) => Promise<string>;
  };
};

export function getNostrProfileUrl(pubkey: string): string {
  return `https://jumble.social/users/${pubkey}`;
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

export function getNostrAuthToken({
  url,
  method,
  payload,
  sk,
  difficulty,
}: {
  url: string;
  method: string;
  payload?: Record<string, unknown>;
  sk?: string;
  difficulty?: number;
}) {
  let pubkey: string;
  let privkey: Uint8Array<ArrayBufferLike>;
  if (sk) {
    privkey = hexToBytes(sk);
    pubkey = getPublicKey(privkey);
  } else {
    privkey = generateSecretKey();
    pubkey = getPublicKey(privkey);
  }
  let authEvent: UnsignedEvent = {
    pubkey,
    kind: kinds.HTTPAuth,
    tags: [
      ["u", url],
      ["method", method],
    ],
    created_at: Math.round(new Date().getTime() / 1000),
    content: "",
  };

  if (payload) {
    authEvent.tags.push(["payload", hashPayload(payload)]);
  }

  if (difficulty) {
    authEvent = minePow(authEvent, difficulty);
  }

  const finalEvent = finalizeEvent(authEvent, privkey);
  return (
    "Nostr " + base64.encode(utf8Encoder.encode(JSON.stringify(finalEvent)))
  );
}
