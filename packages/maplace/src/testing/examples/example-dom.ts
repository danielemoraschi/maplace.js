// Parsing a page's markup and putting it in the test document, its scripts run as a browser would.

/** Script types a browser runs; any other (`application/json`) is data. */
const EXECUTABLE = new Set(["", "module", "text/javascript"]);

export function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/** `html` with `YOUR_KEY` replaced, when a key is given. */
export function withKey(html: string, apiKey: string | undefined): string {
  return apiKey === undefined ? html : html.replaceAll("YOUR_KEY", apiKey);
}

/**
 * A parsed document's nodes, imported into the test document: its head's nodes that match
 * `headSelector` (the parser puts a leading `<style>` or `<script>` there), then its body's.
 */
export function importedNodes(page: Document, headSelector: string): Node[] {
  const head = [...page.head.children].filter((node) => node.matches(headSelector));
  return [...head, ...page.body.childNodes].map((node) => document.importNode(node, true));
}

/** A `<div>` holding `nodes`. */
export function rootOf(nodes: readonly Node[]): HTMLElement {
  const root = document.createElement("div");
  root.append(...nodes);
  return root;
}

/** A script imported from another document never runs: a fresh one in its place does. */
export function runScript(imported: HTMLScriptElement): void {
  if (!EXECUTABLE.has(imported.type)) return;
  const script = document.createElement("script");
  script.type = imported.type;
  script.textContent = imported.textContent;
  imported.replaceWith(script);
}
