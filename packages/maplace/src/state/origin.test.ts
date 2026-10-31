import { describe, expect, it, vi } from "vitest";
import { createState } from "./state";

const rome = { lat: 41.9, lng: 12.5 };

describe("setOrigin", () => {
  it("sets a frozen copy of any point", () => {
    const state = createState();
    state.setOrigin(rome);
    const { origin } = state.getSnapshot();
    expect(origin).toEqual(rome);
    expect(origin).not.toBe(rome);
    expect(Object.isFrozen(origin)).toBe(true);
  });

  it("clears with undefined", () => {
    const state = createState();
    state.setOrigin(rome);
    state.setOrigin(undefined);
    expect(state.getSnapshot().origin).toBeUndefined();
  });

  it("keeps the reference for an equal point and notifies no one", () => {
    const state = createState();
    state.setOrigin(rome);
    const { origin } = state.getSnapshot();
    const onChange = vi.fn();
    state.subscribe(onChange);
    state.setOrigin({ ...rome });
    state.setOrigin(rome);
    expect(state.getSnapshot().origin).toBe(origin);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits one notification for a new point", () => {
    const state = createState();
    const onChange = vi.fn();
    state.subscribe(onChange);
    state.setOrigin(rome);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it.for([
    ["a string", "rome"],
    ["lon for lng", { lat: 1, lon: 2 }],
    ["a latitude out of range", { lat: 91, lng: 0 }],
  ] as const)("refuses %s, naming setOrigin", ([, bad]) => {
    const state = createState();
    expect(() => state.setOrigin(bad as never)).toThrow(/setOrigin: origin/);
    expect(state.getSnapshot().origin).toBeUndefined();
  });

  it("throws destroyed after destroy", () => {
    const state = createState();
    state.destroy();
    expect(() => state.setOrigin(rome)).toThrow(/destroyed/);
  });
});
