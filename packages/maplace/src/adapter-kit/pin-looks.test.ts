// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { PIN_BACKGROUND, PIN_BORDER, pinLookIn, pinLooksOf } from "./pin-looks";

/** A map element with these properties set on it: happy-dom reads back only its own. */
function mapWith(properties: Record<string, string> = {}): HTMLElement {
  const map = document.createElement("div");
  for (const [name, value] of Object.entries(properties)) map.style.setProperty(name, value);
  document.body.append(map);
  return map;
}

afterEach(() => document.body.replaceChildren());

describe("pinLooksOf", () => {
  it("draws the default red dot in a white ring when the page sets no colour", () => {
    expect(pinLooksOf(mapWith()).resting).toEqual({
      background: PIN_BACKGROUND,
      border: PIN_BORDER,
      halo: false,
      scale: 1,
    });
  });

  it("hovers larger and selects larger still, in a halo of the dot's colour", () => {
    const { resting, hovered, selected } = pinLooksOf(mapWith());
    expect(hovered).toEqual({ ...resting, scale: 1.15 });
    expect(selected).toEqual({ ...resting, halo: true, scale: 1.2 });
  });

  it("keeps the page's colours in every state", () => {
    const looks = pinLooksOf(
      mapWith({ "--maplace-pin-background": "#0b6e4f", "--maplace-pin-border": "#063d2c" }),
    );
    for (const look of [looks.resting, looks.hovered, looks.selected]) {
      expect(look).toMatchObject({ background: "#0b6e4f", border: "#063d2c" });
    }
  });

  it("trims what it reads", () => {
    const looks = pinLooksOf(mapWith({ "--maplace-pin-border": "  #123456  " }));
    expect(looks.resting.border).toBe("#123456");
  });
});

describe("pinLookIn", () => {
  it("picks the selected look over the hovered one, and rests otherwise", () => {
    const looks = pinLooksOf(mapWith());
    expect(pinLookIn(looks, { selected: true, hovered: true })).toBe(looks.selected);
    expect(pinLookIn(looks, { selected: false, hovered: true })).toBe(looks.hovered);
    expect(pinLookIn(looks, { selected: false, hovered: false })).toBe(looks.resting);
  });
});
