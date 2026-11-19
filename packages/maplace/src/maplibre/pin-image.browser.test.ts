import { expect, it } from "vitest";
import type { PinColours } from "../adapter-kit/pin-palette";
import { pinImageUrl } from "./pin-image";

const UNSET: PinColours = { background: undefined, border: undefined, glyph: undefined };

/** The pin's colour as `[r, g, b]` at a point, in the drawn image's own pixels (twice the CSS). */
async function pixelOf(colours: PinColours, x: number, y: number): Promise<number[]> {
  const image = new Image();
  image.src = pinImageUrl(document, colours);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("no 2D context");
  context.drawImage(image, 0, 0);
  return [...context.getImageData(x, y, 1, 1).data.slice(0, 3)];
}

/** The dot's centre, and a point of the body above it, at twice the pin's CSS size. */
const DOT = [27, 27] as const;
const BODY = [27, 8] as const;

it("draws today's red pin when no colour is set", async () => {
  expect(await pixelOf(UNSET, ...BODY)).toEqual([0xea, 0x43, 0x35]);
  expect(await pixelOf(UNSET, ...DOT)).toEqual([0xb3, 0x14, 0x12]);
});

it("draws the dot and the body in the colours it's given", async () => {
  const colours = { ...UNSET, background: "#0b6e4f", glyph: "#980400" };
  expect(await pixelOf(colours, ...DOT)).toEqual([0x98, 0x04, 0x00]);
  expect(await pixelOf(colours, ...BODY)).toEqual([0x0b, 0x6e, 0x4f]);
});

it("draws Google's colour in place of one the canvas can't parse, whatever reaches it", async () => {
  const colours = { ...UNSET, background: "not-a-colour" };
  expect(await pixelOf(colours, ...BODY)).toEqual([0xea, 0x43, 0x35]);
});
