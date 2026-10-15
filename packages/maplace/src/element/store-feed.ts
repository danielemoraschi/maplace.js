import {
  createMaplace,
  type Location,
  type Maplace,
  type MaplaceOptions,
  type Route,
} from "../index";
import { elementMisuse } from "./element-error";
import { forwardEvents } from "./event-forwarding";
import { readLocationSource, watchLocationSource } from "./location-sources";
import type { StandingMisuse } from "./standing-misuse";

/** What the store renders `html` through, as its `sanitize` option. */
export type Sanitize = NonNullable<MaplaceOptions["sanitize"]>;

/**
 * The element's store and what feeds it: the `locations` and `route` properties, or the
 * locations written inside the element. Values given before the store exists wait for it.
 */
export class StoreFeed {
  readonly #host: HTMLElement;
  readonly #misuse: StandingMisuse;
  readonly #onStoreChange: () => void;
  #store: Maplace | undefined;
  #clusters = false;
  /** Given before the store exists, or what the store was created with. */
  #sanitize: Sanitize | undefined;
  #pending: { locations?: readonly Location[]; route?: Route | undefined } = {};
  #locationsGiven = false;
  /** `selected-id`, until the locations have it or something else is selected. */
  #pendingSelection: string | undefined;
  #stopWatching: (() => void) | undefined;

  constructor(host: HTMLElement, misuse: StandingMisuse, onStoreChange: () => void) {
    this.#host = host;
    this.#misuse = misuse;
    this.#onStoreChange = onStoreChange;
  }

  /** The store, if created yet. */
  get created(): Maplace | undefined {
    return this.#store;
  }

  /**
   * The store, created now if not yet, from `cluster` and `sanitize` (fixed for its life), then
   * given the locations so far through the same path as any later ones, then `selected-id` and
   * the route.
   */
  store(): Maplace {
    if (this.#store !== undefined) return this.#store;
    this.#clusters = this.#host.hasAttribute("cluster");
    const store = this.#createStore();
    this.#store = store;
    this.#pendingSelection = this.#host.getAttribute("selected-id") ?? undefined;
    const { locations, route } = this.#pending;
    this.#pending = {};
    // Given locations are checked as given, whatever they are.
    if (this.#locationsGiven)
      this.#apply(() => locations as readonly Location[], this.#misuse.attempt);
    else this.#readSource();
    if (route !== undefined) this.giveRoute(route);
    // Only now: the state the store starts from is no event, as an <input value> is no change.
    forwardEvents(store, this.#host);
    store.on("select", () => this.#selectionMade());
    store.subscribe(this.#onStoreChange);
    return store;
  }

  get sanitize(): Sanitize | undefined {
    return this.#sanitize;
  }

  /** `sanitize` from the property: taken until the store exists, misuse once it does. */
  giveSanitize(sanitize: Sanitize | undefined): void {
    if (this.#store === undefined) this.#sanitize = sanitize;
    else if (sanitize === this.#sanitize) this.#misuse.clear("sanitize");
    else {
      const problem = "sanitize can't change once the map is created";
      this.#misuse.fail("sanitize", elementMisuse(problem, { field: "sanitize" }));
    }
  }

  /** Locations from the property: from now on the element's children are not read. */
  giveLocations(locations: readonly Location[]): void {
    this.#locationsGiven = true;
    this.stopWatching();
    if (this.#store === undefined) this.#pending.locations = locations;
    else this.#apply(() => locations, this.#misuse.attempt);
  }

  giveRoute(route: Route | undefined): void {
    const store = this.#store;
    if (store === undefined) this.#pending.route = route;
    else this.#misuse.attempt("route", () => store.setRoute(route));
  }

  /**
   * Reads the locations inside the element again whenever they change, unless given; and now,
   * for what changed while nothing watched (the element disconnected, its store already made).
   */
  watch(): void {
    if (this.#locationsGiven || this.#stopWatching !== undefined) return;
    this.#stopWatching = watchLocationSource(this.#host, () => this.#readSource());
    this.#readSource();
  }

  stopWatching(): void {
    this.#stopWatching?.();
    this.#stopWatching = undefined;
  }

  /** `cluster` changed: misuse, unless it is back to what the store was created with. */
  checkClusterUnchanged(): void {
    if (this.#host.hasAttribute("cluster") === this.#clusters) this.#misuse.clear("store");
    else this.#misuse.fail("store", elementMisuse("cluster can't change once the map is created"));
  }

  /** A store always exists: one `sanitize` the store refuses is left out, standing as misuse. */
  #createStore(): Maplace {
    const cluster = this.#clusters;
    const sanitize = this.#sanitize;
    if (sanitize === undefined) return createMaplace({ cluster });
    const store = this.#misuse.attempt("sanitize", () => createMaplace({ cluster, sanitize }));
    if (store !== undefined) return store;
    this.#sanitize = undefined;
    return createMaplace({ cluster });
  }

  #readSource(): void {
    // Read again on their own: only a new misuse of them is reported.
    if (!this.#locationsGiven)
      this.#apply(() => readLocationSource(this.#host), this.#misuse.retry);
  }

  /** Gives the store the locations `read` returns, run as `run` says, then the selection waiting. */
  #apply(read: () => readonly Location[], run: StandingMisuse["attempt"]): void {
    const store = this.#store;
    if (store === undefined) return;
    const applied = run("data", () => {
      store.setLocations(read());
      return true;
    });
    if (applied) this.#selectPending();
  }

  #selectPending(): void {
    const store = this.#store;
    const id = this.#pendingSelection;
    if (store === undefined || id === undefined) return;
    const selected = this.#misuse.retry("selection", () => {
      store.select(id);
      return true;
    });
    if (selected) this.#pendingSelection = undefined;
  }

  #selectionMade(): void {
    this.#pendingSelection = undefined;
    this.#misuse.clear("selection");
  }
}
