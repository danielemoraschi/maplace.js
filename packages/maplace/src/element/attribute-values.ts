import type { MaplaceErrorDetails } from "../index";
import { elementMisuse } from "./element-error";

/**
 * The attribute's value, or `undefined` when missing or empty: an attribute left empty is not
 * given, so an empty `api-key` is no key rather than an empty one.
 */
export function givenAttribute(element: Element, name: string): string | undefined {
  return given(element.getAttribute(name));
}

/** An attribute's value as given: `undefined` when missing or empty. */
export function given(value: string | null): string | undefined {
  return value || undefined;
}

/** `written` parsed as JSON, or as written when it isn't JSON; `undefined` when nothing is. */
export function jsonOrRaw(written: string | null | undefined): unknown {
  if (written === null || written === undefined) return undefined;
  try {
    return JSON.parse(written);
  } catch {
    return written;
  }
}

/** The attribute as a number, or as written when blank or not a number (`lat=""` is never 0). */
export function numberOrRaw(element: Element, name: string): number | string | undefined {
  const value = element.getAttribute(name);
  return value === null ? undefined : numberOrText(value);
}

/** `text` as a number, or as written when blank or not a number. */
export function numberOrText(text: string): number | string {
  const number = Number(text);
  return text.trim() === "" || !Number.isFinite(number) ? text : number;
}

/**
 * A present attribute with no value, or `"true"`, as true; `"false"` as false; anything else as
 * written, for the store to name.
 */
export function booleanOrRaw(element: Element, name: string): boolean | string | undefined {
  const value = element.getAttribute(name);
  if (value === null) return undefined;
  if (value === "" || value === "true") return true;
  return value === "false" ? false : value;
}

/** `text`'s words, as `class` holds its: none in a blank one, and a word can't hold a space. */
export function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** `name`'s text, refused when blank: misuse naming it. */
export function textOf(host: Element, name: string): string | undefined {
  const text = host.getAttribute(name) ?? undefined;
  if (text?.trim() === "") throw elementMisuse(`${name} must not be blank`, { field: name });
  return text;
}

/** `text` parsed as JSON; text that isn't is misuse naming `source`, with `details`. */
export function jsonIn(text: string, source: string, details?: MaplaceErrorDetails): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw elementMisuse(`${source} is not valid JSON`, { ...details, cause });
  }
}
