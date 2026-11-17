import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { onPageMapLibre } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

/** A list with the group filter, in a corner of the page's own MapLibre map. */
async function filteredListOnMap() {
  const at = { lat: 45, lng: 9 };
  const maplace = createMaplace({
    locations: [
      { id: "milan", title: "Milan", group: ["Europe", "Italy"], ...at },
      { id: "paris", title: "Paris", group: ["Europe", "France"], ...at },
    ],
  });
  const { adapter } = await onPageMapLibre(maplace);
  const view = createListView(maplace, { groupFilter: true });
  onTestFinished(() => view.destroy());
  adapter.mountControl(view.element, "top-right");
  return view.element.querySelector(".maplace-group-filter") as HTMLElement;
}

describe("the group filter in a MapLibre panel", () => {
  it("keeps its button as wide as the filter, MapLibre's button rules aside", async () => {
    const filter = await filteredListOnMap();
    const opener = filter.querySelector("button") as HTMLButtonElement;
    const width = (node: Element) => node.getBoundingClientRect().width;
    expect(width(opener)).toBeGreaterThan(width(filter) - 4);
    expect(opener.getBoundingClientRect().height).toBeGreaterThan(20);
  });

  it("tints its button on hover in the list's own tint, over MapLibre's", async () => {
    const filter = await filteredListOnMap();
    const opener = filter.querySelector("button") as HTMLButtonElement;
    await userEvent.hover(opener);
    expect(getComputedStyle(opener).backgroundImage).toContain("linear-gradient");
  });

  it("opens its boxes", async () => {
    const filter = await filteredListOnMap();
    (filter.querySelector("button") as HTMLButtonElement).click();
    const box = filter.querySelector("label") as HTMLElement;
    expect(box.checkVisibility()).toBe(true);
    expect(box.textContent).toBe("Europe");
  });
});
