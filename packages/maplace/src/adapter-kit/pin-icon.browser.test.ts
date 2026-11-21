import { afterEach, expect, it } from "vitest";
import { anchorFor, isPinIcon, paintPin } from "./pin-icon";
import { pinImageSize, pinImageUrl } from "./pin-image";
import { pinLooksOf } from "./pin-looks";

afterEach(() => document.body.replaceChildren());

const LOOKS = pinLooksOf(document.body);

it("shows the image as a block, its size its look's, with no line under it", () => {
  const holder = document.createElement("div");
  holder.append(paintPin(document, LOOKS.selected));
  document.body.append(holder);
  expect(getComputedStyle(holder.firstElementChild as Element).display).toBe("block");
  expect(holder.getBoundingClientRect().height).toBe(pinImageSize(LOOKS.selected));
});

it("repaints the pin it is given, in place, to each new look", () => {
  const pin = paintPin(document, LOOKS.resting);
  expect(paintPin(document, LOOKS.selected, pin)).toBe(pin);
  expect(pin.getAttribute("src")).toBe(pinImageUrl(document, LOOKS.selected));
  expect(pin.width).toBe(pinImageSize(LOOKS.selected));
});

it("tells maplace's pin, met by its middle, from a page's icon, met by its bottom", () => {
  const pin = paintPin(document, LOOKS.resting);
  const icon = document.createElement("img");
  expect([isPinIcon(pin), anchorFor(pin)]).toEqual([true, "center"]);
  expect([isPinIcon(icon), anchorFor(icon)]).toEqual([false, "bottom"]);
});
