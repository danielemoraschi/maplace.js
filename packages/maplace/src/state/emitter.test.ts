import { describe, expect, it, vi } from "vitest";
import { createEmitter } from "./emitter";

describe("createEmitter", () => {
  it("calls the listeners of the emitted event only, with its payload", () => {
    const emitter = createEmitter();
    const onSelectionChange = vi.fn();
    const onHoverChange = vi.fn();
    emitter.on("selectionChange", onSelectionChange);
    emitter.on("hoverChange", onHoverChange);
    emitter.emit({ name: "selectionChange", payload: { id: "a" } });
    expect(onSelectionChange).toHaveBeenCalledWith({ id: "a" });
    expect(onHoverChange).not.toHaveBeenCalled();
  });

  it("removes a listener through its unsubscribe function or its signal", () => {
    const emitter = createEmitter();
    const unsubscribed = vi.fn();
    const aborted = vi.fn();
    const controller = new AbortController();
    emitter.on("selectionChange", unsubscribed)();
    emitter.on("selectionChange", aborted, { signal: controller.signal });
    controller.abort();
    emitter.emit({ name: "selectionChange", payload: { id: "a" } });
    expect(unsubscribed).not.toHaveBeenCalled();
    expect(aborted).not.toHaveBeenCalled();
  });

  it("removes every listener on clear", () => {
    const emitter = createEmitter();
    const listener = vi.fn();
    emitter.on("routeChange", listener);
    emitter.clear();
    emitter.emit({ name: "routeChange", payload: { result: undefined } });
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects an unknown event, a listener that is not a function and bad options", () => {
    const emitter = createEmitter();
    expect(() => emitter.on("selected" as "selectionChange", () => {})).toThrow(
      /^on: event must be one of/,
    );
    expect(() => emitter.on("selectionChange", "log" as never)).toThrow(
      /^on: listener must be a function, got "log"$/,
    );
    expect(() => emitter.on("selectionChange", () => {}, { signal: {} as AbortSignal })).toThrow(
      /^on: options\.signal must be an AbortSignal/,
    );
  });
});
