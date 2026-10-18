import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";

const HEADING = "Choose a location:";

const places: Location[] = Array.from({ length: 50 }, (_, index) => ({
  id: `p${index}`,
  title: `Place ${index}`,
  lat: index / 10,
  lng: index / 10,
}));

const headingOf = (list: { element: HTMLElement }) =>
  list.element.querySelector(".maplace-list-heading") as HTMLElement;

describe("a headed list view in a browser", () => {
  it("is named by its heading for assistive tech, read once", async () => {
    await listed({ locations: places.slice(0, 3) }, { heading: HEADING });
    await expect.element(page.getByRole("listbox", { name: HEADING })).toBeInTheDocument();
    expect(page.getByText(HEADING).elements()).toHaveLength(1);
  });

  it("leaves the name to label, and the heading in the tree as text", async () => {
    await listed({ locations: places.slice(0, 3) }, { heading: HEADING, label: "Cities" });
    await expect.element(page.getByRole("listbox", { name: "Cities" })).toBeInTheDocument();
    await expect.element(page.getByText(HEADING)).toBeVisible();
  });

  it("names a native select by its heading", async () => {
    await listed({ locations: places.slice(0, 3) }, { heading: HEADING, as: "select" });
    await expect.element(page.getByRole("combobox", { name: HEADING })).toBeInTheDocument();
  });

  it("keeps the heading out of the tab order and above the entries", async () => {
    const { list } = await listed({ locations: places.slice(0, 3) }, { heading: HEADING });
    await userEvent.keyboard("{Tab}");
    await expect.element(page.getByRole("option", { name: "Place 0" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(page.getByRole("option", { name: "Place 1" })).toHaveFocus();
    const firstOption = list.element.querySelector('[role="option"]') as HTMLElement;
    expect(headingOf(list).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      firstOption.getBoundingClientRect().top,
    );
  });

  it("scrolls its entries under the heading in a box the page limits", async () => {
    const { list } = await listed({ locations: places }, { heading: HEADING });
    list.element.style.maxHeight = "120px";
    window.scrollTo(0, 0);
    await userEvent.keyboard("{Tab}{End}");
    await expect.element(page.getByRole("option", { name: "Place 49" })).toHaveFocus();
    const listbox = list.element.querySelector('[role="listbox"]') as HTMLElement;
    const block = list.element.getBoundingClientRect();
    expect(Math.round(block.height)).toBeLessThanOrEqual(120);
    expect(listbox.scrollTop).toBeGreaterThan(0);
    expect(headingOf(list).getBoundingClientRect().top).toBeGreaterThanOrEqual(block.top);
    expect(window.scrollY).toBe(0);
  });

  it("shows no heading while the list has nothing to show", async () => {
    const { list, maplace } = await listed({ locations: places.slice(0, 3) }, { heading: HEADING });
    maplace.setFilter(["none of them"]);
    await expect.poll(() => list.element.hidden).toBe(true);
    expect(getComputedStyle(list.element).display).toBe("none");
    await expect.element(page.getByText(HEADING)).not.toBeVisible();
  });

  it("keeps its keys from the map when on it", async () => {
    const { adapter, list, map } = await listed(
      { locations: places.slice(0, 3) },
      { heading: HEADING },
    );
    adapter.mountControl(list.element, "top-left");
    const reachedMap: string[] = [];
    map.addEventListener("keydown", (event) => reachedMap.push(event.key));
    await userEvent.keyboard("{Tab}{ArrowDown}{End}");
    expect(map.contains(document.activeElement)).toBe(true);
    expect(reachedMap).toEqual([]);
  });
});
