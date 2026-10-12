import { MaplaceError } from "../errors";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import { sameValueSource } from "./same";

type Sanitize = MaplaceOptions["sanitize"];

/**
 * Builds a location's popup content: a string as text, a Node as itself, a function's result.
 * `html` is sanitized on the first call, so nothing touches the DOM until a popup opens (SSR).
 */
export function contentRenderer(location: Location, sanitize: Sanitize): (() => Node) | undefined {
  const { content, html } = location;
  if (html !== undefined) return htmlRenderer(location.id, html, sanitize);
  if (content === undefined) return undefined;
  if (typeof content === "function") return () => content(location);
  return valueRenderer(content);
}

/** Whether `next` renders the same content as `previous`. */
export function sameContentSource(previous: Location, next: Location): boolean {
  return previous.html === next.html && sameValueSource(previous.content, next.content);
}

// Built apart from the location, so a kept renderer doesn't keep an old location alive.
function valueRenderer(content: string | Node): () => Node {
  return typeof content === "string" ? () => document.createTextNode(content) : () => content;
}

function htmlRenderer(id: string, html: string, sanitize: Sanitize): () => Node {
  // Validation rejects html without sanitize first; this keeps unsanitized HTML out regardless.
  if (sanitize === undefined) {
    const message = `location ${JSON.stringify(id)}: html needs the sanitize option`;
    throw new MaplaceError("missing-sanitizer", message, { locationId: id, field: "html" });
  }
  let safe: string | undefined;
  return () => {
    safe ??= sanitize(html);
    return parseHtml(safe);
  };
}

function parseHtml(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}
