import { HEAT_COLORS } from "../adapter-kit/heat-look";

/** A heat point where the canvas draws it, in its pixels, with its weight, 0 to 1. */
export interface HeatPixel {
  readonly x: number;
  readonly y: number;
  readonly weight: number;
}

/** How the heat is drawn: each point's spread, the heat's strength, and its colours. */
export interface HeatBrush {
  readonly radius: number;
  readonly intensity: number;
  /** 256 colours, RGBA, by density (`heatPalette`). */
  readonly palette: Uint8ClampedArray;
}

/** How much one point of full weight at full strength adds to the density at its centre. */
const DENSITY_PER_POINT = 0.25;

/**
 * Draws `points` as heat on `context`'s whole canvas: a soft disc of density stamped per point, its
 * alpha its weight, the discs adding up; then each pixel coloured by its density through the
 * palette. Nothing to draw leaves the canvas clear, without reading it back.
 */
export function drawHeat(
  context: CanvasRenderingContext2D,
  points: readonly HeatPixel[],
  { radius, intensity, palette }: HeatBrush,
): void {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  if (points.length === 0 || width === 0 || height === 0) return;
  // Whole pixels, so a zoom's fractional radii share a handful of discs.
  const spread = Math.max(1, Math.round(radius));
  const disc = discOf(context.canvas.ownerDocument, spread);
  for (const { x, y, weight } of points) {
    context.globalAlpha = Math.min(1, weight * intensity * DENSITY_PER_POINT);
    context.drawImage(disc, x - spread, y - spread);
  }
  context.globalAlpha = 1;
  const { left, top, right, bottom } = stampedBox(points, spread, width, height);
  if (right <= left || bottom <= top) return;
  const image = context.getImageData(left, top, right - left, bottom - top);
  colourByDensity(image.data, palette);
  context.putImageData(image, left, top);
}

/** The canvas pixels the discs cover, so only those are read back and coloured. */
function stampedBox(points: readonly HeatPixel[], spread: number, width: number, height: number) {
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  for (const { x, y } of points) {
    left = Math.min(left, x - spread);
    top = Math.min(top, y - spread);
    right = Math.max(right, x + spread);
    bottom = Math.max(bottom, y + spread);
  }
  return {
    left: Math.max(0, Math.floor(left)),
    top: Math.max(0, Math.floor(top)),
    right: Math.min(width, Math.ceil(right)),
    bottom: Math.min(height, Math.ceil(bottom)),
  };
}

/**
 * The soft disc of each whole radius, drawn once per document: every point stamps it, not a
 * gradient of its own; a document gone (a frame's) takes its discs with it.
 */
const discsByDocument = new WeakMap<Document, Map<number, HTMLCanvasElement>>();

function discOf(document: Document, radius: number): HTMLCanvasElement {
  const discs = discsByDocument.get(document) ?? new Map<number, HTMLCanvasElement>();
  discsByDocument.set(document, discs);
  const known = discs.get(radius);
  if (known !== undefined) return known;
  const disc = document.createElement("canvas");
  disc.width = disc.height = radius * 2;
  const context = disc.getContext("2d");
  if (context !== null) {
    const fade = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
    fade.addColorStop(0, "rgba(0, 0, 0, 1)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = fade;
    context.fillRect(0, 0, disc.width, disc.height);
  }
  discs.set(radius, disc);
  return disc;
}

/** Each pixel's density, its alpha, turned into the palette's colour for it, byte by byte. */
function colourByDensity(pixels: Uint8ClampedArray, palette: Uint8ClampedArray): void {
  for (let at = 0; at < pixels.length; at += 4) {
    const density = pixels[at + 3] ?? 0;
    if (density === 0) continue;
    const colour = density * 4;
    pixels[at] = palette[colour] ?? 0;
    pixels[at + 1] = palette[colour + 1] ?? 0;
    pixels[at + 2] = palette[colour + 2] ?? 0;
    pixels[at + 3] = palette[colour + 3] ?? 0;
  }
}

/** The heat's 256 colours by density, from `HEAT_COLORS`, through a gradient the browser draws. */
export function heatPalette(document: Document): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) return new Uint8ClampedArray(256 * 4);
  const ramp = context.createLinearGradient(0, 0, 256, 0);
  for (const [density, color] of HEAT_COLORS) ramp.addColorStop(density, color);
  context.fillStyle = ramp;
  context.fillRect(0, 0, 256, 1);
  return context.getImageData(0, 0, 256, 1).data;
}
