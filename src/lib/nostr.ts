import WellKnownNostr from "../../public/.well-known/nostr.json";

export function getPubkeyFromName(name: string): string | null {
  return (WellKnownNostr.names as Record<string, string>)[name] || null;
}

export function getNostrProfileUrl(pubkey: string): string {
  return `https://jumble.social/users/${pubkey}`;
}
