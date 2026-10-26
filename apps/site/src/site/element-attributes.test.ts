import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCATION_ATTRIBUTES } from "../../../../packages/maplace/src/element/location-attributes.ts";
import { ROOT } from "../../../../scripts/build/package.ts";
import { captures } from "../../../../scripts/docs/markdown.ts";
import {
  ATTRIBUTES_READ_BY_NAME,
  GOOGLE_PROVIDER_ATTRIBUTES,
  MAP_ATTRIBUTES,
  MAPLIBRE_PROVIDER_ATTRIBUTES,
} from "./element-attributes.ts";

const ELEMENT_SOURCES = globSync("packages/maplace/src/element/*.ts", { cwd: ROOT })
  .filter((file) => !file.includes(".test"))
  .map((file) => readFileSync(join(ROOT, file), "utf8"))
  .join("\n");

// An attribute read by a literal name: `getAttribute("hold")`, `hasAttribute("cluster")`,
// `givenAttribute(element, "map-id")`, `numberOrRaw(element, "zoom")`, `textOf(host, "list-heading")`,
// `read("map-id")`.
const READ_BY_LITERAL = /(?:(?:Attribute|OrRaw|textOf)\((?:[\w.#]+, )?|\bread\()"([a-z-]+)"/g;
const READ_IN_SOURCE = captures(ELEMENT_SOURCES, READ_BY_LITERAL);

describe("ATTRIBUTES_READ_BY_NAME", () => {
  it.each(ATTRIBUTES_READ_BY_NAME)("names an attribute the element's source reads: %s", (name) => {
    expect(READ_IN_SOURCE).toContain(name);
  });
});

describe("the element's attribute lists", () => {
  it("hold every attribute its source reads by name", () => {
    const documented = [
      ...MAP_ATTRIBUTES,
      ...GOOGLE_PROVIDER_ATTRIBUTES,
      ...MAPLIBRE_PROVIDER_ATTRIBUTES,
      ...LOCATION_ATTRIBUTES,
    ];
    expect(READ_IN_SOURCE.filter((name) => !documented.includes(name))).toEqual([]);
  });
});

describe("MAP_ATTRIBUTES", () => {
  it("holds the list attributes and those read by name, once each", () => {
    expect(MAP_ATTRIBUTES).toEqual(expect.arrayContaining(["list", "list-heading", "hold"]));
    expect(new Set(MAP_ATTRIBUTES).size).toBe(MAP_ATTRIBUTES.length);
  });
});
