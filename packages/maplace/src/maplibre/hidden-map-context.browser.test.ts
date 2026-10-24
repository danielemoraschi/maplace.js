import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adding, markerDrawable } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre, mountedOnPageMap, mountingMapLibre } from "./testing/mounted";
import { RENDER_WAIT, renderedIds } from "./testing/rendered";
import { removePageMaps } from "./testing/subject";
import { TEST_STYLE } from "./testing/test-style";

afterEach(() => {
  vi.restoreAllMocks();
  unmountAll();
  removePageMaps();
});

const PINS = ["maplace-pins"];

/** The WebGL context MapLibre draws the map with: the canvas's own, never a new one. */
const contextOf = (map: MapLibreMap) =>
  map.getCanvas().getContext("webgl2") as WebGL2RenderingContext;

const hide = (container: HTMLElement) => {
  container.style.display = "none";
};
const show = (container: HTMLElement) => {
  container.style.display = "";
};

/** Two frames: time for a resize observer to report and anything it started to show. */
const twoFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/** How many times MapLibre draws the pin of `id`: once, on a map one world wide. */
const timesDrawn = (map: MapLibreMap, id: string) =>
  map.queryRenderedFeatures({ layers: PINS }).filter(({ properties }) => properties.id === id)
    .length;

const HELD_STYLE = "https://style.test/held.json";

/** Holds `HELD_STYLE` until the returned function answers it with the test style. */
function heldStyle(): () => void {
  let answer = () => {};
  const answered = new Promise<void>((resolve) => {
    answer = resolve;
  });
  const fetchOnline = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (String(input instanceof Request ? input.url : input) !== HELD_STYLE) {
      return fetchOnline(input, init);
    }
    await answered;
    return Response.json(TEST_STYLE);
  });
  return answer;
}

/** How long `deferNextRestore` holds a restore back: as Chromium may, retrying one. */
const RESTORE_DELAY_MS = 100;

/** Holds the next restore of the map's context back by `RESTORE_DELAY_MS`; call while it's live. */
function deferNextRestore(map: MapLibreMap): void {
  const lossControl = contextOf(map).getExtension("WEBGL_lose_context");
  if (lossControl === null) throw new Error("the browser has no WEBGL_lose_context");
  const restore = lossControl.restoreContext.bind(lossControl);
  vi.spyOn(lossControl, "restoreContext").mockImplementationOnce(() => {
    setTimeout(restore, RESTORE_DELAY_MS);
  });
}

/** A created map drawing marker `a`, hidden until its context is given back. */
async function hiddenMapDrawingA() {
  const mounted = await mountedMapLibre();
  await mounted.adapter.apply(adding(markerDrawable("a")));
  hide(mounted.container);
  await vi.waitFor(() => expect(contextOf(mounted.map).isContextLost()).toBe(true), RENDER_WAIT);
  return mounted;
}

describe("a MapLibre map maplace creates, hidden", () => {
  it("gives its WebGL context back", async () => {
    await hiddenMapDrawingA();
  });

  it("takes it back once shown, and draws each location once", async () => {
    const { map, container, host } = await hiddenMapDrawingA();
    show(container);
    await vi.waitFor(() => expect(timesDrawn(map, "a")).toBe(1), RENDER_WAIT);
    expect(contextOf(map).isContextLost()).toBe(false);
    expect(host.reportsOf("reportError")).toEqual([]);
  });

  it("draws once shown a location added while it was hidden", async () => {
    const { map, container, adapter } = await hiddenMapDrawingA();
    await adapter.apply(adding(markerDrawable("b", { lat: 10, lng: 10 })));
    show(container);
    await vi.waitFor(() => expect(renderedIds(map, PINS)).toEqual(["a", "b"]), RENDER_WAIT);
  });

  it("gives back and takes back again on each hide and show", async () => {
    const { map, container } = await hiddenMapDrawingA();
    show(container);
    await vi.waitFor(() => expect(timesDrawn(map, "a")).toBe(1), RENDER_WAIT);
    hide(container);
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(true), RENDER_WAIT);
    show(container);
    await vi.waitFor(() => expect(timesDrawn(map, "a")).toBe(1), RENDER_WAIT);
  });

  it("hidden again while it takes its context back, gives it back once more", async () => {
    const { map, container } = await hiddenMapDrawingA();
    map.once("webglcontextrestored", () => hide(container));
    show(container);
    await vi.waitFor(() => expect(container.style.display).toBe("none"), RENDER_WAIT);
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(true), RENDER_WAIT);
    show(container);
    await vi.waitFor(() => expect(timesDrawn(map, "a")).toBe(1), RENDER_WAIT);
  });

  it("shown again before the browser reports the loss, takes its context back", async () => {
    const { map, container, probe } = await mountedMapLibre();
    await probe.settle();
    hide(container);
    await probe.settle();
    show(container);
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(false), RENDER_WAIT);
  });

  it("hidden before its context is back, gives it back once it is", async () => {
    const { map, container } = await mountedMapLibre();
    deferNextRestore(map);
    hide(container);
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(true), RENDER_WAIT);
    const restored = new Promise((resolve) => map.once("webglcontextrestored", resolve));
    show(container);
    await twoFrames();
    hide(container);
    await restored;
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(true), RENDER_WAIT);
  });

  it("destroyed before its context is back, gives it back once it is", async () => {
    const { map, container, destroy } = await mountedMapLibre();
    const context = contextOf(map);
    deferNextRestore(map);
    hide(container);
    await vi.waitFor(() => expect(context.isContextLost()).toBe(true), RENDER_WAIT);
    show(container);
    await twoFrames();
    destroy();
    await new Promise((resolve) => setTimeout(resolve, 2 * RESTORE_DELAY_MS));
    expect(context.isContextLost()).toBe(true);
  });

  // The loss is seen at once; MapLibre hears of it a task later. Hidden in between, the watch
  // mustn't take the context for its own: a resize observed first is what this test catches.
  it("never takes back a context lost elsewhere, as the browser restores no other", async () => {
    const { map, container } = await mountedMapLibre();
    const lossControl = contextOf(map).getExtension("WEBGL_lose_context");
    if (lossControl === null) throw new Error("the browser has no WEBGL_lose_context");
    const restored = vi.spyOn(lossControl, "restoreContext");
    lossControl.loseContext();
    await vi.waitFor(() => expect(contextOf(map).isContextLost()).toBe(true), RENDER_WAIT);
    hide(container);
    await twoFrames();
    show(container);
    await twoFrames();
    expect(restored).not.toHaveBeenCalled();
  });

  it("mounted hidden, its style answered late, gets ready and draws once shown", async () => {
    const answerStyle = heldStyle();
    const { adapter, container, mounting, state } = mountingMapLibre({ mapStyle: HELD_STYLE });
    hide(container);
    await twoFrames();
    answerStyle();
    await mounting;
    const map = state.mounted?.map;
    if (map === undefined) throw new Error("the mount opened no map");
    await adapter.apply(adding(markerDrawable("a")));
    show(container);
    await vi.waitFor(() => expect(timesDrawn(map, "a")).toBe(1), RENDER_WAIT);
  });

  it("left alone once destroyed: its container shown again takes nothing back", async () => {
    const { map, container, destroy } = await hiddenMapDrawingA();
    const context = contextOf(map);
    const logged = vi.spyOn(console, "error");
    destroy();
    show(container);
    await twoFrames();
    expect(context.isContextLost()).toBe(true);
    expect(logged).not.toHaveBeenCalled();
  });
});

describe("a MapLibre map keeps its WebGL context", () => {
  it("scrolled off screen, laid out", async () => {
    const { map, container } = await mountedMapLibre();
    container.style.marginTop = `${innerHeight * 2}px`;
    await twoFrames();
    expect(contextOf(map).isContextLost()).toBe(false);
  });

  it("the page's own, hidden", async () => {
    const { map, container } = await mountedOnPageMap();
    hide(container);
    await twoFrames();
    expect(contextOf(map).isContextLost()).toBe(false);
  });
});
