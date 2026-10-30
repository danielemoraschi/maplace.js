import { type Field, item, mustBe } from "./fail";

/** Checks one value at a place in the input; throws a `MaplaceError` when it is wrong. */
export type Check = (value: unknown, field: Field) => void;

/** Inclusive `min`/`max`, or exclusive `above`. */
export interface NumberRange {
  readonly min?: number;
  readonly max?: number;
  readonly above?: number;
}

export const NON_NEGATIVE: NumberRange = { min: 0 };
export const POSITIVE: NumberRange = { above: 0 };

export function checkNumber(
  value: unknown,
  field: Field,
  range: NumberRange = {},
): asserts value is number {
  if (!isNumberIn(value, range)) mustBe(field, describeRange(range), value);
}

export function isNumberIn(value: unknown, range: NumberRange): value is number {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, above } = range;
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (above === undefined || value > above)
  );
}

export function checkString(value: unknown, field: Field): asserts value is string {
  if (typeof value !== "string") mustBe(field, "a string", value);
}

export function checkNonEmptyString(value: unknown, field: Field): asserts value is string {
  if (typeof value !== "string" || value === "") mustBe(field, "a non-empty string", value);
}

/** Text a reader sees, such as a label: not empty, not only spaces. */
export function checkNonBlankString(value: unknown, field: Field): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") mustBe(field, "a non-blank string", value);
}

export function checkBoolean(value: unknown, field: Field): asserts value is boolean {
  if (typeof value !== "boolean") mustBe(field, "a boolean", value);
}

export function checkFunction(
  value: unknown,
  field: Field,
): asserts value is (...args: never[]) => unknown {
  if (typeof value !== "function") mustBe(field, "a function", value);
}

export function checkOneOf<T extends string>(
  value: unknown,
  field: Field,
  allowed: readonly T[],
): asserts value is T {
  if (!allowed.includes(value as T)) {
    mustBe(field, `one of ${allowed.map((name) => JSON.stringify(name)).join(", ")}`, value);
  }
}

/** A plain object: not null, not an array. */
export function checkObject(
  value: unknown,
  field: Field,
  expected = "an object",
): asserts value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    mustBe(field, expected, value);
  }
}

/** What `content` and `icon` take: text, a DOM node, or a function building one. */
export function checkRenderable(value: unknown, field: Field): void {
  const renderable = typeof value === "string" || typeof value === "function" || isNode(value);
  if (!renderable) mustBe(field, "a string, a DOM node or a function", value);
}

export function numberIn(range: NumberRange): Check {
  return (value, field) => checkNumber(value, field, range);
}

export function oneOf<T extends string>(allowed: readonly T[]): Check {
  return (value, field) => checkOneOf(value, field, allowed);
}

/** An array whose items each pass `check`, e.g. route stops. */
export function arrayOf(expected: string, check: Check): Check {
  return (value, field) => {
    if (!Array.isArray(value)) mustBe(field, expected, value);
    for (const [index, element] of value.entries()) check(element, item(field, index));
  };
}

/** A location's tags, or those a filter asks for. */
export const checkTags = arrayOf("an array of tags", checkString);

/** Runs `check` unless the value is absent; optional fields accept an explicit `undefined`. */
export function optional(check: Check): Check {
  return (value, field) => {
    if (value !== undefined) check(value, field);
  };
}

/** The members of a string union, listed once in a record the compiler keeps complete. */
export function members<T extends string>(record: Readonly<Record<T, true>>): readonly T[] {
  return Object.keys(record) as T[];
}

// Duck-typed rather than `instanceof Node`, so validation also runs where there is no DOM (SSR).
export function isNode(value: unknown): value is { readonly nodeType: unknown } {
  return typeof value === "object" && value !== null && "nodeType" in value;
}

const ELEMENT_NODE = 1;

/** An element, duck-typed like `isNode`, so one from another realm (an iframe) passes too. */
export function isElement(value: unknown): value is HTMLElement {
  return isNode(value) && value.nodeType === ELEMENT_NODE;
}

function describeRange({ min, max, above }: NumberRange): string {
  if (min !== undefined && max !== undefined) return `a number from ${min} to ${max}`;
  if (min !== undefined) return `a number of at least ${min}`;
  if (above !== undefined) return `a number above ${above}`;
  return "a number";
}
