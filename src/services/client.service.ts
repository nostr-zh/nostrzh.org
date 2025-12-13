import DataLoader from "dataloader";
import {
  type EventTemplate,
  type Filter,
  kinds,
  matchFilters,
  nip19,
  type NostrEvent,
  SimplePool,
  type VerifiedEvent,
} from "nostr-tools";
import { BIG_RELAY_URLS } from "../constants";
import {
  filterOutBigRelays,
  formatPubkey,
  getProfileFromEvent,
  getRelayListFromEvent,
  pubkeyToNpub,
  userIdToPubkey,
  type TProfile,
  type TRelayList,
} from "../lib/nostr";

class ClientService extends EventTarget {
  static instance: ClientService;

  pubkey?: string;
  currentRelays: string[] = [];
  private pool: SimplePool;

  constructor() {
    super();
    this.pool = new SimplePool();
    this.pool.trackRelays = true;
  }

  public static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService();
    }
    return ClientService.instance;
  }

  async publishEvent(relayUrls: string[], event: NostrEvent) {
    const uniqueRelayUrls = Array.from(new Set(relayUrls));
    await new Promise<void>((resolve, reject) => {
      let successCount = 0;
      let finishedCount = 0;
      // If one third of the relays have accepted the event, consider it a success
      const successThreshold = uniqueRelayUrls.length / 3;
      const errors: { url: string; error: any }[] = [];

      const checkCompletion = () => {
        if (successCount >= successThreshold) {
          this.emitNewEvent(event);
          resolve();
        }
        if (++finishedCount >= uniqueRelayUrls.length) {
          reject(
            new AggregateError(
              errors.map(
                ({ url, error }) =>
                  new Error(
                    `${url}: ${
                      error instanceof Error ? error.message : String(error)
                    }`
                  )
              )
            )
          );
        }
      };

      Promise.allSettled(
        uniqueRelayUrls.map(async (url) => {
          const relay = await this.pool
            .ensureRelay(url, { connectionTimeout: 5_000 })
            .catch(() => {
              return undefined;
            });
          if (!relay) {
            errors.push({ url, error: new Error("Cannot connect to relay") });
            checkCompletion();
            return;
          }

          relay.publishTimeout = 10_000; // 10s
          let hasAuthed = false;

          const publishPromise = async () => {
            try {
              await relay.publish(event);
              successCount++;
            } catch (error) {
              if (
                !hasAuthed &&
                error instanceof Error &&
                error.message.startsWith("auth-required") &&
                !!window.nostr
              ) {
                try {
                  await relay.auth((authEvt: EventTemplate) =>
                    window.nostr!.signEvent(authEvt)
                  );
                  hasAuthed = true;
                  return await publishPromise();
                } catch (error) {
                  errors.push({ url, error });
                }
              } else {
                errors.push({ url, error });
              }
            }
          };

          return publishPromise().finally(checkCompletion);
        })
      );
    });
  }

  emitNewEvent(event: NostrEvent) {
    this.dispatchEvent(new CustomEvent("newEvent", { detail: event }));
  }

  subscribe(
    urls: string[],
    filter: Filter | Filter[],
    {
      onevent,
      oneose,
      onclose,
      startLogin,
      onAllClose,
    }: {
      onevent?: (evt: NostrEvent) => void;
      oneose?: (eosed: boolean) => void;
      onclose?: (url: string, reason: string) => void;
      startLogin?: () => void;
      onAllClose?: (reasons: string[]) => void;
    }
  ) {
    const relays = Array.from(new Set(urls));
    const filters = Array.isArray(filter) ? filter : [filter];

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const _knownIds = new Set<string>();
    let startedCount = relays.length;
    let eosedCount = 0;
    let eosed = false;
    let closedCount = 0;
    const closeReasons: string[] = [];
    const subPromises: Promise<{ close: () => void }>[] = [];
    relays.forEach((url) => {
      let hasAuthed = false;

      subPromises.push(startSub());

      async function startSub() {
        const relay = await that.pool
          .ensureRelay(url, { connectionTimeout: 5_000 })
          .catch(() => {
            return undefined;
          });
        // cannot connect to relay
        if (!relay) {
          if (!eosed) {
            eosedCount++;
            eosed = eosedCount >= startedCount;
            oneose?.(eosed);
          }
          return {
            close: () => {},
          };
        }

        return relay.subscribe(filters, {
          alreadyHaveEvent: (id: string) => {
            const have = _knownIds.has(id);
            if (have) {
              return true;
            }
            _knownIds.add(id);
            return false;
          },
          onevent: (evt: NostrEvent) => {
            onevent?.(evt);
          },
          oneose: () => {
            // make sure eosed is not called multiple times
            if (eosed) return;

            eosedCount++;
            eosed = eosedCount >= startedCount;
            oneose?.(eosed);
          },
          onclose: (reason: string) => {
            // auth-required
            if (reason.startsWith("auth-required") && !hasAuthed) {
              // already logged in
              if (window.nostr) {
                relay
                  .auth(async (authEvt: EventTemplate) => {
                    const evt = await window.nostr!.signEvent(authEvt);
                    if (!evt) {
                      throw new Error("sign event failed");
                    }
                    return evt as VerifiedEvent;
                  })
                  .then(() => {
                    hasAuthed = true;
                    if (!eosed) {
                      startedCount++;
                      subPromises.push(startSub());
                    }
                  })
                  .catch(() => {
                    // ignore
                  });
                return;
              }

              // open login dialog
              if (startLogin) {
                startLogin();
                return;
              }
            }

            // close the subscription
            closedCount++;
            closeReasons.push(reason);
            onclose?.(url, reason);
            if (closedCount >= startedCount) {
              onAllClose?.(closeReasons);
            }
            return;
          },
          eoseTimeout: 10_000, // 10s
        });
      }
    });

    const handleNewEventFromInternal = (data: Event) => {
      const customEvent = data as CustomEvent<NostrEvent>;
      const evt = customEvent.detail;
      if (!matchFilters(filters, evt)) return;

      const id = evt.id;
      const have = _knownIds.has(id);
      if (have) return;

      _knownIds.add(id);
      onevent?.(evt);
    };

    this.addEventListener("newEvent", handleNewEventFromInternal);

    return {
      close: () => {
        this.removeEventListener("newEvent", handleNewEventFromInternal);
        subPromises.forEach((subPromise) => {
          subPromise
            .then((sub) => {
              sub.close();
            })
            .catch((err) => {
              console.error(err);
            });
        });
      },
    };
  }

  private async query(
    urls: string[],
    filter: Filter | Filter[],
    onevent?: (evt: NostrEvent) => void
  ) {
    return await new Promise<NostrEvent[]>((resolve) => {
      const events: NostrEvent[] = [];
      const sub = this.subscribe(urls, filter, {
        onevent(evt) {
          onevent?.(evt);
          events.push(evt);
        },
        oneose: (eosed) => {
          if (eosed) {
            sub.close();
            resolve(events);
          }
        },
        onAllClose: () => {
          resolve(events);
        },
      });
    });
  }

  async fetchEvents(
    urls: string[],
    filter: Filter | Filter[],
    {
      onevent,
    }: {
      onevent?: (evt: NostrEvent) => void;
    } = {}
  ) {
    const relays = Array.from(new Set(urls));
    const events = await this.query(
      relays.length > 0 ? relays : BIG_RELAY_URLS,
      filter,
      onevent
    );
    return events;
  }

  private async fetchEventFromRelays(relayUrls: string[], filter: Filter) {
    if (!relayUrls.length) return;

    const events = await this.query(relayUrls, filter);
    return events.sort((a, b) => b.created_at - a.created_at)[0];
  }

  /** =========== Profile =========== */

  private async _fetchProfileEvent(
    id: string
  ): Promise<NostrEvent | undefined> {
    let pubkey: string | undefined;
    let relays: string[] = [];
    if (/^[0-9a-f]{64}$/.test(id)) {
      pubkey = id;
    } else {
      const { data, type } = nip19.decode(id);
      switch (type) {
        case "npub":
          pubkey = data;
          break;
        case "nprofile":
          pubkey = data.pubkey;
          if (data.relays) relays = data.relays;
          break;
      }
    }

    if (!pubkey) {
      throw new Error("Invalid id");
    }

    const profileFromBigRelays =
      await this.replaceableEventFromBigRelaysDataloader.load({
        pubkey,
        kind: kinds.Metadata,
      });
    if (profileFromBigRelays) {
      return profileFromBigRelays;
    }

    // If the user has a relay list, try those relays first
    if (!relays.length) {
      const relayList = await this.fetchRelayList(pubkey);
      relays = filterOutBigRelays(relayList.write).slice(0, 5);
    }

    // If the user has no relay list, try current relays
    if (!relays.length) {
      relays = filterOutBigRelays(this.currentRelays);
    }

    const profileEvent = await this.fetchEventFromRelays(relays, {
      authors: [pubkey],
      kinds: [kinds.Metadata],
      limit: 1,
    });

    return profileEvent;
  }

  private profileDataloader = new DataLoader<string, TProfile | null, string>(
    async (ids) => {
      const results = await Promise.allSettled(
        ids.map((id) => this._fetchProfile(id))
      );
      return results.map((res) =>
        res.status === "fulfilled" ? res.value : null
      );
    }
  );

  async fetchProfile(pubkey: string): Promise<TProfile> {
    const [profile] = await this.fetchProfiles([pubkey]);
    return profile;
  }

  async fetchProfiles(pubkeys: string[]): Promise<TProfile[]> {
    return await this.profileDataloader.loadMany(pubkeys).then((results) =>
      results.map((res, index) => {
        if (res instanceof Error || !res) {
          const pubkey = pubkeys[index];
          return {
            pubkey,
            npub: pubkeyToNpub(pubkey) ?? "",
            username: formatPubkey(pubkey),
          };
        }
        return res;
      })
    );
  }

  private async _fetchProfile(id: string): Promise<TProfile | null> {
    const profileEvent = await this._fetchProfileEvent(id);
    if (profileEvent) {
      return getProfileFromEvent(profileEvent);
    }

    try {
      const pubkey = userIdToPubkey(id);
      return {
        pubkey,
        npub: pubkeyToNpub(pubkey) ?? "",
        username: formatPubkey(pubkey),
      };
    } catch {
      return null;
    }
  }

  /** =========== Relay list =========== */

  async fetchRelayList(pubkey: string): Promise<TRelayList> {
    const [relayList] = await this.fetchRelayLists([pubkey]);
    return relayList;
  }

  async fetchRelayLists(pubkeys: string[]): Promise<TRelayList[]> {
    const relayEvents = await this.fetchReplaceableEventsFromBigRelays(
      pubkeys,
      kinds.RelayList
    );

    return relayEvents.map((event, index) => {
      if (event) {
        return {
          pubkey: event.pubkey,
          ...getRelayListFromEvent(event),
        };
      }
      return {
        pubkey: pubkeys[index],
        write: BIG_RELAY_URLS,
        read: BIG_RELAY_URLS,
        originalRelays: [],
      };
    });
  }

  /** =========== Replaceable event from big relays dataloader =========== */

  private replaceableEventFromBigRelaysDataloader = new DataLoader<
    { pubkey: string; kind: number },
    NostrEvent | null,
    string
  >(this.replaceableEventFromBigRelaysBatchLoadFn.bind(this), {
    batchScheduleFn: (callback) => setTimeout(callback, 50),
    maxBatchSize: 500,
    cacheKeyFn: ({ pubkey, kind }) => `${pubkey}:${kind}`,
  });

  private async replaceableEventFromBigRelaysBatchLoadFn(
    params: readonly { pubkey: string; kind: number }[]
  ) {
    const groups = new Map<number, string[]>();
    params.forEach(({ pubkey, kind }) => {
      if (!groups.has(kind)) {
        groups.set(kind, []);
      }
      groups.get(kind)!.push(pubkey);
    });

    const eventsMap = new Map<string, NostrEvent>();
    await Promise.allSettled(
      Array.from(groups.entries()).map(async ([kind, pubkeys]) => {
        const events = await this.query(BIG_RELAY_URLS, {
          authors: pubkeys,
          kinds: [kind],
        });

        for (const event of events) {
          const key = `${event.pubkey}:${event.kind}`;
          const existing = eventsMap.get(key);
          if (!existing || existing.created_at < event.created_at) {
            eventsMap.set(key, event);
          }
        }
      })
    );

    return params.map(({ pubkey, kind }) => {
      const key = `${pubkey}:${kind}`;
      const event = eventsMap.get(key);
      return event ?? null;
    });
  }

  private async fetchReplaceableEventsFromBigRelays(
    pubkeys: string[],
    kind: number
  ) {
    return (
      await this.replaceableEventFromBigRelaysDataloader.loadMany(
        pubkeys.map((pubkey) => ({
          pubkey,
          kind,
        }))
      )
    ).map((evt) => (evt instanceof Error ? null : evt));
  }
}

const instance = ClientService.getInstance();
export default instance;
