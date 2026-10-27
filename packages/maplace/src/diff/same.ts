import { type Route, sameComputation } from "../route";

/**
 * Shallow equality: every field of either object is `===` the same field of the other. A field
 * written as `undefined` equals a missing one, as everywhere in the API.
 */
export function sameFields(a: object, b: object): boolean {
  return fieldsFoundIn(a, b) && fieldsFoundIn(b, a);
}

/** The same items, `===`, in the same order. */
export function sameItems(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Both absent, or both present and `same`: optional values compared under one rule. */
export function sameOptional<T>(
  a: T | undefined,
  b: T | undefined,
  same: (a: T, b: T) => boolean,
): boolean {
  return a === undefined || b === undefined ? a === b : same(a, b);
}

/** The same groups in the same order, or both no filter. */
export function sameFilter(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined,
): boolean {
  return sameOptional(a, b, sameItems);
}

/** The same route: the same computation and the same style. */
export function sameRoute(a: Route, b: Route): boolean {
  return sameComputation(a, b) && sameOptional(a.style, b.style, sameFields);
}

/** `previous` when `next` has the same fields, so unchanged values keep their reference. */
export function keepIfSame<T extends object | undefined>(previous: T | undefined, next: T): T {
  return previous !== undefined && next !== undefined && sameFields(previous, next)
    ? previous
    : next;
}

/**
 * Whether a renderer built from the `previous` source (`content`, `icon`) still fits `next`:
 * the same value, and not a function, which is called with the location object itself, so a new
 * object needs a new renderer.
 */
export function sameValueSource(previous: unknown, next: unknown): boolean {
  return previous === next && typeof next !== "function";
}

function fieldsFoundIn(source: object, target: object): boolean {
  const from = source as Readonly<Record<string, unknown>>;
  const to = target as Readonly<Record<string, unknown>>;
  for (const key in from) {
    if (from[key] !== to[key]) return false;
  }
  return true;
}
