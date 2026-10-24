import { afterEach, describe, expect, it, vi } from "vitest";
import { sizedContainer } from "../testing/container";
import {
  deferNextRestore,
  drawnCanvasIn,
  freeContext,
  hide,
  lossControlOf,
  nextContextEvent,
  show,
  twoFrames,
} from "../testing/webgl-canvas";
import { type MapInUse, mapSourceFor } from "./map-source";
import { StubMap, stubLibraries } from "./testing/stub-libraries";

const opened: MapInUse[] = [];
const contexts: WebGL2RenderingContext[] = [];

afterEach(() => {
  for (const { release } of opened.splice(0)) release();
  for (const gl of contexts.splice(0)) freeContext(gl);
  document.body.replaceChildren();
});

/** A map maplace creates, in a container on the page, with Google's rendering type. */
function createdMap(renderingType: "VECTOR" | "RASTER" = "VECTOR") {
  const container = sizedContainer();
  const inUse = mapSourceFor({ mapId: "id" }).open(container, stubLibraries());
  opened.push(inUse);
  const stub = inUse.map as unknown as StubMap;
  stub.renderingType = renderingType;
  return { container, stub, release: inUse.release };
}

/** Adds the WebGL 2 canvas Google draws a map on to its div, before Google says it has drawn. */
function addCanvas(stub: StubMap): WebGL2RenderingContext {
  const gl = drawnCanvasIn(stub.element);
  contexts.push(gl);
  return gl;
}

/** A vector map maplace creates, drawn on: its canvas made, then Google's `idle`. */
function vectorMapDrawn() {
  const map = createdMap();
  const gl = addCanvas(map.stub);
  map.stub.trigger("idle");
  return { ...map, gl };
}

const lostSoon = (gl: WebGL2RenderingContext, lost = true) =>
  vi.waitFor(() => expect(gl.isContextLost()).toBe(lost));

describe("a vector Google map maplace creates", () => {
  it("gives its WebGL context back while hidden, and takes it back once shown", async () => {
    const { container, gl } = vectorMapDrawn();
    hide(container);
    await lostSoon(gl);
    show(container);
    await lostSoon(gl, false);
  });

  it("gives its context back for good once released", async () => {
    const { gl, release } = vectorMapDrawn();
    const lossControl = lossControlOf(gl);
    release();
    expect(gl.isContextLost()).toBe(true);
    await twoFrames();
    const restored = nextContextEvent(gl, "webglcontextrestored");
    lossControl.restoreContext();
    await restored;
    await lostSoon(gl);
  });

  it("hidden while its context comes back, gives it back once restored", async () => {
    const { container, gl } = vectorMapDrawn();
    deferNextRestore(gl);
    hide(container);
    await lostSoon(gl);
    const restored = nextContextEvent(gl, "webglcontextrestored");
    show(container);
    await twoFrames();
    hide(container);
    await restored;
    await lostSoon(gl);
  });

  it("waits for Google to draw: a canvas before the first idle keeps its context", async () => {
    const { container, stub } = createdMap();
    const gl = addCanvas(stub);
    hide(container);
    await twoFrames();
    expect(gl.isContextLost()).toBe(false);
  });

  it("follows a canvas Google replaces: the old one given back, the new one while hidden", async () => {
    const { container, stub, gl: old } = vectorMapDrawn();
    (old.canvas as HTMLCanvasElement).remove();
    const gl = addCanvas(stub);
    stub.trigger("idle");
    expect(old.isContextLost()).toBe(true);
    hide(container);
    await lostSoon(gl);
  });

  it("keeps watching its canvas while it's in the div, whatever canvas comes before it", async () => {
    const { container, stub, gl } = vectorMapDrawn();
    stub.element.prepend(document.createElement("canvas"));
    stub.trigger("idle");
    expect(gl.isContextLost()).toBe(false);
    hide(container);
    await lostSoon(gl);
  });

  it("taken off the page with its canvas and put back, still takes its context back", async () => {
    const { container, stub, gl } = vectorMapDrawn();
    container.remove();
    stub.trigger("idle");
    document.body.append(container);
    hide(container);
    await lostSoon(gl);
    show(container);
    await lostSoon(gl, false);
  });
});

describe("a Google map keeps its WebGL context", () => {
  it("raster, even with a webgl2 canvas in its div", async () => {
    const { container, stub } = createdMap("RASTER");
    const gl = addCanvas(stub);
    stub.trigger("idle");
    hide(container);
    await twoFrames();
    expect(gl.isContextLost()).toBe(false);
  });

  it("the page's own, hidden and released", async () => {
    const element = sizedContainer();
    const pageMap = new StubMap(element);
    pageMap.renderingType = "VECTOR";
    const { release } = mapSourceFor({ map: pageMap as never }).open(element, stubLibraries());
    const gl = addCanvas(pageMap);
    pageMap.trigger("idle");
    hide(element);
    await twoFrames();
    release();
    expect(gl.isContextLost()).toBe(false);
  });
});
