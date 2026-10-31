/// <reference types="google.maps" />
import { afterEach, expect, it } from "vitest";
import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { queried } from "../testing/queried";
import { listMountedOnGoogle } from "./testing/panels";
import { places } from "./testing/places";
import { onGoogle } from "./testing/store-on-google";
import { describeWithMaps } from "./testing/with-maps";

// Before Maps JS loads, as on a real page. A browser test file has its own page, so it never leaks.
document.documentElement.dir = "rtl";

/** How near an edge of the map what sits against it is, a corner's margin included. */
const AT_THE_EDGE_PX = 20;

/** How the popup holding `paragraph` lines it up, once its heading and content are in the DOM. */
function popupInsets(paragraph: HTMLElement) {
  const content = paragraph.closest(`.${POPUP_CLASS}`);
  const heading = paragraph.closest('[role="dialog"]')?.querySelector(`.${POPUP_HEADING_CLASS}`);
  if (!(content && heading)) return undefined;
  const text = paragraph.getBoundingClientRect();
  return {
    pastTheHeading: Math.round(heading.getBoundingClientRect().right - text.right),
    fromTheFarSide: Math.round(text.left - content.getBoundingClientRect().left),
  };
}

describeWithMaps("Google on a right-to-left page", () => {
  afterEach(() => document.body.replaceChildren());

  it("starts a popup's heading and content at one edge, and insets its far side", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "One";
    const maplace = createMaplace({
      locations: [{ id: "a", lat: 0, lng: 0, title: "Alpha town", content: paragraph }],
    });
    await onGoogle(maplace);
    maplace.select("a");
    await expect
      .poll(() => popupInsets(paragraph))
      .toEqual({ pastTheHeading: 0, fromTheFarSide: 12 });
  });

  it("keeps a list top left at the map's left, and shows the link past the map at its right", async () => {
    const maplace = createMaplace({ locations: places() });
    const list = createListView(maplace);
    const { container, panel } = await listMountedOnGoogle({ maplace, list });
    const map = container.getBoundingClientRect();
    // Beside Google's own map type control, which holds that corner's edge.
    expect(panel.getBoundingClientRect().left).toBeLessThan(map.left + map.width / 2);
    const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
    link.focus();
    expect(map.right - link.getBoundingClientRect().right).toBeLessThan(AT_THE_EDGE_PX);
  });
});
