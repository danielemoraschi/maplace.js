import { describe, expect, it, onTestFinished, vi } from "vitest";
import { twoFrames } from "../testing/webgl-canvas";
import type { MaplaceMapElement } from "./index";
import {
  adaptersMade,
  lastAdapter,
  mapFrom,
  nextTask,
  ROME,
  styledPage,
} from "./testing/fake-maps";

/** Pushes what follows it well past the viewport and the margin a lazy map opens within. */
const FAR = '<div style="height: 200vh"></div>';

function lazyPage(): void {
  styledPage();
  onTestFinished(() => scrollTo(0, 0));
}

function mapWith(attributes = 'loading="lazy"'): string {
  return `<maplace-map ${attributes}>${ROME}</maplace-map>`;
}

function listboxIn(map: MaplaceMapElement): Element | null {
  return map.querySelector('[role="listbox"]');
}

describe('<maplace-map loading="lazy">', () => {
  it("asks no provider far from the viewport, its list beside the map built at once", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + mapWith('loading="lazy" list'));
    await twoFrames();
    expect(adaptersMade.length).toBe(before);
    expect([map.loadState, map.matches(":state(idle)")]).toEqual(["idle", true]);
    expect(listboxIn(map)?.textContent).toContain("Rome");
  });

  it("opens its map as it scrolls into view", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + mapWith('loading="lazy" list'));
    await twoFrames();
    const list = listboxIn(map);
    map.scrollIntoView();
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    expect(map.loadState).toBe("loading");
    expect(listboxIn(map)).toBe(list);
  });

  it("opens as soon as it shows when it starts in view", async () => {
    lazyPage();
    const before = adaptersMade.length;
    await mapFrom(mapWith());
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
  });

  it("reads loading set just after it was inserted, as hold is read", async () => {
    lazyPage();
    const before = adaptersMade.length;
    document.body.innerHTML = FAR + mapWith("");
    document.querySelector("maplace-map")?.setAttribute("loading", "lazy");
    await nextTask();
    await twoFrames();
    expect(adaptersMade.length).toBe(before);
  });

  it("waits while hidden in view, and opens once shown", async () => {
    lazyPage();
    const before = adaptersMade.length;
    await mapFrom(`<div id="panel" style="display: none">${mapWith()}</div>`);
    await twoFrames();
    expect(adaptersMade.length).toBe(before);
    document.getElementById("panel")?.removeAttribute("style");
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
  });

  it("waits in a closed <details> in view, and opens once it opens", async () => {
    lazyPage();
    const before = adaptersMade.length;
    await mapFrom(`<details><summary>Map</summary>${mapWith()}</details>`);
    await twoFrames();
    expect(adaptersMade.length).toBe(before);
    document.querySelector("details")?.setAttribute("open", "");
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
  });

  it("loads at once, far from view, with any other value of loading", async () => {
    lazyPage();
    const before = adaptersMade.length;
    await mapFrom(FAR + mapWith('loading="eager"'));
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("release() opens a lazy map at once, far from the viewport", async () => {
    lazyPage();
    const map = await mapFrom(FAR + mapWith());
    const before = adaptersMade.length;
    map.release();
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("loads at once on a later connect once released", async () => {
    lazyPage();
    const map = await mapFrom(FAR + mapWith());
    map.release();
    map.remove();
    await nextTask();
    const before = adaptersMade.length;
    document.body.append(map);
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("waits for release() with hold too, even in view", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(mapWith('hold loading="lazy" list'));
    await twoFrames();
    expect([map.loadState, adaptersMade.length, listboxIn(map)]).toEqual(["idle", before, null]);
    map.release();
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("stops watching once removed", async () => {
    lazyPage();
    const map = await mapFrom(FAR + mapWith());
    const disconnect = vi.spyOn(IntersectionObserver.prototype, "disconnect");
    onTestFinished(() => disconnect.mockRestore());
    map.remove();
    await nextTask();
    expect(disconnect).toHaveBeenCalled();
  });

  it("waits for the view again when connected again", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + mapWith());
    map.scrollIntoView();
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    scrollTo(0, 0);
    map.remove();
    await nextTask();
    document.body.append(map);
    await nextTask();
    await twoFrames();
    expect(adaptersMade.length).toBe(before + 1);
    map.scrollIntoView();
    await expect.poll(() => adaptersMade.length).toBe(before + 2);
  });

  it("keeps its map through a move within one task, and reopens at once on a new provider", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(`<div id="elsewhere"></div>${mapWith()}`);
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    const adapter = lastAdapter();
    document.getElementById("elsewhere")?.append(map);
    await nextTask();
    expect([lastAdapter(), adapter.destroyed]).toEqual([adapter, false]);
    map.setAttribute("provider", "fake");
    expect(adaptersMade.length).toBe(before + 2);
  });
});
