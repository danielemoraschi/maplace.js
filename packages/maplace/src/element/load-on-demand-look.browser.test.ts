import { describe, expect, it } from "vitest";
import { EXAMPLES, type Example, type Provider } from "../testing/examples/example-files";
import { openHost } from "../testing/examples/example-hosts";
import { openScript } from "../testing/examples/example-scripts";
import { mapFrom, ROME } from "./testing/fake-maps";
import { buttonIn, panelIn } from "./testing/load-panel";

// Load on demand's HTML version shows the element's own panel while it holds the map; the other
// versions write a panel of their own, which a reader should find looking the same before the press.

const PANEL_LOOK = [
  "display",
  "height",
  "placeContent",
  "gap",
  "backgroundColor",
  "paddingInline",
  "textAlign",
] as const;
const BUTTON_LOOK = ["padding", "border", "borderRadius", "fontWeight", "backgroundColor"] as const;

const LOADS_FROM: Record<Provider, string> = {
  google: "Loads from Google",
  maplibre: "Loads from OpenFreeMap",
};

const lookOf = (element: Element, properties: readonly (keyof CSSStyleDeclaration)[]) => {
  const style = getComputedStyle(element);
  return Object.fromEntries(properties.map((name) => [name, style[name]]));
};

/** Each version but the page, its program run without the press, in its own root. */
async function versionsOpenedOf({ script, vanilla, react }: Example): Promise<HTMLElement[]> {
  const opened = openScript(script);
  await opened.run();
  const hosts = [vanilla, react].map((host) => ({ root: openHost(host.html), run: host.run }));
  for (const host of hosts) await host.run();
  return [opened.root, ...hosts.map(({ root }) => root)];
}

async function panelOf(root: HTMLElement): Promise<Element> {
  await expect.poll(() => root.querySelector(".load-panel")).not.toBeNull();
  return root.querySelector(".load-panel") as Element;
}

const LOAD_ON_DEMAND = EXAMPLES.filter(({ name }) => name === "load-on-demand");
if (LOAD_ON_DEMAND.length !== 2) throw new Error("load-on-demand is drawn on Google and MapLibre");

describe.each(LOAD_ON_DEMAND)("Load on demand's panels ($provider)", (example) => {
  it("shows every version's panel as the element shows its own, naming whom the map loads from", async () => {
    // `mapFrom` replaces the body, so the element's panel opens before the versions.
    const reference = await mapFrom(`<maplace-map hold provider="fake">${ROME}</maplace-map>`);
    const elementsPanel = panelIn(reference) as Element;
    const roots = await versionsOpenedOf(example);
    for (const root of roots) {
      const panel = await panelOf(root);
      expect(lookOf(panel, PANEL_LOOK)).toEqual(lookOf(elementsPanel, PANEL_LOOK));
      const button = panel.querySelector(":scope > button") as Element;
      expect(lookOf(button, BUTTON_LOOK)).toEqual(lookOf(buttonIn(reference), BUTTON_LOOK));
      expect(button.textContent).toBe("Load map");
      expect(panel.querySelector(":scope > span")?.textContent).toBe(LOADS_FROM[example.provider]);
    }
  });
});
