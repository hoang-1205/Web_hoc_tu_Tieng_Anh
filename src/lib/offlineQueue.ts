// VocabQuest — IndexedDB Offline Event Queue & Session Autosave
// Lỗi 12 Fix: Persist AnswerEvents and session state to IndexedDB before sending.
//              Retry with idempotent client_event_id when back online.

const DB_NAME = 'vocabquest_offline';
const DB_VERSION = 1;
const EVENTS_STORE = 'pending_events';
const SESSION_STATE_STORE = 'session_state';

type PendingEvent = {
  client_event_id: string;
  session_id: string;
  question_id: string;
  user_answer: string;
  attempt_no: number;
  response_ms: number;
  hint_used: boolean;
  created_at: number; // Date.now()
};

type SessionSnapshot = {
  session_id: string;
  current_q_index: number;
  hearts: number;
  score: number;
  combo: number;
  answer_events: PendingEvent[];
  updated_at: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not available'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        db.createObjectStore(EVENTS_STORE, { keyPath: 'client_event_id' });
      }
      if (!db.objectStoreNames.contains(SESSION_STATE_STORE)) {
        db.createObjectStore(SESSION_STATE_STORE, { keyPath: 'session_id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ────────────────────── Event Queue ──────────────────────

/** Enqueue an event into IndexedDB before sending to server. */
export async function enqueueEvent(event: PendingEvent): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    tx.objectStore(EVENTS_STORE).put(event);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {
    // IndexedDB unavailable; silently continue (events still live in React state)
    console.warn('[OfflineQueue] enqueueEvent failed:', e);
  }
}

/** Remove a successfully-acknowledged event from IndexedDB. */
export async function dequeueEvent(clientEventId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    tx.objectStore(EVENTS_STORE).delete(clientEventId);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    // best-effort
  }
}

/** Remove all pending events for a given session after complete. */
export async function clearSessionEvents(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const ev = cursor.value as PendingEvent;
        if (ev.session_id === sessionId) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    // best-effort
  }
}

/** Get all pending events for a session (used on page reload to restore). */
export async function getPendingEvents(sessionId: string): Promise<PendingEvent[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(EVENTS_STORE, 'readonly');
    const store = tx.objectStore(EVENTS_STORE);
    const all: PendingEvent[] = [];
    const req = store.openCursor();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const ev = cursor.value as PendingEvent;
          if (ev.session_id === sessionId) {
            all.push(ev);
          }
          cursor.continue();
        } else {
          resolve(all);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ────────────────────── Session State Autosave ──────────────────────

/** Save current session gameplay snapshot to IndexedDB. */
export async function saveSessionState(snapshot: SessionSnapshot): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STATE_STORE, 'readwrite');
    tx.objectStore(SESSION_STATE_STORE).put(snapshot);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    // best-effort
  }
}

/** Load a saved session snapshot (returns null if none). */
export async function loadSessionState(sessionId: string): Promise<SessionSnapshot | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STATE_STORE, 'readonly');
    const req = tx.objectStore(SESSION_STATE_STORE).get(sessionId);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Clear session state after completion. */
export async function clearSessionState(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SESSION_STATE_STORE, 'readwrite');
    tx.objectStore(SESSION_STATE_STORE).delete(sessionId);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    // best-effort
  }
}

// ────────────────────── Sync / Flush ──────────────────────

/**
 * Send a batch of events to the server with retry.
 * On success, dequeues acknowledged events from IndexedDB.
 * Returns { accepted, duplicates, failed }.
 */
export async function syncEventsToServer(
  sessionId: string,
  events: PendingEvent[],
): Promise<{ accepted: number; duplicates: number; failed: number }> {
  if (events.length === 0) return { accepted: 0, duplicates: 0, failed: 0 };

  try {
    const res = await fetch(`/api/v1/sessions/${sessionId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      return { accepted: 0, duplicates: 0, failed: events.length };
    }

    const data = await res.json();
    const accepted: number = data.accepted || 0;
    const duplicates: number = data.duplicates || 0;

    // Dequeue events the server has accepted or recognised as duplicates
    for (const ev of events) {
      const isRejected = (data.rejected || []).some(
        (r: any) => r.client_event_id === ev.client_event_id,
      );
      if (!isRejected) {
        await dequeueEvent(ev.client_event_id);
      }
    }

    return { accepted, duplicates, failed: (data.rejected || []).length };
  } catch {
    // Network error — events stay in IndexedDB for next retry
    return { accepted: 0, duplicates: 0, failed: events.length };
  }
}

/**
 * Flush all pending events for a session from IndexedDB to server.
 * Useful on page load, online event, or before completing a session.
 */
export async function flushPendingEvents(sessionId: string): Promise<void> {
  const pending = await getPendingEvents(sessionId);
  if (pending.length === 0) return;
  await syncEventsToServer(sessionId, pending);
}

// ────────────────────── Online / Offline Listener ──────────────────────

let _flushSessionId: string | null = null;

export function startOnlineListener(sessionId: string): () => void {
  _flushSessionId = sessionId;

  const handler = () => {
    if (_flushSessionId) {
      flushPendingEvents(_flushSessionId).catch(() => {});
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handler);
  }

  return () => {
    _flushSessionId = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handler);
    }
  };
}
