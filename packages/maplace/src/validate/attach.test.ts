// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAdapter, containerOf } from "./attach";
import { child, root } from "./fail";

const field = root("attach");
const container = child(field, "container");

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("containerOf", () => {
  it("returns an element node, from any realm", () => {
    const element = { nodeType: 1 };
    expect(containerOf(element, field)).toBe(element);
  });

  it("resolves a selector to the element it matches", () => {
    const map = Object.assign(document.createElement("div"), { id: "map" });
    document.body.append(map);
    expect(containerOf("#map", container)).toBe(map);
  });

  it("refuses a selector matching nothing, naming it", () => {
    expect(() => containerOf("#nope", container)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: "container",
        message: 'attach: container "#nope" matches no element',
      }),
    );
  });

  it("refuses a selector that isn't valid", () => {
    expect(() => containerOf("#", container)).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: 'attach: container "#" is not a valid selector',
      }),
    );
  });

  it("lets through what the lookup throws for any other reason", () => {
    const failure = new TypeError("the document went away");
    vi.spyOn(document, "querySelector").mockImplementation(() => {
      throw failure;
    });
    expect(() => containerOf("#map", container)).toThrow(failure);
  });

  it("refuses what is neither an element nor a string", () => {
    expect(() => containerOf({ nodeType: 3 }, field)).toThrow("must be an HTMLElement");
    expect(() => containerOf(42, field)).toThrow(
      "attach: must be an HTMLElement or a selector, got 42",
    );
  });
});

describe("checkAdapter", () => {
  it("accepts an object with capabilities and mount", () => {
    expect(() => checkAdapter({ capabilities: new Set(), mount() {} }, field)).not.toThrow();
  });

  it("rejects anything else", () => {
    expect(() => checkAdapter(null, field)).toThrow("must be an adapter");
    expect(() => checkAdapter({ capabilities: ["route"], mount() {} }, field)).toThrow(
      "must be an adapter",
    );
    expect(() => checkAdapter({ capabilities: new Set() }, field)).toThrow("must be an adapter");
  });
});
