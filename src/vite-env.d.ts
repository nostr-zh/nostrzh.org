/// <reference types="vite/client" />
import { type TNip07 } from "./types/nostr";

declare global {
  interface Window {
    nostr?: TNip07;
  }
}
