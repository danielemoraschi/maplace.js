// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createMaplace } from "../index";
import { optionsIn } from "../testing/lists";
import { listFromAttributes } from "./element-list";
import { elementWith } from "./testing/dom";

describe("the list's switches", () => {
  it("refuses search with list='select', naming it", () => {
    const host = elementWith({ list: "select", search: "" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "search" }),
    );
  });

  it.each([
    ["search='false'", { search: "false" }],
    ["a lone search-label", { "search-label": "Find" }],
  ])("takes %s on list='select', with no box", (_, attributes) => {
    const host = elementWith({ list: "select", ...attributes });
    listFromAttributes(host, createMaplace());
    expect(host.querySelector("input")).toBeNull();
  });

  it.each(["fit-all", "search"])("refuses %s that is neither true nor false, naming it", (name) => {
    const host = elementWith({ list: "", [name]: "maybe" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({ code: "invalid-input", field: name }),
    );
  });

  it("builds fit-all and search in their default words", () => {
    const host = elementWith({ list: "", "fit-all": "", search: "" });
    listFromAttributes(host, createMaplace());
    expect(optionsIn(host)[0]?.textContent).toBe("All locations");
    expect(host.querySelector("input")?.getAttribute("aria-label")).toBe("Search");
  });

  it("builds neither from its label alone", () => {
    const host = elementWith({ list: "", "fit-all-label": "All", "search-label": "Find" });
    listFromAttributes(host, createMaplace());
    expect(optionsIn(host)).toEqual([]);
    expect(host.querySelector("input")).toBeNull();
  });
});
