import type { MaplaceError } from "../errors";
import { destroyedError } from "../state/destroyed";

/** `whenReady`, settled by the load it waits for. */
export interface Readiness {
  whenReady(): Promise<void>;
  ready(): void;
  failed(error: MaplaceError): void;
  /** A new load begins, or the map is gone: later calls wait again. */
  reset(): void;
  /** For `destroy`: rejects every waiter, and every later call, with `destroyed`. */
  close(): void;
}

interface Waiter {
  resolve(): void;
  reject(error: MaplaceError): void;
}

/** How the current load ended, while it lasts; undefined while it hasn't. */
type Outcome = "ready" | MaplaceError | undefined;

/**
 * Waiters outlive an attachment: one waiting before `attach`, or across `detach`, settles with
 * the next load. A promise exists only once someone asks, so no rejection goes unhandled.
 */
export function createReadiness(): Readiness {
  let waiters: Waiter[] = [];
  let outcome: Outcome;
  let closed = false;

  function settle(next: Exclude<Outcome, undefined>): void {
    outcome = next;
    const settling = waiters;
    waiters = [];
    for (const waiter of settling) {
      if (next === "ready") waiter.resolve();
      else waiter.reject(next);
    }
  }

  return {
    whenReady() {
      if (closed) return Promise.reject(destroyedError("whenReady"));
      if (outcome === "ready") return Promise.resolve();
      if (outcome !== undefined) return Promise.reject(outcome);
      return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
    },
    ready: () => settle("ready"),
    failed: (error) => settle(error),
    reset() {
      outcome = undefined;
    },
    close() {
      closed = true;
      settle(destroyedError("whenReady"));
    },
  };
}
