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
    areaOnly: part(".maplace-area-only"),
    showAll: part(".maplace-show-all"),
    status: part(".maplace-empty-area"),
    listbox: part('[role="listbox"]'),
  };
}

describe("list view with scope in a browser", () => {
  it("the buttons sit one above the other over the entries, full width, and the entries scroll under them in a short block", async () => {
    const { maplace, adapter, list, areaOnly, showAll, listbox } = await scopedListMovedTo(
      2.5,
      2.5,
    );
    await userEvent.click(areaOnly);
    maplace.setView({ lat: 1, lng: 1 }, 9);
    await adapter.probe().settle();
    expect([areaOnly.hidden, showAll.hidden]).toEqual([false, false]);
    const block = list.element.getBoundingClientRect();
    const first = areaOnly.getBoundingClientRect();
    const second = showAll.getBoundingClientRect();
    expect(first.bottom).toBeLessThanOrEqual(second.top);
    expect(second.bottom).toBeLessThanOrEqual(listbox.getBoundingClientRect().top);
    for (const shown of [first, second]) expect(shown.width).toBeGreaterThan(block.width * 0.9);
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    listbox.scrollTop = listbox.scrollHeight;
    expect(showAll.getBoundingClientRect().top).toBe(second.top);
    expect(list.element.getBoundingClientRect().height).toBe(block.height);
  });

  it("Tab reaches 'This area only', then the list, and Enter on 'This area only' filters and puts focus on the list's first entry", async () => {
    const { list, areaOnly } = await scopedListMovedTo(2.5, 2.5);
    await userEvent.keyboard("{Tab}");
    await expect.element(areaOnly).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("role")).toBe("option");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(areaOnly).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const entries = optionsIn(list.element);
    expect(entries.length).toBeLessThan(places.length);
    expect(document.activeElement).toBe(entries[0]);
    expect(areaOnly.hidden).toBe(true);
  });

  it("Shift+Tab from the filtered list reaches 'Show all', and Enter on it lists everything and puts focus on the list's tab stop", async () => {
    const { list, areaOnly, showAll } = await scopedListMovedTo(2.5, 2.5);
    await userEvent.click(areaOnly);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(showAll).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const entries = optionsIn(list.element);
    expect([entries.length, showAll.hidden]).toEqual([places.length, true]);
    expect(document.activeElement).toBe(entries[0]);
    await expect.element(areaOnly).toBeVisible();
  });

  it("filtering from a list scrolled to its end shows the entry it puts focus on", async () => {
    const { areaOnly, listbox } = await scopedListMovedTo(2.5, 2.5);
    listbox.scrollTop = listbox.scrollHeight;
    await userEvent.click(areaOnly);
    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute("role")).toBe("option");
    const box = listbox.getBoundingClientRect();
    const shown = focused.getBoundingClientRect();
    expect(shown.top).toBeGreaterThanOrEqual(box.top);
    expect(shown.bottom).toBeLessThanOrEqual(box.bottom);
  });

  it("filtering to an empty area keeps the block shown and puts focus on its status, which names it, after 'Show all'", async () => {
    const { list, status, showAll } = await scopedListMovedTo(0, 100);
    await userEvent.keyboard("{Tab}{Enter}");
    expect(list.element.hidden).toBe(false);
    await expect.element(page.getByRole("status")).toHaveTextContent("No locations in this area");
    expect(document.activeElement).toBe(status);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(showAll).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(document.activeElement).toBe(optionsIn(list.element)[0]);
  });

  it("hidden buttons and a hidden status take no room", async () => {
    const ready = await listed({ locations: places }, { scope: "viewport" });
    const block = ready.list.element;
    const listbox = block.querySelector('[role="listbox"]') as HTMLElement;
    for (const part of block.querySelectorAll(
      ".maplace-area-only, .maplace-show-all, .maplace-empty-area",
    )) {
      expect(part.getBoundingClientRect().height).toBe(0);
    }
    expect(listbox.getBoundingClientRect().top).toBe(block.getBoundingClientRect().top);
  });
});
