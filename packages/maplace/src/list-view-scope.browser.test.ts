import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";
import { optionsIn } from "./testing/lists";

const places: Location[] = Array.from({ length: 50 }, (_, index) => ({
  id: `p${index}`,
  title: `Place ${index}`,
  lat: index / 10,
  lng: index / 10,
}));

/** A scoped list beside a ready map, in a short block, the map then moved to (`lat`, `lng`). */
async function scopedListMovedTo(lat: number, lng: number) {
  const ready = await listed({ locations: places }, { scope: "viewport" });
  await ready.adapter.probe().settle();
  ready.list.element.style.height = "200px";
  ready.maplace.setView({ lat, lng }, 9);
  await ready.adapter.probe().settle();
  const part = (selector: string) => ready.list.element.querySelector(selector) as HTMLElement;
  return {
    ...ready,
    button: part(".maplace-search-area"),
    status: part(".maplace-empty-area"),
    listbox: part('[role="listbox"]'),
  };
}

describe("list view with scope in a browser", () => {
  it("the button sits above the entries, full width, and the entries scroll under it in a short block", async () => {
    const { list, button, listbox } = await scopedListMovedTo(2.5, 2.5);
    expect(button.hidden).toBe(false);
    const block = list.element.getBoundingClientRect();
    const shown = button.getBoundingClientRect();
    expect(shown.bottom).toBeLessThanOrEqual(listbox.getBoundingClientRect().top);
    expect(shown.width).toBeGreaterThan(block.width * 0.9);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    listbox.scrollTop = listbox.scrollHeight;
    expect(button.getBoundingClientRect().top).toBe(shown.top);
    expect(list.element.getBoundingClientRect().height).toBe(block.height);
  });

  it("Tab reaches the button, then the list, and Enter on the button searches and puts focus on the list's first entry", async () => {
    const { list, button } = await scopedListMovedTo(2.5, 2.5);
    await userEvent.keyboard("{Tab}");
    await expect.element(button).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("role")).toBe("option");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const entries = optionsIn(list.element);
    expect(entries.length).toBeLessThan(places.length);
    expect(document.activeElement).toBe(entries[0]);
    expect(button.hidden).toBe(true);
  });

  it("a search from a list scrolled to its end shows the entry it puts focus on", async () => {
    const { button, listbox } = await scopedListMovedTo(2.5, 2.5);
    listbox.scrollTop = listbox.scrollHeight;
    await userEvent.click(button);
    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute("role")).toBe("option");
    const box = listbox.getBoundingClientRect();
    const shown = focused.getBoundingClientRect();
    expect(shown.top).toBeGreaterThanOrEqual(box.top);
    expect(shown.bottom).toBeLessThanOrEqual(box.bottom);
  });

  it("a search over an empty area keeps the block shown and puts focus on its status, which names it", async () => {
    const { list, status } = await scopedListMovedTo(0, 100);
    await userEvent.keyboard("{Tab}{Enter}");
    expect(list.element.hidden).toBe(false);
    await expect.element(page.getByRole("status")).toHaveTextContent("No locations in this area");
    expect(document.activeElement).toBe(status);
  });

  it("a hidden button and a hidden status take no room", async () => {
    const ready = await listed({ locations: places }, { scope: "viewport" });
    const block = ready.list.element;
    const listbox = block.querySelector('[role="listbox"]') as HTMLElement;
    for (const part of block.querySelectorAll(".maplace-search-area, .maplace-empty-area")) {
      expect(part.getBoundingClientRect().height).toBe(0);
    }
    expect(listbox.getBoundingClientRect().top).toBe(block.getBoundingClientRect().top);
  });
});
