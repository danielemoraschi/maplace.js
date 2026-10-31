// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { LatLng } from "../geometry";
import { createOriginDot, ORIGIN_DOT_CLASS, originDotElement } from "./origin-dot";

function dotOn() {
  const teardowns: (() => void)[] = [];
  const map = { onDestroy: (teardown: () => void) => teardowns.push(teardown) };
  const drawn = { moveTo: vi.fn(), remove: vi.fn() };
  const place = vi.fn(() => drawn);
  let mounted: typeof map | undefined;
  let origin: LatLng | undefined;
  const dot = createOriginDot({ mounted: () => mounted, origin: () => origin, place });
  return {
    dot,
    map,
    drawn,
    place,
    teardowns,
    open() {
      mounted = map;
      dot.part.open(map);
    },
    setOrigin(next: LatLng | undefined) {
      origin = next;
      dot.sync();
    },
  };
}

const here = { lat: 1, lng: 2 };
const there = { lat: 3, lng: 4 };

describe("createOriginDot", () => {
  it("places once, moves after, and removes on clearing", () => {
    const { drawn, place, open, setOrigin } = dotOn();
    open();
    expect(place).not.toHaveBeenCalled();
    setOrigin(here);
    setOrigin(there);
    expect(place).toHaveBeenCalledTimes(1);
    expect(drawn.moveTo).toHaveBeenCalledWith(there);
    setOrigin(undefined);
    expect(drawn.remove).toHaveBeenCalledTimes(1);
  });

  it("does nothing before the map opens, then draws the origin there is", () => {
    const { map, place, open, setOrigin } = dotOn();
    setOrigin(here);
    expect(place).not.toHaveBeenCalled();
    open();
    expect(place).toHaveBeenCalledWith(map, here);
  });

  it("removes it as the map is destroyed", () => {
    const { drawn, teardowns, open, setOrigin } = dotOn();
    open();
    setOrigin(here);
    for (const teardown of teardowns) teardown();
    expect(drawn.remove).toHaveBeenCalledTimes(1);
  });
});

describe("originDotElement", () => {
  it("carries the class", () => {
    expect(originDotElement(document).className).toBe(ORIGIN_DOT_CLASS);
  });
});
