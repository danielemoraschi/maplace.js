import { describe, expect, it, onTestFinished } from "vitest";
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

  it("is 24rem tall when the page gives it no height", async () => {
    styledPage("maplace-map { width: 600px; }");
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    expect(box(map.querySelector(".maplace-map-pane"))).toEqual({ width: 600, height: 384 });
  });

  it("takes the height its layout gives it when the page sets its height to auto", async () => {
    styledPage(
      ".box { position: relative; width: 600px; height: 500px; } maplace-map { position: absolute; inset: 0; height: auto; }",
    );
    const map = await mapFrom(`<div class="box"><maplace-map>${ROME}</maplace-map></div>`);
    expect(box(map.querySelector(".maplace-map-pane"))).toEqual({ width: 600, height: 500 });
  });

  it("puts its list beside the map by default, as tall as the map", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map list>${ROME}</maplace-map>`);
    const pane = map.querySelector(".maplace-map-pane");
    const list = map.querySelector('[role="listbox"]');
    expect(list?.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      pane?.getBoundingClientRect().right ?? 0,
    );
    expect(box(list).height).toBe(300);
  });

  it("lets the page's styles place its list", async () => {
    styledPage("maplace-map { width: 600px; height: 300px; display: block; }");
    const map = await mapFrom(`<maplace-map list>${ROME}</maplace-map>`);
    const list = map.querySelector('[role="listbox"]');
    expect(list?.getBoundingClientRect().top).toBeGreaterThanOrEqual(300);
  });

  it("puts its list on the map in a corner", async () => {
    await mapFrom(`<maplace-map list list-position="top-left">${ROME}</maplace-map>`);
    const container = lastAdapter().mounted?.container;
    expect(container?.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it("builds its list again, where its attributes now say, when they change", async () => {
    const map = await mapFrom(`<maplace-map list list-position="top-left">${ROME}</maplace-map>`);
    const container = lastAdapter().mounted?.container;
    map.setAttribute("list", "select");
    await nextTask();
    expect(container?.querySelector('[role="listbox"]')).toBeNull();
    expect(container?.querySelector("select")?.textContent).toContain("Rome");
    map.setAttribute("list-position", "outside");
    await nextTask();
    expect(map.lastElementChild?.localName).toBe("select");
  });

  it("builds its list again once for the attributes a page sets together", async () => {
    const map = await mapFrom(`<maplace-map list>${ROME}</maplace-map>`);
    const added: Node[] = [];
    const watch = new MutationObserver((records) => {
      for (const { addedNodes } of records) added.push(...addedNodes);
    });
    watch.observe(map, { childList: true });
    onTestFinished(() => watch.disconnect());
    map.setAttribute("fit-all-label", "All towns");
    map.setAttribute("list-heading", "Towns");
    await nextTask();
    expect(added).toEqual([map.querySelector(".maplace-list")]);
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
