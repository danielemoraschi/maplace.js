import { createMaplace, type Location, type Maplace, type Route } from "../index";
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
import { StoreProperties } from "./store-properties";

/**
 * The element's store and what feeds it: the `locations` and `route` properties, or the
 * locations written inside the element, or the file its `src` names (fetched once the map opens
 * past `hold`), and the selection the page's address names. Values given before the store exists
 * wait for it, as a route given while a file loads waits for its locations, through a failed or
 * refused one.
 */
export class StoreFeed {
  readonly #host: HTMLElement;
  readonly #misuse: StandingMisuse;
  readonly #onStoreChange: () => void;
  #store: Maplace | undefined;
  /** What the store took from its attributes: `cluster`, the link switches, the labels, the view. */
  #attributes: StoreAttributes | undefined;
  readonly properties: StoreProperties;
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
    this.properties = new StoreProperties(misuse);
    this.#src = new SrcSource(host, misuse, (read) => this.#applyFile(read));
  }

  /** The store, if created yet. */
  get created(): Maplace | undefined {
    return this.#store;
  }

  /** The store, created on first use. */
  store(): Maplace {
    return this.#store ?? this.#create();
  }

  /** Locations from the property: from now on the element's children are not read. */
  giveLocations(locations: readonly Location[]): void {
    this.#locationsGiven = true;
    this.stopWatching();
    this.#src.stop();
    if (this.#store === undefined) {
      this.#pending.locations = locations;
    } else {
      this.#apply(() => locations, this.#misuse.attempt);
      this.#giveWaitingRoute();
    }
  }

  /**
   * A route's stops are ids: one given before the locations of the file `src` names are in waits
   * for them, through a file that failed or was refused, `src` checked as it stands (a change in
   * the same task not yet heard), its file loaded only once the watch hears it.
   */
  giveRoute(route: Route | undefined): void {
    const store = this.#store;
    if (store !== undefined && this.#readsSrc()) this.#src.check();
    if (store === undefined || this.#src.awaiting) this.#pending.route = route;
    else this.#misuse.attempt("route", () => store.setRoute(route));
  }

  /**
   * Selects `id` once the locations show it, winning over `selected-id` unless it names the same
   * location; an id they never show is dropped, silently, when something else is selected. No id,
   * nothing from the address waits.
   */
  selectOnceShown(id: string | undefined): void {
    this.#pendingSelection.fromAddress(id);
    this.#pendingSelection.trySelect();
  }

  /**
   * Reads the locations inside the element again whenever they change, unless given; and now,
   * for what changed while nothing watched (the element disconnected, its store already made).
   */
  watch(): void {
    if (this.#locationsGiven || this.#stopWatching !== undefined) return;
    this.#stopWatching = watchLocationSource(this.#host, () => this.#sourceChanged());
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

  /** The map closed: a load in flight is dropped, and none starts until it opens again. */
  holdFileLoads(): void {
    this.#src.holdLoads();
  }

  /** The store's attributes, checked again: only a new misuse is said. */
  recheckAttributes(): void {
    checkStoreAttributes(this.#host, this.#attributes, this.#misuse.retry);
  }

  /** A store attribute changed: once the store took them, any change is misuse, said each time. */
  attributeChanged(): void {
    const run = this.#attributes === undefined ? this.#misuse.retry : this.#misuse.attempt;
    checkStoreAttributes(this.#host, this.#attributes, run);
  }

  /**
   * The store from `cluster`, the labels, the link switches, the view, the map's icon template and
   * the `sanitize` and `markerIcon` properties (over the template), fixed for its life (a template
   * added later changes nothing), then fed what waited for it. It is listened to only then: the
   * state the store starts from is no event, as an <input value> is no change. A refused property
   * and a bad label, switch or view are said last, as a listener may read the store: a refused
   * property is left out, so a store always exists.
   */
  #create(): Maplace {
    const attributes = readStoreAttributes(this.#host);
    const { options, refused } = this.properties.take();
    // The map's own <template data-icon>, built once: a Node the store copies for each marker.
    const markerIcon = options.markerIcon ?? iconTemplateOf(this.#host)?.();
    const store = createMaplace({ ...attributes, ...options, markerIcon });
    this.#store = store;
    this.#attributes = attributes;
    this.#feedPending(attributes);
    this.#listenTo(store);
    for (const [name, error] of refused) this.#misuse.fail(name, error);
    // A held map's were said at open: only a new misuse is said.
    this.recheckAttributes();
    return store;
  }

  /**
   * `selected-id`, then the locations so far through the same path as any later ones, then the
   * route.
   */
  #feedPending({ view }: StoreAttributes): void {
    // A first view of the page's stands: `selected-id` selects without moving off it.
    this.#pendingSelection.fromAttribute(this.#host.getAttribute("selected-id") ?? undefined, {
      pan: view === undefined,
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

  /** `src` or the element's inside changed: a file refused is fetched again. */
  #sourceChanged(): void {
    this.#src.forgetRefused();
    this.#readSource();
  }

  #readSource(): void {
    if (this.#locationsGiven) return;
    if (this.#host.hasAttribute("src")) {
      if (this.#store !== undefined) this.#src.read();
    } else {
      this.#src.stop();
      // Read again on their own: only a new misuse of them is reported.
      this.#apply(() => readLocationSource(this.#host), this.#misuse.retry);
      this.#giveWaitingRoute();
    }
  }

  /** Whether the locations come from `src`: none were given. */
  #readsSrc(): boolean {
    return !this.#locationsGiven && this.#host.hasAttribute("src");
  }

  /** The route given before the store or the file, if any: `undefined` given clears it. */
  #giveWaitingRoute(): void {
    if (!("route" in this.#pending)) return;
    const { route } = this.#pending;
    delete this.#pending.route;
    this.giveRoute(route);
  }

  /** A file's locations: a route waiting for them is given only once they are taken. */
  #applyFile(read: () => readonly Location[]): boolean {
    const taken = this.#apply(read, this.#misuse.attempt);
    if (taken) this.#giveWaitingRoute();
    return taken;
  }

  /**
   * Gives the store the locations `read` returns, run as `run` says, then the selection; returns
   * whether the store took them.
   */
  #apply(read: () => readonly Location[], run: StandingMisuse["attempt"]): boolean {
    const store = this.#store;
    if (store === undefined) return false;
    const applied =
      run("data", () => {
        store.setLocations(read());
        return true;
      }) ?? false;
    if (applied) this.#pendingSelection.trySelect();
    return applied;
  }
}
