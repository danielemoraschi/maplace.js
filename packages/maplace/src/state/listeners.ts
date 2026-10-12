import type { Unsubscribe } from "../events";

/** A set of listeners: subscribers, or the listeners of one event. */
export interface Listeners<T> {
  add(listener: (value: T) => void, signal?: AbortSignal): Unsubscribe;
  notify(value: T): void;
  /** Removes every listener and stops watching their signals. */
  clear(): void;
}

interface Entry<T> {
  readonly listener: (value: T) => void;
  readonly remove: Unsubscribe;
}

const NOTHING_TO_REMOVE: Unsubscribe = () => {};

export function createListeners<T>(): Listeners<T> {
  const entries = new Set<Entry<T>>();
  return {
    add(listener, signal) {
      if (signal?.aborted) return NOTHING_TO_REMOVE;
      const remove = () => {
        entries.delete(entry);
        signal?.removeEventListener("abort", remove);
      };
      const entry: Entry<T> = { listener, remove };
      entries.add(entry);
      signal?.addEventListener("abort", remove);
      return remove;
    },
    notify(value) {
      // The listeners present now: one added by a listener waits for the next notification,
      // and one removed by an earlier listener is skipped.
      const present = Array.from(entries);
      for (const entry of present) {
        if (entries.has(entry)) callSafely(entry.listener, value);
      }
    },
    clear() {
      for (const entry of entries) entry.remove();
    },
  };
}

function callSafely<T>(listener: (value: T) => void, value: T): void {
  try {
    listener(value);
  } catch (error) {
    rethrowLater(error);
  }
}

// One listener's bug must not stop the others or leave the store half-notified, and it must not
// vanish either: rethrown in a microtask, it reaches the console and `window.onerror`.
function rethrowLater(error: unknown): void {
  queueMicrotask(() => {
    throw error;
  });
}
