import { afterEach, describe, expect, it, vi } from "vitest";
import { createListeners } from "./listeners";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createListeners", () => {
  it("calls each listener with the value, in the order added", () => {
    const listeners = createListeners<number>();
    const calls: string[] = [];
    listeners.add((value) => calls.push(`a${value}`));
    listeners.add((value) => calls.push(`b${value}`));
    listeners.notify(1);
    expect(calls).toEqual(["a1", "b1"]);
  });

  it("stops calling a listener once unsubscribed, and unsubscribing twice is harmless", () => {
    const listeners = createListeners<number>();
    const listener = vi.fn();
    const unsubscribe = listeners.add(listener);
    unsubscribe();
    unsubscribe();
    listeners.notify(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps each registration of the same function separate", () => {
    const listeners = createListeners<number>();
    const listener = vi.fn();
    const first = listeners.add(listener);
    listeners.add(listener);
    first();
    listeners.notify(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("waits until the next notification to call a listener added during one", () => {
    const listeners = createListeners<number>();
    const added = vi.fn();
    listeners.add(() => listeners.add(added));
    listeners.notify(1);
    expect(added).not.toHaveBeenCalled();
    listeners.notify(2);
    expect(added).toHaveBeenCalledWith(2);
  });

  it("skips a listener removed by an earlier one during the same call", () => {
    const listeners = createListeners<number>();
    const later = vi.fn();
    let removeLater = () => {};
    listeners.add(() => removeLater());
    removeLater = listeners.add(later);
    listeners.notify(1);
    expect(later).not.toHaveBeenCalled();
  });

  it("adds nothing for an aborted signal", () => {
    const listeners = createListeners<number>();
    const listener = vi.fn();
    const unsubscribe = listeners.add(listener, AbortSignal.abort());
    listeners.notify(1);
    expect(unsubscribe).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it("removes the listener when its signal aborts", () => {
    const listeners = createListeners<number>();
    const controller = new AbortController();
    const listener = vi.fn();
    listeners.add(listener, controller.signal);
    controller.abort();
    listeners.notify(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops watching the signal once unsubscribed or cleared", () => {
    const listeners = createListeners<number>();
    const signal = new AbortController().signal;
    const remove = vi.spyOn(signal, "removeEventListener");
    listeners.add(vi.fn(), signal)();
    listeners.add(vi.fn(), signal);
    listeners.clear();
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it("removes every listener on clear", () => {
    const listeners = createListeners<number>();
    const listener = vi.fn();
    listeners.add(listener);
    listeners.clear();
    listeners.notify(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps calling the others when one throws, and rethrows its error later", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const listeners = createListeners<number>();
    const error = new Error("listener bug");
    const after = vi.fn();
    listeners.add(() => {
      throw error;
    });
    listeners.add(after);
    listeners.notify(1);
    expect(after).toHaveBeenCalledWith(1);
    expect(queued).toHaveLength(1);
    expect(() => queued[0]?.()).toThrow(error);
  });
});
