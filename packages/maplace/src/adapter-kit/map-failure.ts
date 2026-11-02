import type { Adapter, AdapterHost } from "../adapter";
import { adoptStyles } from "../adopted-styles";
import type { MaplaceError } from "../errors";
import { MAP_FAILURE_CLASS, MAP_FAILURE_WORDS } from "../map-failure-words";
import { outsideUnstyled } from "../unstyled";

/** How an adapter of maplace's says, on the map, that the map can't be used. */
export interface MapFailureNotice {
  /** `mount`, the panel shown in its container when it fails, unless cancelled. */
  mounting(mount: Adapter["mount"]): Adapter["mount"];
  /** A failure the map doesn't outlive: the panel shown, then reported. */
  reportFatal(host: AdapterHost, error: MaplaceError): void;
  /** Takes the panel off: the adapter's `destroy`. */
  clear(): void;
}

/**
 * The look of the words. No vertical margin: one would collapse through the holder of no height
 * and move the map, or the whole container.
 */
const FAILURE_STYLES = `${outsideUnstyled(`.${MAP_FAILURE_CLASS}>*`)}{display:block;position:relative;top:.5rem;width:fit-content;max-width:calc(100% - 1rem);margin-inline:auto;padding:.5rem .75rem;border:1px solid;border-radius:.375rem;background:Canvas;color:CanvasText;font-size:.875rem}`;

/** A notice for a map the adapter creates. */
export function createMapFailureNotice(): MapFailureNotice {
  let container: HTMLElement | undefined;
  let panel: HTMLElement | undefined;
  const show = () => {
    if (container !== undefined && panel === undefined) panel = failurePanelIn(container);
  };
  return {
    mounting: (mount) => async (context) => {
      container = context.container;
      try {
        await mount(context);
      } catch (error) {
        if (!context.signal.aborted) show();
        throw error;
      }
    },
    reportFatal(host, error) {
      show();
      host.reportError(error);
    },
    clear() {
      panel?.remove();
      panel = undefined;
    },
  };
}

/** The page's own map: the page owns it, and hears the `error` event. */
export const PAGE_MAP_FAILURES: MapFailureNotice = {
  mounting: (mount) => mount,
  reportFatal: (host, error) => host.reportError(error),
  clear() {},
};

/**
 * The panel, first in `container`: a holder of no height, so the map doesn't move, styled inline
 * as it must work under the opt-out and in a shadow root, where no sheet reaches; above MapLibre's
 * corners (`z-index: 2`), with no positioned ancestor needed. No inline `display`, which would beat
 * a page's `display: none`.
 */
function failurePanelIn(container: HTMLElement): HTMLElement {
  const document = container.ownerDocument;
  adoptStyles(document, FAILURE_STYLES);
  const panel = document.createElement("div");
  panel.className = MAP_FAILURE_CLASS;
  panel.setAttribute("role", "alert");
  panel.style.cssText = "position:relative;z-index:3;height:0";
  const words = document.createElement("span");
  words.textContent = MAP_FAILURE_WORDS;
  panel.append(words);
  container.prepend(panel);
  return panel;
}
