import { describe, expect, it } from "vitest";
import { locationsFromGeoJSON } from "./geojson";
import { createMaplace } from "./maplace/create";

type Geometry = { type: string; coordinates?: unknown } | null;

function feature(id: string | number, geometry: Geometry, properties?: object | null) {
  return { type: "Feature", id, geometry, properties };
}

function collection(...features: ReturnType<typeof feature>[]) {
  return { type: "FeatureCollection", features };
}

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 0],
];
const hole = [
  [2, 2],
  [4, 2],
  [4, 4],
  [2, 2],
];

describe("locationsFromGeoJSON", () => {
  it("turns a Point into a marker, reading [lng, lat] and dropping an altitude", () => {
    const point = feature("a", { type: "Point", coordinates: [12.5, 41.9, 21] });
    expect(locationsFromGeoJSON(collection(point))).toEqual([{ id: "a", lat: 41.9, lng: 12.5 }]);
  });

  it("turns a LineString into a polyline, its points in order", () => {
    const line = feature("a", {
      type: "LineString",
      coordinates: [
        [1, 2],
        [3, 4],
        [5, 6, 7],
      ],
    });
    expect(locationsFromGeoJSON(collection(line))).toEqual([
      {
        id: "a",
        type: "polyline",
        path: [
          { lat: 2, lng: 1 },
          { lat: 4, lng: 3 },
          { lat: 6, lng: 5 },
        ],
      },
    ]);
  });

  it("turns a Polygon into a polygon: its first ring the path, the others its holes, each without its closing point", () => {
    const polygon = feature("a", { type: "Polygon", coordinates: [square, hole] });
    expect(locationsFromGeoJSON(collection(polygon))).toEqual([
      {
        id: "a",
        type: "polygon",
        path: [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 10 },
          { lat: 10, lng: 10 },
        ],
        holes: [
          [
            { lat: 2, lng: 2 },
            { lat: 2, lng: 4 },
            { lat: 4, lng: 4 },
          ],
        ],
      },
    ]);
  });

  it("leaves a ring GeoJSON left unclosed as it is", () => {
    const open = feature("a", { type: "Polygon", coordinates: [square.slice(0, 3)] });
    const [polygon] = locationsFromGeoJSON(collection(open));
    expect(polygon).toMatchObject({ path: [{ lng: 0 }, { lng: 10 }, { lng: 10 }] });
  });

  it("gives a polygon with one ring no holes", () => {
    const polygon = feature("a", { type: "Polygon", coordinates: [square] });
    expect(locationsFromGeoJSON(collection(polygon))[0]).not.toHaveProperty("holes");
  });

  it("takes the id from the feature, a number as its string", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    const ids = locationsFromGeoJSON(collection(feature(7, point), feature("b", point))).map(
      (location) => location.id,
    );
    expect(ids).toEqual(["7", "b"]);
  });

  it("takes title and group from the properties, and keeps all the properties in data", () => {
    const properties = { title: "Rome", group: "office", phone: "06 123" };
    const point = feature("a", { type: "Point", coordinates: [1, 2] }, properties);
    expect(locationsFromGeoJSON(collection(point))).toEqual([
      { id: "a", title: "Rome", group: "office", data: properties, lat: 2, lng: 1 },
    ]);
  });

  it("reads a null title or group, as GIS exports write empty attributes, as none", () => {
    const properties = { title: null, group: null, phone: "06 123" };
    const point = feature("a", { type: "Point", coordinates: [1, 2] }, properties);
    const locations = locationsFromGeoJSON(collection(point));
    expect(locations).toStrictEqual([{ id: "a", data: properties, lat: 2, lng: 1 }]);
    expect(() => createMaplace({ locations })).not.toThrow();
  });

  it("takes tags from a list in the properties", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    const [tagged] = locationsFromGeoJSON(collection(feature("a", point, { tags: ["parking"] })));
    expect(tagged?.tags).toEqual(["parking"]);
  });

  it("leaves `tags` that aren't a list to data, as an OpenStreetMap export's object is", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    for (const tags of [null, "parking", { amenity: "cafe" }]) {
      const [location] = locationsFromGeoJSON(collection(feature("a", point, { tags })));
      expect(location).not.toHaveProperty("tags");
      expect(location?.data).toEqual({ tags });
    }
  });

  it("names a list of tags that aren't strings", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    expect(() => locationsFromGeoJSON(collection(feature("a", point, { tags: [1] })))).toThrow(
      /features\[0\]\.properties\.tags\[0\] must be a string/,
    );
  });

  it("gives a feature with null or no properties no title, group or data", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    const locations = locationsFromGeoJSON(
      collection(feature("a", point, null), feature("b", point)),
    );
    expect(locations.map((location) => Object.keys(location))).toEqual([
      ["id", "lat", "lng"],
      ["id", "lat", "lng"],
    ]);
  });

  it("keeps the features in order, and an empty collection gives no locations", () => {
    const point = { type: "Point", coordinates: [1, 2] };
    const ids = locationsFromGeoJSON(collection(feature("z", point), feature("a", point))).map(
      (location) => location.id,
    );
    expect(ids).toEqual(["z", "a"]);
    expect(locationsFromGeoJSON(collection())).toEqual([]);
  });

  it("returns locations the store takes as they are", () => {
    const locations = locationsFromGeoJSON(
      collection(
        feature("point", { type: "Point", coordinates: [1, 2] }, { title: "P" }),
        feature("line", {
          type: "LineString",
          coordinates: [
            [1, 2],
            [3, 4],
          ],
        }),
        feature("area", { type: "Polygon", coordinates: [square, hole] }, null),
      ),
    );
    const maplace = createMaplace({ locations });
    expect(maplace.getSnapshot().locations.map((location) => location.id)).toEqual([
      "point",
      "line",
      "area",
    ]);
  });

  it("leaves the values to the store: an out-of-range latitude is refused by setLocations, naming the location", () => {
    const locations = locationsFromGeoJSON(
      collection(feature("a", { type: "Point", coordinates: [1, 95] })),
    );
    expect(() => createMaplace({ locations })).toThrow(
      expect.objectContaining({ code: "invalid-input", locationId: "a", field: "lat" }),
    );
  });
});
