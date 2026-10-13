import { describe, expect, it } from "vitest";
import { createHoverIntent } from "./hover-intent";

describe("createHoverIntent", () => {
  it("hovers what the pointer is on, else what has focus", () => {
    const intent = createHoverIntent();
    expect(intent.focused("a")).toEqual({ hover: "a" });
    expect(intent.pointerEntered("b")).toEqual({ hover: "b" });
    expect(intent.pointerLeft()).toEqual({ hover: "a" });
    expect(intent.blurred()).toEqual({ unhover: "a" });
  });

  it("moving focus between entries is one hover, not a clear and a set", () => {
    const intent = createHoverIntent();
    intent.focused("a");
    expect(intent.focused("b")).toEqual({ hover: "b" });
  });

  it("asks nothing when its hover doesn't change", () => {
    const intent = createHoverIntent();
    intent.pointerEntered("a");
    expect(intent.focused("a")).toBeUndefined();
    expect(intent.pointerLeft()).toBeUndefined();
    expect(createHoverIntent().blurred()).toBeUndefined();
  });

  it("forgets entries no longer listed, without asking the store", () => {
    const intent = createHoverIntent();
    intent.focused("a");
    intent.retain((id) => id !== "a");
    expect(intent.current()).toBeUndefined();
    expect(intent.blurred()).toBeUndefined();
  });
});
