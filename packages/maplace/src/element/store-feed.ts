import { createMaplace, type Location, type Maplace, type Route } from "../index";
import { elementMisuse } from "./element-error";
import { forwardEvents } from "./event-forwarding";
import { readLocationSource, watchLocationSource } from "./location-sources";
import type { StandingMisuse } from "./standing-misuse";

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
   * The store, created now if not yet, from `cluster` (fixed for its life), then given the
   * locations so far through the same path as any later ones, then `selected-id` and the route.
   */
  store(): Maplace {
    if (this.#store !== undefined) return this.#store;
    this.#clusters = this.#host.hasAttribute("cluster");
    const store = createMaplace({ cluster: this.#clusters });
    this.#store = store;
    this.#pendingSelection = this.#host.getAttribute("selected-id") ?? undefined;
    const { locations, route } = this.#pending;
    this.#pending = {};
    this.#apply(() => locations ?? readLocationSource(this.#host));
    if (route !== undefined) this.giveRoute(route);
    // Only now: the state the store starts from is no event, as an <input value> is no change.
    forwardEvents(store, this.#host);
    store.on("select", () => this.#selectionMade());
    store.subscribe(this.#onStoreChange);
    return store;
  }

  /** Locations from the property: from now on the element's children are not read. */
  giveLocations(locations: readonly Location[]): void {
    this.#locationsGiven = true;
    this.stopWatching();
    if (this.#store === undefined) this.#pending.locations = locations;
    else this.#apply(() => locations);
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

  #readSource(): void {
    if (!this.#locationsGiven) this.#apply(() => readLocationSource(this.#host));
  }

  /** Gives the store the locations `read` returns, then the selection waiting for them. */
  #apply(read: () => readonly Location[]): void {
    if (this.#setLocations(read)) this.#selectPending();
  }

  #setLocations(read: () => readonly Location[]): boolean {
    const store = this.#store;
    if (store === undefined) return false;
    return (
      this.#misuse.attempt("data", () => {
        store.setLocations(read());
        return true;
      }) === true
    );
  }

  #selectPending(): void {
    const store = this.#store;
    const id = this.#pendingSelection;
    if (store === undefined || id === undefined) return;
    const selected = this.#misuse.attempt("selection", () => {
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
