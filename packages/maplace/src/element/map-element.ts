import type { LoadState, Location, Maplace, Route } from "../index";
import { afterParsing } from "./after-parsing";
import { adoptDefaultStyles, PANE_CLASS } from "./default-styles";
import { type ElementList, LIST_ATTRIBUTES, listFromAttributes } from "./element-list";
import type { MaplaceMapElement } from "./index";
import { showLoadState } from "./load-state";
import { type MapSession, openSession } from "./map-session";
import { createSetupRetry } from "./setup-retry";
import { createStandingMisuse } from "./standing-misuse";
import { StoreFeed } from "./store-feed";
import { MAPLACE_VERSION } from "./version";

/**
 * `<maplace-map>`: a store that lives as long as the element, its list, and a map from the
 * provider while the element is connected and not held.
 */
export class MaplaceMap extends HTMLElement implements MaplaceMapElement {
  static readonly maplaceVersion = MAPLACE_VERSION;
  static readonly observedAttributes = [...LIST_ATTRIBUTES, "provider", "cluster"];

  readonly #internals = this.attachInternals();
  readonly #misuse = createStandingMisuse(this, () => this.#showLoadState());
  readonly #pane = paneIn(this.ownerDocument);
  readonly #setupRetry = createSetupRetry(this, () => this.#start());
  readonly #ownNodesWatch = new MutationObserver(() => this.#keepOwnNodes());
  readonly #feed = new StoreFeed(this, this.#misuse, () => this.#showLoadState());
  #list: ElementList | undefined;
  #listRebuildQueued = false;
  #session: MapSession | undefined;
  #shownState: LoadState = "idle";
  #released = false;

  constructor() {
    super();
    reapplyOwnProperties(this);
    showLoadState(this.#internals, "idle");
  }

  get maplace(): Maplace {
    return this.#feed.store();
  }

  get loadState(): LoadState {
    if (this.#misuse.stands()) return "error";
    return this.#feed.created?.getSnapshot().loadState ?? "idle";
  }

  get locations(): readonly Location[] {
    return this.maplace.getSnapshot().locations;
  }

  set locations(locations: readonly Location[]) {
    this.#feed.giveLocations(locations);
  }

  get route(): Route | undefined {
    return this.maplace.getSnapshot().route;
  }

  set route(route: Route | undefined) {
    this.#feed.giveRoute(route);
  }

  connectedCallback(): void {
    adoptDefaultStyles(this.ownerDocument);
    this.#keepOwnNodes();
    this.#ownNodesWatch.observe(this, { childList: true });
    this.#feed.watch();
    afterParsing(this.ownerDocument, () => this.#open());
  }

  disconnectedCallback(): void {
    // A move (React reordering, an append elsewhere) disconnects and connects in one task: the
    // map stays through it.
    queueMicrotask(() => {
      if (!this.isConnected) this.#stop();
    });
  }

  attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
    const store = this.#feed.created;
    if (previous === value || store === undefined) return;
    if (name === "cluster") this.#feed.checkClusterUnchanged();
    else if (name === "provider") this.#restart();
    else this.#queueListRebuild(store);
  }

  release(): void {
    this.#released = true;
    this.#open();
  }

  /** Creates the store and its list, and opens the map unless held. */
  #open(): void {
    if (!this.isConnected) return;
    const store = this.#feed.store();
    this.#list ??= this.#listFor(store);
    this.#start();
  }

  #isHeld(): boolean {
    return this.hasAttribute("hold") && !this.#released;
  }

  #start(): void {
    if (!this.isConnected || this.#isHeld() || this.#session !== undefined) return;
    const parts = { store: this.#feed.store(), pane: this.#pane, list: this.#list };
    this.#session = this.#misuse.retry("setup", () => openSession(this, parts));
    if (this.#session === undefined) this.#setupRetry.wait();
    else this.#setupRetry.stop();
  }

  #stop(): void {
    this.#closeSession();
    this.#setupRetry.stop();
    this.#ownNodesWatch.disconnect();
    this.#feed.stopWatching();
  }

  /** The page may replace the element's children, rendering its locations: the map and list stay. */
  #keepOwnNodes(): void {
    if (this.#pane.parentNode !== this) this.prepend(this.#pane);
    this.#list?.restore();
  }

  #restart(): void {
    this.#closeSession();
    this.#start();
  }

  #closeSession(): void {
    this.#session?.close();
    this.#session = undefined;
  }

  #listFor(store: Maplace): ElementList | undefined {
    return this.#misuse.attempt("list", () => listFromAttributes(this, store));
  }

  /** One rebuild for the list attributes a page sets together. */
  #queueListRebuild(store: Maplace): void {
    if (this.#listRebuildQueued) return;
    this.#listRebuildQueued = true;
    queueMicrotask(() => {
      this.#listRebuildQueued = false;
      this.#list?.destroy();
      this.#list = this.#listFor(store);
      this.#session?.showList(this.#list);
    });
  }

  #showLoadState(): void {
    const state = this.loadState;
    if (state === this.#shownState) return;
    this.#shownState = state;
    showLoadState(this.#internals, state);
  }
}

function paneIn(document: Document): HTMLElement {
  const pane = document.createElement("div");
  pane.className = PANE_CLASS;
  return pane;
}

/**
 * Properties a page set before the element was defined are own properties hiding the class's
 * setters: they go through the setters now.
 */
function reapplyOwnProperties(element: MaplaceMap): void {
  const properties = element as unknown as Record<string, unknown>;
  for (const name of ["locations", "route"]) {
    if (Object.getOwnPropertyDescriptor(element, name) === undefined) continue;
    const value = properties[name];
    delete properties[name];
    properties[name] = value;
  }
}
