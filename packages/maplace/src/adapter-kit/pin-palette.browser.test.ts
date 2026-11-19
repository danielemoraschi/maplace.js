import { afterEach, expect, it } from "vitest";
import { pinPaletteOf } from "./pin-palette";

afterEach(() => document.body.replaceChildren());

/** A map inside a wrapper carrying these properties, as a page sets them above the map. */
function mapInside(properties: Record<string, string>): HTMLElement {
  const wrapper = document.createElement("div");
  for (const [name, value] of Object.entries(properties)) wrapper.style.setProperty(name, value);
  const map = document.createElement("div");
  wrapper.append(map);
  document.body.append(wrapper);
  return map;
}

it("takes a colour set on an ancestor", () => {
  const map = mapInside({ "--maplace-pin-background": "#0b6e4f" });
  expect(pinPaletteOf(map).resting.background).toBe("#0b6e4f");
});

it("drops a value that isn't a colour, leaving the provider's own", () => {
  const map = mapInside({ "--maplace-pin-glyph": "nope", "--maplace-pin-selected-glyph": "12px" });
  const palette = pinPaletteOf(map);
  expect(palette.resting.glyph).toBeUndefined();
  expect(palette.selected.glyph).toBe("#980400");
});

it("resolves currentColor to the map's text colour, as either provider then draws it", () => {
  const map = mapInside({ "--maplace-pin-glyph": "currentColor", color: "rgb(1, 2, 3)" });
  expect(pinPaletteOf(map).resting.glyph).toBe("rgb(1, 2, 3)");
});
