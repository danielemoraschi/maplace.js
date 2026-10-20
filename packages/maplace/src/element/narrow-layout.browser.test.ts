import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { box, mapFrom, places, styledPage } from "./testing/fake-maps";
import { restoreScreen, showOnPhone } from "./testing/screens";

// Its own file: the element on a phone's screen, below the width a list beside the map needs.

beforeAll(showOnPhone);
afterAll(restoreScreen);
beforeEach(() => styledPage("maplace-map { width: 343px; height: 400px; }"));

describe("<maplace-map> on a phone", () => {
  it("puts its list under the map, the map as wide as the element", async () => {
    const map = await mapFrom(`<maplace-map list>${places(3)}</maplace-map>`);
    const pane = map.querySelector(".maplace-map-pane")?.getBoundingClientRect();
    const list = map.querySelector('[role="listbox"]')?.getBoundingClientRect();
    expect(pane?.width).toBe(343);
    expect(list?.top).toBeGreaterThanOrEqual(pane?.bottom ?? Infinity);
    expect(list?.width).toBe(343);
  });

  it("keeps a long list within the element's height, scrolling under the map", async () => {
    const map = await mapFrom(`<maplace-map list>${places(30)}</maplace-map>`);
    const listbox = map.querySelector<HTMLElement>('[role="listbox"]');
    expect(box(map.querySelector(".maplace-map-pane")).height).toBeGreaterThan(200);
    expect(listbox?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      map.getBoundingClientRect().bottom,
    );
    expect(listbox?.scrollHeight).toBeGreaterThan(listbox?.clientHeight ?? Infinity);
  });
});
