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
