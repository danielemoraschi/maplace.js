import { createPopupChoice } from "../adapter-kit/popup-choice";
import { type PopupContent, popupContent, popupStep } from "../adapter-kit/popup-content";
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

/** The open popup, and the geometry it last pointed at. */
interface OpenPopup extends ShownGooglePopup, PopupContent {
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
    const id = choice.wanted(state.presented);
    const placed = id === undefined ? undefined : state.placed.get(id);
    const step = popupStep(open, placed?.drawable());
    if (step === "keep" && open && placed) follow(open, placed);
    else if (step === "refresh" && placed) refresh(placed);
    else replace(placed);
  }

  /** A shape's popup moves with its centre after an edit; an unchanged geometry costs nothing. */
  function follow(current: OpenPopup, placed: PlacedLocation): void {
    const { geometry } = placed.drawable();
    if (geometry === current.followed) return;
    current.followed = geometry;
    window.follow(placed.popupPlace());
  }

  function refresh(placed: PlacedLocation): void {
    const next = render(placed);
    if (next === undefined) {
      close();
      return;
    }
    track(next);
    window.refresh(next.element);
  }

  function replace(placed: PlacedLocation | undefined): void {
    close();
    const next = placed && render(placed);
    if (placed === undefined || next === undefined) return;
    track(next);
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
    return { id: drawable.id, ...content, infoWindow, shown: false, followed: drawable.geometry };
  }

  return {
    sync,
    end() {
      window.close();
      track(undefined);
      announced = undefined;
    },
  };
}
