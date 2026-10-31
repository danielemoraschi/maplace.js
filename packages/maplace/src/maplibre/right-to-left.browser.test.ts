import { afterEach, describe, expect, it } from "vitest";
import { POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { optionsIn } from "../testing/lists";
import { queried } from "../testing/queried";
import { onMapLibre } from "./testing/control-site";

// A browser test file has its own page, so this is the whole file's and never leaks.
document.documentElement.dir = "rtl";

/** How near an edge of the map what sits against it is, a corner's margin included. */
const AT_THE_EDGE_PX = 20;

afterEach(() => {
  document.body.replaceChildren();
});

async function listTopLeft() {
  const maplace = createMaplace({
    locations: [
      { id: "long", lat: 1, lng: 1, title: "A place with a long name" },
      { id: "short", lat: 2, lng: 2, title: "B" },
    ],
  });
  const { adapter, container } = await onMapLibre(maplace);
  const list = createListView(maplace);
  adapter.mountControl(list.element, "top-left");
  return { container, list };
}

describe("MapLibre on a right-to-left page", () => {
  it("keeps a list in the top-left corner at the map's left", async () => {
    const { container, list } = await listTopLeft();
    const gap = list.element.getBoundingClientRect().left - container.getBoundingClientRect().left;
    expect(gap).toBeLessThan(AT_THE_EDGE_PX);
  });

  it("puts a short option's text at its right, under a longer one", async () => {
    const { list } = await listTopLeft();
    const option = optionsIn(list.element).find(({ textContent }) => textContent === "B");
    if (!option) throw new Error("no option B");
    const text = document.createRange();
    text.selectNodeContents(option);
    const gap = option.getBoundingClientRect().right - text.getBoundingClientRect().right;
    expect(gap).toBeLessThan(AT_THE_EDGE_PX);
  });

  it("shows the focused link past the map at the map's right", async () => {
    const maplace = createMaplace({ locations: [{ id: "a", lat: 1, lng: 1 }] });
    const { container } = await onMapLibre(maplace);
    const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
    link.focus();
    const gap = container.getBoundingClientRect().right - link.getBoundingClientRect().right;
    expect(gap).toBeLessThan(AT_THE_EDGE_PX);
  });

  it("stops a popup's heading short of the close button", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "One";
    const maplace = createMaplace({
      locations: [{ id: "a", lat: 0, lng: 0, title: "Alpha", content: paragraph }],
    });
    await onMapLibre(maplace);
    maplace.select("a");
    const closeButton = () => document.querySelector(".maplibregl-popup-close-button");
    await expect.poll(closeButton).not.toBeNull();
    const heading = queried(document.body, `.${POPUP_HEADING_CLASS}`);
    expect(heading.getBoundingClientRect().right).toBeLessThanOrEqual(
      (closeButton() as Element).getBoundingClientRect().left,
    );
  });
});
