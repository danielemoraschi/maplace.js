import { hasSize, sizeOf } from "./map-size";

/** A map drawing on a WebGL 2 canvas, as far as giving its context back goes. */
export interface ContextOwner {
  /** Whose size says whether the map shows. */
  readonly element: HTMLElement;
  /** The canvas the map draws on, its `webgl2` context made already: the watch never makes one. */
  readonly canvas: HTMLCanvasElement;
  /**
   * Runs `run` once the map can lose its context and draw again whole once it's back: now if it
   * can.
   */
  whenReady(run: () => void): void;
}

/**
 * The map's WebGL context as this watch knows it: `losing` once given back here, until the map
 * has seen the loss, after which the browser lets it be taken back; `restoring` once taken back,
 * until the map has it again.
 */
type ContextState = "live" | "losing" | "lost" | "restoring";

/**
 * Gives the map's WebGL context back while its element has no size (hidden, `display: none`, a
 * closed tab), and takes it back once it has one, until the returned function stops it. A browser
 * keeps about 16 contexts per page and takes the oldest one away past that, blanking a map on
 * screen, so maps kept hidden mustn't count.
 *
 * Only a context lost here is taken back, once the map has seen the loss: the browser restores no
 * other, and the map would stay blank. The watch listens on the canvas after the map's own
 * listeners, which the map added when it made the context. Stopping leaves the context given
 * back: the map is going.
 */
export function giveBackContextWhileHidden({
  element,
  canvas,
  whenReady,
}: ContextOwner): () => void {
  const gl = canvas.getContext("webgl2");
  const lossControl = gl?.getExtension("WEBGL_lose_context");
  if (!(gl && lossControl)) return () => {};
  let context: ContextState = "live";
  let stopped = false;
  const isShown = () => hasSize(sizeOf(element));

  const followSize = () => {
    if (stopped) return;
    const shown = isShown();
    if (!shown && context === "live") whenReady(giveBackIfHidden);
    else if (shown && context === "lost") takeBack();
  };
  const giveBackIfHidden = () => {
    if (stopped || context !== "live" || isShown()) return;
    // Lost elsewhere (the browser, the page), the map not told yet: not this watch's to take back.
    if (gl.isContextLost()) return;
    context = "losing";
    lossControl.loseContext();
  };
  const takeBack = () => {
    context = "restoring";
    lossControl.restoreContext();
  };
  const lost = () => {
    if (context === "losing") context = "lost";
    // The browser allows a restore only once the loss's dispatch is over: a task later.
    setTimeout(followSize);
  };
  const restored = () => {
    context = "live";
    // Hidden while it came back: given back again a task later, once the map has set itself up
    // on the restored context (MapLibre sets its style back there).
    setTimeout(followSize);
  };

  const observer = new ResizeObserver(followSize);
  observer.observe(element);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return () => {
    stopped = true;
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
    if (!gl.isContextLost()) lossControl.loseContext();
    // A restore to come, this watch's or another's, would bring the context back on a canvas no
    // map uses any more.
    canvas.addEventListener("webglcontextrestored", () => lossControl.loseContext(), {
      once: true,
    });
  };
}
