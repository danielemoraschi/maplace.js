import { MaplaceError, type MisuseCode } from "../errors";

/**
 * A place in the input: the label that starts each message (`location "a"`, `setView`), the
 * location id when known, and the path to the value, e.g. `path[2].lng`; empty at the root.
 */
export interface Field {
  readonly label: string;
  readonly locationId: string | undefined;
  readonly path: string;
}

const MAX_SHOWN_LENGTH = 40;

export function root(label: string, locationId?: string): Field {
  return { label, locationId, path: "" };
}

export function child(field: Field, key: string): Field {
  return { ...field, path: field.path === "" ? key : `${field.path}.${key}` };
}

export function item(field: Field, index: number): Field {
  return { ...field, path: `${field.path}[${index}]` };
}

/** Throws `<label>: <path> <problem>` as a `MaplaceError`, `invalid-input` unless told otherwise. */
export function reject(field: Field, problem: string, code: MisuseCode = "invalid-input"): never {
  const { label, locationId, path } = field;
  const message = `${label}: ${[path, problem].filter(Boolean).join(" ")}`;
  throw new MaplaceError(code, message, { locationId, field: path === "" ? undefined : path });
}

/** Throws "<path> must be <expected>, got <what it got>". */
export function mustBe(field: Field, expected: string, got: unknown): never {
  return reject(field, `must be ${expected}, got ${describeValue(got)}`);
}

/** A short, unambiguous rendering of any value for messages: strings stay quoted. */
export function describeValue(value: unknown): string {
  switch (typeof value) {
    case "string":
      return JSON.stringify(shorten(value));
    case "function":
      return "a function";
    case "object":
      return describeObject(value);
    default:
      return String(value);
  }
}

function describeObject(value: object | null): string {
  if (value === null) return "null";
  return Array.isArray(value) ? "an array" : "an object";
}

function shorten(text: string): string {
  return text.length > MAX_SHOWN_LENGTH ? `${text.slice(0, MAX_SHOWN_LENGTH)}…` : text;
}
