import { expect, it } from "vitest";
import { pinImageSize, pinImageUrl, pinRadiusOf } from "./pin-image";
import { type PinLook, pinLooksOf } from "./pin-looks";

const LOOKS = pinLooksOf(document.body);
const RED = [0xe3, 0x3b, 0x2d];
const WHITE = [0xff, 0xff, 0xff];

/** The pin's colour as `[r, g, b]` at `dx` CSS pixels right of its middle, in the drawn image. */
async function pixelOf(look: PinLook, dx: number): Promise<number[]> {
  const image = new Image();
  image.src = pinImageUrl(document, look);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("no 2D context");
  context.drawImage(image, 0, 0);
  const ratio = image.naturalWidth / pinImageSize(look);
  const middle = image.naturalWidth / 2;
  const at = context.getImageData(Math.round(middle + dx * ratio), Math.round(middle), 1, 1);
  return [...at.data.slice(0, 3)];
}

it("draws the default red dot, a white ring around it, centred", async () => {
  expect(await pixelOf(LOOKS.resting, 0)).toEqual(RED);
  expect(await pixelOf(LOOKS.resting, pinRadiusOf(LOOKS.resting) - 1)).toEqual(WHITE);
});

it("draws the colours it's given", async () => {
  const look = { ...LOOKS.resting, background: "#0b6e4f", border: "#063d2c" };
  expect(await pixelOf(look, 0)).toEqual([0x0b, 0x6e, 0x4f]);
  expect(await pixelOf(look, pinRadiusOf(look) - 1)).toEqual([0x06, 0x3d, 0x2c]);
});

it("draws a selected pin larger, in a halo of its colour", async () => {
  const { selected } = LOOKS;
  expect(pinRadiusOf(selected)).toBeGreaterThan(pinRadiusOf(LOOKS.hovered));
  expect(pinRadiusOf(LOOKS.hovered)).toBeGreaterThan(pinRadiusOf(LOOKS.resting));
  expect(await pixelOf(selected, pinRadiusOf(selected) - 1)).toEqual(RED);
  expect(await pixelOf(selected, pinRadiusOf(selected) - 3)).toEqual(WHITE);
});

it("draws the default colour in place of one the canvas can't parse", async () => {
  expect(await pixelOf({ ...LOOKS.resting, background: "not-a-colour" }, 0)).toEqual(RED);
});

it("sizes each look's image to hold the dot, its halo and its shadow", async () => {
  for (const look of [LOOKS.resting, LOOKS.hovered, LOOKS.selected]) {
    expect(pinImageSize(look)).toBeGreaterThan(2 * pinRadiusOf(look));
    expect(await pixelOf(look, pinImageSize(look) / 2 - 1)).not.toEqual(RED);
  }
});
