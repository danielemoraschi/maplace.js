import type { LatLng } from "../geometry";
import { type Field, item, mustBe, reject } from "./fail";
import { OLD_COORDINATE_FIELDS } from "./migration";
import { type Assert, recordOf } from "./record";
import { type Check, isNumberIn, type NumberRange, numberIn } from "./values";

export const LATITUDE: NumberRange = { min: -90, max: 90 };
export const LONGITUDE: NumberRange = { min: -180, max: 180 };

const checkLatLngInDetail: Assert<LatLng> = recordOf<LatLng>({
  checks: { lat: numberIn(LATITUDE), lng: numberIn(LONGITUDE) },
  unknown: "is not a coordinate field",
  remarks: OLD_COORDINATE_FIELDS,
  expected: "an object with lat and lng",
});

export function checkLatLng(value: unknown, field: Field): asserts value is LatLng {
  if (!isLatLng(value)) checkLatLngInDetail(value, field);
}

/** A line or ring of at least `minPoints` points; fewer would draw nothing. */
export function pathOf(minPoints: number): Check {
  const expected = `an array of at least ${minPoints} points`;
  return (value, field) => {
    if (!Array.isArray(value)) mustBe(field, expected, value);
    if (value.length < minPoints) {
      reject(field, `must be ${expected}, got ${pointCount(value.length)}`);
    }
    // The field path is built only for a bad point: paths can hold many thousands.
    for (const [index, point] of value.entries()) {
      if (!isLatLng(point)) checkLatLngInDetail(point, item(field, index));
    }
  };
}

/** The common case, checked without building messages or paths. */
function isLatLng(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as Partial<LatLng>;
  return isNumberIn(lat, LATITUDE) && isNumberIn(lng, LONGITUDE) && Object.keys(value).length === 2;
}

function pointCount(count: number): string {
  return count === 1 ? "1 point" : `${count} points`;
}
