import type { Map as MapLibreMap } from "maplibre-gl";

/** The default marker's image, by name on the map. */
export const PIN_IMAGE = "maplace-pin";

/** The pin's size in CSS pixels, its tip at the bottom middle, as Google's default pin. */
export const PIN_SIZE = { width: 27, height: 43 } as const;

/** Drawn at twice its size, so it stays sharp on high-density screens. */
const PIXEL_RATIO = 2;

/** Google's pin colours: red, darker at the edge and the dot. */
const BODY = "#ea4335";
const EDGE = "#b31412";

/** Adds the default marker's pin to the map's images, once. */
export function addPinImage(map: MapLibreMap): void {
  if (map.hasImage(PIN_IMAGE)) return;
  const canvas = pinCanvas(map.getContainer().ownerDocument);
  const context = canvas?.getContext("2d");
  if (canvas === undefined || !context) return;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  map.addImage(PIN_IMAGE, image, { pixelRatio: PIXEL_RATIO });
}

/** The pin as an image URL, drawn once per document, for the pins drawn again in front. */
const urls = new WeakMap<Document, string>();

export function pinImageUrl(document: Document): string {
  let url = urls.get(document);
  if (url === undefined) {
    url = pinCanvas(document)?.toDataURL() ?? "";
    urls.set(document, url);
  }
  return url;
}

/** The pin drawn on a canvas at `PIXEL_RATIO`; none where the browser gives no 2D context. */
function pinCanvas(document: Document): HTMLCanvasElement | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = PIN_SIZE.width * PIXEL_RATIO;
  canvas.height = PIN_SIZE.height * PIXEL_RATIO;
  const context = canvas.getContext("2d");
  if (context === null) return undefined;
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  drawPin(context);
  return canvas;
}

/** A teardrop: a round head over a point at the bottom middle, with a dot in the head. */
function drawPin(context: CanvasRenderingContext2D): void {
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
  context.fillStyle = BODY;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = EDGE;
  context.stroke();
  context.beginPath();
  context.arc(middle, headY, radius * 0.38, 0, 2 * Math.PI);
  context.fillStyle = EDGE;
  context.fill();
}
