import { describe, expect, it, vi } from "vitest";
import type { Snapshot } from "../store";
import { patchOnly } from "./change";
import { type CommitHooks, createCore } from "./core";
import { initialSnapshot } from "./initial";

const initial: Snapshot = initialSnapshot({ locations: [{ id: "a", lat: 0, lng: 0 }] });

function coreWith(hooks: Partial<CommitHooks<unknown>>) {
  const core = createCore(initial);
  core.setHooks({ beforeCommit() {}, afterCommit() {}, ...hooks });
  return core;
}

describe("createCore", () => {
  it("asks beforeCommit with the candidate and the method; a throw commits nothing", () => {
    const beforeCommit = vi.fn(() => {
      throw new Error("unsupported");
    });
    const core = coreWith({ beforeCommit });
    const onChange = vi.fn();
    core.subscribers.add(onChange);
    expect(() => core.commit("select", patchOnly({ selectedId: "a" }))).toThrow("unsupported");
    expect(beforeCommit).toHaveBeenCalledWith(
      expect.objectContaining({ selectedId: "a" }),
      "select",
    );
    expect(core.getSnapshot()).toBe(initial);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips beforeCommit when nothing would change, and for the store's own changes", () => {
    const beforeCommit = vi.fn();
    const core = coreWith({ beforeCommit });
    core.commit("select", patchOnly({ selectedId: undefined }));
    core.commitOwn(patchOnly({ loadState: "loading" }));
    expect(beforeCommit).not.toHaveBeenCalled();
    expect(core.getSnapshot().loadState).toBe("loading");
  });

  it("runs afterCommit before subscribers and listeners hear of the change", () => {
    const order: string[] = [];
    const core = coreWith({
      afterCommit: () => order.push(`after:${core.getSnapshot().selectedId}`),
    });
    core.subscribers.add(() => order.push("subscriber"));
    core.emitter.on("select", () => order.push("listener"));
    core.commit("select", {
      patch: { selectedId: "a" },
      events: [{ name: "select", payload: { id: "a" } }],
    });
    expect(order).toEqual(["after:a", "subscriber", "listener"]);
  });
});
