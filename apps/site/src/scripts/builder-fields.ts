import { OLD_LOCATION_FIELDS } from "../../../../packages/maplace/src/validate/migration.ts";
import { firstRefusedIn, holdsWords, isRecord } from "./builder-literal.ts";
import type { Report } from "./builder-report.ts";
import {
  circleFromLegacy,
  nextFreeNumber,
  type PastedLocation,
  type PastedRecord,
} from "./builder-shapes.ts";

/** Fields kept under their own name: 0.2's that 1.0 still has, and 1.0's own. */
const KEPT_FIELDS: ReadonlySet<string> = new Set([
  "lat",
  "lng",
  "title",
  "html",
  "content",
  "icon",
  "zoom",
  "visible",
  "group",
  "tags",
  "searchText",
  "listed",
  "editable",
  "type",
  "center",
  "radius",
  "path",
  "holes",
  "style",
  "selectedStyle",
  "hoveredStyle",
  "data",
]);

/** Fields written under another name, unless the record has that one too. */
export const RENAMED_FIELDS: Readonly<Record<string, string>> = {
  lon: "lng",
  long: "lng",
  longitude: "lng",
  latitude: "lat",
  name: "title",
  draggable: "editable",
};

/** Fields read elsewhere: the id on its own, `show_infowindow` with the popup. */
const IMPLIED_FIELDS: ReadonlySet<string> = new Set(["id", "show_infowindow"]);

const CIRCLE_OPTIONS = ["stroke_options", "circle_options"];

const isId = (id: unknown): id is string | number =>
  typeof id === "string" || typeof id === "number";

/**
 * `records` each with an `id` as a string: its own, or its 1-based position, or the next number
 * free when another record names that one. Anything in the list but a record stays as it is.
 */
export function recordsWithIds(records: readonly unknown[], report: Report): readonly unknown[] {
  const taken = new Set(
    records.flatMap((record) => (isRecord(record) && isId(record.id) ? [String(record.id)] : [])),
  );
  // Every number under `searchedTo` is taken: a long list doesn't search them again.
  let searchedTo = 1;
  return records.map((record, index) => {
    if (!isRecord(record)) return record;
    if (isId(record.id)) return { ...record, id: String(record.id) };
    reportCode("id", record.id, report);
    const free = nextFreeNumber(taken, Math.max(index + 1, searchedTo));
    searchedTo = free + 1;
    taken.add(String(free));
    return { ...record, id: String(free) };
  });
}

/** The location `record` describes, at 0-based `index`; what can't be carried is reported. */
export function locationFromRecord(
  record: PastedRecord,
  index: number,
  report: Report,
): PastedLocation {
  const id = isId(record.id) ? String(record.id) : String(index + 1);
  const location: PastedLocation = { ...fieldsOf(record, index, report), id };
  return isLegacyCircle(record) ? circleFromLegacy(location, report) : location;
}

/** A circle as 0.2 wrote one, at `lat`, `lng`. */
function isLegacyCircle(record: PastedRecord): boolean {
  return record.type === "circle" && !hasValue(record.center);
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function fieldsOf(record: PastedRecord, index: number, report: Report): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const keepsOptions = isLegacyCircle(record);
  for (const [name, value] of Object.entries(record)) {
    if (keepsOptions && CIRCLE_OPTIONS.includes(name)) {
      // Read key by key (`styleFromLegacy`), which names the code in them.
      if (hasValue(value)) fields[name] = value;
    } else if (hasValue(value) && !reportCode(name, value, report) && !IMPLIED_FIELDS.has(name)) {
      carryField(record, name, value, fields, report);
    }
  }
  return withPopupOf(record, index, fields);
}

/** Puts one field of `record` under its 1.0 name, or reports it. */
function carryField(
  record: PastedRecord,
  name: string,
  value: unknown,
  fields: Record<string, unknown>,
  report: Report,
): void {
  if (KEPT_FIELDS.has(name)) fields[name] = value;
  else if (Object.hasOwn(RENAMED_FIELDS, name)) rename(record, name, value, fields, report);
  else if (name === "on_menu") copyOnMenu(record, value, fields);
  else reportField(name, report);
}

/** Whether `value` holds code, which is reported in place of carrying it. */
function reportCode(name: string, value: unknown, report: Report): boolean {
  const code = firstRefusedIn(value);
  if (code !== undefined) {
    report.note(name, holdsWords(code));
  }
  return code !== undefined;
}

function rename(
  record: PastedRecord,
  name: string,
  value: unknown,
  fields: Record<string, unknown>,
  report: Report,
): void {
  const target = RENAMED_FIELDS[name] as string;
  if (hasValue(record[target])) report.note(name, `is beside ${target}, which was used`);
  else fields[target] = value;
}

function copyOnMenu(record: PastedRecord, value: unknown, fields: Record<string, unknown>): void {
  if (value === false && !hasValue(record.listed)) fields.listed = false;
}

function reportField(name: string, report: Report): void {
  report.note(
    name,
    Object.hasOwn(OLD_LOCATION_FIELDS, name)
      ? (OLD_LOCATION_FIELDS[name] as string)
      : "isn't a location field",
  );
}

/** `fields` with the popup 0.2 would have shown: none for `show_infowindow: false`. */
function withPopupOf(
  record: PastedRecord,
  index: number,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const { html, content, ...rest } = fields;
  if (record.show_infowindow === false) return rest;
  return typeof html === "string"
    ? { ...fields, html: withPopupPlaceholders(html, index, record) }
    : fields;
}

/** `html` with its first `%index` and first `%title` filled in, as 0.2's `_init` did. */
function withPopupPlaceholders(html: string, index: number, record: PastedRecord): string {
  const title = fieldTitle(record);
  const indexed = html.replace("%index", () => String(index + 1));
  return title === undefined ? indexed : indexed.replace("%title", () => title);
}

function fieldTitle(record: PastedRecord): string | undefined {
  const title = hasValue(record.title) ? record.title : (record.name ?? "");
  return typeof title === "string" ? title : undefined;
}
