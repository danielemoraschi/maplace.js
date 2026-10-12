import { describe, expect, it, vi } from "vitest";
import { createEmitter } from "./emitter";

describe("createEmitter", () => {
  it("calls the listeners of the emitted event only, with its payload", () => {
    const emitter = createEmitter();
    const onSelect = vi.fn();
    const onHover = vi.fn();
    emitter.on("select", onSelect);
    emitter.on("hover", onHover);
    emitter.emit({ name: "select", payload: { id: "a" } });
    expect(onSelect).toHaveBeenCalledWith({ id: "a" });
    expect(onHover).not.toHaveBeenCalled();
  });

  it("removes a listener through its unsubscribe function or its signal", () => {
    const emitter = createEmitter();
    const unsubscribed = vi.fn();
    const aborted = vi.fn();
    const controller = new AbortController();
    emitter.on("select", unsubscribed)();
    emitter.on("select", aborted, { signal: controller.signal });
    controller.abort();
    emitter.emit({ name: "select", payload: { id: "a" } });
    expect(unsubscribed).not.toHaveBeenCalled();
    expect(aborted).not.toHaveBeenCalled();
  });

  it("removes every listener on clear", () => {
    const emitter = createEmitter();
    const listener = vi.fn();
    emitter.on("route", listener);
    emitter.clear();
    emitter.emit({ name: "route", payload: { result: undefined } });
    expect(listener).not.toHaveBeenCalled();
  });

  it("rejects an unknown event, a listener that is not a function and bad options", () => {
    const emitter = createEmitter();
    expect(() => emitter.on("selected" as "select", () => {})).toThrow(/^on: event must be one of/);
    expect(() => emitter.on("select", "log" as never)).toThrow(
      /^on: listener must be a function, got "log"$/,
    );
    expect(() => emitter.on("select", () => {}, { signal: {} as AbortSignal })).toThrow(
      /^on: options\.signal must be an AbortSignal/,
    );
  });
});
