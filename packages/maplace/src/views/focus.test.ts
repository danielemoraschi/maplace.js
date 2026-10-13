import { describe, expect, it } from "vitest";
import { KEYS, nextFocus } from "./focus";

describe("nextFocus", () => {
  it("moves within bounds, without wrapping", () => {
    expect(nextFocus(0, KEYS.next, 3)).toBe(1);
    expect(nextFocus(2, KEYS.next, 3)).toBe(2);
    expect(nextFocus(0, KEYS.previous, 3)).toBe(0);
    expect(nextFocus(1, KEYS.first, 3)).toBe(0);
    expect(nextFocus(1, KEYS.last, 3)).toBe(2);
  });

  it("ignores other keys and empty lists", () => {
    expect(nextFocus(0, "a", 3)).toBeUndefined();
    expect(nextFocus(0, KEYS.next, 0)).toBeUndefined();
  });
});
