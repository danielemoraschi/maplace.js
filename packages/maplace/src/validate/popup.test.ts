import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkPopupOptions } from "./popup";

function argument(call: string, name: string) {
  return child(root(call), name);
}

describe("checkPopupOptions", () => {
  const field = argument("createMaplace", "popup");

  it("accepts the documented options", () => {
    const popup = { maxWidth: 300, offset: [0, -10], openOn: "hover" };
    expect(() => checkPopupOptions(popup, field)).not.toThrow();
  });

  it("rejects a bad offset or openOn", () => {
    expect(() => checkPopupOptions({ offset: [1] }, field)).toThrow(
      /popup\.offset must be a pair of numbers \[x, y\], got an array/,
    );
    expect(() => checkPopupOptions({ openOn: "focus" }, field)).toThrow(
      /popup\.openOn must be one of "click", "hover", got "focus"/,
    );
  });
});
