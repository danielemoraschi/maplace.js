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
  if (value === null) return undefined;
  const number = Number(value);
  return value.trim() === "" || !Number.isFinite(number) ? value : number;
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
