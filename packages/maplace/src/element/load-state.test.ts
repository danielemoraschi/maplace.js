import { describe, expect, it } from "vitest";
import { showLoadState } from "./load-state";

function internals() {
  return { states: new Set<string>(), ariaBusy: null as string | null };
}

describe("showLoadState", () => {
  it("holds exactly one load state, busy only while loading", () => {
    const shown = internals();
    showLoadState(shown as unknown as ElementInternals, "loading");
    expect([...shown.states]).toEqual(["loading"]);
    expect(shown.ariaBusy).toBe("true");
    showLoadState(shown as unknown as ElementInternals, "ready");
    expect([...shown.states]).toEqual(["ready"]);
    expect(shown.ariaBusy).toBeNull();
  });
});
