import type { PastedLocation } from "./builder-shapes.ts";

/** What reads as a separate line, so its text isn't glued to what follows. */
const BLOCKS =
  "address, article, aside, br, dd, div, dl, dt, footer, h1, h2, h3, h4, h5, h6, header, hr, li, ol, p, pre, section, table, td, th, tr, ul";

function parsed(html: string): HTMLTemplateElement {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
}

/**
 * `html` as it can sit in a `<template>` in a written page, or `undefined` when it wouldn't stay
 * in one: a `</template>` or `<plaintext>` would swallow or break out into what follows.
 */
export function popupMarkupOf(html: string): string | undefined {
  const markup = parsed(html).innerHTML;
  // A page with scripting on reads a noscript's contents as raw text, where these parses (scripting
  // off) read markup: a `</noscript>` hidden in a comment could then close the template there.
  if (/<noscript\b/i.test(markup)) return undefined;
  const nodes = parsed(`<template>${markup}</template>`).content.childNodes;
  const [only] = nodes;
  const stays =
    nodes.length === 1 && only instanceof HTMLTemplateElement && only.innerHTML === markup;
  return stays ? markup : undefined;
}

/** What `html` says, without its markup or the code of its scripts and styles. */
export function plainTextOf(html: string): string {
  const { content } = parsed(html);
  for (const code of content.querySelectorAll("script, style")) code.remove();
  for (const block of content.querySelectorAll(BLOCKS)) block.after(" ");
  return (content.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * `location` with its `html` as plain text in `content`, the one way it is written where markup
 * can't go. Parsing in a template runs nothing and fetches nothing.
 */
export function withPopupAsText(location: PastedLocation): PastedLocation {
  const { html, ...rest } = location;
  if (typeof html !== "string") return location;
  const text = plainTextOf(html);
  return text.trim() === "" ? rest : { ...rest, content: text };
}

/**
 * Locations for the site's own preview: pasted `html` never runs here, and a pasted `icon`'s host
 * is never asked.
 */
export function previewLocationsOf(
  locations: readonly PastedLocation[],
): readonly PastedLocation[] {
  return locations.map((location) => {
    const { icon: _icon, ...rest } = withPopupAsText(location);
    return rest as PastedLocation;
  });
}
