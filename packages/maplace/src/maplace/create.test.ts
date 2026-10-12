import { describe, expect, it } from "vitest";
import { createFakeAdapter } from "../testing/fake-adapter";
import { createMaplace } from "./create";

const element = { nodeType: 1 } as HTMLElement;

describe("createMaplace", () => {
  it("imports and runs without a DOM, as on a server", () => {
    expect(typeof document).toBe("undefined");
    const maplace = createMaplace({ locations: [{ id: "a", lat: 0, lng: 0 }] });
    maplace.select("a");
    expect(maplace.getSnapshot()).toMatchObject({ selectedId: "a", loadState: "idle" });
  });

  it("keeps stores apart: each attaches its own adapter", async () => {
    const first = createMaplace({ locations: [{ id: "a", lat: 0, lng: 0 }] });
    const second = createMaplace();
    const firstAdapter = createFakeAdapter();
    const secondAdapter = createFakeAdapter();
    first.attach(firstAdapter, element);
    second.attach(secondAdapter, element);
    await firstAdapter.finishMount();
    expect(first.getSnapshot().loadState).toBe("ready");
    expect(second.getSnapshot().loadState).toBe("loading");
    expect(secondAdapter.calls).toEqual([]);
  });
});

describe("destroy", () => {
  it("detaches, and rejects whenReady with destroyed now and later", async () => {
    const maplace = createMaplace();
    const adapter = createFakeAdapter();
    maplace.attach(adapter, element);
    const ready = maplace.whenReady();
    maplace.destroy();
    expect(adapter.destroyed).toBe(true);
    await expect(ready).rejects.toMatchObject({ code: "destroyed" });
    await expect(maplace.whenReady()).rejects.toMatchObject({
      message: "whenReady: this maplace was destroyed",
    });
    expect(() => maplace.destroy()).not.toThrow();
  });
});
