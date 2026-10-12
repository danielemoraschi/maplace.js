import type { Bounds, FitOptions, SelectOptions, View } from "../viewport";
import { child, type Field, mustBe, reject } from "./fail";
import { checkLatLng, LATITUDE, LONGITUDE } from "./geometry";
import { type Assert, recordOf } from "./record";
import {
  arrayOf,
  type Check,
  checkBoolean,
  checkNonEmptyString,
  checkNumber,
  checkObject,
  checkOneOf,
  members,
  NON_NEGATIVE,
  numberIn,
  oneOf,
  optional,
  POSITIVE,
} from "./values";

type ViewOf<K extends View["kind"]> = Extract<View, { readonly kind: K }>;

export function checkZoom(value: unknown, field: Field): asserts value is number {
  checkNumber(value, field, NON_NEGATIVE);
}

/** A box; `west` greater than `east` is allowed and crosses the antimeridian. */
export function checkBounds(value: unknown, field: Field): asserts value is Bounds {
  checkBoundsFields(value, field);
  if (value.south > value.north) {
    const north = child(field, "north").path;
    reject(child(field, "south"), `(${value.south}) must not be above ${north} (${value.north})`);
  }
}

export function checkView(value: unknown, field: Field): asserts value is View {
  checkObject(value, field);
  checkOneOf(value.kind, child(field, "kind"), VIEW_KINDS);
  const checkKind: Check = VIEW_RECORDS[value.kind];
  checkKind(value, field);
}

/** `select`'s options: a zoom only makes sense while panning. */
export function checkSelectOptions(
  value: unknown,
  field: Field,
): asserts value is SelectOptions | undefined {
  if (value === undefined) return;
  checkSelectFields(value, field);
  if (value.pan === false && value.zoom !== undefined) {
    reject(child(field, "zoom"), "needs pan; with pan: false the map stays where it is");
  }
}

export function checkFitOptions(
  value: unknown,
  field: Field,
): asserts value is FitOptions | undefined {
  if (value !== undefined) checkFitFields(value, field);
}

/** `SelectOptions` with both branches' fields, before the pan/zoom rule is checked. */
interface SelectFields {
  readonly pan?: boolean | undefined;
  readonly zoom?: number | undefined;
}

const checkSelectFields: Assert<SelectFields> = recordOf<SelectFields>({
  checks: { pan: optional(checkBoolean), zoom: optional(checkZoom) },
  unknown: "is not a select option",
});

const checkFitFields: Assert<FitOptions> = recordOf<FitOptions>({
  checks: { padding: optional(numberIn(NON_NEGATIVE)) },
  unknown: "is not a fit option",
});

const checkBoundsFields: Assert<Bounds> = recordOf<Bounds>({
  checks: {
    south: numberIn(LATITUDE),
    west: numberIn(LONGITUDE),
    north: numberIn(LATITUDE),
    east: numberIn(LONGITUDE),
  },
  unknown: "is not a bounds field",
});

const padding = numberIn(NON_NEGATIVE);

const VIEW_RECORDS: { readonly [K in View["kind"]]: Assert<ViewOf<K>> } = {
  "fit-all": viewRecord("fit-all", { padding }),
  "fit-bounds": viewRecord("fit-bounds", { bounds: checkBounds, padding }),
  center: viewRecord("center", { center: checkLatLng, zoom: checkZoom }),
  location: viewRecord("location", {
    id: checkNonEmptyString,
    zoom: optional(checkZoom),
  }),
};

const VIEW_KINDS = Object.keys(VIEW_RECORDS) as View["kind"][];

function viewRecord<K extends View["kind"]>(
  kind: K,
  checks: Readonly<Record<Exclude<keyof ViewOf<K>, "kind">, Check>>,
): Assert<ViewOf<K>> {
  return recordOf<ViewOf<K>, "kind">({
    checks,
    unchecked: ["kind"],
    unknown: `is not a ${kind} view field`,
  });
}
