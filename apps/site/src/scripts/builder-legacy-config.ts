import { OLD_OPTIONS } from "../../../../packages/maplace/src/validate/migration.ts";
import { locationFromRecord, recordsWithIds } from "./builder-fields.ts";
import { firstRefusedIn, holdsWords, isRecord, Refused, refusalWords } from "./builder-literal.ts";
import { PasteRefused, type Report } from "./builder-report.ts";
import {
  NOT_AN_OBJECT,
  type PastedLocation,
  type PastedRecord,
  pathShape,
} from "./builder-shapes.ts";

/** A map's attributes in the order they are written; an empty value is a bare attribute. */
export type MapAttributes = readonly (readonly [name: string, value: string])[];

type Config = PastedRecord;

/** Options this module carries, or that need nothing in 1.0 (`map_div`: the element is the map). */
const READ_OPTIONS: ReadonlySet<string> = new Set([
  "locations",
  "shared",
  "commons",
  "generate_controls",
  "force_generate_controls",
  "controls_type",
  "controls_on_map",
  "controls_title",
  "view_all",
  "view_all_text",
  "start",
  "show_markers",
  "show_infowindows",
  "map_div",
  "type",
  "stroke_options",
  "circle_options",
]);

/** Options read per key or per location, where the code in them is named on its own. */
const READ_INSIDE: ReadonlySet<string> = new Set([
  "locations",
  "shared",
  "commons",
  "stroke_options",
  "circle_options",
]);

const LEGACY_VIEW_ALL = "View All";
const DRAWN_TYPES: ReadonlySet<unknown> = new Set(["marker", "circle", "polyline", "polygon"]);

/** Whether `config` reads as a 0.2 config: its `locations`, or any option of 0.2's. */
export function isLegacyConfig(config: Config): boolean {
  return Object.keys(config).some((key) => Object.hasOwn(OLD_OPTIONS, key) || key === "locations");
}

/** The locations and attributes of a 0.2 `new Maplace({…})`, on what 0.2 itself would draw. */
export function fromLegacyConfig(
  pasted: Config,
  report: Report,
): { locations: readonly PastedLocation[]; attributes: MapAttributes } {
  const config = withoutCode(pasted, report);
  const given = locationsOf(pasted);
  const points = (recordsWithIds(recordsOf(config, given, report), report) as PastedRecord[]).map(
    (record, index) => locationFromRecord(record, index, report),
  );
  reportOtherOptions(config, points, report);
  const attributes = [
    ...listAttributesOf(config, points.length, report),
    ...selectedIdOf(config, points),
  ];
  return { locations: withPathShape(config, points, report), attributes };
}

/** `pasted` without the options read whole that hold code, each reported. */
function withoutCode(pasted: Config, report: Report): Config {
  const kept = Object.entries(pasted).filter(([name, value]) => {
    const readWhole = READ_OPTIONS.has(name) && !READ_INSIDE.has(name);
    const code = readWhole ? firstRefusedIn(value) : undefined;
    if (code !== undefined) report.note(name, holdsWords(code));
    return code === undefined;
  });
  return Object.fromEntries(kept);
}

function locationsOf({ locations }: Config): readonly unknown[] {
  if (locations instanceof Refused) {
    const isName = /^[\w$.]+$/.test(locations.source);
    throw new PasteRefused(
      isName
        ? `locations is ${locations.source}, a variable: paste its array in its place`
        : `locations is ${refusalWords(locations)}: paste its array in its place`,
    );
  }
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new PasteRefused("A 0.2 config needs locations, a list with at least one in it");
  }
  return locations;
}

/** Each pasted location with what the config spreads under it or sets over it. */
function recordsOf(config: Config, given: readonly unknown[], report: Report): PastedRecord[] {
  const defaults = {
    ...defaultsOf(config, "commons", report),
    ...defaultsOf(config, "shared", report),
  };
  return given.map((location, index) => {
    if (!isRecord(location)) {
      throw new PasteRefused(`Location ${index + 1} of locations isn't an object`);
    }
    return withMapWide(config, { ...defaults, ...location });
  });
}

function defaultsOf(config: Config, name: string, report: Report): PastedRecord {
  const value = config[name];
  if (value === undefined) return {};
  if (isRecord(value)) return value;
  const code = firstRefusedIn(value);
  report.note(name, code === undefined ? NOT_AN_OBJECT : holdsWords(code));
  return {};
}

/** `record` under the config's `show_*`, and its circle's map-wide type and options. */
function withMapWide(config: Config, record: PastedRecord): PastedRecord {
  const merged: Record<string, unknown> = { ...record };
  if (config.show_markers === false && !Object.hasOwn(record, "visible")) merged.visible = false;
  if (config.show_infowindows === false) merged.show_infowindow = false;
  if (config.type === "circle" && !Object.hasOwn(record, "type")) merged.type = "circle";
  if (merged.type !== "circle") return merged;
  for (const name of ["stroke_options", "circle_options"]) {
    merged[name] = underOwn(config[name], record[name]);
  }
  return merged;
}

/** A location's own options over the config's. */
function underOwn(mapWide: unknown, own: unknown): unknown {
  return isRecord(mapWide) && isRecord(own) ? { ...mapWide, ...own } : (own ?? mapWide);
}

/** The list 0.2's `Load` would have drawn. */
function listAttributesOf(config: Config, count: number, report: Report): MapAttributes {
  const generated = count > 1 && config.generate_controls !== false;
  if (!generated && !config.force_generate_controls) return [];
  const attributes: [string, string][] = [
    ["list", config.controls_type === "list" ? "" : "select"],
  ];
  if (config.controls_on_map !== false) attributes.push(["list-position", "top-right"]);
  const heading = textOption(config, "controls_title", report);
  if (heading !== undefined) attributes.push(["list-heading", heading]);
  if (config.view_all !== false) {
    const label = textOption(config, "view_all_text", report);
    attributes.push(["fit-all", ""], ["fit-all-label", label ?? LEGACY_VIEW_ALL]);
  }
  return attributes;
}

/** The text option `name`; a blank one, which the element refuses, or any other value, is noted. */
function textOption(config: Config, name: string, report: Report): string | undefined {
  const value = config[name];
  if (value === undefined) return undefined;
  if (typeof value === "string" && value.trim() !== "") return value;
  report.note(name, "isn't text with something in it, so it was left out");
  return undefined;
}

/** 0.2's `start`, a 1-based position, 0 for none, as the id there. */
function selectedIdOf(config: Config, points: readonly PastedLocation[]): MapAttributes {
  const point = points[Number(config.start) - 1];
  // The store refuses to select what is hidden.
  return point === undefined || point.visible === false ? [] : [["selected-id", point.id]];
}

function withPathShape(
  config: Config,
  points: readonly PastedLocation[],
  report: Report,
): readonly PastedLocation[] {
  const { type } = config;
  if (type !== "polyline" && type !== "polygon") return points;
  return [...points, pathShape(type, points, config.stroke_options, report)];
}

function reportOtherOptions(
  config: Config,
  points: readonly PastedLocation[],
  report: Report,
): void {
  const anyCircle = points.some(({ type }) => type === "circle");
  const anyShape = anyCircle || config.type === "polyline" || config.type === "polygon";
  if (config.stroke_options !== undefined && !anyShape)
    noteOption("stroke_options", config, report);
  if (config.circle_options !== undefined && !anyCircle)
    noteOption("circle_options", config, report);
  if (config.type !== undefined && !DRAWN_TYPES.has(config.type)) {
    report.note(
      `type: ${JSON.stringify(config.type)}`,
      `${OLD_OPTIONS.type}; its points stay markers`,
    );
  }
  for (const name of Object.keys(config)) {
    if (!READ_OPTIONS.has(name)) noteOption(name, config, report);
  }
}

function noteOption(name: string, config: Config, report: Report): void {
  const says = Object.hasOwn(OLD_OPTIONS, name)
    ? (OLD_OPTIONS[name] as string)
    : "isn't a 0.2 option this page carries over";
  const code = firstRefusedIn(config[name]);
  report.note(
    name,
    code === undefined ? says : `${says}; it holds ${refusalWords(code)}, not read`,
  );
}
