// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { type Box, MARGIN, type Shift } from "../adapter-kit/popup-shift";
import type { ResolvedPopupOptions } from "../popup";
import { frames } from "./frames";
import { createMapState } from "./map-state";
import { createPopupWindow } from "./popup-window";
import { boxAt, type LaidOutBox, laidOutAt } from "./testing/laid-out";
import { STUB_CONTROL_POSITIONS, type StubMap } from "./testing/stub-libraries";
import type { StubInfoWindow } from "./testing/stub-popups";
import { stubMounted } from "./testing/stub-site";

/** A phone-width map, as the site's at 375. */
const MAP: LaidOutBox = [0, 0, 375, 600];
/** A list in the map's top-right corner. */
const TOP_RIGHT_LIST: LaidOutBox = [200, 10, 165, 250];
/** A popup over the list, as Google's autopan leaves it: inside the map only. */
const POPUP: LaidOutBox = [67.25, 100.5, 240, 170];
/** A view for the stub map to show, so it counts as drawn. */
const VIEW = {
  center: { lat: 0, lng: 0 },
  zoom: 5,
  bounds: { north: 1, south: -1, east: 1, west: -1 },
};

/**
 * A popup's window on a drawn stub map laid out at `MAP`, as the session drives one, a panel at
 * `panel` drawn in Google's layer and pushed to the top-right corner. Popups open on click unless
 * `openOn` says otherwise.
 */
function popupOnStubs({
  openOn = "click",
  panel = TOP_RIGHT_LIST,
}: {
  openOn?: ResolvedPopupOptions["openOn"];
  panel?: LaidOutBox;
} = {}) {
  const { mounted } = stubMounted(createMapState(), { openOn });
  const map = mounted.map as unknown as StubMap;
  map.shown = VIEW;
  const div = map.getDiv();
  document.body.append(div);
  laidOutAt(div, MAP);
  const root = div.ownerDocument.createElement("div");
  laidOutAt(root, MAP);
  const layer = div.ownerDocument.createElement("div");
  laidOutAt(layer, MAP);
  root.append(layer);
  div.append(root);
  const pushed = div.ownerDocument.createElement("div");
  laidOutAt(pushed, panel);
  layer.append(pushed);
  map.controls[STUB_CONTROL_POSITIONS.TOP_RIGHT]?.push(pushed);
  const window = createPopupWindow(mounted, { contentShown() {}, closedByUser() {} });
  return {
    map,
    infoWindow: window.infoWindow as unknown as StubInfoWindow,
    /** Google's root, inside the map's element, as its own handlers are. */
    root,
    open(box: LaidOutBox = POPUP): HTMLElement {
      const content = div.ownerDocument.createElement("div");
      laidOutAt(content, box);
      window.open({ element: content, place: { position: { lat: 0, lng: 0 } }, title: undefined });
      return content;
    },
    /** Past the window's `domready`, then the two frames the pan waits after it. */
    looked: async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await frames(2);
    },
    /** New content in the open window, laid out at `box`, as the session refreshes it. */
    refresh(box: LaidOutBox): void {
      const content = div.ownerDocument.createElement("div");
      laidOutAt(content, box);
      window.refresh(content);
    },
    close: () => window.close(),
  };
}

type PopupOnStubs = ReturnType<typeof popupOnStubs>;

/** `box` where a pan by `shift` moves it on the page: `panBy` moves the view, so its content goes the other way. */
function moved([left, top, width, height]: LaidOutBox, [x, y]: Shift): Box {
  return boxAt([left - x, top - y, width, height]);
}

/** The one pan asked of `map`, failing unless there was exactly one. */
function onePan(map: StubMap): Shift {
  expect(map.panBy).toHaveBeenCalledTimes(1);
  return map.panBy.mock.calls[0] as unknown as Shift;
}

function expectJustBelowTheList(popup: LaidOutBox, shift: Shift): void {
  expect(shift[0]).toBe(0);
  expect(moved(popup, shift).top - boxAt(TOP_RIGHT_LIST).bottom).toBeCloseTo(MARGIN, 9);
}

afterEach(() => document.body.replaceChildren());

describe("a Google popup panned clear of the corners", () => {
  it("pans a click popup clear of a panel in the top-right corner, two frames after it draws, when nothing moves", async () => {
    const popup = popupOnStubs();
    popup.open();
    await popup.looked();
    expectJustBelowTheList(POPUP, onePan(popup.map));
  });

  it("waits for the move under way to end, then pans at its idle", async () => {
    const popup = popupOnStubs();
    popup.open();
    popup.map.trigger("center_changed");
    await popup.looked();
    expect(popup.map.panBy).not.toHaveBeenCalled();
    popup.map.trigger("idle");
    expectJustBelowTheList(POPUP, onePan(popup.map));
  });

  it("pans once drawn after an idle that came before the window drew, nothing moving since", async () => {
    const popup = popupOnStubs();
    popup.open();
    popup.map.trigger("center_changed");
    popup.map.trigger("idle");
    await popup.looked();
    expectJustBelowTheList(POPUP, onePan(popup.map));
  });

  it("pans once: a later move and idle pan nothing more", async () => {
    const popup = popupOnStubs();
    popup.open();
    await popup.looked();
    popup.map.trigger("center_changed");
    popup.map.trigger("idle");
    onePan(popup.map);
  });

  it("never pans for a camera move long after the open", async () => {
    const popup = popupOnStubs();
    const content = popup.open([20, 300, 150, 100]);
    await popup.looked();
    laidOutAt(content, POPUP);
    popup.map.trigger("center_changed");
    popup.map.trigger("idle");
    expect(popup.map.panBy).not.toHaveBeenCalled();
  });

  it.each(["pointerdown", "wheel"])(
    "never pans once the user's %s on the map comes before it settles",
    async (input) => {
      const popup = popupOnStubs();
      popup.open();
      popup.map.trigger("center_changed");
      await popup.looked();
      popup.map.userInput(input);
      popup.map.trigger("idle");
      expect(popup.map.panBy).not.toHaveBeenCalled();
    },
  );

  it.each(["pointerdown", "wheel"])(
    "never pans once the user's %s on Google's own elements comes before it settles, nothing moving",
    async (input) => {
      const popup = popupOnStubs();
      popup.open();
      popup.root.dispatchEvent(new Event(input));
      await popup.looked();
      expect(popup.map.panBy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["the page", (popup: PopupOnStubs) => popup.close()],
    ["the user", (popup: PopupOnStubs) => popup.infoWindow.closeByUser()],
  ])("never pans a popup %s closed before the map settles", async (_, close) => {
    const popup = popupOnStubs();
    popup.open();
    popup.map.trigger("center_changed");
    close(popup);
    // Its content back in the page and drawn, so only the closed wait keeps it from panning.
    document.body.append(popup.infoWindow.box);
    popup.infoWindow.trigger("domready");
    await frames(2);
    popup.map.trigger("idle");
    expect(popup.map.panBy).not.toHaveBeenCalled();
  });

  it("pans once, by the newest popup's own box, when two open before the map settles", async () => {
    const second: LaidOutBox = [100, 40, 240, 170];
    const popup = popupOnStubs();
    popup.open(POPUP);
    popup.open(second);
    await popup.looked();
    expectJustBelowTheList(second, onePan(popup.map));
  });

  it("pans by the new content's box when the content is refreshed before the map settles", async () => {
    const second: LaidOutBox = [100, 40, 240, 170];
    const popup = popupOnStubs();
    popup.open();
    popup.map.trigger("center_changed");
    popup.refresh(second);
    await popup.looked();
    popup.map.trigger("idle");
    expectJustBelowTheList(second, onePan(popup.map));
  });

  it("waits on for the window to draw content not in the page yet when its first look comes", async () => {
    const popup = popupOnStubs();
    const content = popup.open();
    const box = content.parentElement as HTMLElement;
    content.remove();
    await popup.looked();
    expect(popup.map.panBy).not.toHaveBeenCalled();
    box.append(content);
    popup.infoWindow.trigger("domready");
    await frames(2);
    expectJustBelowTheList(POPUP, onePan(popup.map));
  });

  it("leaves Google's own pan when no place clears every control", async () => {
    const popup = popupOnStubs({ panel: [130, 10, 235, 580] });
    popup.open();
    await popup.looked();
    expect(popup.map.panBy).not.toHaveBeenCalled();
  });

  it("never pans a hover popup", async () => {
    const popup = popupOnStubs({ openOn: "hover" });
    popup.open();
    await popup.looked();
    popup.map.trigger("idle");
    expect(popup.map.panBy).not.toHaveBeenCalled();
  });
});
