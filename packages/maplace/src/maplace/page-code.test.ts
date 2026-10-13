// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { createFakeAdapter } from "../testing/fake-adapter";
import { createMaplace } from "./create";

const container = () => document.createElement("div");

describe("the page's own icon code", () => {
  it("failing while the map draws is one error event; the map stays ready", async () => {
    const broken: Location = {
      id: "a",
      lat: 0,
      lng: 0,
      icon: () => {
        throw new Error("page bug");
      },
    };
    const maplace = createMaplace({ locations: [broken, { id: "b", lat: 1, lng: 1 }] });
    const onError = vi.fn();
    maplace.on("error", onError);
    const adapter = createFakeAdapter();
    maplace.attach(adapter, container());
    await adapter.finishMount();
    await maplace.whenReady();
    for (let round = 0; round < 50; round++) {
      maplace.hover("a");
      maplace.hover("b");
    }
    await Promise.resolve();
    expect(maplace.getSnapshot().loadState).toBe("ready");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0].error).toMatchObject({
      code: "invalid-input",
      locationId: "a",
      field: "icon",
    });
  });

  it("is ignored once the map is detached", async () => {
    const maplace = createMaplace({
      locations: [{ id: "a", lat: 0, lng: 0, content: () => "x" as unknown as Node }],
    });
    const onError = vi.fn();
    maplace.on("error", onError);
    const adapter = createFakeAdapter();
    const detach = maplace.attach(adapter, container());
    await adapter.finishMount();
    const renderContent = adapter.callsOf("apply")[0]?.diff.added[0]?.renderContent;
    detach();
    expect(renderContent?.()).toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
  });
});
