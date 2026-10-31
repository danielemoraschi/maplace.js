import type { LoadState, Location, Maplace, Route } from "../index";
import { afterParsing } from "./after-parsing";
import { type CameraKeeper, createCameraKeeper } from "./camera-keeper";
import { adoptDefaultStyles, PANE_CLASS } from "./default-styles";
import { isListAttribute, LIST_ATTRIBUTES } from "./element-list";
import type { MaplaceMapElement } from "./index";
import { createListKeeper, type ListKeeper } from "./list-keeper";
import { showLoadState } from "./load-state";
import { type MapSession, openSession } from "./map-session";
import { createMapSettingsWatch } from "./map-settings-watch";
import { createNearViewWait } from "./near-view";
import { reapplyOwnProperties } from "./own-properties";
import { createSetupRetry } from "./setup-retry";
import { createStandingMisuse } from "./standing-misuse";
import { type Sanitize, StoreFeed } from "./store-feed";
import { isStoreLabelAttribute, LABEL_ATTRIBUTES } from "./store-labels";
import { createUrlState } from "./url-state";
import { MAPLACE_VERSION } from "./version";

/**
 * `<maplace-map>`: a store that lives as long as the element, and its list and a map from the
 * provider while the element is connected and not held.
 */
export class MaplaceMap extends HTMLElement implements MaplaceMapElement {
  static readonly maplaceVersion = MAPLACE_VERSION;
  static readonly observedAttributes = [
    ...LIST_ATTRIBUTES,
    "provider",
    "cluster",
    ...LABEL_ATTRIBUTES,
  ];

  readonly #internals = this.attachInternals();
  readonly #misuse = createStandingMisuse(this, () => this.#showLoadState());
  readonly #pane = paneIn(this.ownerDocument);
  readonly #setupRetry = createSetupRetry(this, () => this.#openSession());
  readonly #settingsWatch = createMapSettingsWatch(this, () => this.#reopenAtCamera());
  readonly #ownNodesWatch = new MutationObserver(() => this.#keepOwnNodes());
  readonly #nearView = createNearViewWait(this, () => this.#openSession());
  readonly #feed = new StoreFeed(this, this.#misuse, () => this.#showLoadState());
  readonly #urlState = createUrlState(this, this.#feed);
  #lists: ListKeeper | undefined;
  #camera: CameraKeeper | undefined;
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

  get sanitize(): Sanitize | undefined {
    return this.#feed.sanitize;
  }

  set sanitize(sanitize: Sanitize | undefined) {
    this.#feed.giveSanitize(sanitize);
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
    this.#urlState.start();
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
    if (previous === value || this.#feed.created === undefined) return;
    if (name === "cluster") this.#feed.checkClusterUnchanged();
    else if (isStoreLabelAttribute(name)) this.#feed.checkLabels();
    else if (name === "provider") this.#reopenSession();
    else if (isListAttribute(name)) this.#lists?.rebuildSoon();
  }

  release(): void {
    this.#released = true;
    this.#nearView.stop();
    this.#open();
  }

  /**
   * Creates the store, then, unless held, its list and the map: a held page's scripts, and the
   * list views they define, may run only on release.
   */
  #open(): void {
    if (!this.isConnected) return;
    const store = this.#feed.store();
    if (this.#isHeld()) return;
    this.#lists ??= createListKeeper(this, {
      store,
      misuse: this.#misuse,
      show: (list) => this.#session?.showList(list),
    });
    this.#lists.open();
    this.#camera ??= createCameraKeeper(store);
    if (!this.#released && this.#session === undefined) this.#nearView.start();
    this.#openSession();
  }

  #isHeld(): boolean {
    return this.hasAttribute("hold") && !this.#released;
  }

  #openSession(): void {
    if (!this.isConnected || this.#isHeld() || this.#nearView.waiting) return;
    if (this.#session !== undefined) return;
    const parts = { store: this.#feed.store(), pane: this.#pane, list: this.#lists?.list };
    // Before attaching: an adapter may report where it opened while it mounts.
    this.#camera?.opening();
    this.#session = this.#misuse.retry("setup", () => openSession(this, parts));
    if (this.#session === undefined) {
      this.#setupRetry.wait();
    } else {
      this.#setupRetry.stop();
      this.#settingsWatch.start(this.#session.mapSettings);
    }
  }

  #stop(): void {
    this.#closeSession();
    this.#setupRetry.stop();
    this.#nearView.stop();
    this.#lists?.stop();
    this.#ownNodesWatch.disconnect();
    this.#feed.stopWatching();
    this.#urlState.stop();
  }

  /** The page may replace the element's children, rendering its locations: the map and list stay. */
  #keepOwnNodes(): void {
    if (this.#pane.parentNode !== this) this.prepend(this.#pane);
    this.#lists?.restore();
  }

  #reopenSession(): void {
    this.#closeSession();
    this.#openSession();
  }

  /** Opens the map again for new map settings, where the map was: the store keeps the rest. */
  #reopenAtCamera(): void {
    this.#camera?.keep();
    this.#reopenSession();
  }

  #closeSession(): void {
    this.#settingsWatch.stop();
    this.#session?.close();
    this.#session = undefined;
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
