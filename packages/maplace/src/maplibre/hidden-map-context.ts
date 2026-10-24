import type { Map as MapLibreMap } from "maplibre-gl";
import { hasSize, sizeOf } from "../adapter-kit/map-size";
import { whenStyleLoaded } from "./style-load";

/**
 * The map's WebGL context as this watch knows it: `losing` once given back here, until MapLibre
 * has seen the loss, after which the browser lets it be taken back.
 */
type ContextState = "live" | "losing" | "lost";

/**
 * Gives the map's WebGL context back while its element has no size (hidden, `display: none`, a
 * closed tab), and takes it back once it has one, until the returned function stops it. A browser
 * keeps about 16 contexts per page and takes the oldest one away past that, blanking a map on
 * screen, so maps kept hidden mustn't count. MapLibre saves its style when the context goes and
 * sets it back when it returns, maplace's sources and layers with it (`drawing.ts`).
 *
 * Only a context lost here is taken back, once MapLibre has seen the loss: the browser restores no
 * other, and the map would stay blank. And it's given back only while the map has its style, which
 * MapLibre saves: lost before it loads, or while a restore sets it back, the style would be gone.
 */
export function giveBackContextWhileHidden(map: MapLibreMap): () => void {
  const gl = map.getCanvas().getContext("webgl2");
  const lossControl = gl?.getExtension("WEBGL_lose_context");
  if (!(gl && lossControl)) return () => {};
  const element = map.getContainer();
  let context: ContextState = "live";
  let stopped = false;

  const followSize = () => {
    if (stopped) return;
    const shown = hasSize(sizeOf(element));
    if (!shown && context === "live") giveBack();
    else if (shown && context === "lost") takeBack();
  };
  const giveBack = () => {
    // No style while lost: on its way back, the restore's style load calls again.
    if (map.getStyle() === undefined) return whenStyleLoaded(map, followSize);
    // Lost elsewhere (the browser, the page), MapLibre not told yet: not this watch's to take back.
    if (gl.isContextLost()) return;
    context = "losing";
    lossControl.loseContext();
  };
  const takeBack = () => {
    context = "live";
    lossControl.restoreContext();
  };
  const lost = () => {
    if (context === "losing") context = "lost";
    // The browser allows a restore only once the loss's dispatch is over: a task later.
    setTimeout(followSize);
  };

  const observer = new ResizeObserver(followSize);
  observer.observe(element);
  map.on("webglcontextlost", lost);
  return () => {
    stopped = true;
    observer.disconnect();
    map.off("webglcontextlost", lost);
    // A restore under way would bring the context back on a canvas no map uses any more.
    if (context === "live" && gl.isContextLost()) {
      gl.canvas.addEventListener("webglcontextrestored", () => lossControl.loseContext(), {
        once: true,
      });
    }
  };
}
