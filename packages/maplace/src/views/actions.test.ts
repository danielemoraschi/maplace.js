import { afterEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { listActionsFor } from "./actions";

const locations = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 1, lng: 1 },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listActionsFor", () => {
  it("chooses, hovers and shows all through the store", () => {
    const store = createMaplace({ locations });
    const actions = listActionsFor(store, vi.fn());
    actions.choose("a");
    actions.hover("b");
    expect(store.getSnapshot()).toMatchObject({ selectedId: "a", hoveredId: "b" });
    const fitAll = vi.spyOn(store, "fitAll");
    actions.showAll();
    expect(store.getSnapshot().selectedId).toBeUndefined();
    expect(fitAll).toHaveBeenCalledOnce();
  });

  it("clears only the hover it is told about", () => {
    const store = createMaplace({ locations });
    const actions = listActionsFor(store, vi.fn());
    actions.hover("a");
    actions.unhover("b");
    expect(store.getSnapshot().hoveredId).toBe("a");
    actions.unhover("a");
    expect(store.getSnapshot().hoveredId).toBeUndefined();
  });

  it("hears once that the store is gone, then does nothing", () => {
    const store = createMaplace({ locations });
    const onStoreGone = vi.fn();
    const actions = listActionsFor(store, onStoreGone);
    store.destroy();
    actions.choose("a");
    actions.hover("a");
    expect(onStoreGone).toHaveBeenCalledOnce();
    expect(onStoreGone.mock.calls[0]?.[0]).toMatchObject({ code: "destroyed" });
  });

  it("lets other errors through", () => {
    const actions = listActionsFor(createMaplace({ locations }), vi.fn());
    expect(() => actions.choose("gone")).toThrow(expect.objectContaining({ code: "unknown-id" }));
  });
});
