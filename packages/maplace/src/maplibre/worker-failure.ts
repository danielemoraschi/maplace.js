import { MaplaceError } from "../errors";
import type { MapLibre } from "./library";

type Dispatcher = ReturnType<MapLibre["getGlobalDispatcher"]>;

/** What is known of maplibre-gl's workers, which every MapLibre map on the page shares. */
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
 * Starts watching the page's workers, once per dispatcher. maplibre-gl's global dispatcher lasts as
 * long as the page and hears a worker's failure whichever map came first, where a later map's own
 * dispatcher, subscribing too late, never does. Since 6.16 the workers stop with the last map and
 * come back with the next, so each set gets a hello of its own; a set that couldn't load fails the
 * page's maps for good, as the next would load the same way. The hello starts the workers if none
 * run: when a mount throws before its map exists, nobody claims them and they last as long as the
 * page, as on 6.15. Not being able to watch must not cost a page its map.
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
 * Only workers that have never answered their hello have failed to load: MapLibre fires the same
 * error for a live worker's uncaught exception, which leaves working maps working.
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
  const greetWorkers = () => {
    answered = false;
    sayHello(
      dispatcher,
      () => {
        answered = true;
      },
      failed,
    );
  };
  greetWorkers();
  dispatcher.on("workerscreate", greetWorkers);
  dispatcher.on("error", ({ error }) => failed(error));
  return {
    failure: () => failure,
    whenFails(heard) {
      waiting.add(heard);
      return () => waiting.delete(heard);
    },
  };
}

/** A message no worker has a handler for: a worker answers it with nothing, proving it loaded. */
const HELLO = "maplace:hello";

/**
 * Says hello to the workers, calling `answered` when they answer. A rejected hello is `failed`: no
 * worker could be made, and no `error` event will come. Workers stopped before they answered (6.16
 * stops them with the page's last map) failed at nothing: the next ones get a hello of their own.
 */
function sayHello(dispatcher: Dispatcher, answered: () => void, failed: (cause: unknown) => void) {
  dispatcher.broadcast(HELLO, undefined).then(answered, (cause: unknown) => {
    if (!isAbort(cause)) failed(cause);
  });
}

/** The workers were stopped before they answered: the page removed its last map. */
function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === "AbortError";
}
