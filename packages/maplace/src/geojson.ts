import type { LatLng, PolygonRings } from "./geometry";
import type { LocationGroup } from "./group-path";
import type { Location } from "./location";
import { child, type Field, item, mustBe, root } from "./validate/fail";
import { checkGroup } from "./validate/group";
import { type Check, checkObject, checkOneOf, checkString, checkTags } from "./validate/values";

/**
 * A GeoJSON FeatureCollection, as `locationsFromGeoJSON` reads it. Its strings are wide and a
 * feature's `properties` any object, so a JSON module's import (whose features' properties
 * differ) and `@types/geojson`'s collections both fit; the values are checked when it is called.
 */
export interface GeoJSONFeatureCollection {
  readonly type: string;
  readonly features: readonly GeoJSONFeature[];
}

/** One feature of a `GeoJSONFeatureCollection`: its `id` becomes the location's. */
export interface GeoJSONFeature {
  readonly type: string;
  readonly id?: string | number | undefined;
  readonly geometry: { readonly type: string; readonly coordinates?: unknown } | null;
  readonly properties?: object | null | undefined;
}

const GEOMETRY_TYPES = ["Point", "LineString", "Polygon", "MultiPolygon"] as const;
const POSITION = "a position, [lng, lat] in numbers";

/**
 * A GeoJSON FeatureCollection as locations, ready for `setLocations`: a `Point` becomes a marker,
 * a `LineString` a polyline, a `Polygon` a polygon (its first ring the path, the others its
 * holes, each without GeoJSON's closing point), a `MultiPolygon` one multipolygon, its polygons
 * read as a `Polygon`'s rings, even when it has only one. Positions are `[lng, lat]`; an altitude
 * is dropped. The `id` is the feature's (a number as its string), `title`, `group` (a name, or
 * a path as a list of names) and a list of `tags` its properties', and `data` its properties whole, typed `Data` as `createMaplace<Data>()`
 * types it.
 *
 * @throws `MaplaceError` `invalid-input` at the GeoJSON path (`features[2].geometry.type`) for a
 *   shape it can't read: not a FeatureCollection, a feature without an `id`, another geometry (a
 *   `MultiPoint` or `MultiLineString`, a `GeometryCollection`, none), a non-string `title`, a
 *   `group` that is neither a name nor a path, a list of `tags` that aren't strings, a bad position. Values, such as ranges, are the
 *   store's to check when the locations are set.
 */
export function locationsFromGeoJSON<Data = unknown>(
  collection: GeoJSONFeatureCollection,
): Location<Data>[] {
  const field = root("locationsFromGeoJSON");
  checkObject(collection, field, "a GeoJSON FeatureCollection");
  if (collection.type !== "FeatureCollection") {
    mustBe(child(field, "type"), '"FeatureCollection"', collection.type);
  }
  const featuresField = child(field, "features");
  if (!Array.isArray(collection.features)) {
    mustBe(featuresField, "an array of features", collection.features);
  }
  return collection.features.map((feature, index) =>
    locationOf<Data>(feature, item(featuresField, index)),
  );
}

function locationOf<Data>(feature: unknown, field: Field): Location<Data> {
  checkObject(feature, field, "a GeoJSON Feature");
  const id = idOf(feature.id, child(field, "id"));
  const identified = { ...field, locationId: id };
  const data = feature.properties as Data | null | undefined;
  return {
    id,
    ...labelsOf(feature.properties, child(identified, "properties")),
    ...(data !== null && data !== undefined && { data }),
    ...geometryOf(feature.geometry, child(identified, "geometry")),
  };
}

function idOf(id: unknown, field: Field): string {
  if (typeof id === "number") return String(id);
  if (typeof id !== "string") mustBe(field, "a string or a number", id);
  return id;
}

/** The labels the properties hold, leaving out those they don't. */
function labelsOf(
  properties: unknown,
  field: Field,
): { title?: string; group?: LocationGroup; tags?: readonly string[] } {
  if (properties === null || properties === undefined) return {};
  checkObject(properties, field);
  const title = labelFrom<string>(properties.title, child(field, "title"), checkString);
  const group = labelFrom<LocationGroup>(properties.group, child(field, "group"), checkGroup);
  const tags = tagsOf(properties.tags, child(field, "tags"));
  return {
    ...(title !== undefined && { title }),
    ...(group !== undefined && { group }),
    ...(tags !== undefined && { tags }),
  };
}

/**
 * Tags, from a list only: anything else named `tags` is the file's own, as an OpenStreetMap
 * export's object of keys is, and stays in `data` without failing the file.
 */
function tagsOf(value: unknown, field: Field): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  checkTags(value, field);
  return value as readonly string[];
}

/** A label `check` accepts, `null` meaning none: GIS tools write an empty attribute as `null`. */
function labelFrom<T>(value: unknown, field: Field, check: Check): T | undefined {
  if (value === null || value === undefined) return undefined;
  check(value, field);
  return value as T;
}

function geometryOf(geometry: unknown, field: Field) {
  checkObject(geometry, field, "a Point, LineString, Polygon or MultiPolygon geometry");
  checkOneOf(geometry.type, child(field, "type"), GEOMETRY_TYPES);
  const coordinates = child(field, "coordinates");
  switch (geometry.type) {
    case "Point":
      return latLngOf(geometry.coordinates, coordinates);
    case "LineString":
      return { type: "polyline" as const, path: pathOf(geometry.coordinates, coordinates) };
    case "Polygon":
      return { type: "polygon" as const, ...ringsOf(geometry.coordinates, coordinates) };
    case "MultiPolygon":
      return {
        type: "multipolygon" as const,
        polygons: polygonsOf(geometry.coordinates, coordinates),
      };
  }
}

function polygonsOf(polygons: unknown, field: Field): PolygonRings[] {
  if (!Array.isArray(polygons)) mustBe(field, "an array of polygons", polygons);
  return polygons.map((rings, index) => ringsOf(rings, item(field, index)));
}

/** One polygon's rings: its first the outline, the others its holes. */
function ringsOf(rings: unknown, field: Field): PolygonRings {
  if (!Array.isArray(rings)) mustBe(field, "an array of rings", rings);
  const [path = [], ...holes] = rings.map((ring, index) =>
    withoutClosingPoint(pathOf(ring, item(field, index))),
  );
  return { path, ...(holes.length > 0 && { holes }) };
}

function pathOf(positions: unknown, field: Field): LatLng[] {
  if (!Array.isArray(positions)) mustBe(field, "an array of positions", positions);
  // The field path is built only for a bad position: paths can hold many thousands.
  return positions.map((position, index) =>
    isPosition(position) ? toLatLng(position) : mustBe(item(field, index), POSITION, position),
  );
}

function latLngOf(position: unknown, field: Field): LatLng {
  if (!isPosition(position)) mustBe(field, POSITION, position);
  return toLatLng(position);
}

function isPosition(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number";
}

function toLatLng([lng, lat]: readonly [number, number]): LatLng {
  return { lat, lng };
}

/** Drops GeoJSON's closing point (a last point equal to the first) from a ring it owns. */
function withoutClosingPoint(ring: LatLng[]): LatLng[] {
  const [first] = ring;
  const last = ring.at(-1);
  if (ring.length > 1 && first?.lat === last?.lat && first?.lng === last?.lng) ring.pop();
  return ring;
}
