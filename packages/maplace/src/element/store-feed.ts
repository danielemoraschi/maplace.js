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
import { PendingSelection } from "./pending-selection";
import type { StandingMisuse } from "./standing-misuse";
import { checkStoreLabels, readStoreLabels, type StoreLabels } from "./store-labels";

/** What the store renders `html` through, as its `sanitize` option. */
export type Sanitize = NonNullable<MaplaceOptions["sanitize"]>;

/**
 * The element's store and what feeds it: the `locations` and `route` properties, or the
 * locations written inside the element, and the selection the page's address names. Values given
 * before the store exists wait for it.
 */
export class StoreFeed {
  readonly #host: HTMLElement;
  readonly #misuse: StandingMisuse;
  readonly #onStoreChange: () => void;
  #store: Maplace | undefined;
  #clusters = false;
  /** What the store took from the label attributes. */
  #labels: StoreLabels = {};
  /** Given before the store exists, or what the store was created with. */
  #sanitize: Sanitize | undefined;
  #pending: { locations?: readonly Location[]; route?: Route | undefined } = {};
  #locationsGiven = false;
  readonly #pendingSelection: PendingSelection;
  #stopWatching: (() => void) | undefined;

  constructor(host: HTMLElement, misuse: StandingMisuse, onStoreChange: () => void) {
    this.#host = host;
    this.#misuse = misuse;
    this.#onStoreChange = onStoreChange;
    this.#pendingSelection = new PendingSelection(() => this.#store, misuse);
  }

  /** The store, if created yet. */
  get created(): Maplace | undefined {
    return this.#store;
  }

  /** The store, created on first use. */
  store(): Maplace {
    return this.#store ?? this.#create();
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
   * Selects `id` once the locations show it, winning over `selected-id`; an id they never show is
   * dropped, silently, when something else is selected.
   */
  selectOnceShown(id: string): void {
    this.#pendingSelection.fromAddress(id);
    this.#pendingSelection.trySelect();
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
    if (this.#host.hasAttribute("cluster") === this.#clusters) this.#misuse.clear("cluster");
    else {
      const problem = "cluster can't change once the map is created";
      this.#misuse.fail("cluster", elementMisuse(problem));
    }
  }

  /** A blank label stands as misuse, as does a change once the store has taken them. */
  checkLabels(): void {
    checkStoreLabels(this.#host, this.#labels, this.#misuse);
  }

  /**
   * The store from `cluster`, the labels and `sanitize`, fixed for its life, then fed what waited
   * for it. It is listened to only then: the state the store starts from is no event, as an
   * <input value> is no change. A bad label is said last, as a listener may read the store.
   */
  #create(): Maplace {
    this.#clusters = this.#host.hasAttribute("cluster");
    this.#labels = readStoreLabels(this.#host);
    const store = this.#createStore();
    this.#store = store;
    this.#feedPending();
    this.#listenTo(store);
    this.checkLabels();
    return store;
  }

  /** A store always exists: one `sanitize` the store refuses is left out, standing as misuse. */
  #createStore(): Maplace {
    const fixed = { cluster: this.#clusters, ...this.#labels };
    const sanitize = this.#sanitize;
    if (sanitize === undefined) return createMaplace(fixed);
    const store = this.#misuse.attempt("sanitize", () => createMaplace({ ...fixed, sanitize }));
    if (store !== undefined) return store;
    this.#sanitize = undefined;
    return createMaplace(fixed);
  }

  /**
   * `selected-id`, then the locations so far through the same path as any later ones, then the
   * route.
   */
  #feedPending(): void {
    this.#pendingSelection.fromAttribute(this.#host.getAttribute("selected-id") ?? undefined);
    const { locations, route } = this.#pending;
    this.#pending = {};
    // Given locations are checked as given, whatever they are.
    if (this.#locationsGiven)
      this.#apply(() => locations as readonly Location[], this.#misuse.attempt);
    else this.#readSource();
    if (route !== undefined) this.giveRoute(route);
  }

  #listenTo(store: Maplace): void {
    forwardEvents(store, this.#host);
    store.on("selectionChange", () => this.#pendingSelection.drop());
    store.subscribe(this.#onStoreChange);
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
    if (applied) this.#pendingSelection.trySelect();
  }
}
