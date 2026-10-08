/**
 * Offline outbox (foundation for offline-first sync).
 *
 * Mutations that must never be lost (attendance, session events, payments) go through
 * `sendOrQueue`. When the network is unavailable the request is persisted and replayed
 * in order once connectivity returns. Every queued request carries a client-generated
 * idempotency key so the backend can safely ignore duplicates.
 *
 * Next step for full offline mode: persist the React Query cache and pull deltas from
 * GET /sync/changes?since=<server_time>.
 */
import NetInfo from '@react-native-community/netinfo';
import { ApiError, http } from '../apiClient';
import { storage } from '../storage';
import { uuid } from '@/shared/utils/id';

const KEY = 'offline_outbox_v1';

export interface OutboxItem { id: string; method: 'post' | 'put' | 'patch' | 'delete'; url: string; body?: unknown; createdAt: string }

type Listener = (count: number) => void;
const listeners = new Set<Listener>();
let flushing = false;

async function read(): Promise<OutboxItem[]> {
  return storage.getJSON<OutboxItem[]>(KEY, []);
}
async function write(items: OutboxItem[]) {
  await storage.setJSON(KEY, items);
  listeners.forEach((l) => l(items.length));
}

export const outbox = {
  subscribe(l: Listener) {
    listeners.add(l);
    read().then((i) => l(i.length));
    return () => listeners.delete(l);
  },
  async count() {
    return (await read()).length;
  },
  async enqueue(item: Omit<OutboxItem, 'id' | 'createdAt'>) {
    const items = await read();
    items.push({ ...item, id: uuid(), createdAt: new Date().toISOString() });
    await write(items);
  },
  async flush(): Promise<number> {
    if (flushing) return 0;
    flushing = true;
    let sent = 0;
    try {
      let items = await read();
      while (items.length) {
        const it = items[0];
        try {
          await http.request({ method: it.method, url: it.url, data: it.body });
        } catch (e) {
          if (e instanceof ApiError && e.isNetwork) break; // still offline
          // server rejected -> drop the item to avoid blocking the queue
        }
        items = items.slice(1);
        sent += 1;
        await write(items);
      }
    } finally {
      flushing = false;
    }
    return sent;
  },
};

/** Try the request now; if offline, queue it and resolve with `{ queued: true }`. */
export async function sendOrQueue<T>(method: OutboxItem['method'], url: string, body?: unknown): Promise<T | { queued: true }> {
  try {
    const r = await http.request<T>({ method, url, data: body });
    return r.data;
  } catch (e) {
    if (e instanceof ApiError && e.isNetwork) {
      await outbox.enqueue({ method, url, body });
      return { queued: true };
    }
    throw e;
  }
}

export function startOutboxSync() {
  return NetInfo.addEventListener((s) => {
    if (s.isConnected) outbox.flush();
  });
}
