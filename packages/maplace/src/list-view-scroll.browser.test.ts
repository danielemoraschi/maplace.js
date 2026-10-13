import { describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";

const places: Location[] = Array.from({ length: 50 }, (_, index) => ({
  id: `p${index}`,
  title: `Place ${index}`,
  lat: index / 10,
  lng: index / 10,
}));

/** The list in a short scrolling box, on a page taller than the window. */
async function listOnLongPage() {
  const ready = await listed({ locations: places });
  Object.assign(ready.list.element.style, { height: "120px", overflow: "auto" });
  const rest = Object.assign(document.createElement("div"), { style: "height: 3000px" });
  document.body.append(rest);
  onTestFinished(() => rest.remove());
  window.scrollTo(0, 0);
  return ready;
}

describe("list view in a browser: only the list scrolls", () => {
  it("arrowing to the end scrolls the list, not the page", async () => {
    const { list } = await listOnLongPage();
    await userEvent.keyboard("{Tab}{ArrowDown}{ArrowDown}{End}");
    await expect.element(page.getByRole("option", { name: "Place 49" })).toHaveFocus();
    expect(list.element.scrollTop).toBeGreaterThan(0);
    expect(window.scrollY).toBe(0);
  });

  it("Space at the end of the list chooses, and the page stays put", async () => {
    const { maplace } = await listOnLongPage();
    await userEvent.keyboard("{Tab}{End} ");
    expect(maplace.getSnapshot().selectedId).toBe("p49");
    expect(window.scrollY).toBe(0);
  });

  it("a map click on the last place scrolls the list to it, not the page", async () => {
    const { adapter, list } = await listOnLongPage();
    adapter.probe().click("p49");
    await expect.poll(() => list.element.scrollTop).toBeGreaterThan(0);
    expect(window.scrollY).toBe(0);
  });
});
