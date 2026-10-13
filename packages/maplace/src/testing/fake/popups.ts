import type { AdapterHost } from "../../adapter";
import type { ResolvedPopupOptions } from "../../popup";
import type { ShownPopup } from "../map-probe";
import { type MapState, shownEntry } from "./map-state";

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

export function createPopups({ map, host, openOn, layer }: PopupSettings): FakePopups {
  let shown: ShownPopup | undefined;
  let dismissed: string | undefined;

  /** The location whose popup should show: the selected one, or the hovered one. */
  function wish(): string | undefined {
    const { selectedId, hoveredId } = map.presented;
    return openOn === "click" ? selectedId : hoveredId;
  }

  /** The wished-for location, unless the user closed its popup or it isn't shown. */
  function popupToShow(): string | undefined {
    const id = wish();
    if (id !== dismissed) dismissed = undefined;
    if (id === undefined || id === dismissed) return undefined;
    return shownEntry(map, id) ? id : undefined;
  }

  function close(): void {
    if (shown === undefined) return;
    shown.element.remove();
    host.reportPopupClose(shown.id);
    shown = undefined;
  }

  function open(id: string): void {
    const content = shownEntry(map, id)?.drawable.renderContent?.();
    if (content === undefined || layer === undefined) return;
    const element = layer.ownerDocument.createElement("div");
    element.append(content);
    layer.append(element);
    shown = { id, element };
    host.reportPopupOpen(id, element);
  }

  return {
    shown: () => shown,
    settle() {
      const next = popupToShow();
      if (shown?.id === next) return;
      close();
      if (next !== undefined) open(next);
    },
    closeByUser() {
      dismissed = shown?.id;
      close();
    },
  };
}
