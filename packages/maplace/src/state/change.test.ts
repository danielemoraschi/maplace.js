import { describe, expect, it } from "vitest";
import type { Snapshot } from "../store";
import { andThen, type Change, changesAnything, NO_CHANGE, withPatch } from "./change";

const snapshot: Snapshot = {
  locations: [],
  selectedId: "a",
  hoveredId: undefined,
  filter: undefined,
  view: { kind: "fit-all", padding: 40 },
  viewport: undefined,
  route: undefined,
  routeResult: undefined,
  loadState: "idle",
};

describe("andThen", () => {
  it("runs each step on the snapshot with the earlier patches applied", () => {
    const first: Change = {
      patch: { selectedId: "b" },
      events: [{ name: "select", payload: { id: "b" } }],
    };
    const seen: (string | undefined)[] = [];
    const change = andThen(snapshot, first, (current) => {
      seen.push(current.selectedId);
      return { patch: { hoveredId: "b" }, events: [{ name: "hover", payload: { id: "b" } }] };
    });
    expect(seen).toEqual(["b"]);
    expect(change).toEqual({
      patch: { selectedId: "b", hoveredId: "b" },
      events: [
        { name: "select", payload: { id: "b" } },
        { name: "hover", payload: { id: "b" } },
      ],
    });
  });

  it("lets a later patch win", () => {
    const change = andThen(snapshot, { patch: { selectedId: "b" }, events: [] }, () => ({
      patch: { selectedId: undefined },
      events: [],
    }));
    expect(change.patch).toEqual({ selectedId: undefined });
    expect("selectedId" in change.patch).toBe(true);
  });
});

describe("changesAnything", () => {
  it("is false for no patch or a patch of the same references", () => {
    expect(changesAnything(snapshot, NO_CHANGE.patch)).toBe(false);
    expect(changesAnything(snapshot, { selectedId: "a", view: snapshot.view })).toBe(false);
  });

  it("is true when a field gets another value, undefined included", () => {
    expect(changesAnything(snapshot, { selectedId: undefined })).toBe(true);
    expect(changesAnything(snapshot, { view: { kind: "fit-all", padding: 40 } })).toBe(true);
  });
});

describe("withPatch", () => {
  it("returns a frozen snapshot with the patch applied", () => {
    const next = withPatch(snapshot, { selectedId: undefined });
    expect(next).toEqual({ ...snapshot, selectedId: undefined });
    expect(Object.isFrozen(next)).toBe(true);
  });
});
