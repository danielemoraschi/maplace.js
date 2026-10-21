import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LatLng } from "../geometry";
import { createClickGesture, DOUBLE_CLICK_WAIT_MS } from "./click-gesture";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const HERE = { lat: 1, lng: 2 };

function recordedGesture() {
  const singles: LatLng[] = [];
  return { gesture: createClickGesture((at) => singles.push(at)), singles };
}

describe("createClickGesture", () => {
  it("holds a click, and reports it once no double-click can follow", () => {
    const { gesture, singles } = recordedGesture();
    gesture.click(HERE, 1);
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT_MS - 1);
    expect(singles).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(singles).toEqual([HERE]);
  });

  it("drops a held click at a dblclick", () => {
    const { gesture, singles } = recordedGesture();
    gesture.click(HERE, 1);
    gesture.doubleClick();
    vi.runAllTimers();
    expect(singles).toEqual([]);
  });

  it("takes a click its event counts as a second for none", () => {
    const { gesture, singles } = recordedGesture();
    gesture.click(HERE, 2);
    vi.runAllTimers();
    expect(singles).toEqual([]);
  });

  it("drops what it holds when asked, as a location's click does", () => {
    const { gesture, singles } = recordedGesture();
    gesture.click(HERE, 0);
    gesture.dropHeld();
    vi.runAllTimers();
    expect(singles).toEqual([]);
  });

  it("counts a click the map can't place toward the gesture, reporting nothing for it", () => {
    const { gesture, singles } = recordedGesture();
    gesture.click(undefined, 1);
    gesture.click(HERE, 1);
    vi.runAllTimers();
    expect(singles).toEqual([]);
  });
});
