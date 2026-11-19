import type { Map as MapLibreMap } from "maplibre-gl";
import type { PinColours } from "../adapter-kit/pin-palette";

/** The default marker's image, by name on the map. */
export const PIN_IMAGE = "maplace-pin";

/** The pin's size in CSS pixels, its tip at the bottom middle, as Google's default pin. */
export const PIN_SIZE = { width: 27, height: 43 } as const;

/** Drawn at twice its size, so it stays sharp on high-density screens. */
const PIXEL_RATIO = 2;

/** Google's pin colours: red, darker at the edge and the dot. */
const BODY = "#ea4335";
const EDGE = "#b31412";

/** Adds the default marker's pin, in `colours`, to the map's images, once. */
export function addPinImage(map: MapLibreMap, colours: PinColours): void {
  if (map.hasImage(PIN_IMAGE)) return;
  const drawn = drawnPin(map.getContainer().ownerDocument, colours);
  if (drawn === undefined) return;
  const { width, height } = drawn.canvas;
  map.addImage(PIN_IMAGE, drawn.getImageData(0, 0, width, height), { pixelRatio: PIXEL_RATIO });
}

/**
 * The pins drawn, as image URLs, by the colours they are drawn in: a map's palette keeps its
 * colours for its life, so a hit is one lookup; a data URL shows in any document.
 */
const urls = new WeakMap<PinColours, string>();

/** The pin in `colours` as an image URL, drawn once per colours, for the pins in the DOM. */
export function pinImageUrl(document: Document, colours: PinColours): string {
  let url = urls.get(colours);
  if (url === undefined) {
    url = drawnPin(document, colours)?.canvas.toDataURL() ?? "";
    urls.set(colours, url);
  }
  return url;
}

/** The default pin in `colours` as an image, sized as the layer's, its tip at the bottom middle. */
export function createPinIcon(document: Document, colours: PinColours): HTMLImageElement {
  const image = document.createElement("img");
  paintPin(image, colours);
  image.alt = "";
  image.width = PIN_SIZE.width;
  image.height = PIN_SIZE.height;
  return image;
}

/** Shows the pin in `colours` in `image`, changing its source only when that is another. */
export function paintPin(image: HTMLImageElement, colours: PinColours): void {
  const url = pinImageUrl(image.ownerDocument, colours);
  if (image.getAttribute("src") !== url) image.src = url;
}

/** The pin drawn on a canvas at `PIXEL_RATIO`; none where the browser gives no 2D context. */
function drawnPin(document: Document, colours: PinColours): CanvasRenderingContext2D | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = PIN_SIZE.width * PIXEL_RATIO;
  canvas.height = PIN_SIZE.height * PIXEL_RATIO;
  const context = canvas.getContext("2d");
  if (context === null) return undefined;
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  drawPin(context, colours);
  return context;
}

/**
 * A teardrop: a round head over a point at the bottom middle, with a dot in the head, in
 * `colours`, Google's where one is unset.
 */
function drawPin(context: CanvasRenderingContext2D, colours: PinColours): void {
  const middle = PIN_SIZE.width / 2;
  const radius = middle - 1.5;
  const headY = radius + 1.5;
  const tipY = PIN_SIZE.height - 1;
  context.beginPath();
  context.moveTo(middle, tipY);
  context.bezierCurveTo(
    middle - 2,
    tipY - 12,
    middle - radius,
    headY + radius * 0.7,
    middle - radius,
    headY,
  );
  context.arc(middle, headY, radius, Math.PI, 0);
  context.bezierCurveTo(middle + radius, headY + radius * 0.7, middle + 2, tipY - 12, middle, tipY);
  context.closePath();
  // Google's colour first: a canvas ignores a colour it can't parse, which CSS may still accept.
  context.fillStyle = BODY;
  context.fillStyle = colours.background ?? BODY;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = EDGE;
  context.strokeStyle = colours.border ?? EDGE;
  context.stroke();
  context.beginPath();
  context.arc(middle, headY, radius * 0.38, 0, 2 * Math.PI);
  context.fillStyle = EDGE;
  context.fillStyle = colours.glyph ?? EDGE;
  context.fill();
}
