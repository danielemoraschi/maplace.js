import { describe, expect, it } from "vitest";
import { countriesFrom } from "./natural-earth.ts";

/** A Natural Earth admin-0 feature, with only the fields read and one to drop. */
function country(
  code: string,
  name: string,
  people: number,
  gdpMillions: number,
  geometry: { type: string; coordinates: unknown },
  longName = name,
) {
  return {
    type: "Feature",
    properties: {
      ADM0_A3: code,
      NAME: name,
      NAME_LONG: longName,
      POP_EST: people,
      GDP_MD: gdpMillions,
      SOVEREIGNT: name,
    },
    geometry,
  };
}

const square = {
  type: "Polygon",
  coordinates: [
    [
      [2.123, 46.456],
      [3.987, 46.456],
      [3.987, 47.001],
      [2.123, 46.456],
    ],
  ],
};

describe("countriesFrom", () => {
  it("keeps each country's code as its id, its name, its GDP per person and its geometry, rounded", () => {
    const collection = {
      type: "FeatureCollection",
      features: [country("FRA", "France", 1000000, 2500, square)],
    };
    expect(countriesFrom(collection)).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "FRA",
          properties: { title: "France", gdpPerPerson: 2500 },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2.12, 46.46],
                [3.99, 46.46],
                [3.99, 47],
                [2.12, 46.46],
              ],
            ],
          },
        },
      ],
    });
  });

  it("gives no GDP per person to an area of under 10,000 people", () => {
    const collection = {
      type: "FeatureCollection",
      features: [country("FLK", "Falkland Is.", 3398, 282, square)],
    };
    expect(countriesFrom(collection).features[0]?.properties.gdpPerPerson).toBeNull();
  });

  it("leaves Antarctica out", () => {
    const features = [
      country("ATA", "Antarctica", 4490, 898, square),
      country("FRA", "France", 1e6, 2500, square),
    ];
    expect(countriesFrom({ features }).features.map(({ id }) => id)).toEqual(["FRA"]);
  });

  it("names a country in full where Natural Earth's short name abbreviates it", () => {
    const features = [
      country("BIH", "Bosnia and Herz.", 3e6, 20_000, square, "Bosnia and Herzegovina"),
      country("PRK", "North Korea", 25e6, 40_000, square, "Dem. Rep. Korea"),
    ];
    const titles = countriesFrom({ features }).features.map(({ properties }) => properties.title);
    expect(titles).toEqual(["Bosnia and Herzegovina", "North Korea"]);
  });

  it("lists the countries by name, as the select a reader picks from", () => {
    const features = [
      country("FJI", "Fiji", 1e6, 5_000, square),
      country("AFG", "Afghanistan", 38e6, 19_000, square),
      country("CZE", "Czechia", 10e6, 250_000, square),
    ];
    const ids = countriesFrom({ features }).features.map(({ id }) => id);
    expect(ids).toEqual(["AFG", "CZE", "FJI"]);
  });
});
