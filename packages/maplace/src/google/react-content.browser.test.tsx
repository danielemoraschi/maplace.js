import { startTransition } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { Location } from "../location";
import { MaplaceMap, MaplaceProvider } from "../react/index";
import { storeCatcher } from "../react/testing/render";
import { sizedContainer } from "../testing/container";
import { createGoogleAdapter } from "./index";
import { describeWithMaps } from "./testing/with-maps";

const LOCATIONS: readonly Location[] = [
  { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" },
  { id: "milan", lat: 45.46, lng: 9.19, title: "Milan" },
  { id: "naples", lat: 40.85, lng: 14.27, title: "Naples" },
];

const createAdapter = () => createGoogleAdapter({ mapId: "DEMO_MAP_ID" });
const markerIcon = (location: Location) => <b className="pin">{`★ ${location.id}`}</b>;
// Big enough that a popup laid out before it came in would be too small, or panned short.
const CONTENT_HEIGHT = 160;
const popupContent = (location: Location) => (
  <div style={{ width: 240, height: CONTENT_HEIGHT }}>{`Card ${location.id}`}</div>
);

/** What a page sees when `popupOpen` fires: the content, and whether the popup fits it. */
interface Shown {
  readonly text: string | null;
  readonly fits: boolean;
}

let cleanUp: () => void = () => {};
afterEach(() => cleanUp());

/**
 * The provider and its map, as an app renders them, in a sized container: no `act`, so Maps JS
 * and React schedule their work as they do on a page.
 */
function renderApp(onShown: (shown: Shown) => void) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });
  const container = sizedContainer();
  const sizing = document.createElement("style");
  sizing.textContent = ".map { width: 100%; height: 100%; }";
  document.head.append(sizing);
  const { Keep, store } = storeCatcher();
  const root = createRoot(container);
  root.render(
    <MaplaceProvider locations={LOCATIONS} onPopupOpen={({ element }) => onShown(shownIn(element))}>
      <Keep />
      <MaplaceMap
        createAdapter={createAdapter}
        className="map"
        markerIcon={markerIcon}
        popupContent={popupContent}
      />
    </MaplaceProvider>,
  );
  cleanUp = () => {
    root.unmount();
    container.remove();
    sizing.remove();
  };
  return { container, store };
}

/** The popup was laid out for its content: as tall as it, its inset aside, with nothing to scroll. */
function shownIn(element: HTMLElement): Shown {
  const box = element.parentElement as HTMLElement;
  const { paddingTop, paddingBottom } = getComputedStyle(element);
  const contentHeight =
    element.offsetHeight - Number.parseFloat(paddingTop) - Number.parseFloat(paddingBottom);
  const fits = contentHeight === CONTENT_HEIGHT && box.scrollHeight <= box.clientHeight;
  return { text: element.textContent, fits };
}

/** Whether `inner` is inside `outer` on the page. */
function isInside(inner: Element, outer: Element): boolean {
  const a = inner.getBoundingClientRect();
  const b = outer.getBoundingClientRect();
  return a.top >= b.top && a.left >= b.left && a.bottom <= b.bottom && a.right <= b.right;
}

describeWithMaps("React content on Google Maps", () => {
  it("draws JSX markers, and popups laid out for their JSX, in when popupOpen fires", async () => {
    const shown: Shown[] = [];
    const { container, store } = renderApp((popup) => shown.push(popup));
    const marker = (id: string) =>
      [...container.querySelectorAll("gmp-advanced-marker")].find(
        (element) => element.textContent === `★ ${id}`,
      ) as HTMLElement | undefined;
    await expect.poll(() => LOCATIONS.every(({ id }) => marker(id) !== undefined)).toBe(true);

    await userEvent.click(marker("rome") as HTMLElement);
    await expect.poll(() => shown.length).toBe(1);
    setTimeout(() => store().select("milan"));
    await expect.poll(() => shown.length, { timeout: 5000 }).toBe(2);
    startTransition(() => store().select("naples"));
    await expect.poll(() => shown.length, { timeout: 5000 }).toBe(3);

    expect(shown).toEqual(
      ["rome", "milan", "naples"].map((id) => ({ text: `Card ${id}`, fits: true })),
    );
    // Google pans an open popup into view from the size it laid it out at.
    const card = container.querySelector("[role=dialog]") as HTMLElement;
    await expect.poll(() => isInside(card, container), { timeout: 5000 }).toBe(true);
  });
});
