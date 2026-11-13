import { describe, expect, it } from "vitest";
import { API_LISTS } from "../../../../packages/maplace/src/__typetests__/api-lists.ts";
import * as google from "../../../../packages/maplace/src/google/index.ts";
import * as core from "../../../../packages/maplace/src/index.ts";
import * as maplibre from "../../../../packages/maplace/src/maplibre/index.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import { missingFrom } from "../../../../scripts/checks/lists.ts";
import { backticked } from "../../../../scripts/docs/markdown.ts";
import { mistakesToAvoid } from "./agent-skill-mistakes.ts";
import { GOOGLE_PROVIDER_ATTRIBUTES, MAP_ATTRIBUTES } from "./element-attributes.ts";
import { LOCATION_FIELDS, STORE_NAMES } from "./reference-names.ts";
import { GOOGLE_MAP_OPTIONS, MAP_ELEMENT_PROPERTIES } from "./reference-names-bindings.ts";

const MISTAKES = mistakesToAvoid();

/** Names the API states: an attribute, a property, an option, a field, a code or an export. */
const API_NAMES: readonly string[] = [
  ...MAP_ATTRIBUTES,
  ...GOOGLE_PROVIDER_ATTRIBUTES,
  ...MAP_ELEMENT_PROPERTIES,
  ...STORE_NAMES.options,
  ...GOOGLE_MAP_OPTIONS,
  ...Object.values(LOCATION_FIELDS).flat(),
  ...API_LISTS.misuseCodes,
  ...Object.keys(core),
  ...Object.keys(google),
  ...Object.keys(maplibre),
];

/** What the list names that no API list holds, by the doc that states it. */
const DOC_LITERALS: Readonly<Record<string, string>> = {
  "new Maplace(options).Load()": "MIGRATION.md",
  "<maplace-map>": "docs/reference/element.md",
  ApiProjectMapError: "docs/reference/setup.md",
  DEMO_MAP_ID: "docs/reference/setup.md",
  key: "docs/reference/setup.md",
  "[lng, lat]": "docs/reference/locations.md",
  "{ lat, lng }": "docs/reference/locations.md",
};

/** A span as the API names it: a method called in the text, `release()`, is `release`. */
const apiNameOf = (span: string) => span.replace(/^(\w+)\(\)$/, "$1");

describe("the skill's mistakes to avoid", () => {
  it("names only the API's names, or what the docs state", () => {
    const known = [...API_NAMES, ...Object.keys(DOC_LITERALS)];
    expect(missingFrom(known, backticked(MISTAKES).map(apiNameOf))).toEqual([]);
    for (const [literal, doc] of Object.entries(DOC_LITERALS)) {
      expect(readRootFile(doc), `${literal} in ${doc}`).toContain(`\`${literal}\``);
    }
  });

  it("has a code span on every line, so none escapes the check", () => {
    const lines = MISTAKES.split("\n").filter(
      (line) => line.trim() !== "" && !line.startsWith("#"),
    );
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(backticked(line), line).not.toEqual([]);
  });

  it("is right that html needs sanitize", () => {
    const locations = [{ id: "a", lat: 0, lng: 0, html: "<b>a</b>" }];
    expect(() => core.createMaplace({ locations })).toThrow(
      expect.objectContaining({ code: "missing-sanitizer" }),
    );
  });

  it("is right that GeoJSON's positions are [lng, lat]", () => {
    const [location] = core.locationsFromGeoJSON({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "a",
          properties: {},
          geometry: { type: "Point", coordinates: [2, 1] },
        },
      ],
    });
    expect(location).toMatchObject({ lat: 1, lng: 2 });
  });
});
