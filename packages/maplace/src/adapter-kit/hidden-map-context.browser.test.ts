import { describe, expect, it, onTestFinished, vi } from "vitest";
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
import { type ContextOwner, giveBackContextWhileHidden } from "./hidden-map-context";

const READY_NOW: ContextOwner["whenReady"] = (run) => run();

/** A sized element drawing on a WebGL 2 canvas, its context watched until the test ends. */
function watched({ whenReady = READY_NOW } = {}) {
  const element = sizedContainer();
  const gl = drawnCanvasIn(element);
  const canvas = gl.canvas as HTMLCanvasElement;
  const releaseContext = giveBackContextWhileHidden({ element, canvas, whenReady });
  onTestFinished(() => {
    releaseContext();
    freeContext(gl);
    element.remove();
  });
  return { element, gl, releaseContext };
}

const lostSoon = (gl: WebGL2RenderingContext, lost = true) =>
  vi.waitFor(() => expect(gl.isContextLost()).toBe(lost));

describe("a map's WebGL context, watched", () => {
  it("is given back while its element has no size, and taken back once it has one", async () => {
    const { element, gl } = watched();
    hide(element);
    await lostSoon(gl);
    show(element);
    await lostSoon(gl, false);
  });

  it("is given back only once the map is ready", async () => {
    let ready = () => {};
    const { element, gl } = watched({
      whenReady: (run) => {
        ready = run;
      },
    });
    hide(element);
    await twoFrames();
    expect(gl.isContextLost()).toBe(false);
    ready();
    await lostSoon(gl);
  });

  // The loss is seen at once; the map hears of it a task later. Hidden in between, the watch
  // mustn't take the context for its own.
  it("is never taken back when lost elsewhere, as the browser restores no other", async () => {
    const { element, gl } = watched();
    const restore = vi.spyOn(lossControlOf(gl), "restoreContext");
    lossControlOf(gl).loseContext();
    hide(element);
    await twoFrames();
    show(element);
    await twoFrames();
    expect(restore).not.toHaveBeenCalled();
  });

  it("shown again before the loss is reported, is taken back once the loss is over", async () => {
    const { element, gl } = watched();
    const lossControl = lossControlOf(gl);
    const loseContext = lossControl.loseContext.bind(lossControl);
    vi.spyOn(lossControl, "loseContext").mockImplementationOnce(() => {
      loseContext();
      show(element);
    });
    const lost = nextContextEvent(gl, "webglcontextlost");
    hide(element);
    await lost;
    await lostSoon(gl, false);
  });

  it("hidden while it comes back, is given back once restored", async () => {
    const { element, gl } = watched();
    deferNextRestore(gl);
    hide(element);
    await lostSoon(gl);
    const restored = nextContextEvent(gl, "webglcontextrestored");
    show(element);
    await twoFrames();
    hide(element);
    await restored;
    await lostSoon(gl);
  });

  it("released before it's back, is given back once it is", async () => {
    const { element, gl, releaseContext } = watched();
    deferNextRestore(gl);
    hide(element);
    await lostSoon(gl);
    const restored = nextContextEvent(gl, "webglcontextrestored");
    show(element);
    await twoFrames();
    releaseContext();
    await restored;
    await lostSoon(gl);
  });

  it("released while live, is given back, and again once something restores it", async () => {
    const { gl, releaseContext } = watched();
    const lossControl = lossControlOf(gl);
    releaseContext();
    expect(gl.isContextLost()).toBe(true);
    await twoFrames();
    const restored = nextContextEvent(gl, "webglcontextrestored");
    lossControl.restoreContext();
    await restored;
    await lostSoon(gl);
  });

  it("released while lost elsewhere, is given back once the browser restores it", async () => {
    const { gl, releaseContext } = watched();
    const lossControl = lossControlOf(gl);
    lossControl.loseContext();
    await nextContextEvent(gl, "webglcontextlost");
    await twoFrames();
    releaseContext();
    const restored = nextContextEvent(gl, "webglcontextrestored");
    lossControl.restoreContext();
    await restored;
    await lostSoon(gl);
  });

  it("released, is taken back no more once shown again", async () => {
    const { element, gl, releaseContext } = watched();
    hide(element);
    await lostSoon(gl);
    releaseContext();
    show(element);
    await twoFrames();
    await new Promise((resolve) => setTimeout(resolve));
    expect(gl.isContextLost()).toBe(true);
  });

  it("is no business of a canvas with no webgl2 context", () => {
    const element = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.getContext("2d");
    element.append(canvas);
    const releaseContext = giveBackContextWhileHidden({ element, canvas, whenReady: READY_NOW });
    expect(releaseContext).not.toThrow();
  });
});
