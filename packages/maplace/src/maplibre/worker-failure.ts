import { MaplaceError } from "../errors";
import type { MapLibre } from "./library";

type Dispatcher = ReturnType<MapLibre["getGlobalDispatcher"]>;

/** What is known of the worker pool every MapLibre map on the page shares for the page's life. */
export interface WorkerWatch {
  /** The worker's failure, once heard. */
  failure(): MaplaceError | undefined;
  /** Calls `heard` once if it fails from now on; returns how to stop. */
  whenFails(heard: (error: MaplaceError) => void): () => void;
}

const WORKER_FAILURE =
  "mount: MapLibre's worker failed to load: a page opened as a file can't start it, so serve the page; a content security policy must allow it (worker-src); a worker URL must be right";

/** One per dispatcher, so tests can pass a fake, and two copies of maplibre-gl don't mix. */
const watches = new WeakMap<Dispatcher, WorkerWatch>();

/** What a page gets when the worker can't be watched: as if nothing ever failed. */
const UNWATCHED: WorkerWatch = { failure: () => undefined, whenFails: () => () => {} };

/**
 * Starts watching the page's worker, once per dispatcher, which starts the worker if none is.
 * maplibre-gl's global dispatcher holds the pool for the page's life, so a dead worker stays dead
 * and remembering it is right; and it hears a worker's failure whichever map came first, where a
 * later map's own dispatcher, subscribing too late, never does. Not being able to watch must not
 * cost a page its map.
 */
export function watchWorker(maplibre: MapLibre): WorkerWatch {
  try {
    const dispatcher = maplibre.getGlobalDispatcher();
    const watch = watches.get(dispatcher) ?? startWatching(dispatcher);
    watches.set(dispatcher, watch);
    return watch;
  } catch {
    return UNWATCHED;
  }
}

/**
 * Only a worker that has never answered has failed to load: MapLibre fires the same error for a
 * live worker's uncaught exception, which leaves working maps working.
 */
function startWatching(dispatcher: Dispatcher): WorkerWatch {
  let answered = false;
  let failure: MaplaceError | undefined;
  const waiting = new Set<(error: MaplaceError) => void>();
  const failed = (cause: unknown) => {
    if (answered || failure !== undefined) return;
    failure = new MaplaceError("provider-load-failed", WORKER_FAILURE, { cause });
    for (const heard of waiting) heard(failure);
    waiting.clear();
  };
  markFirstAnswer(
    dispatcher,
    () => {
      answered = true;
    },
    failed,
  );
  dispatcher.on("error", ({ error }) => failed(error));
  return {
    failure: () => failure,
    whenFails(heard) {
      waiting.add(heard);
      return () => waiting.delete(heard);
    },
  };
}

/**
 * Calls `answered` at the worker's first message: any map's first broadcast brings one. `getActor`
 * rejecting is `failed`: no worker could be made, and no `error` event will come. `getActor` and
 * `target` are in maplibre-gl's types, not its docs, and the peer range is a caret. Either missing
 * counts as answered: back to today's silence rather than failing working maps. The tests on a
 * real worker fail if an upgrade changes them.
 */
function markFirstAnswer(
  dispatcher: Dispatcher,
  answered: () => void,
  failed: (cause: unknown) => void,
): void {
  const actor = unlessItThrows(() => dispatcher.getActor());
  if (actor === undefined) {
    answered();
    return;
  }
  actor
    .then(({ target }) => target.addEventListener("message", answered, { once: true }), failed)
    .catch(answered);
}

/** What `call` returns, or undefined if calling it throws: a method a later version took out. */
function unlessItThrows<T>(call: () => T): T | undefined {
  try {
    return call();
  } catch {
    return undefined;
  }
}
