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
import { iconTemplateOf } from "./location-templates";
import { PendingSelection } from "./pending-selection";
import { SrcSource } from "./src-source";
import type { StandingMisuse } from "./standing-misuse";
import {
  checkStoreAttributes,
  readStoreAttributes,
  type StoreAttributes,
} from "./store-attributes";

/** What the store renders `html` through, as its `sanitize` option. */
export type Sanitize = NonNullable<MaplaceOptions["sanitize"]>;

/**
 * The element's store and what feeds it: the `locations` and `route` properties, or the
 * locations written inside the element, or the file its `src` names (fetched once the map opens
 * past `hold`), and the selection the page's address names. Values given before the store exists
 * wait for it, as a route given while a file loads waits for its locations.
 */
export class StoreFeed {
  readonly #host: HTMLElement;
  readonly #misuse: StandingMisuse;
  readonly #onStoreChange: () => void;
  #store: Maplace | undefined;
  /** What the store took from its attributes: `cluster`, the link switches, the labels, the view. */
  #attributes: StoreAttributes = {};
  /** Given before the store exists, or what the store was created with. */
  #sanitize: Sanitize | undefined;
  /** What waits for the store, and a route waiting for the file's locations too. */
  readonly #pending: { locations?: readonly Location[]; route?: Route | undefined } = {};
  #locationsGiven = false;
  readonly #pendingSelection: PendingSelection;
  #stopWatching: (() => void) | undefined;
  readonly #src: SrcSource;

  constructor(host: HTMLElement, misuse: StandingMisuse, onStoreChange: () => void) {
    this.#host = host;
    this.#misuse = misuse;
    this.#onStoreChange = onStoreChange;
    this.#pendingSelection = new PendingSelection(() => this.#store, misuse);
    this.#src = new SrcSource(host, misuse, (read) => this.#apply(read, this.#misuse.attempt));
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
    this.#src.stop();
    if (this.#store === undefined) this.#pending.locations = locations;
    else this.#apply(() => locations, this.#misuse.attempt);
  }

  /**
   * A route's stops are ids: one given before the file `src` names has loaded waits for its
   * locations, `src` read as it stands (a change in the same task not yet heard).
   */
  giveRoute(route: Route | undefined): void {
    const store = this.#store;
    this.#readSrc();
    if (store === undefined || this.#src.awaiting) this.#pending.route = route;
    else this.#misuse.attempt("route", () => store.setRoute(route));
  }

  /**
   * Selects `id` once the locations show it, winning over `selected-id` unless it names the same
   * location; an id they never show is dropped, silently, when something else is selected.
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

  /** The map opened past `hold`: the file `src` names may load from now on. */
  allowFileLoads(): void {
    this.#src.allowLoads();
  }

  /** The map closed: no file loads until it opens again. */
  holdFileLoads(): void {
    this.#src.holdLoads();
  }

  /**
   * A blank label, a bad switch or a bad view stands as misuse, as does a change once the store
   * took them.
   */
  checkAttributes(): void {
    checkStoreAttributes(this.#host, this.#attributes, this.#misuse);
  }

  /**
   * The store from `cluster`, the labels, the link switches, the view, the map's icon template and
   * `sanitize`, fixed for its life (a template added later changes nothing), then fed what waited
   * for it. It is listened to only then: the state the store starts from is no event, as an
   * <input value> is no change. A bad label, switch or view is said last, as a listener may read
   * the store.
   */
  #create(): Maplace {
    this.#attributes = readStoreAttributes(this.#host);
    const store = this.#createStore();
    this.#store = store;
    this.#feedPending();
    this.#listenTo(store);
    this.checkAttributes();
    return store;
  }

  /** A store always exists: one `sanitize` the store refuses is left out, standing as misuse. */
  #createStore(): Maplace {
    // The map's own <template data-icon>, built once: a Node the store copies for each marker.
    const options = { ...this.#attributes, markerIcon: iconTemplateOf(this.#host)?.() };
    const sanitize = this.#sanitize;
    if (sanitize === undefined) return createMaplace(options);
    const store = this.#misuse.attempt("sanitize", () => createMaplace({ ...options, sanitize }));
    if (store !== undefined) return store;
    this.#sanitize = undefined;
    return createMaplace(options);
  }

  /**
   * `selected-id`, then the locations so far through the same path as any later ones, then the
   * route.
   */
  #feedPending(): void {
    // A first view of the page's stands: `selected-id` selects without moving off it.
    this.#pendingSelection.fromAttribute(this.#host.getAttribute("selected-id") ?? undefined, {
      pan: this.#attributes.view === undefined,
    });
    const { locations } = this.#pending;
    delete this.#pending.locations;
    // Given locations are checked as given, whatever they are.
    if (this.#locationsGiven)
      this.#apply(() => locations as readonly Location[], this.#misuse.attempt);
    else this.#readSource();
    this.#giveWaitingRoute();
  }

  #listenTo(store: Maplace): void {
    forwardEvents(store, this.#host);
    store.on("selectionChange", () => this.#pendingSelection.drop());
    store.subscribe(this.#onStoreChange);
  }

  #readSource(): void {
    if (this.#locationsGiven) return;
    if (this.#host.hasAttribute("src")) {
      this.#readSrc();
    } else {
      this.#src.stop();
      // Read again on their own: only a new misuse of them is reported.
      this.#apply(() => readLocationSource(this.#host), this.#misuse.retry);
    }
  }

  /** Reads `src` once the store exists, unless the locations were given. */
  #readSrc(): void {
    if (this.#store !== undefined && !this.#locationsGiven && this.#host.hasAttribute("src")) {
      this.#src.read();
    }
  }

  /** The route given before the store or the file, if any: `undefined` given clears it. */
  #giveWaitingRoute(): void {
    if (!("route" in this.#pending)) return;
    const { route } = this.#pending;
    delete this.#pending.route;
    this.giveRoute(route);
  }

  /**
   * Gives the store the locations `read` returns, run as `run` says, then the selection and any
   * route waiting for them.
   */
  #apply(read: () => readonly Location[], run: StandingMisuse["attempt"]): void {
    const store = this.#store;
    if (store === undefined) return;
    const applied = run("data", () => {
      store.setLocations(read());
      return true;
    });
    if (applied) this.#pendingSelection.trySelect();
    this.#giveWaitingRoute();
  }
}
