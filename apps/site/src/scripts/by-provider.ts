import { isProvider, type Provider } from "../examples/example-providers.ts";

/**
 * The version `element` is in (`[data-live-version]`): every map and version the site runs is in
 * one, so an element outside one is a bug in the site, and it throws.
 */
export function versionOf(element: Element): HTMLElement {
  const version = element.closest<HTMLElement>("[data-live-version]");
  if (version === null) throw new Error(`${described(element)} isn't in a version`);
  return version;
}

/** The provider of the version `element` is in, as the frame names it (`data-provider`). */
export function providerOf(element: Element): Provider {
  const named = versionOf(element).dataset.provider;
  if (named === undefined || !isProvider(named)) {
    throw new Error(`${described(element)}'s version names no known provider: "${named ?? ""}"`);
  }
  return named;
}

/** What hands each element to the handler of its provider (`providerOf`). */
export function byProvider<Target extends Element, Result>(
  handlers: Readonly<Record<Provider, (target: Target) => Result>>,
): (target: Target) => Result {
  return (target) => handlers[providerOf(target)](target);
}

/** `element` as an error names it: its tag, with its id when it has one. */
function described(element: Element): string {
  const tag = element.localName;
  return element.id === "" ? `<${tag}>` : `<${tag} id="${element.id}">`;
}
