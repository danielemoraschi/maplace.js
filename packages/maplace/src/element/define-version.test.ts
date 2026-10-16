// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
import { defineElements } from "./define";

it("names another copy that gives no version string as of an unknown version", () => {
  class OtherCopy extends HTMLElement {
    static readonly maplaceVersion = { major: 0 };
  }
  customElements.define("maplace-map", OtherCopy);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  defineElements();
  expect(logged.mock.calls[0]?.[0]).toContain("already defined by maplace (unknown version)");
});
