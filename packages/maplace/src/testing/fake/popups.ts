import type { AdapterHost } from "../../adapter";
import { createPopupChoice } from "../../adapter-kit/popup-choice";
import { type PopupContent, popupContent, popupStep } from "../../adapter-kit/popup-content";
import type { Drawable } from "../../drawable";
import type { ResolvedPopupOptions } from "../../popup";
import type { ShownPopup } from "../map-probe";
import type { MapState } from "./map-state";

/** Where popups open and whom they report to. */
export interface PopupSettings {
  readonly map: MapState;
  readonly host: AdapterHost;
  readonly openOn: ResolvedPopupOptions["openOn"];
  /** What popup elements are placed in; without one (no DOM), no popup opens. */
  readonly layer: HTMLElement | undefined;
}

/**
 * The fake map's one popup. It follows the selection (or the hover, with `openOn: 'hover'`) when
 * the map settles, as a real popup opens once its content is in the DOM. A popup the user closed
 * stays closed until a different location is wanted.
 */
export interface FakePopups {
  shown(): ShownPopup | undefined;
  settle(): void;
  closeByUser(): void;
}

/** The open popup: which location, and its content. */
interface OpenPopup extends ShownPopup, PopupContent {}

export function createPopups({ map, host, openOn, layer }: PopupSettings): FakePopups {
  const choice = createPopupChoice(openOn);
  let shown: OpenPopup | undefined;

  /** The drawable whose popup should show, once it is drawn. */
  function wanted(): Drawable | undefined {
    const id = choice.wanted(map.presented);
    return id === undefined ? undefined : map.entries.get(id)?.drawable;
  }

  /** `drawable`'s popup in the layer; none without content or without a DOM. */
  function render(drawable: Drawable): OpenPopup | undefined {
    const content = layer && popupContent(drawable, layer.ownerDocument);
    return content && { id: drawable.id, ...content };
  }

  function close(): void {
    if (shown === undefined) return;
    shown.element.remove();
    host.reportPopupClose(shown.id);
    shown = undefined;
  }

  function open(drawable: Drawable): void {
    const popup = render(drawable);
    if (popup === undefined) return;
    layer?.append(popup.element);
    shown = popup;
    host.reportPopupOpen(popup.id, popup.element);
  }

  function refresh(current: OpenPopup, drawable: Drawable): void {
    const popup = render(drawable);
    if (popup === undefined) close();
    else {
      current.element.replaceWith(popup.element);
      shown = popup;
      host.reportPopupOpen(popup.id, popup.element);
    }
  }

  return {
    shown: () => shown,
    settle() {
      const next = wanted();
      const step = popupStep(shown, next);
      if (step === "refresh" && shown && next) refresh(shown, next);
      else if (step === "replace") {
        close();
        if (next) open(next);
      }
    },
    closeByUser() {
      if (shown) choice.dismiss(shown.id);
      close();
    },
  };
}
