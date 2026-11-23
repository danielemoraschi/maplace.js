import { PIN_BACKGROUND, type PinLook, type PinLooks } from "./pin-looks";

/** The resting dot's radius with its ring, the ring's width, and a selected dot's halo's width. */
const DOT_RADIUS = 10;
const RING_WIDTH = 3;
const HALO_WIDTH = 2;

/** A soft shadow under the dot: a larger, lower one under a selected pin. */
const SHADOW = { colour: "rgb(0 0 0 / 40%)", blur: 4, offsetY: 1 };
const RAISED_SHADOW = { colour: "rgb(0 0 0 / 45%)", blur: 6, offsetY: 2 };

/** Drawn at twice its size, so it stays sharp on high-density screens. */
export const PIN_PIXEL_RATIO = 2;

/** How far from its middle a pin in `look` reaches: its dot, ring and halo. */
export function pinRadiusOf(look: PinLook): number {
  return DOT_RADIUS * look.scale + (look.halo ? HALO_WIDTH : 0);
}

/** The side of the square image of a pin in `look`, in CSS pixels: the pin and its shadow. */
export function pinImageSize(look: PinLook): number {
  const shadow = shadowOf(look);
  return 2 * Math.ceil(pinRadiusOf(look) + shadow.blur + shadow.offsetY);
}

/** How far above its point a pin's popup opens: clear of the selected pin. */
export function pinLiftOf(looks: PinLooks): number {
  return pinRadiusOf(looks.selected);
}

/**
 * The pins drawn, as image URLs, by what they look like: maps whose pins look the same share them;
 * a data URL shows in any document.
 */
const urls = new Map<string, string>();

/**
 * The pin in `look` as an image URL, drawn once per look, for the pins in the DOM; none (`""`)
 * where the browser gives no 2D context, tried again next time, as another document may.
 */
export function pinImageUrl(document: Document, look: PinLook): string {
  const key = `${look.background} ${look.border} ${look.halo} ${look.scale}`;
  let url = urls.get(key);
  if (url === undefined) {
    url = drawnPin(document, look)?.canvas.toDataURL() ?? "";
    if (url !== "") urls.set(key, url);
  }
  return url;
}

/**
 * The pin in `look` as pixels for a map's images, at `PIN_PIXEL_RATIO`; none where the browser
 * gives no 2D context.
 */
export function pinImageData(document: Document, look: PinLook): ImageData | undefined {
  const drawn = drawnPin(document, look);
  return drawn?.getImageData(0, 0, drawn.canvas.width, drawn.canvas.height);
}

function shadowOf(look: PinLook) {
  return look.halo ? RAISED_SHADOW : SHADOW;
}

/** The pin drawn on a canvas at `PIN_PIXEL_RATIO`; none where the browser gives no 2D context. */
function drawnPin(document: Document, look: PinLook): CanvasRenderingContext2D | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = pinImageSize(look) * PIN_PIXEL_RATIO;
  const context = canvas.getContext("2d");
  if (context === null) return undefined;
  context.scale(PIN_PIXEL_RATIO, PIN_PIXEL_RATIO);
  drawPin(context, look);
  return context;
}

/**
 * A dot in a ring, in the middle of the image, with a soft shadow; selected, in a halo of the
 * dot's colour. The ring and the halo are discs under the dot, so no edge between them shows.
 */
function drawPin(context: CanvasRenderingContext2D, look: PinLook): void {
  const middle = pinImageSize(look) / 2;
  const radius = DOT_RADIUS * look.scale;
  const disc = (discRadius: number, colour: string) => {
    context.beginPath();
    context.arc(middle, middle, discRadius, 0, 2 * Math.PI);
    // The default first: a canvas ignores a colour it can't parse, which CSS may still accept.
    context.fillStyle = PIN_BACKGROUND;
    context.fillStyle = colour;
    context.fill();
  };
  const shadow = shadowOf(look);
  context.shadowColor = shadow.colour;
  context.shadowBlur = shadow.blur * PIN_PIXEL_RATIO;
  context.shadowOffsetY = shadow.offsetY * PIN_PIXEL_RATIO;
  disc(pinRadiusOf(look), look.halo ? look.background : look.border);
  context.shadowColor = "transparent";
  if (look.halo) disc(radius, look.border);
  disc(radius - RING_WIDTH * look.scale, look.background);
}
