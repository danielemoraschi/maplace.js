import { describe, expect, it } from "vitest";
import { checkAdapter, checkContainer } from "./attach";
import { root } from "./fail";

const field = root("attach");

describe("checkContainer", () => {
  it("accepts an element node, from any realm", () => {
    expect(() => checkContainer({ nodeType: 1 }, field)).not.toThrow();
  });

  it("rejects anything else", () => {
    expect(() => checkContainer({ nodeType: 3 }, field)).toThrow("must be an HTMLElement");
    expect(() => checkContainer("#map", field)).toThrow(
      'attach: must be an HTMLElement, got "#map"',
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
