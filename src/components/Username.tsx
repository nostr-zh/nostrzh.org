import { bareNostrUser, loadNostrUser } from "@nostr/gadgets/metadata";
import { useEffect, useState } from "react";
import { getNostrProfileUrl } from "../lib/nostr";

export default function Username({ pubkey }: { pubkey: string }) {
  const [username, setUsername] = useState<string>(
    bareNostrUser(pubkey).shortName
  );

  useEffect(() => {
    loadNostrUser(pubkey).then((profile) => {
      setUsername(profile.shortName);
    });
  });

  return (
    <a
      href={getNostrProfileUrl(pubkey)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-slate-700 dark:text-slate-200"
    >
      {username}
    </a>
  );
}
