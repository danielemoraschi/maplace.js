import { createPopupChoice } from "../adapter-kit/popup-choice";
import {
  type PopupContent,
  type PopupStep,
  popupContent,
  popupStep,
} from "../adapter-kit/popup-content";
import type { Geometry } from "../geometry";
import type { GoogleMapState, ShownGooglePopup } from "./map-state";
import type { MountedMap } from "./mounted-map";
import type { PlacedLocation } from "./placed-location";
import { createPopupWindow } from "./popup-window";

/** The popup on one open map. */
export interface PopupSession {
  /** Brings the popup in step with what is placed and presented. */
  sync(): void;
  /** The map closed: the window goes, and nothing more is reported. */
  end(): void;
}

/** The open popup, the placed location it shows, and the geometry it last pointed at. */
interface OpenPopup extends ShownGooglePopup, PopupContent {
  readonly placed: PlacedLocation;
  shown: boolean;
  followed: Geometry;
}

/**
 * One popup at a time, following the selection (or the hover). It opens once the location is
 * placed, and each step is the one every map takes (`popupStep`). Every close the store hears
 * pairs with an open it heard: `popupOpen` waits for Google's `domready`.
 */
export function startPopupSession(state: GoogleMapState, mounted: MountedMap): PopupSession {
  const choice = createPopupChoice(mounted.popup.openOn);
  const window = createPopupWindow(mounted, { contentShown, closedByUser });
  const document = mounted.map.getDiv().ownerDocument;
  let open: OpenPopup | undefined;
  /** The location whose `popupOpen` the store heard, until it hears the close. */
  let announced: string | undefined;

  function sync(): void {
    const placed = wantedLocation();
    const step = stepTo(placed);
    if (open === undefined || placed === undefined || step === "replace") replace(placed);
    else if (step === "reopen") reopen(placed);
    else if (step === "refresh") refresh(placed);
    else follow(open, placed);
  }

  function wantedLocation(): PlacedLocation | undefined {
    const id = choice.wanted(state.presented);
    return id === undefined ? undefined : state.placed.get(id);
  }

  /** Every map's step, and Google's own: a location placed anew under its id moves the popup. */
  function stepTo(placed: PlacedLocation | undefined): PopupStep | "reopen" {
    const step = popupStep(open, placed?.drawable());
    return step !== "replace" && placed !== open?.placed ? "reopen" : step;
  }

  /** Placed anew under its id, as after a type change: still open, on the new one. */
  function reopen(placed: PlacedLocation): void {
    const next = render(placed);
    if (next === undefined) close();
    else show(next);
  }

  /** A shape's popup moves with its centre after an edit; an unchanged geometry costs nothing. */
  function follow(current: OpenPopup, placed: PlacedLocation): void {
    const { geometry } = placed.drawable();
    if (geometry === current.followed) return;
    current.followed = geometry;
    window.follow(placed.popupPlace());
  }

  /** New content where the popup is: Google reports it in the DOM again. */
  function refresh(placed: PlacedLocation): void {
    const next = render(placed);
    if (next === undefined) close();
    else {
      track(next);
      window.refresh(next.element);
    }
  }

  function replace(placed: PlacedLocation | undefined): void {
    close();
    const next = placed && render(placed);
    if (next !== undefined) show(next);
  }

  /** Opens `next` where its location is; Google reports its content in the DOM again. */
  function show(next: OpenPopup): void {
    track(next);
    const { placed } = next;
    window.open({
      element: next.element,
      place: placed.popupPlace(),
      title: placed.drawable().title,
    });
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
    if (announced !== undefined) mounted.live()?.reportPopupClose(announced);
    announced = undefined;
  }

  /** A `domready` for content since replaced finds the current content not yet in the DOM. */
  function contentShown(): void {
    if (open === undefined || open.shown || !open.element.isConnected) return;
    open.shown = true;
    announced = open.id;
    mounted.live()?.reportPopupOpen(open.id, open.element);
  }

  function track(next: OpenPopup | undefined): void {
    open = next;
    state.popup = next;
  }

  function render(placed: PlacedLocation): OpenPopup | undefined {
    const drawable = placed.drawable();
    const content = popupContent(drawable, document);
    if (content === undefined) return undefined;
    const { infoWindow } = window;
    const followed = drawable.geometry;
    return { id: drawable.id, ...content, infoWindow, placed, shown: false, followed };
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
