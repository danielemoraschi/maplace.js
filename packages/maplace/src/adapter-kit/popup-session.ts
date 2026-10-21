import type { AdapterHost, PresentationState } from "../adapter";
import type { Geometry } from "../geometry";
import type { ResolvedPopupOptions } from "../popup";
import { createPopupChoice } from "./popup-choice";
import { type PopupStep, popupContent, popupStep } from "./popup-content";
import type { PopupTarget, PopupWindow, PopupWindowEvents, SessionPopup } from "./popup-window";

/** The open map as the popup session sees it. */
export interface PopupSessionSite<Place, Window extends PopupWindow<Place>> {
  presented(): PresentationState;
  placedOf(id: string): PopupTarget<Place> | undefined;
  openWindow(events: PopupWindowEvents): Window;
  readonly document: Document;
  readonly openOn: ResolvedPopupOptions["openOn"];
  live(): AdapterHost | undefined;
  /**
   * The popup the session tracks now (its content perhaps not yet in the DOM), or none: the live
   * object, whose `shown` a probe watches.
   */
  onTracked(popup: SessionPopup<Window> | undefined): void;
}

/** The popup on one open map. */
export interface PopupSession {
  /** Brings the popup in step with what is placed and presented. */
  sync(): void;
  /** The map closed: the window goes, and nothing more is reported. */
  end(): void;
}

/** The open popup, the placed location it shows, the geometry it last pointed at and its heading. */
interface OpenPopup<Place, Window> extends SessionPopup<Window> {
  readonly placed: PopupTarget<Place>;
  followed: Geometry;
  heading: string | undefined;
}

/**
 * One popup at a time, following the selection (or the hover). It opens once the location is
 * placed, and each step is the one every map takes (`popupStep`). Every close the store hears
 * pairs with an open it heard: `popupOpen` waits for the window's content to be in the DOM.
 */
export function startPopupSession<Place, Window extends PopupWindow<Place>>(
  site: PopupSessionSite<Place, Window>,
): PopupSession {
  const choice = createPopupChoice(site.openOn);
  const window = site.openWindow({ contentShown, closedByUser });
  let open: OpenPopup<Place, Window> | undefined;
  /** The location whose `popupOpen` the store heard, until it hears the close. */
  let announced: string | undefined;

  function sync(): void {
    const placed = wantedLocation();
    const step = stepTo(placed);
    if (open === undefined || placed === undefined || step === "replace") replace(placed);
    else if (step === "reopen") reopen(placed);
    else {
      retitle(open, placed);
      if (step === "refresh") refresh(placed);
      else follow(open, placed);
    }
  }

  function wantedLocation(): PopupTarget<Place> | undefined {
    const id = choice.wanted(site.presented());
    return id === undefined ? undefined : site.placedOf(id);
  }

  /** Every map's step, and one more: a location placed anew under its id moves the popup. */
  function stepTo(placed: PopupTarget<Place> | undefined): PopupStep | "reopen" {
    const step = popupStep(open, placed?.drawable());
    return step !== "replace" && placed !== open?.placed ? "reopen" : step;
  }

  /** Placed anew under its id, as after a type change: still open, on the new one. */
  function reopen(placed: PopupTarget<Place>): void {
    const next = render(placed);
    if (next === undefined) close();
    else show(next);
  }

  /** A shape's popup moves with its centre after an edit; an unchanged geometry costs nothing. */
  function follow(current: OpenPopup<Place, Window>, placed: PopupTarget<Place>): void {
    const { geometry } = placed.drawable();
    if (geometry === current.followed) return;
    current.followed = geometry;
    window.follow(placed.popupPlace());
  }

  /** A new title alone heads and names the popup anew: its content stays, unreported. */
  function retitle(current: OpenPopup<Place, Window>, placed: PopupTarget<Place>): void {
    const { title } = placed.drawable();
    if (title === current.heading) return;
    current.heading = title;
    window.retitle(title);
  }

  /** New content where the popup is: the window reports it in the DOM again. */
  function refresh(placed: PopupTarget<Place>): void {
    const next = render(placed);
    if (next === undefined) close();
    else {
      track(next);
      window.refresh(next.element);
    }
  }

  function replace(placed: PopupTarget<Place> | undefined): void {
    close();
    const next = placed && render(placed);
    if (next !== undefined) show(next);
  }

  /** Opens `next` where its location is; the window reports its content in the DOM again. */
  function show(next: OpenPopup<Place, Window>): void {
    track(next);
    const { placed } = next;
    window.open({ element: next.element, place: placed.popupPlace(), title: next.heading });
  }

  function close(): void {
    if (open === undefined) return;
    window.close();
    ended();
  }

  function closedByUser(): void {
    if (open === undefined) return;
    choice.dismiss(open.id);
    ended();
  }

  function ended(): void {
    track(undefined);
    if (announced !== undefined) site.live()?.reportPopupClose(announced);
    announced = undefined;
  }

  /** A report for content since replaced finds the current content not yet in the DOM. */
  function contentShown(): void {
    if (open === undefined || open.shown || !open.element.isConnected) return;
    open.shown = true;
    announced = open.id;
    site.live()?.reportPopupOpen(open.id, open.element);
  }

  function track(next: OpenPopup<Place, Window> | undefined): void {
    open = next;
    site.onTracked(next);
  }

  function render(placed: PopupTarget<Place>): OpenPopup<Place, Window> | undefined {
    const drawable = placed.drawable();
    const content = popupContent(drawable, site.document);
    if (content === undefined) return undefined;
    const followed = drawable.geometry;
    const heading = drawable.title;
    return { id: drawable.id, ...content, window, placed, shown: false, followed, heading };
  }

  return {
    sync,
    end() {
      track(undefined);
      announced = undefined;
      window.close();
    },
  };
}

/** An adapter's popup: a part on the open map, kept in step after each `present` and `apply`. */
export interface PopupPart<Mounted> {
  readonly part: { open(mounted: Mounted): void };
  sync(): void;
}

/**
 * Popups for each map once it opens, the session `start` makes, ended when the map closes; until
 * then and after, `sync` does nothing.
 */
export function createPopupPart<Mounted extends { onDestroy(teardown: () => void): void }>(
  start: (mounted: Mounted) => PopupSession,
): PopupPart<Mounted> {
  let session: PopupSession | undefined;
  return {
    part: {
      open(mounted) {
        session = start(mounted);
        mounted.onDestroy(() => {
          const ending = session;
          session = undefined;
          ending?.end();
        });
        session.sync();
      },
    },
    sync: () => session?.sync(),
  };
}
