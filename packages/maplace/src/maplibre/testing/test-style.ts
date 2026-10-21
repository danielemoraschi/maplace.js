import type { StyleSpecification } from "maplibre-gl";

/**
 * The tests' map style: a plain background, with no sources, glyphs or sprite, so nothing leaves
 * the machine. What a test draws is maplace's own.
 */
export const TEST_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#e8eef4" } }],
};
