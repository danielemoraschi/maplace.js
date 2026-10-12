import { describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../errors";
import { createInternalState } from "../state/state";
import { createLoadStates } from "./load";
import { createReadiness } from "./ready";

function loading() {
  const state = createInternalState();
  const readiness = createReadiness();
  const loadStates = createLoadStates(state, readiness);
  const onError = vi.fn();
  state.store.on("error", onError);
  loadStates.loading();
  return { store: state.store, readiness, loadStates, onError };
}

describe("createLoadStates", () => {
  it("is ready only from loading, so an error reported meanwhile stays", async () => {
    const { store, readiness, loadStates } = loading();
    const outcome = readiness.whenReady().catch((reason: unknown) => reason);
    const denied = new MaplaceError("provider-auth-failed", "bad key");
    loadStates.reportError(denied);
    loadStates.ready();
    expect(store.getSnapshot().loadState).toBe("error");
    expect(await outcome).toBe(denied);
  });

  it("emits runtime errors; load and auth failures also fail the load", () => {
    const { store, loadStates, onError } = loading();
    loadStates.ready();
    const routeFailed = new MaplaceError("route-failed", "no route");
    loadStates.reportError(routeFailed);
    expect(store.getSnapshot().loadState).toBe("ready");
    expect(onError).toHaveBeenCalledWith({ error: routeFailed });
    loadStates.reportError(new MaplaceError("provider-load-failed", "gone"));
    expect(store.getSnapshot().loadState).toBe("error");
  });

  it("fails the load as provider-load-failed on anything but a MaplaceError", () => {
    const { store, loadStates, onError } = loading();
    loadStates.reportError(new Error("style 404") as never);
    loadStates.failed("script blocked");
    expect(store.getSnapshot().loadState).toBe("error");
    expect(onError.mock.calls.map(([{ error }]) => [error.code, error.cause])).toEqual([
      ["provider-load-failed", new Error("style 404")],
      ["provider-load-failed", "script blocked"],
    ]);
  });

  it("returns to idle without a viewport, and waits for the next load", () => {
    const { store, readiness, loadStates } = loading();
    loadStates.ready();
    loadStates.idle();
    expect(store.getSnapshot()).toMatchObject({ loadState: "idle", viewport: undefined });
    let settled = false;
    void readiness.whenReady().then(() => {
      settled = true;
    });
    return Promise.resolve().then(() => expect(settled).toBe(false));
  });
});
