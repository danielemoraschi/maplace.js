/// <reference types="google.maps" preserve="true" />
import {
  dotOpacityAt,
  HEAT_FADE_ZOOMS,
  heatIntensityAt,
  heatOpacityAt,
  heatRadiusAt,
} from "../adapter-kit/heat-look";
import { adoptStyles } from "../adopted-styles";
import { drawHeat, type HeatPixel, heatPalette } from "./heat-canvas";
import {
  createHeatDots,
  DOTS_OPACITY,
  HEAT_DOT_STYLES,
  type HeatDots,
  UNDER_HEAT_ATTRIBUTE,
} from "./heat-dot";
import {
  type HeatFrame,
  type HeatPoint,
  heatPointsOf,
  pixelCopies,
  samePoints,
} from "./heat-points";
import type { GoogleMapState } from "./map-state";
import type { MountedMap } from "./mounted-map";

/**
 * A heatmap on a Google map, loaded only for a store that asks for one: the heat markers drawn as
 * heat on a canvas in the overlay pane below `maxZoom`, and their dots faded in over the zooms
 * before it (`heat-dot.ts`).
 */
export interface GoogleHeat {
  open(mounted: MountedMap, state: GoogleMapState): void;
  /** After a diff: the dots weighed again if the heaviest changed, and the heat drawn again. */
  drawn(): void;
  /** After a presentation: the heat drawn again only if what is hidden changed. */
  presented(): void;
  /** Shows a heat marker as its dot, with `pin` over it while in front. */
  showMarker: HeatDots["show"];
}

export function createGoogleHeat(maxZoom: number): GoogleHeat {
  const dots = createHeatDots();
  let open: OpenHeat | undefined;
  return {
    open(mounted, state) {
      open = openHeat({ mounted, state, dots, maxZoom });
    },
    drawn: () => open?.drawn(),
    presented: () => open?.presented(),
    showMarker: dots.show,
  };
}

type OpenHeat = Pick<GoogleHeat, "drawn" | "presented">;

/** What the heat draws on and from: the open map, the adapter's state, the dots and `maxZoom`. */
interface HeatSite {
  readonly mounted: MountedMap;
  readonly state: GoogleMapState;
  readonly dots: HeatDots;
  readonly maxZoom: number;
}

function openHeat({ mounted, state, dots, maxZoom }: HeatSite): OpenHeat {
  const { map, libraries } = mounted;
  const container = map.getDiv();
  const document = container.ownerDocument;
  adoptStyles(document, HEAT_DOT_STYLES);
  const canvas = heatCanvas(document);
  const palette = heatPalette(document);
  const overlay = new libraries.maps.OverlayView();
  /** The heat markers shown, weighed: worked out again after a diff, or when the hidden change. */
  let points: readonly HeatPoint[] = [];
  let weighedHidden: ReadonlySet<string> | undefined;
  /** The points' pixels, refilled at each draw rather than made anew. */
  const pixels: HeatPixel[] = [];

  /** Works the points out again; whether they changed, so the heat needs drawing again. */
  function weigh(): boolean {
    weighedHidden = state.presented.hiddenIds;
    const weighed = heatPointsOf(state.placed.values(), state.presented, dots.heaviest());
    const changed = !samePoints(points, weighed);
    points = weighed;
    return changed;
  }

  /** The dots' opacity through the fade, and hidden below it, set on the container at once. */
  function fadeDots(): void {
    const zoom = map.getZoom() ?? 0;
    container.style.setProperty(DOTS_OPACITY, String(dotOpacityAt(zoom, maxZoom)));
    container.toggleAttribute(UNDER_HEAT_ATTRIBUTE, zoom < maxZoom - HEAT_FADE_ZOOMS);
  }

  /**
   * Draws the heat over the view, the canvas placed at its top-left in the overlay pane (which
   * moves as the map pans): inside Google's `draw`, so the heat never lags behind a pan.
   */
  function draw(): void {
    const projection = overlay.getProjection();
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!projection || center === undefined || zoom === undefined) return;
    const middle = projection.fromLatLngToDivPixel(center);
    if (middle === null) return;
    const { clientWidth: width, clientHeight: height } = container;
    const radius = heatRadiusAt(zoom, maxZoom);
    const frame = {
      left: middle.x - width / 2,
      top: middle.y - height / 2,
      width,
      height,
      radius,
      worldWidth: projection.getWorldWidth(),
    };
    placeCanvas(canvas, frame, heatOpacityAt(zoom, maxZoom));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context === null) return;
    pixels.length = 0;
    if (zoom < maxZoom) project(projection, frame);
    drawHeat(context, pixels, { radius, intensity: heatIntensityAt(zoom, maxZoom), palette });
  }

  function project(projection: google.maps.MapCanvasProjection, frame: HeatFrame): void {
    for (const { at, weight } of points) {
      const pixel = projection.fromLatLngToDivPixel(at);
      if (pixel !== null) pixelCopies(pixel, weight, frame, pixels);
    }
  }

  weigh();
  overlay.onAdd = () => {
    (overlay.getPanes()?.overlayLayer as HTMLElement | undefined)?.append(canvas);
    fadeDots();
  };
  overlay.draw = draw;
  overlay.onRemove = () => canvas.remove();
  const zooming = map.addListener("zoom_changed", fadeDots);
  overlay.setMap(map);
  mounted.onDestroy(() => {
    zooming.remove();
    overlay.setMap(null);
    container.style.removeProperty(DOTS_OPACITY);
    container.removeAttribute(UNDER_HEAT_ATTRIBUTE);
  });

  return {
    drawn() {
      dots.reweigh(state.placed);
      if (weigh()) draw();
    },
    presented() {
      if (state.presented.hiddenIds !== weighedHidden && weigh()) draw();
    },
  };
}

function heatCanvas(document: Document): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";
  return canvas;
}

/** The canvas over the view, one pixel per CSS pixel: the heat is a blur at any density. */
function placeCanvas(
  canvas: HTMLCanvasElement,
  { left, top, width, height }: HeatFrame,
  opacity: number,
): void {
  canvas.style.left = `${left}px`;
  canvas.style.top = `${top}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.opacity = String(opacity);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}
