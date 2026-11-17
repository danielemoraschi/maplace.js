import { afterEach, describe, expect, it } from "vitest";
import { adoptStyles } from "../adopted-styles";
import { createHeatDots, HEAT_DOT_STYLES } from "./heat-dot";

/**
 * A stand-in for Google's advanced marker: an element standing on its point at its content's
 * bottom centre, as Google places one.
 */
function markerOnPage(): HTMLElement {
  adoptStyles(document, HEAT_DOT_STYLES);
  const marker = document.createElement("div");
  marker.style.cssText = "position:absolute;left:100px;top:100px;display:inline-block";
  document.body.append(marker);
  return marker;
}

const middleOf = (rect: DOMRect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("a heat dot in its marker", () => {
  it("gives the marker its size, the dot centred on the marker's point", () => {
    const marker = markerOnPage();
    createHeatDots().show(marker, 1, undefined);
    const box = marker.getBoundingClientRect();
    const dot = marker.firstElementChild?.getBoundingClientRect() as DOMRect;
    expect(box.width).toBeGreaterThan(0);
    expect(middleOf(dot).x).toBeCloseTo(box.left + box.width / 2, 0);
    expect(middleOf(dot).y).toBeCloseTo(box.bottom, 0);
  });

  it("keeps the dot on the point under a pin, the pin standing there with its tip", () => {
    const marker = markerOnPage();
    const pin = document.createElement("span");
    pin.style.cssText = "display:block;width:26px;height:37px";
    createHeatDots().show(marker, 1, pin);
    const box = marker.getBoundingClientRect();
    const dot = marker.querySelector(".maplace-heat-dot")?.getBoundingClientRect() as DOMRect;
    expect(box.width).toBe(26);
    expect(middleOf(dot).x).toBeCloseTo(box.left + 13, 0);
    expect(middleOf(dot).y).toBeCloseTo(box.bottom, 0);
  });
});
