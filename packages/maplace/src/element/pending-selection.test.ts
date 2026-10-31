import { describe, expect, it, vi } from "vitest";
import { createMaplace } from "../index";
import { PendingSelection } from "./pending-selection";
import type { StandingMisuse } from "./standing-misuse";

const LOCATIONS = [
  { id: "rome", lat: 0, lng: 0, title: "Rome" },
  { id: "milan", lat: 0, lng: 0, title: "Milan" },
];

function waitingFor(id: string) {
  const store = createMaplace({ locations: LOCATIONS });
  const retry = vi.fn((_: string, attempt: () => boolean) => attempt());
  const misuse = { retry, clear: vi.fn() } as unknown as StandingMisuse;
  const pending = new PendingSelection(() => store, misuse);
  pending.fromAttribute(id);
  return { store, pending, retry };
}

describe("PendingSelection", () => {
  it("selects selected-id once the store has it", () => {
    const { store, pending } = waitingFor("rome");
    pending.trySelect();
    expect(store.getSnapshot().selectedId).toBe("rome");
  });

  it("waits while a query hides it, as a visitor's typing is no misuse of the page's", () => {
    const { store, pending, retry } = waitingFor("rome");
    store.setFilter({ query: "milan" });
    pending.trySelect();
    expect(retry).not.toHaveBeenCalled();
    expect(store.getSnapshot().selectedId).toBeUndefined();
  });

  it.each([
    ["an id the locations don't have", "typo", undefined],
    ["an id the page's own filter hides", "rome", ["Nowhere"]],
  ])("still tries %s under a query, so its misuse is reported", (_, id, groups) => {
    const { store, pending, retry } = waitingFor(id);
    retry.mockReturnValue(false);
    store.setFilter({ query: "milan", groups });
    pending.trySelect();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("selects it under a query that shows it", () => {
    const { store, pending } = waitingFor("rome");
    store.setFilter({ query: "rome" });
    pending.trySelect();
    expect(store.getSnapshot().selectedId).toBe("rome");
  });
});
