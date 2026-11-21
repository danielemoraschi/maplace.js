import { afterEach, describe, expect, it } from "vitest";
import { paintPin } from "../adapter-kit/pin-icon";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import { adoptStyles } from "../adopted-styles";
import { offPoint } from "../testing/off-point";
import { createHeatDots, HEAT_DOT_STYLES } from "./heat-dot";

/** Where the stand-in marker's point is on the page. */
const POINT = { x: 100, y: 100 };

/**
 * A stand-in for Google's advanced marker with a heat marker's `anchorTop` of -50%: its content's
 * middle on its point, as Google places one (moved by -50% across and `anchorTop` down).
 */
function markerOnPage(): HTMLElement {
  adoptStyles(document, HEAT_DOT_STYLES);
  const marker = document.createElement("div");
  marker.style.cssText = `position:absolute;left:${POINT.x}px;top:${POINT.y}px;transform:translate(-50%,-50%)`;
  document.body.append(marker);
  return marker;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("a heat dot in its marker", () => {
  it("gives the marker its size, the dot alone centred on the point", () => {
    const marker = markerOnPage();
    createHeatDots().show(marker, 1, undefined);
    expect(marker.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(offPoint(marker.firstElementChild as Element, POINT)).toBeLessThanOrEqual(0.5);
  });

  it("draws the pin over its dot, both centred on the point", () => {
    const marker = markerOnPage();
    const pin = paintPin(document, pinLooksOf(document.body).selected);
    createHeatDots().show(marker, 1, pin);
    for (const part of [pin, marker.querySelector(".maplace-heat-dot")]) {
      expect(offPoint(part as Element, POINT)).toBeLessThanOrEqual(0.5);
    }
    expect(document.elementFromPoint(POINT.x, POINT.y)).toBe(pin);
  });
});
