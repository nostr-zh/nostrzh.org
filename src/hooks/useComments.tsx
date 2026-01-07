import { pool } from "@nostr/gadgets/global";
import { loadRelayList } from "@nostr/gadgets/lists";
import dayjs from "dayjs";
import { kinds, type NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_RELAY_URLS } from "../constants";
import { formatErrorMessage } from "../lib/error";
import type { TComment } from "../types";

interface UseCommentsOptions {
  url: string;
  relays?: string[];
  pubkey?: string;
  limit?: number;
}

const determineRelays = async (relays?: string[], pubkey?: string) => {
  const _relays = relays ?? DEFAULT_RELAY_URLS;
  if (pubkey) {
    const relayList = await loadRelayList(pubkey);
    relayList.items
      .filter((item) => item.read)
      .forEach((item) => _relays.push(item.url));
  }
  return _relays;
};

export function useComments({
  url,
  limit = 50,
  relays,
  pubkey,
}: UseCommentsOptions) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [until, setUntil] = useState<number | undefined>(dayjs().unix());

  const loadComments = useCallback(async () => {
    setLoading(true);
    setEvents([]);
    setError(null);
    try {
      const urls = [url];
      if (url.endsWith("/")) {
        urls.push(url.slice(0, -1));
      } else {
        urls.push(url + "/");
      }
      const _relays = await determineRelays(relays, pubkey);
      const comments: NostrEvent[] = [];
      let eosed = false;
      const sub = pool.subscribe(
        _relays,
        {
          kinds: [kinds.Comment],
          "#I": urls,
          limit,
        },
        {
          onevent: (evt) => {
            if (eosed) {
              setEvents((prev) => [evt, ...prev]);
            } else {
              comments.push(evt);
            }
          },
          oneose: () => {
            eosed = true;
            const sliced = comments.slice(0, limit);
            setEvents(sliced);
            setUntil(
              sliced.length >= limit
                ? sliced[sliced.length - 1].created_at - 1
                : undefined
            );
            setLoading(false);
          },
        }
      );
      return () => sub.close();
    } catch (err: unknown) {
      setError(formatErrorMessage(err) || "Failed to load comments");
      setLoading(false);
    }
  }, [relays, pubkey, url, limit]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !until) return;

    setLoadingMore(true);
    try {
      const _relays = await determineRelays(relays, pubkey);
      const events = await pool.querySync(_relays, {
        kinds: [kinds.Comment],
        "#I": [url],
        until,
        limit,
      });
      if (events.length === 0) {
        setUntil(undefined);
        setLoadingMore(false);
        return;
      }

      setEvents((prev) => [...prev, ...events]);
      setUntil(events[events.length - 1].created_at - 1);
    } catch (err: unknown) {
      setError(formatErrorMessage(err) || "Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  }, [limit, loading, loadingMore, pubkey, relays, until, url]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const { comments, commentCount } = useMemo<{
    comments: TComment[];
    commentCount: number;
  }>(() => {
    const map = new Map<string, NostrEvent[]>(); // parent key -> children

    const getParentKey = (event: NostrEvent) => {
      const eTag = event.tags.find((tag) => tag[0] === "e");
      if (eTag) {
        return eTag[1];
      }

      return null;
    };

    events.forEach((event) => {
      const parentKey = getParentKey(event);
      if (parentKey) {
        if (!map.has(parentKey)) {
          map.set(parentKey, []);
        }
        map.get(parentKey)!.push(event);
      } else {
        if (!map.has("root")) {
          map.set("root", []);
        }
        map.get("root")!.push(event);
      }
    });

    let commentCount = 0;
    const buildComments = (parentKey: string): TComment[] => {
      const childrenEvents = map.get(parentKey) || [];
      return childrenEvents.map((event) => {
        commentCount++;
        return {
          event,
          children: buildComments(event.id),
        };
      });
    };

    return { comments: buildComments("root"), commentCount };
  }, [events]);

  return {
    comments,
    commentCount,
    loading,
    loadingMore,
    hasMore: until !== undefined,
    error,
    reload: loadComments,
    loadMore,
  };
}
