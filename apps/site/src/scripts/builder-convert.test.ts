// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { MaplaceError } from "../../../../packages/maplace/src/index.ts";
import { convertPasted } from "./builder-convert.ts";
import { PasteRefused } from "./builder-report.ts";

const LIST = '[{ "lat": 1, "lng": 2 }, { "lat": 3, "lng": 4 }]';
const CONFIG = "{ locations: [{ lat: 1, lon: 2 }, { lat: 3, lon: 4 }] }";
const titles = (text: string) => convertPasted(text).locations.map(({ title }) => title);

describe("convertPasted's choice of reader", () => {
  it.each([
    ["lat,lng\n1,2", "CSV"],
    ["variant,lat,lng\nx,1,2", "CSV"],
    ["letter,lat,lng\nx,1,2", "CSV"],
    ["constituency,lat,lng\nx,1,2", "CSV"],
    [LIST, "a list of locations"],
    [CONFIG, "a 0.2 config"],
    [`var config = ${CONFIG};`, "a 0.2 config"],
    [`new Maplace(${CONFIG}).Load();`, "a 0.2 config"],
    [`$(function () { new Maplace(${CONFIG}) })`, "a 0.2 config"],
    [`// my [list]\n${CONFIG}`, "a 0.2 config"],
    [`// new Maplace({ no: 1 })\n${CONFIG}`, "a 0.2 config"],
    [
      '{ "type": "FeatureCollection", "features": [{ "type": "Feature", "id": 1, "geometry": { "type": "Point", "coordinates": [2, 1] } }] }',
      "GeoJSON",
    ],
  ])("reads %s as %s", (text, format) => {
    expect(convertPasted(text).format).toBe(format);
  });

  it("reads an apostrophe in a CSV as text", () => {
    expect(titles("name,lat,lng\nL'Aquila,42.35,13.4")).toEqual(["L'Aquila"]);
    expect(titles("name,lat,lng\nL'Aquila,42.35,13.4\nSant'Anna,43,10")).toEqual([
      "L'Aquila",
      "Sant'Anna",
    ]);
  });

  it.each([
    '{ "type": "Feature", "geometry": null }',
    '{ "type": "Point", "coordinates": [1, 2] }',
  ])("says %s is GeoJSON that needs a FeatureCollection", (text) => {
    expect(() => convertPasted(text)).toThrow("FeatureCollection");
  });

  it("refuses an object it knows nothing of", () => {
    expect(() => convertPasted('{ "lat": 1 }')).toThrow("This page reads");
    expect(() => convertPasted("new Maplace(config)")).toThrow("this is config");
  });
});

describe("convertPasted's attributes", () => {
  it("gives a list of several locations a list, and of one none", () => {
    expect(convertPasted(LIST).attributes).toEqual([["list", ""]]);
    expect(convertPasted('[{ "lat": 1, "lng": 2 }]').attributes).toEqual([]);
  });
});

describe("convertPasted on GeoJSON", () => {
  const collection = (features: unknown) => JSON.stringify({ type: "FeatureCollection", features });
  const point = (fields: object) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [2, 1] },
    ...fields,
  });

  it("brings feature ids and data through", () => {
    const [location] = convertPasted(
      collection([point({ id: 7, properties: { a: 1 } })]),
    ).locations;
    expect(location).toMatchObject({ id: "7", data: { a: 1 }, lat: 1, lng: 2 });
  });

  it("gives features without an id free positions", () => {
    const { locations } = convertPasted(collection([point({ id: 2 }), point({})]));
    expect(locations.map(({ id }) => id)).toEqual(["2", "3"]);
  });

  it("takes properties.name as the title when there is no title", () => {
    expect(titles(collection([point({ properties: { name: "n" } })]))).toEqual(["n"]);
    expect(titles(collection([point({ properties: { name: "n", title: "t" } })]))).toEqual(["t"]);
  });

  it("leaves a non-array features to locationsFromGeoJSON's refusal", () => {
    expect(() => convertPasted(collection(5))).toThrow(MaplaceError);
  });

  it("refuses GeoJSON holding code", () => {
    expect(() => convertPasted('{ type: "FeatureCollection", features: foo() }')).toThrow(
      PasteRefused,
    );
  });
});

describe("convertPasted and the store", () => {
  it.each([
    ['[{ "id": 1, "lat": 1, "lng": 2 }, { "id": "1", "lat": 3, "lng": 4 }]', "duplicate-id"],
    ['[{ "id": "north", "lat": 200, "lng": 2 }]', "north"],
    ['[{ "lat": 1, "lng": 2, "html": 5 }]', "html"],
    ['[{ "lat": 1, "lng": 2, "html": "a", "content": "b" }]', "html"],
    ["lat,lng\nnorth,2", "north"],
    [
      '{ type: "polygon", locations: [{ lat: 1, lon: 2 }, { lat: 3, lon: 4 }] }',
      "at least 3 points",
    ],
    ['[{ "type": "polyline" }]', "path"],
  ])("lets the store refuse %s", (text, words) => {
    const refusal = () => convertPasted(text);
    expect(refusal).toThrow(MaplaceError);
    try {
      refusal();
    } catch (error) {
      expect(`${(error as MaplaceError).code} ${(error as Error).message}`).toContain(words);
    }
  });

  it("lets html pass and stay on the location", () => {
    const [location] = convertPasted('[{ "lat": 1, "lng": 2, "html": "<b>x</b>" }]').locations;
    expect(location?.html).toBe("<b>x</b>");
  });
});

describe("convertPasted on values of the wrong type", () => {
  const point = "{ lat: 1, lon: 2 }";
  const circle = `{ type: "circle", locations: [${point}, ${point}], `;
  it.each([
    `[{ lat: 1, lng: 2, html: 5 }]`,
    `[{ lat: 1, lng: 2, title: 5, html: "%title" }]`,
    `${circle} stroke_options: null }`,
    `${circle} stroke_options: "x" }`,
    `${circle} circle_options: "x" }`,
    `{ shared: null, locations: [${point}] }`,
    `{ shared: foo, locations: [${point}] }`,
    `{ controls_title: 5, locations: [${point}, ${point}] }`,
    `{ view_all_text: "  ", locations: [${point}, ${point}] }`,
    `[{ lat: 1, lng: 2, tags: 5 }]`,
    `[5]`,
  ])("ends %s in a note or a refusal, never another error", (text) => {
    try {
      convertPasted(text);
    } catch (error) {
      expect(error instanceof PasteRefused || error instanceof MaplaceError, String(error)).toBe(
        true,
      );
    }
  });
});
