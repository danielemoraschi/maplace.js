import {
  createMaplace,
  type GeoJSONFeatureCollection,
  type Location,
  locationsFromGeoJSON,
} from "../../../../packages/maplace/src/index.ts";
import { isCode } from "./builder-code-start.ts";
import { recordsFromCsv } from "./builder-csv.ts";
import { locationFromRecord, recordsWithIds } from "./builder-fields.ts";
import { fromLegacyConfig, isLegacyConfig, type MapAttributes } from "./builder-legacy-config.ts";
import {
  firstRefusedIn,
  isRecord,
  type Literal,
  readLiteral,
  refusalWords,
} from "./builder-literal.ts";
import { createReport, type Note, PasteRefused, type Report } from "./builder-report.ts";
import type { PastedLocation } from "./builder-shapes.ts";

/** What a paste became: checked locations, the map's attributes, and what wasn't carried. */
export interface Conversion {
  /** What the paste was read as. */
  readonly format: string;
  readonly locations: readonly PastedLocation[];
  readonly attributes: MapAttributes;
  readonly notCarried: readonly Note[];
}

type Read = Pick<Conversion, "format" | "locations" | "attributes">;

/** GeoJSON's other objects: their `type` isn't 0.2's. */
const GEOJSON_PIECES: ReadonlySet<unknown> = new Set([
  "Feature",
  "Point",
  "LineString",
  "Polygon",
  "MultiPoint",
  "MultiLineString",
  "MultiPolygon",
  "GeometryCollection",
]);

const WHAT_THIS_READS = "This page reads CSV, a JSON list of locations, GeoJSON or a 0.2 config";

/**
 * `text` as a map's locations and attributes, the store having checked them.
 *
 * @throws `PasteRefused` for what can't be read, `MaplaceError` for what the store refuses.
 */
export function convertPasted(text: string): Conversion {
  const report = createReport();
  const read = isCode(text)
    ? fromLiteral(readLiteral(text), report)
    : fromRecords("CSV", recordsFromCsv(text, report), report);
  checkWithStore(read.locations);
  return { ...read, notCarried: report.notes() };
}

function fromLiteral(value: Literal, report: Report): Read {
  if (Array.isArray(value)) return fromRecords("a list of locations", value, report);
  if (isRecord(value)) {
    if (value.type === "FeatureCollection") return fromGeoJSON(value);
    if (GEOJSON_PIECES.has(value.type)) {
      throw new PasteRefused(
        `This is a GeoJSON ${value.type}: this page reads a FeatureCollection, so put it in one`,
      );
    }
    if (isLegacyConfig(value)) {
      return { format: "a 0.2 config", ...fromLegacyConfig(value, report) };
    }
    throw new PasteRefused(`${WHAT_THIS_READS}; this object is none of them`);
  }
  const code = firstRefusedIn(value);
  const what = code === undefined ? String(value) : refusalWords(code);
  throw new PasteRefused(`${WHAT_THIS_READS}; this is ${what}`);
}

function fromRecords(format: string, values: readonly unknown[], report: Report): Read {
  if (values.length === 0) throw new PasteRefused("This list has no locations in it");
  const locations = recordsWithIds(values, report).map((record, index) => {
    if (!isRecord(record)) throw new PasteRefused(`Item ${index + 1} of the list isn't an object`);
    return locationFromRecord(record, index, report);
  });
  return { format, locations, attributes: listFor(locations) };
}

function fromGeoJSON(collection: Readonly<Record<string, unknown>>): Read {
  const code = firstRefusedIn(collection);
  if (code !== undefined) {
    throw new PasteRefused(
      `This GeoJSON holds ${refusalWords(code)}, which this page doesn't read`,
    );
  }
  const { features } = collection;
  const identified = Array.isArray(features) ? recordsWithIds(features, createReport()) : features;
  const geoJSON = { ...collection, features: identified } as unknown as GeoJSONFeatureCollection;
  const locations = locationsFromGeoJSON(geoJSON).map(withNameAsTitle);
  if (locations.length === 0) throw new PasteRefused("This GeoJSON has no features in it");
  return { format: "GeoJSON", locations, attributes: listFor(locations) };
}

/** A feature's `properties.name` as its title when it has none. */
function withNameAsTitle(location: Location): PastedLocation {
  const { title, data } = location;
  const name = isRecord(data) ? data.name : undefined;
  return { ...location, ...(title === undefined && typeof name === "string" && { title: name }) };
}

/** The list a paste with several locations gets: it is what the builder's map is for. */
function listFor(locations: readonly PastedLocation[]): MapAttributes {
  return locations.length > 1 ? [["list", ""]] : [];
}

/**
 * Has the store refuse what it would on a page. Nothing renders without an adapter, so the
 * pass-through `sanitize` reaches no page: it lets `html` by, and keeps the store's checks on it.
 */
function checkWithStore(locations: readonly PastedLocation[]): void {
  createMaplace({
    locations: locations as unknown as Location[],
    sanitize: (html) => html,
  }).destroy();
}
