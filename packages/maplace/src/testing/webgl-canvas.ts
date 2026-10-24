/**
 * A canvas in `element` drawn on with WebGL 2, as a map's: its loss `preventDefault()`ed, as
 * MapLibre and Maps JS do, keeping the right to a restore.
 */
export function drawnCanvasIn(element: HTMLElement): WebGL2RenderingContext {
  const canvas = document.createElement("canvas");
  element.append(canvas);
  const gl = canvas.getContext("webgl2");
  if (gl === null) throw new Error("the browser gives no webgl2 context");
  canvas.addEventListener("webglcontextlost", (event) => event.preventDefault());
  return gl;
}

/** The extension that loses and restores `gl`, as the page may. */
export function lossControlOf(gl: WebGL2RenderingContext): WEBGL_lose_context {
  const lossControl = gl.getExtension("WEBGL_lose_context");
  if (lossControl === null) throw new Error("the browser has no WEBGL_lose_context");
  return lossControl;
}

/** How long `deferNextRestore` holds a restore back. */
const RESTORE_DELAY_MS = 100;

/** Holds the next restore of `gl` back, as Chromium may; later ones run at once. */
export function deferNextRestore(gl: WebGL2RenderingContext): void {
  const lossControl = lossControlOf(gl);
  const restore = lossControl.restoreContext;
  lossControl.restoreContext = () => {
    lossControl.restoreContext = restore;
    setTimeout(() => restore.call(lossControl), RESTORE_DELAY_MS);
  };
}

/** The next time `gl` is lost or restored. */
export function nextContextEvent(
  gl: WebGL2RenderingContext,
  type: "webglcontextlost" | "webglcontextrestored",
): Promise<Event> {
  return new Promise((resolve) => gl.canvas.addEventListener(type, resolve, { once: true }));
}

/** Gives `gl` back and removes its canvas: a test's context leaves the browser's ~16. */
export function freeContext(gl: WebGL2RenderingContext): void {
  if (!gl.isContextLost()) lossControlOf(gl).loseContext();
  (gl.canvas as HTMLCanvasElement).remove();
}

export function hide(element: HTMLElement): void {
  element.style.display = "none";
}

export function show(element: HTMLElement): void {
  element.style.display = "";
}

/** Two frames: time for a resize observer to report and anything it started to show. */
export const twoFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
