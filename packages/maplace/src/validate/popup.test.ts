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

  it("accepts the links' switches and labels", () => {
    const popup = {
      openInMapsLink: true,
      directionsLink: false,
      openInMapsLabel: "Open in Maps",
      directionsLabel: "Directions",
    };
    expect(() => checkPopupOptions(popup, field)).not.toThrow();
  });

  it("accepts openOn 'hover' with no link, whatever the labels say", () => {
    const popup = { openOn: "hover", openInMapsLink: false, directionsLabel: "Directions" };
    expect(() => checkPopupOptions(popup, field)).not.toThrow();
  });

  it("rejects a link switch that isn't a boolean, naming it", () => {
    expect(() => checkPopupOptions({ openInMapsLink: "Open" }, field)).toThrow(
      /popup\.openInMapsLink/,
    );
    expect(() => checkPopupOptions({ directionsLink: 1 }, field)).toThrow(/popup\.directionsLink/);
  });

  it("rejects a blank label naming it", () => {
    expect(() => checkPopupOptions({ openInMapsLabel: " " }, field)).toThrow(
      /popup\.openInMapsLabel/,
    );
    expect(() => checkPopupOptions({ directionsLabel: 1 }, field)).toThrow(
      /popup\.directionsLabel/,
    );
  });

  it("rejects openOn 'hover' beside either link, naming openOn", () => {
    for (const link of [{ openInMapsLink: true }, { directionsLink: true }]) {
      expect(() => checkPopupOptions({ openOn: "hover", ...link }, field)).toThrow(
        /popup\.openOn can't be 'hover' with a link in the popup/,
      );
    }
  });
});
