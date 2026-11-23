// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createStandingMisuse } from "./standing-misuse";
import { StoreProperties } from "./store-properties";
import { elementWith, errorsOn } from "./testing/dom";

function properties() {
  const host = elementWith({});
  const misuse = createStandingMisuse(host, () => {});
  return { properties: new StoreProperties(misuse), misuse, errors: errorsOn(host) };
}

const sanitize = (html: string) => html;
const icon = () => document.createElement("b");

describe("StoreProperties", () => {
  it("keeps each property until taken, and takes only those given", () => {
    const { properties: given } = properties();
    given.give("markerIcon", icon);
    given.give("markerIcon", undefined);
    given.give("sanitize", sanitize);
    expect(given.take()).toEqual({ options: { sanitize }, refused: [] });
  });

  it("refuses a change once taken, and clears that when the same value comes back", () => {
    const { properties: given, misuse, errors } = properties();
    given.give("sanitize", sanitize);
    given.take();
    given.give("sanitize", (html: string) => html.trim());
    expect(errors.map(({ message }) => message)).toEqual([
      "<maplace-map>: sanitize can't change once the map is created",
    ]);
    given.give("sanitize", sanitize);
    expect(misuse.stands()).toBe(false);
  });

  it("takes a refused one out, returning its misuse, saying nothing itself", () => {
    const { properties: given, errors } = properties();
    given.give("markerIcon", 42 as never);
    given.give("sanitize", sanitize);
    const { options, refused } = given.take();
    expect(options).toEqual({ sanitize });
    expect(refused.map(([name, { field }]) => [name, field])).toEqual([
      ["markerIcon", "markerIcon"],
    ]);
    expect([errors, given.get("markerIcon")]).toEqual([[], undefined]);
  });
});
