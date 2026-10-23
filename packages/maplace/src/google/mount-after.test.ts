import { describe, expect, it, vi } from "vitest";
import type { MountContext } from "../adapter";
import { CONTAINER } from "../testing/container";
import { createFakeAdapter } from "../testing/fake-adapter";
import { mountAfter } from "./mount-after";

function deferred() {
  let resolve: () => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const CONTEXT = { container: CONTAINER } as MountContext;

describe("mountAfter", () => {
  it("mounts only once loading resolved", async () => {
    const loading = deferred();
    const adapter = createFakeAdapter();
    const mount = vi.spyOn(adapter, "mount").mockResolvedValue();
    const mounting = mountAfter(adapter, () => loading.promise).mount(CONTEXT);
    await Promise.resolve();
    expect(mount).not.toHaveBeenCalled();
    loading.resolve();
    await mounting;
    expect(mount).toHaveBeenCalledWith(CONTEXT);
  });

  it("fails the mount when loading fails", async () => {
    const loading = deferred();
    const mounting = mountAfter(createFakeAdapter(), () => loading.promise).mount(CONTEXT);
    loading.reject(new Error("no Maps JS"));
    await expect(mounting).rejects.toThrow("no Maps JS");
  });

  it("hands the mount's context to what it waits for", async () => {
    const beforeMount = vi.fn(async () => {});
    const adapter = createFakeAdapter();
    vi.spyOn(adapter, "mount").mockResolvedValue();
    await mountAfter(adapter, beforeMount).mount(CONTEXT);
    expect(beforeMount).toHaveBeenCalledWith(CONTEXT);
  });

  it("is the adapter's own in every other way, before loading too", () => {
    const adapter = createFakeAdapter({ capabilities: ["route"], routeStopLimit: 5 });
    const after = mountAfter(adapter, () => new Promise(() => {}));
    expect([...after.capabilities, after.routeStopLimit]).toEqual(["route", 5]);
    after.destroy();
    expect(adapter.destroyed).toBe(true);
  });
});
