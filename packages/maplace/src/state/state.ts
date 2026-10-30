import type { MaplaceOptions } from "../options";
import type { Maplace } from "../store";
import { child, root } from "../validate/fail";
import { checkFunction } from "../validate/values";
import type { Change } from "./change";
import { type CommitHooks, createCore } from "./core";
import { destroyedError } from "./destroyed";
import { setFilter } from "./filter";
import { hover } from "./hover";
import { initialSnapshot } from "./initial";
import { setLocations } from "./locations";
import { setRoute } from "./route";
import { select } from "./selection";
import { fitAll, fitBounds, setView } from "./views";

/** The store without a map: everything but `attach` and `whenReady`. */
export type MaplaceState<Data = unknown> = Omit<Maplace<Data>, "attach" | "whenReady">;

/** The public state, beside what `createMaplace` builds on; the latter never reaches users. */
export interface InternalState<Data = unknown> {
  readonly store: MaplaceState<Data>;
  /** Commits a change the store decided itself (load state, a report from the map). */
  commitOwn(change: Change<Data>): void;
  /** Throws `destroyed` after `destroy`. */
  checkNotDestroyed(method: string): void;
  setHooks(hooks: CommitHooks<Data>): void;
}

/**
 * The headless store alone, without a map. Each call validates, computes a change, then commits it: a new frozen
 * snapshot, one notification to subscribers, then the change's events.
 */
export function createState<Data = unknown>(options?: MaplaceOptions<Data>): MaplaceState<Data> {
  return createInternalState(options).store;
}

export function createInternalState<Data = unknown>(
  options?: MaplaceOptions<Data>,
): InternalState<Data> {
  const core = createCore(initialSnapshot(options));
  const { subscribers, emitter, getSnapshot } = core;
  const context = { sanitize: options?.sanitize };
  let destroyed = false;

  function checkNotDestroyed(method: string): void {
    if (destroyed) throw destroyedError(method);
  }

  function run(method: string, operation: () => Change<Data>): void {
    checkNotDestroyed(method);
    core.commit(method, operation());
  }

  const store: MaplaceState<Data> = {
    subscribe(onChange) {
      checkNotDestroyed("subscribe");
      checkFunction(onChange, child(root("subscribe"), "onChange"));
      return subscribers.add(onChange);
    },
    getSnapshot,
    setLocations: (locations) =>
      run("setLocations", () => setLocations(getSnapshot(), locations, context)),
    select: (id, selectOptions) => run("select", () => select(getSnapshot(), id, selectOptions)),
    hover: (id) => run("hover", () => hover(getSnapshot(), id)),
    setFilter: (filter) => run("setFilter", () => setFilter(getSnapshot(), filter)),
    fitAll: (fitOptions) => run("fitAll", () => fitAll(fitOptions)),
    fitBounds: (bounds, fitOptions) => run("fitBounds", () => fitBounds(bounds, fitOptions)),
    setView: (center, zoom) => run("setView", () => setView(center, zoom)),
    setRoute: (route) => run("setRoute", () => setRoute(getSnapshot(), route)),
    on(event, listener, listenOptions) {
      checkNotDestroyed("on");
      return emitter.on(event, listener, listenOptions);
    },
    // Idempotent, and getSnapshot and unsubscribe functions keep working: cleanups (React's
    // double effects, late unmounts) must never throw.
    destroy() {
      destroyed = true;
      subscribers.clear();
      emitter.clear();
    },
  };
  return { store, commitOwn: core.commitOwn, checkNotDestroyed, setHooks: core.setHooks };
}
