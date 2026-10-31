import { firstRefusedIn, holdsWords, isRecord } from "./builder-literal.ts";
import type { Report } from "./builder-report.ts";

/** A location as the builder has it, for the store to check. */
export type PastedLocation = Readonly<Record<string, unknown>> & { readonly id: string };

/** A location as pasted, or any object of fields. */
export type PastedRecord = Readonly<Record<string, unknown>>;

/** 0.2's Google style options under the names of 1.0's `style`. */
const STYLE_FIELDS: Readonly<Record<string, string>> = {
  strokeColor: "stroke",
  strokeOpacity: "strokeOpacity",
  strokeWeight: "strokeWidth",
  fillColor: "fill",
  fillOpacity: "fillOpacity",
};

/** What `circle_options` holds besides a style, which a circle takes itself. */
const CIRCLE_ONLY = new Set(["radius", "visible"]);

/** What a report says of an option that should be an object. */
export const NOT_AN_OBJECT = "isn't an object, so it was left out";

/** 0.2's default radius, which `circle_options` always set. */
const LEGACY_RADIUS = 100;

/** The first number from `from` on that `taken` doesn't hold as a string. */
export function nextFreeNumber(taken: ReadonlySet<string>, from: number): number {
  let free = from;
  while (taken.has(String(free))) free += 1;
  return free;
}

/** `options`, from a 0.2 option named `optionName`, as a 1.0 `style`; the rest is reported. */
export function styleFromLegacy(
  options: unknown,
  optionName: string,
  report: Report,
): Record<string, unknown> {
  if (options === undefined || options === null) return {};
  if (!isRecord(options)) {
    const code = firstRefusedIn(options);
    report.note(optionName, code === undefined ? NOT_AN_OBJECT : holdsWords(code));
    return {};
  }
  const style: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    const code = firstRefusedIn(value);
    const name = `${optionName}.${key}`;
    if (code !== undefined) {
      report.note(name, holdsWords(code));
    } else if (Object.hasOwn(STYLE_FIELDS, key)) {
      style[STYLE_FIELDS[key] as string] = value;
    } else if (!(optionName === "circle_options" && CIRCLE_ONLY.has(key))) {
      report.note(name, "has no 1.0 style field");
    }
  }
  return style;
}

/** `style` without the fill, which a line doesn't have. */
export function lineStyleOf(style: PastedRecord): Record<string, unknown> {
  const { fill: _fill, fillOpacity: _fillOpacity, ...line } = style;
  return line;
}

/**
 * The location `fields` describes as 0.2 drew it, a circle at `lat`, `lng`. `circle_options` wins
 * over the location's own `radius`, then 100; only it hides a circle, as in 0.2's
 * `create_objCircle`, so a point's `visible` is dropped.
 */
export function circleFromLegacy(fields: PastedLocation, report: Report): PastedLocation {
  const {
    lat,
    lng,
    icon,
    visible: _visible,
    radius,
    style,
    stroke_options: strokeOptions,
    circle_options: circleOptions,
    ...rest
  } = fields;
  if (icon !== undefined) report.note("icon", "is a marker's field; a circle has none");
  const options = isRecord(circleOptions) ? circleOptions : {};
  const drawn = {
    ...styleFromLegacy(strokeOptions, "stroke_options", report),
    ...styleFromLegacy(circleOptions, "circle_options", report),
    ...(isRecord(style) ? style : {}),
  };
  const ownRadius = firstRefusedIn(options.radius) === undefined ? options.radius : undefined;
  return {
    ...rest,
    center: { lat, lng },
    radius: ownRadius ?? radius ?? LEGACY_RADIUS,
    ...(options.visible === false && { visible: false }),
    ...(Object.keys(drawn).length > 0 && { style: drawn }),
  };
}

/**
 * The one polyline or polygon a 0.2 config's points draw: off the list, its id the next number
 * free among theirs, so `start` and the list go on counting the points alone.
 */
export function pathShape(
  type: "polyline" | "polygon",
  points: readonly PastedLocation[],
  strokeOptions: unknown,
  report: Report,
): PastedLocation {
  const style = styleFromLegacy(strokeOptions, "stroke_options", report);
  const drawn = type === "polyline" ? lineStyleOf(style) : style;
  const ids = new Set(points.map(({ id }) => id));
  return {
    id: String(nextFreeNumber(ids, points.length + 1)),
    type,
    path: points.filter((point) => "lat" in point).map(({ lat, lng }) => ({ lat, lng })),
    listed: false,
    ...(Object.keys(drawn).length > 0 && { style: drawn }),
  };
}
