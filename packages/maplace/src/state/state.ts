import type { MaplaceOptions } from "../options";
import type { Maplace } from "../store";
import { child, reject, root } from "../validate/fail";
import { checkFunction } from "../validate/values";
import { type Change, changesAnything, withPatch } from "./change";
import { createEmitter } from "./emitter";
import { setFilter } from "./filter";
import { initialSnapshot } from "./initial";
import { createListeners } from "./listeners";
import { setLocations } from "./locations";
import { setRoute } from "./route";
import { select } from "./selection";
import { fitAll, fitBounds, setView } from "./views";

/** The store without a map: everything but `attach` and `whenReady`. */
export type MaplaceState<Data = unknown> = Omit<Maplace<Data>, "attach" | "whenReady">;

/**
 * A headless store. Each call validates, computes a change, then commits it: a new frozen
 * snapshot, one notification to subscribers, then the change's events.
 */
export function createState<Data = unknown>(options?: MaplaceOptions<Data>): MaplaceState<Data> {
  let snapshot = initialSnapshot(options);
  let destroyed = false;
  const context = { sanitize: options?.sanitize };
  const subscribers = createListeners<void>();
  const emitter = createEmitter<Data>();
  // Deliveries wait their turn: a call made by a listener commits at once, but its notification
  // and events follow those of the change being delivered, so every listener sees them in order.
  const deliveries: (() => void)[] = [];
  let delivering = false;

  function checkNotDestroyed(method: string): void {
    if (destroyed) reject(root(method), "this maplace was destroyed", "destroyed");
  }

  function run(method: string, operation: () => Change<Data>): void {
    checkNotDestroyed(method);
    const change = operation();
    if (changesAnything(snapshot, change.patch)) {
      snapshot = withPatch(snapshot, change.patch);
      deliveries.push(() => subscribers.notify(undefined));
    }
    for (const event of change.events) deliveries.push(() => emitter.emit(event));
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
    subscribe(onChange) {
      checkNotDestroyed("subscribe");
      checkFunction(onChange, child(root("subscribe"), "onChange"));
      return subscribers.add(onChange);
    },
    getSnapshot: () => snapshot,
    setLocations: (locations) =>
      run("setLocations", () => setLocations(snapshot, locations, context)),
    select: (id, selectOptions) => run("select", () => select(snapshot, id, selectOptions)),
    setFilter: (groups) => run("setFilter", () => setFilter(snapshot, groups)),
    fitAll: (fitOptions) => run("fitAll", () => fitAll(fitOptions)),
    fitBounds: (bounds, fitOptions) => run("fitBounds", () => fitBounds(bounds, fitOptions)),
    setView: (center, zoom) => run("setView", () => setView(center, zoom)),
    setRoute: (route) => run("setRoute", () => setRoute(snapshot, route)),
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
}
