import { describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";

const places: Location[] = Array.from({ length: 40 }, (_, index) => ({
  id: `p${index}`,
  title: `Place ${index}`,
  lat: index,
  lng: 0,
}));

/** A short, scrolling list that sorts by distance. */
async function sortedList() {
  const ready = await listed({ locations: places }, { sort: "distance" });
  Object.assign(ready.list.element.style, { height: "120px", overflow: "auto" });
  onTestFinished(() => ready.maplace.setOrigin(undefined));
  return ready;
}

describe("a list sorted by distance in a browser", () => {
  it("focus stays on the entry through a sort", async () => {
    const { maplace } = await sortedList();
    await userEvent.keyboard("{Tab}{ArrowDown}{ArrowDown}");
    const focused = page.getByRole("option", { name: "Place 2", exact: true }).element();
    expect(document.activeElement).toBe(focused);
    maplace.setOrigin({ lat: 39, lng: 0 });
    expect(document.activeElement).toBe(focused);
    expect(focused.textContent).toContain("km");
  });

  it("a new origin scrolls the list to its top", async () => {
    const { maplace, list } = await sortedList();
    list.element.scrollTop = 300;
    maplace.setOrigin({ lat: 39, lng: 0 });
    expect(list.element.scrollTop).toBe(0);
    expect(list.element.querySelector("[role=option]")?.textContent).toContain("Place 39");
  });

  it("leaves the scroll alone while focus is in the list", async () => {
    const { maplace, list } = await sortedList();
    await userEvent.keyboard("{Tab}{End}");
    expect(list.element.scrollTop).toBeGreaterThan(0);
    // South of them all: the order stays, so only a reset would move the scroll.
    maplace.setOrigin({ lat: -1, lng: 0 });
    expect(list.element.scrollTop).toBeGreaterThan(0);
  });
});
