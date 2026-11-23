import { afterEach, expect, it } from "vitest";
import { PIN_BORDER, pinLooksOf } from "./pin-looks";

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
  expect(pinLooksOf(map).resting.background).toBe("#0b6e4f");
});

it("drops a value that isn't a colour, leaving the default", () => {
  const map = mapInside({ "--maplace-pin-border": "12px" });
  expect(pinLooksOf(map).resting.border).toBe(PIN_BORDER);
});

it("resolves currentColor to the map's text colour, as either provider then draws it", () => {
  const map = mapInside({ "--maplace-pin-border": "currentColor", color: "rgb(1, 2, 3)" });
  expect(pinLooksOf(map).resting.border).toBe("rgb(1, 2, 3)");
});
