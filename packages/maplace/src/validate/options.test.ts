import { describe, expect, it } from "vitest";
import { validateOptions } from "./options";

describe("validateOptions", () => {
  it("accepts no options and every documented option", () => {
    expect(() => validateOptions(undefined)).not.toThrow();
    const options = {
      locations: [{ id: "h", lat: 1, lng: 2, html: "<b>x</b>" }],
      selectedId: "h",
      sanitize: (html: string) => html,
      popup: { openOn: "click" },
      style: { fill: "red" },
      cluster: true,
      view: { kind: "fit-all", padding: 40 },
    };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("rejects something that is not an object", () => {
    expect(() => validateOptions([])).toThrow(
      expect.objectContaining({
        message: "createMaplace: options must be an object, got an array",
        field: "options",
      }),
    );
  });

  it("points 0.2 options at their replacement", () => {
    expect(() => validateOptions({ start: 1 })).toThrow(
      expect.objectContaining({
        message: "createMaplace: options.start is a 0.2 option; use selectedId",
        field: "options.start",
      }),
    );
    expect(() => validateOptions({ map_div: "#map" })).toThrow(
      /map_div is a 0.2 option; pass the container to attach/,
    );
  });

  it("rejects unknown options", () => {
    expect(() => validateOptions({ zoom: 3 })).toThrow(/options\.zoom is not a maplace option/);
  });

  it("checks each option's value", () => {
    expect(() => validateOptions({ cluster: "yes" })).toThrow(
      /options\.cluster must be a boolean, got "yes"/,
    );
    expect(() => validateOptions({ sanitize: "dompurify" })).toThrow(
      /options\.sanitize must be a function/,
    );
    expect(() => validateOptions({ selectedId: "" })).toThrow(
      /options\.selectedId must be a non-empty string/,
    );
  });

  it("checks the locations with the given sanitizer", () => {
    const html = [{ id: "h", lat: 1, lng: 2, html: "<b>x</b>" }];
    expect(() => validateOptions({ locations: html })).toThrow(
      expect.objectContaining({ code: "missing-sanitizer" }),
    );
    expect(() => validateOptions({ locations: [{ id: "a", lat: 99, lng: 0 }] })).toThrow(
      /location "a": lat must be a number from -90 to 90, got 99/,
    );
  });
});
