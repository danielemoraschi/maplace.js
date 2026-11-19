// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { pinColoursIn, pinPaletteOf, SELECTED_PIN_GLYPH } from "./pin-palette";

const RESTING = { selected: false, hovered: false };
const SELECTED = { selected: true, hovered: false };

/** A map element with these properties set on it: happy-dom reads back only its own. */
function mapWith(properties: Record<string, string> = {}): HTMLElement {
  const map = document.createElement("div");
  for (const [name, value] of Object.entries(properties)) map.style.setProperty(name, value);
  document.body.append(map);
  return map;
}

afterEach(() => document.body.replaceChildren());

describe("pinPaletteOf", () => {
  it("leaves every resting colour to the provider when the page sets none", () => {
    expect(pinPaletteOf(mapWith()).resting).toEqual({
      background: undefined,
      border: undefined,
      glyph: undefined,
    });
  });

  it("darkens only the selected pin's dot by default", () => {
    expect(pinPaletteOf(mapWith()).selected).toEqual({
      background: undefined,
      border: undefined,
      glyph: SELECTED_PIN_GLYPH,
    });
  });

  it("keeps the page's background and border on the selected pin", () => {
    const palette = pinPaletteOf(
      mapWith({ "--maplace-pin-background": "#0b6e4f", "--maplace-pin-border": "#063d2c" }),
    );
    expect(palette.selected).toEqual({
      background: "#0b6e4f",
      border: "#063d2c",
      glyph: SELECTED_PIN_GLYPH,
    });
  });

  it("takes the page's selected dot over the default", () => {
    const palette = pinPaletteOf(mapWith({ "--maplace-pin-selected-glyph": "#ffffff" }));
    expect(palette.selected.glyph).toBe("#ffffff");
  });

  it("trims what it reads", () => {
    const palette = pinPaletteOf(mapWith({ "--maplace-pin-glyph": "  #123456  " }));
    expect(palette.resting.glyph).toBe("#123456");
  });
});

describe("pinColoursIn", () => {
  it("picks the selected colours only while selected", () => {
    const palette = pinPaletteOf(mapWith());
    expect(pinColoursIn(palette, SELECTED)).toBe(palette.selected);
    expect(pinColoursIn(palette, { selected: false, hovered: true })).toBe(palette.resting);
    expect(pinColoursIn(palette, RESTING)).toBe(palette.resting);
  });
});
