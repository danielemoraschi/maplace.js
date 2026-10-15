// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
import { defineElements } from "./define";
import { MaplaceMap } from "./map-element";
import { MAPLACE_VERSION } from "./version";

// Its own file: a page's element definitions can't be undone.
it("says so when another copy defined only <maplace-location>, whose children it can't read", () => {
  class OtherLocation extends HTMLElement {
    static readonly maplaceVersion = "0.9.0";
  }
  customElements.define("maplace-location", OtherLocation);
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  defineElements();
  defineElements();
  expect(customElements.get("maplace-map")).toBe(MaplaceMap);
  expect(logged).toHaveBeenCalledOnce();
  expect(logged.mock.calls[0]?.[0]).toMatch(
    new RegExp(
      `maplace ${MAPLACE_VERSION}: <maplace-location> is already defined by maplace 0\\.9\\.0`,
    ),
  );
});
