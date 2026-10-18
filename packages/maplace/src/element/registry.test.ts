import { describe, expect, it, vi } from "vitest";
import { createRegistry } from "./registry";

type Factory = () => string;

const KIND = { noun: "widget", builds: "a widget", field: "widget" };

const factory = (): Factory => () => "built";

describe("createRegistry", () => {
  it("gives what was added under a name, and only that", () => {
    const registry = createRegistry<Factory>(KIND);
    const one = factory();
    registry.add("one", one);
    expect(registry.get("one")).toBe(one);
    expect(registry.get("two")).toBeUndefined();
    expect([...registry.values()]).toEqual([one]);
  });

  it("takes the same entry twice, but not another under its name", () => {
    const registry = createRegistry<Factory>(KIND);
    const one = factory();
    registry.add("one", one);
    expect(() => registry.add("one", one)).not.toThrow();
    expect(() => registry.add("one", factory())).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: "widget",
        message: expect.stringMatching(/widget "one" is already registered/),
      }),
    );
  });

  it.each([
    ["an empty name", "", factory(), /a widget's name must be a non-empty string, got /],
    ["a name that isn't a string", 3, factory(), /non-empty string, got 3/],
    [
      "an entry that isn't a function",
      "one",
      "x",
      /widget "one" must be a function building a widget/,
    ],
  ])("refuses %s", (_, name, entry, message) => {
    const registry = createRegistry<Factory>(KIND);
    expect(() => registry.add(name as string, entry as Factory)).toThrow(
      expect.objectContaining({ field: "widget", message: expect.stringMatching(message) }),
    );
  });

  it("tells those waiting of each entry added, until they stop", () => {
    const registry = createRegistry<Factory>(KIND);
    const waiting = vi.fn();
    const stop = registry.onAdded(waiting);
    registry.add("one", factory());
    registry.add("one", registry.get("one") as Factory);
    expect(waiting).toHaveBeenCalledTimes(1);
    stop();
    registry.add("two", factory());
    expect(waiting).toHaveBeenCalledTimes(1);
  });

  it("doesn't tell one that starts waiting while others are told", () => {
    const registry = createRegistry<Factory>(KIND);
    const late = vi.fn();
    registry.onAdded(() => registry.onAdded(late));
    registry.add("one", factory());
    expect(late).not.toHaveBeenCalled();
  });

  it("names what it holds, quoted, in the order added", () => {
    const registry = createRegistry<Factory>(KIND);
    registry.add("b", factory());
    registry.add("a", factory());
    expect(registry.names()).toBe('"b", "a"');
  });
});
