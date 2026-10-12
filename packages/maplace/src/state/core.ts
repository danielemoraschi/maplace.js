import type { Snapshot } from "../store";
import { type Change, changesAnything, withPatch } from "./change";
import { createEmitter, type Emitter } from "./emitter";
import { createListeners, type Listeners } from "./listeners";

/** What a store adds around each commit; `createMaplace` keeps the map in step through them. */
export interface CommitHooks<Data> {
  /** Checks a call's change; throwing refuses it, so nothing changes. `method` labels the error. */
  beforeCommit(candidate: Snapshot<Data>, method: string): void;
  /** Runs after every commit, before subscribers and listeners hear of it. */
  afterCommit(): void;
}

const NO_HOOKS: CommitHooks<unknown> = { beforeCommit() {}, afterCommit() {} };

/** The snapshot, who listens to it, and the one place it changes. */
export interface Core<Data> {
  getSnapshot(): Snapshot<Data>;
  /** A call's change: a new frozen snapshot, one notification to subscribers, then its events. */
  commit(method: string, change: Change<Data>): void;
  /** A change the store decided itself (load state, a report from the map): never refused. */
  commitOwn(change: Change<Data>): void;
  setHooks(hooks: CommitHooks<Data>): void;
  readonly subscribers: Listeners<void>;
  readonly emitter: Emitter<Data>;
}

export function createCore<Data>(initial: Snapshot<Data>): Core<Data> {
  let snapshot = initial;
  let hooks: CommitHooks<Data> = NO_HOOKS;
  const subscribers = createListeners<void>();
  const emitter = createEmitter<Data>();
  // Deliveries wait their turn: a call made by a listener commits at once, but its notification
  // and events follow those of the change being delivered, so every listener sees them in order.
  const deliveries: (() => void)[] = [];
  let delivering = false;

  function commitAfter(check: (candidate: Snapshot<Data>) => void, change: Change<Data>): void {
    if (changesAnything(snapshot, change.patch)) {
      const candidate = withPatch(snapshot, change.patch);
      check(candidate);
      snapshot = candidate;
      deliveries.push(() => subscribers.notify(undefined));
    }
    for (const event of change.events) deliveries.push(() => emitter.emit(event));
    hooks.afterCommit();
    deliver();
  }

  function deliver(): void {
    if (delivering) return;
    delivering = true;
    try {
      for (let next = deliveries.shift(); next !== undefined; next = deliveries.shift()) next();
    } finally {
      delivering = false;
    }
  }

  return {
    getSnapshot: () => snapshot,
    commit: (method, change) =>
      commitAfter((candidate) => hooks.beforeCommit(candidate, method), change),
    commitOwn: (change) => commitAfter(() => {}, change),
    setHooks(next) {
      hooks = next;
    },
    subscribers,
    emitter,
  };
}
