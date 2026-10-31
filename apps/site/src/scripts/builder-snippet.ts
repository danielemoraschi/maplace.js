import type { LOCATION_ATTRIBUTES } from "../../../../packages/maplace/src/element/location-attributes.ts";
import type { Provider } from "../examples/example-providers.ts";
import { attributeValue } from "../examples/page-markup.ts";
import type { Conversion } from "./builder-convert.ts";
import type { MapAttributes } from "./builder-legacy-config.ts";
import { popupMarkupOf, withPopupAsText } from "./builder-popups.ts";
import type { PastedLocation } from "./builder-shapes.ts";

/** A written page: its text, and how its popups came out. */
export interface WrittenSnippet {
  readonly text: string;
  /** Some `html` couldn't be written as markup, and is plain text. */
  readonly popupsAsText: boolean;
  /** Some `html` is written as it came, so it runs on the reader's page. */
  readonly popupsAsWritten: boolean;
}

interface SnippetRequest {
  readonly conversion: Pick<Conversion, "locations" | "attributes">;
  readonly provider: Provider;
  /** The provider's pinned `<script>` tag. */
  readonly pinnedScript: string;
}

const TRUST_COMMENT = "<!-- The popups below are used as written: keep only HTML you trust. -->";

/** JSON's own escape of `<`: a backslash, `u`, and its four hex digits. */
const LESS_THAN_ESCAPE = String.raw`\u${"003c"}`;

/** Fields a `<maplace-location>` writes in its attributes, beside `html` and `content`. */
const ATTRIBUTE_OF: readonly (readonly [
  field: string,
  attribute: (typeof LOCATION_ATTRIBUTES)[number],
])[] = [
  ["type", "type"],
  ["lat", "lat"],
  ["lng", "lng"],
  ["radius", "radius"],
  ["title", "title"],
  ["group", "group"],
  ["tags", "tags"],
  ["searchText", "search-text"],
  ["icon", "icon"],
  ["zoom", "zoom"],
  ["listed", "listed"],
  ["editable", "editable"],
  ["style", "shape-style"],
  ["selectedStyle", "selected-style"],
  ["hoveredStyle", "hovered-style"],
];

const CHILD_FIELDS: ReadonlySet<string> = new Set([
  ...ATTRIBUTE_OF.map(([field]) => field),
  "id",
  "center",
  "html",
  "content",
]);

/** The page `conversion` becomes on `provider`. Google's key is always the reader's to fill in. */
export function writeSnippet({
  conversion: { locations, attributes },
  provider,
  pinnedScript,
}: SnippetRequest): WrittenSnippet {
  const hasHtml = locations.some(({ html }) => typeof html === "string");
  const open = mapTag(provider, attributes);
  const children = hasHtml ? childrenOf(locations) : undefined;
  if (children !== undefined) {
    return {
      text: [pinnedScript, TRUST_COMMENT, open, ...children, "</maplace-map>"].join("\n"),
      popupsAsText: false,
      popupsAsWritten: true,
    };
  }
  const data = locations.map(withPopupAsText);
  return {
    text: [pinnedScript, open, jsonScript(data), "</maplace-map>"].join("\n"),
    popupsAsText: hasHtml,
    popupsAsWritten: false,
  };
}

function mapTag(provider: Provider, attributes: MapAttributes): string {
  const key: MapAttributes = provider === "google" ? [["api-key", "YOUR_KEY"]] : [];
  const written = [...key, ...attributes].map(([name, value]) =>
    value === "" ? ` ${name}` : ` ${name}="${attributeValue(value)}"`,
  );
  return `<maplace-map${written.join("")}>`;
}

/** The inline JSON form, one location per line; a `<` can't end the script it sits in. */
function jsonScript(locations: readonly PastedLocation[]): string {
  const lines = locations.map((location) => `    ${scriptSafeJson(location)}`).join(",\n");
  return `  <script type="application/json">\n  [\n${lines}\n  ]\n  </script>`;
}

/** `value` as JSON whose every `<` is JSON's own escape, which `JSON.parse` reads back. */
function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", LESS_THAN_ESCAPE);
}

/** Each location as a child, or `undefined` if any can't be one. */
function childrenOf(locations: readonly PastedLocation[]): readonly string[] | undefined {
  const children: string[] = [];
  for (const location of locations) {
    const child = canBeChild(location) ? childOf(location) : undefined;
    if (child === undefined) return undefined;
    children.push(child);
  }
  return children;
}

/** Whether `<maplace-location>` has an attribute or template for all of `location`. */
function canBeChild(location: PastedLocation): boolean {
  const { type, tags, content, center } = location;
  return (
    Object.keys(location).every((field) => CHILD_FIELDS.has(field)) &&
    (type === undefined || type === "marker" || type === "circle") &&
    (center === undefined || type === "circle") &&
    (tags === undefined || (Array.isArray(tags) && tags.every(isOneWord))) &&
    (content === undefined || typeof content === "string")
  );
}

const isOneWord = (tag: unknown) => typeof tag === "string" && tag !== "" && !/\s/.test(tag);

/** `location` as a child, or `undefined` when its popup wouldn't stay whole. */
function childOf(location: PastedLocation): string | undefined {
  const attributes = attributesOf(location)
    .map(([name, value]) => ` ${name}="${attributeValue(value)}"`)
    .join("");
  const popup = popupOf(location);
  return popup === undefined
    ? undefined
    : `  <maplace-location${attributes}>${popup}</maplace-location>`;
}

function attributesOf(location: PastedLocation): readonly (readonly [string, string])[] {
  const { center, tags } = location;
  const fields: Readonly<Record<string, unknown>> = {
    ...location,
    ...(center !== undefined && (center as object)),
    ...(Array.isArray(tags) && { tags: tags.join(" ") }),
  };
  const written = ATTRIBUTE_OF.flatMap(([field, attribute]): [string, string][] => {
    const value = fields[field];
    if (value === undefined || value === "") return [];
    return [[attribute, typeof value === "string" ? value : JSON.stringify(value)]];
  });
  return [["location-id", location.id], ...written];
}

function popupOf({ html, content }: PastedLocation): string | undefined {
  if (typeof html === "string") {
    const markup = popupMarkupOf(html);
    if (markup === undefined) return undefined;
    return markup.trim() === "" ? "" : `<template>${markup}</template>`;
  }
  return typeof content === "string" ? `<template>${attributeValue(content)}</template>` : "";
}
