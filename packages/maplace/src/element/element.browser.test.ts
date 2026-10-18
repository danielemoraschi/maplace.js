import { describe, expect, it } from "vitest";
import {
  box,
  errorsOn,
  lastAdapter,
  mapFrom,
  nextTask,
  ROME,
  styledPage,
} from "./testing/fake-maps";

describe("<maplace-map> on the page", () => {
  it("fills itself with the map, which the page sizes", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    expect(box(map.querySelector(".maplace-map-pane"))).toEqual({ width: 600, height: 300 });
    expect(box(map.querySelector("maplace-location"))).toEqual({ width: 0, height: 0 });
  });

  it("puts its list beside the map by default, and the page's styles win", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map list>${ROME}</maplace-map>`);
    const pane = map.querySelector(".maplace-map-pane");
    const list = map.querySelector('[role="listbox"]');
    expect(list?.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      pane?.getBoundingClientRect().right ?? 0,
    );
    expect(box(list).height).toBe(300);
    const style = document.createElement("style");
    style.textContent = "maplace-map { display: block; }";
    document.head.append(style);
    expect(list?.getBoundingClientRect().top).toBeGreaterThanOrEqual(300);
  });

  it("puts its list on the map in a corner, and builds it again once when its attributes change", async () => {
    const map = await mapFrom(`<maplace-map list list-position="top-left">${ROME}</maplace-map>`);
    const container = lastAdapter().mounted?.container;
    expect(container?.querySelector('[role="listbox"]')).not.toBeNull();
    map.setAttribute("list", "select");
    await nextTask();
    expect(container?.querySelector('[role="listbox"]')).toBeNull();
    expect(container?.querySelector("select")?.textContent).toContain("Rome");
    map.setAttribute("list-position", "outside");
    await nextTask();
    expect(map.lastElementChild?.localName).toBe("select");
  });

  it("refuses a list it can't build, until its attributes are right", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("list", "menu");
    await nextTask();
    expect(errors.map(({ field }) => field)).toEqual(["list"]);
    expect(map.loadState).toBe("error");
    map.setAttribute("list", "");
    await nextTask();
    expect(map.loadState).toBe("loading");
    expect(map.querySelector('[role="listbox"]')).not.toBeNull();
  });
});
