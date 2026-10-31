import { adoptStyles } from "../adopted-styles";
import { locationById } from "../location-index";
import { labelOf } from "../location-state";
import type { MaplaceOptions } from "../options";
import type { Maplace } from "../store";
import { outsideUnstyled } from "../unstyled";

export const SKIP_MAP_CLASS = "maplace-skip-map";

/** What the link and the announcement are worded by. */
type MapAidLabels = Pick<MaplaceOptions, "skipMapLabel" | "selectedLabel">;

/** The store as far as these need it. */
type Selections = Pick<Maplace, "on" | "getSnapshot">;

const LINK = `.${SKIP_MAP_CLASS}`;

/** What takes focus in a control on the map: `.maplace-control` is `CONTROL_CLASS`'s. */
const CONTROL_STOPS = '.maplace-control :is(a[href],button,input,select,textarea,[tabindex="0"])';

/** Lists that speak a change of their own selection, while focused. */
const LISTS = '[role="listbox"],select';

const FOCUSED_LINK = outsideUnstyled(`${LINK}:focus`);

/** A focused link's look: its being hidden until then is set on it, so it holds without a sheet. */
export const MAP_AID_STYLES = `${FOCUSED_LINK}{margin:.5rem;padding:.5rem .75rem;border-radius:.375rem;background:Canvas;color:CanvasText}`;

/**
 * What every map gives a keyboard and a screen reader, whichever provider draws it: a link first in
 * the container, past the map's own tab stops, and a live region saying what is selected. Returns
 * what removes them.
 */
export function addMapAids(
  container: HTMLElement,
  store: Selections,
  { skipMapLabel = "Skip the map", selectedLabel = "Selected" }: MapAidLabels = {},
): () => void {
  const page = container.ownerDocument;
  adoptStyles(page, MAP_AID_STYLES);
  const region = outOfSight(page.createElement("div"));
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  const end = outOfSight(page.createElement("span"));
  end.setAttribute("tabindex", "-1");
  const link = outOfSight(page.createElement("a"));
  link.href = "#";
  link.className = SKIP_MAP_CLASS;
  link.textContent = skipMapLabel;
  // No offsets, so it stays where it is in a container that isn't positioned; above the map's corners.
  link.addEventListener("focus", () => {
    link.style.cssText = "position:absolute;z-index:3";
  });
  link.addEventListener("blur", () => outOfSight(link));
  link.addEventListener("click", (event) => {
    event.preventDefault();
    focusPast(container, end);
  });
  const stopSaying = saySelections(container, region, store, selectedLabel);
  container.prepend(link, region);
  container.append(end);
  return () => {
    stopSaying();
    link.remove();
    region.remove();
    end.remove();
  };
}

/**
 * Set on the node, as it holds where a sheet doesn't reach (a shadow root). `google/map-resizes.ts`
 * passes over the link and the region by their markup.
 */
function outOfSight<T extends HTMLElement>(node: T): T {
  node.style.cssText =
    "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
  return node;
}

/** Focus on the first control on the map that takes it, such as a list there, else past the map. */
function focusPast(container: HTMLElement, end: HTMLElement): void {
  for (const stop of container.querySelectorAll<HTMLElement>(CONTROL_STOPS)) {
    stop.focus();
    if (focusedAround(container) === stop) return;
  }
  end.focus();
}

/** Says each new selection, but for a list holding focus: a screen reader speaks the change there. */
function saySelections(
  container: HTMLElement,
  region: HTMLElement,
  store: Selections,
  label: string,
): () => void {
  return store.on("selectionChange", ({ id }) => {
    const location = id === undefined ? undefined : locationById(store.getSnapshot().locations, id);
    const speaks = location !== undefined && !focusedAround(container)?.closest(LISTS);
    region.textContent = speaks ? `${label}: ${labelOf(location)}` : "";
  });
}

/** The focused element in `node`'s document or shadow root. */
function focusedAround(node: Node): Element | null | undefined {
  return (node.getRootNode() as Partial<DocumentOrShadowRoot>).activeElement;
}
