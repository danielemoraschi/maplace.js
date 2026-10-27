import { describe, expect, it, vi } from "vitest";
import { type ContextHolder, contextBudget } from "./context-budget";

/** A map's context that gives itself back at once when asked. */
function holder(): ContextHolder & { readonly given: boolean } {
  let live = true;
  return {
    holdsContext: () => live,
    giveBack: () => {
      live = false;
    },
    get given() {
      return !live;
    },
  };
}

describe("contextBudget", () => {
  it("lets hidden maps keep their contexts up to its limit", () => {
    const budget = contextBudget(2);
    const [a, b] = [holder(), holder()];
    budget.watch(a);
    budget.watch(b);
    budget.hidden(a);
    budget.hidden(b);
    expect([a.given, b.given]).toEqual([false, false]);
  });

  it("past its limit, takes the context of the map hidden longest", () => {
    const budget = contextBudget(2);
    const [a, b, c] = [holder(), holder(), holder()];
    budget.watch(a);
    budget.watch(b);
    budget.hidden(b);
    budget.hidden(a);
    budget.watch(c);
    expect([a.given, b.given, c.given]).toEqual([false, true, false]);
  });

  it("never takes the context of a map on show, past its limit", () => {
    const budget = contextBudget(0);
    const shown = holder();
    budget.watch(shown);
    budget.shown(shown);
    expect(shown.given).toBe(false);
  });

  it("takes no context from a map shown again", () => {
    const budget = contextBudget(1);
    const [a, b] = [holder(), holder()];
    budget.watch(a);
    budget.hidden(a);
    budget.shown(a);
    budget.watch(b);
    expect(a.given).toBe(false);
  });

  it("counts a forgotten map no more, and never asks it for its context", () => {
    const budget = contextBudget(1);
    const [gone, kept] = [holder(), holder()];
    budget.watch(gone);
    budget.watch(kept);
    budget.forget(gone);
    budget.hidden(kept);
    budget.hidden(gone);
    expect([gone.given, kept.given]).toEqual([false, false]);
  });
});

describe("the page's context budget", () => {
  // Each CDN script, Google's and MapLibre's, carries its own copy of maplace.
  it("is one per page, shared by every copy of maplace on it", async () => {
    const first = await import("./context-budget");
    vi.resetModules();
    const second = await import("./context-budget");
    expect(second).not.toBe(first);
    expect(second.PAGE_CONTEXT_BUDGET).toBe(first.PAGE_CONTEXT_BUDGET);
  });
});
