import { describe, expect, it } from "vitest";
import { checkEventName, checkListenOptions } from "./events";
import { child, root } from "./fail";

const on = root("on");

describe("checkEventName", () => {
  it("accepts every event name", () => {
    for (const name of [
      "selectionChange",
      "hoverChange",
      "locationChange",
      "popupOpen",
      "popupClose",
      "viewportChange",
      "routeChange",
      "error",
    ]) {
      expect(() => checkEventName(name, child(on, "event"))).not.toThrow();
    }
  });

  it("rejects other names, listing the known ones", () => {
    expect(() => checkEventName("selected", child(on, "event"))).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        message: expect.stringMatching(
          /^on: event must be one of "selectionChange", "hoverChange", .*got "selected"$/,
        ),
        field: "event",
      }),
    );
  });
});

describe("checkListenOptions", () => {
  it("accepts an AbortSignal, or no signal", () => {
    expect(() =>
      checkListenOptions({ signal: new AbortController().signal }, child(on, "options")),
    ).not.toThrow();
    expect(() => checkListenOptions({ signal: undefined }, child(on, "options"))).not.toThrow();
  });

  it("rejects a signal that is not one", () => {
    expect(() => checkListenOptions({ signal: true }, child(on, "options"))).toThrow(
      /^on: options\.signal must be an AbortSignal, got true$/,
    );
  });

  it("rejects unknown options", () => {
    expect(() => checkListenOptions({ once: true }, child(on, "options"))).toThrow(
      /options\.once is not a listen option/,
    );
  });
});
