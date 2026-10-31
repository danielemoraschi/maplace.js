import { onTestFinished } from "vitest";

/** The page's own panel, in place of the ready-made one. */
export const OWN_CHILD =
  '<div data-maplace-idle id="own"><button id="own-button">Ask</button></div>';

export const panelIn = (map: Element) => map.querySelector(".maplace-load-panel");
export const paneIn = (map: Element) => map.querySelector<HTMLElement>(".maplace-map-pane");
export const lineIn = (map: Element) => map.querySelector<HTMLElement>(".maplace-load-panel>span");

export function buttonIn(map: Element): HTMLButtonElement {
  const button = map.querySelector<HTMLButtonElement>(".maplace-load-panel>button");
  if (button === null) throw new Error("no panel button");
  return button;
}

/** Every load panel added to the page from now until the test ends, even one gone by then. */
export function panelsAdded(): Element[] {
  const panels: Element[] = [];
  const seen = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && node.classList.contains("maplace-load-panel")) {
          panels.push(node);
        }
      }
    }
  });
  seen.observe(document.body, { childList: true, subtree: true });
  onTestFinished(() => seen.disconnect());
  return panels;
}
