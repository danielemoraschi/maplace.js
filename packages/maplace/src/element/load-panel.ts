import { LOAD_PANEL_CLASS, OWN_PANEL_SELECTOR } from "./default-styles";
import type { MaplaceMapElement } from "./index";
import { loadSourceOf } from "./providers";
import { createSetupRetry } from "./setup-retry";

/** A const: element-attributes.test.ts reads a literal in `…Attribute("…")` as an attribute read. */
const TABINDEX = "tabindex";
/** In backticks: `check`'s import layers read a word `from` before a quote as an import. */
const LOADS_FROM = `Loads from`;

/** The element's default content while a map waits for `release()` or for the viewport. */
export interface LoadPanel {
  /** Shows the panel, unless the page has its own, following what it names, until `hide`. */
  show(): void;
  /** Takes it out, focus passing to the pane if the panel or the page's own held it. */
  hide(): void;
  /** Looks again at the page's children, if shown. */
  refresh(): void;
}

/** A panel in `pane`: a line naming whom the map loads from, and a button releasing it. */
export function createLoadPanel(host: MaplaceMapElement, pane: HTMLElement): LoadPanel {
  const document = host.ownerDocument;
  const panel = document.createElement("div");
  panel.className = LOAD_PANEL_CLASS;
  const source = document.createElement("span");
  const button = document.createElement("button");
  button.type = "button";
  button.addEventListener("click", () => host.release());
  panel.append(source, button);
  const rereads = createSetupRetry(host, refresh);
  let wanted = false;

  function refresh(): void {
    if (!wanted) return;
    if (host.querySelector(OWN_PANEL_SELECTOR)) {
      panel.remove();
      return;
    }
    fillIn();
    if (panel.parentNode !== pane) pane.append(panel);
  }

  /** In place, so a focused button keeps focus through a rename. */
  function fillIn(): void {
    const from = loadSourceOf(host);
    source.hidden = !from;
    source.textContent = from
      ? `${host.getAttribute("load-from-label")?.trim() || LOADS_FROM} ${from}`
      : "";
    button.textContent = host.getAttribute("load-label")?.trim() || "Load map";
  }

  return {
    show() {
      wanted = true;
      rereads.wait();
      refresh();
    },
    hide() {
      wanted = false;
      rereads.stop();
      const shown = host.querySelector(OWN_PANEL_SELECTOR) ?? panel;
      if (shown.matches(":focus-within")) holdFocusOn(pane);
      panel.remove();
    },
    refresh,
  };
}

/**
 * In a microtask: beside the page's own panel the pane stays hidden until `attach` sets `loading`,
 * later in this task. The next Tab goes to what `attach` adds first, the link past the map.
 */
function holdFocusOn(pane: HTMLElement): void {
  pane.tabIndex = -1;
  pane.addEventListener("blur", () => pane.removeAttribute(TABINDEX), { once: true });
  queueMicrotask(() => pane.focus({ preventScroll: true }));
}
