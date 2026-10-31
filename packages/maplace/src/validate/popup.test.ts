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

  it("accepts the link labels", () => {
    const popup = { openInMapsLabel: "Open in Maps", directionsLabel: "Directions" };
    expect(() => checkPopupOptions(popup, field)).not.toThrow();
  });

  it("accepts openOn 'hover' with no label", () => {
    const popup = { openOn: "hover", openInMapsLabel: undefined, directionsLabel: undefined };
    expect(() => checkPopupOptions(popup, field)).not.toThrow();
  });

  it("rejects a blank label naming it", () => {
    expect(() => checkPopupOptions({ openInMapsLabel: " " }, field)).toThrow(
      /popup\.openInMapsLabel/,
    );
    expect(() => checkPopupOptions({ directionsLabel: 1 }, field)).toThrow(
      /popup\.directionsLabel/,
    );
  });

  it("rejects openOn 'hover' beside either label, naming openOn", () => {
    for (const label of [{ openInMapsLabel: "Open" }, { directionsLabel: "Go" }]) {
      expect(() => checkPopupOptions({ openOn: "hover", ...label }, field)).toThrow(
        /popup\.openOn can't be 'hover' with a link in the popup/,
      );
    }
  });
});
