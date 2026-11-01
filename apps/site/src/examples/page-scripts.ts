/** The type an example page's script carries on the site until its map opens: one no browser runs. */
export const INERT_SCRIPT_TYPE = "text/x-maplace-page";

/**
 * Marks a page's map holding itself: on the site, consent opens its panel, not the map; the
 * attribute's value is `PANEL_OPEN` once it has, when pressing the panel can load the map.
 */
export const HELD_BY_EXAMPLE_ATTRIBUTE = "data-held-by-example";
export const PANEL_OPEN = "open";

/**
 * Runs the page scripts held inert in `frame`, in order, each with its own type: a page's code
 * runs as written, only later, when its map opens. A script once run is no longer inert, so a
 * second call runs nothing.
 */
export function runPageScripts(frame: ParentNode): void {
  const inert = frame.querySelectorAll<HTMLScriptElement>(`script[type="${INERT_SCRIPT_TYPE}"]`);
  for (const held of inert) held.replaceWith(runnable(held));
}

function runnable(held: HTMLScriptElement): HTMLScriptElement {
  const script = held.ownerDocument.createElement("script");
  if (held.dataset.type !== undefined) script.type = held.dataset.type;
  script.textContent = held.textContent;
  return script;
}
