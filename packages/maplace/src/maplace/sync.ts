import type { Adapter, LocationDiff } from "../adapter";
import type { DrawContext } from "../diff/drawable";
import { type Drawn, diffLocations, NOTHING_DRAWN } from "../diff/locations";
import { runSafely } from "../state/safely";
import type { Snapshot } from "../store";
import { createViewSender } from "./fit";
import { type Presented, presentationOf } from "./presentation";

/** Keeps one adapter in step with the store. */
export interface AdapterSync {
  /** The first pass sends everything, `apply` even when empty; resolves once that is drawn. */
  start(): Promise<void>;
  /** Sends what changed since the last pass; nothing before `start`. */
  update(): void;
}

export interface SyncSource {
  readonly adapter: Adapter;
  readonly getSnapshot: () => Snapshot;
  readonly draw: DrawContext;
}

/**
 * Each pass sends what changed since the last one, in the contract's order: `apply`,
 * `present`, `setView`, `setRoute`. A change the adapter causes while a pass runs (a report
 * back) waits for the next pass, so the adapter sees calls in the order the store made them.
 */
export function createAdapterSync({ adapter, getSnapshot, draw }: SyncSource): AdapterSync {
  let synced: Snapshot | undefined;
  let drawn: Drawn = NOTHING_DRAWN;
  let presented: Presented | undefined;
  let started = false;
  let syncing = false;
  const sendView = createViewSender(adapter);

  function syncUntilCurrent(): Promise<void> | undefined {
    if (!started || syncing) return undefined;
    syncing = true;
    let firstApply: Promise<void> | undefined;
    try {
      for (let next = getSnapshot(); next !== synced; next = getSnapshot()) {
        const applied = pass(next);
        firstApply ??= applied;
      }
    } finally {
      syncing = false;
    }
    return firstApply;
  }

  function pass(next: Snapshot): Promise<void> | undefined {
    const previous = synced;
    const applied = sendLocations(next, previous);
    sendPresentation(next);
    sendView(next, previous);
    if (next.route !== previous?.route) runSafely(() => adapter.setRoute(next.route));
    synced = next;
    return applied;
  }

  function sendLocations(
    next: Snapshot,
    previous: Snapshot | undefined,
  ): Promise<void> | undefined {
    if (next.locations === previous?.locations) return undefined;
    const result = diffLocations(drawn, next.locations, draw);
    drawn = result.drawn;
    if (previous !== undefined && isEmpty(result.diff)) return undefined;
    return runSafely(() => adapter.apply(result.diff));
  }

  function sendPresentation(next: Snapshot): void {
    const state = presentationOf(next, presented);
    if (state !== presented?.state) runSafely(() => adapter.present(state));
    presented = { snapshot: next, state };
  }

  return {
    start() {
      started = true;
      return syncUntilCurrent() ?? Promise.resolve();
    },
    update: () => void syncUntilCurrent(),
  };
}

function isEmpty({ added, updated, removed }: LocationDiff): boolean {
  return added.length === 0 && updated.length === 0 && removed.length === 0;
}
