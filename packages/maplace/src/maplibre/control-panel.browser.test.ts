import { NavigationControl } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import type { ControlPosition } from "../adapter";
import { darkPage } from "../google/testing/dark-page";
import { places } from "../google/testing/places";
import { createMaplace } from "../maplace/create";
import { unstyledPage } from "../testing/unstyled-page";
import { onMapLibre, onPageMapLibre, panelOf } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

/** A button of the page's in a corner of a MapLibre map: the page's own, or one maplace creates. */
async function buttonOn(attach: typeof onMapLibre, position: ControlPosition = "top-left") {
  const maplace = createMaplace({ locations: places() });
  const site = await attach(maplace);
  const node = document.createElement("button");
  node.textContent = "Mine";
  const remove = site.adapter.mountControl(node, position);
  return { ...site, node, remove, panel: getComputedStyle(panelOf(node)) };
}

/** A rule of the page's, for this test. */
function pageRule(css: string): void {
  const rule = document.createElement("style");
  rule.textContent = css;
  document.head.append(rule);
  onTestFinished(() => rule.remove());
}

describe("the panel of a control on a MapLibre map", () => {
  it("matches MapLibre's own control: its background, rounding and ring, 10px from the corner", async () => {
    const maplace = createMaplace({ locations: places() });
    const { adapter, map } = await onPageMapLibre(maplace);
    map.addControl(new NavigationControl(), "top-right");
    const node = document.createElement("button");
    adapter.mountControl(node, "top-right");
    const own = getComputedStyle(
      map.getContainer().querySelector(".maplibregl-ctrl-group") as Element,
    );
    const panel = getComputedStyle(panelOf(node));
    const look = (style: CSSStyleDeclaration) => [
      style.backgroundColor,
      style.borderRadius,
      style.boxShadow,
    ];
    expect(look(panel)).toEqual(look(own));
    expect([panel.marginTop, panel.marginRight]).toEqual(["10px", "10px"]);
  });

  it("stays light with dark text on a dark page", async () => {
    darkPage();
    const { panel } = await buttonOn(onPageMapLibre);
    expect([panel.backgroundColor, panel.color, panel.colorScheme]).toEqual([
      "rgb(255, 255, 255)",
      "rgb(31, 31, 31)",
      "light",
    ]);
  });

  it("draws dark when the page asks with .maplace-control { color-scheme: dark }", async () => {
    pageRule(".maplace-control { color-scheme: dark }");
    const { panel } = await buttonOn(onPageMapLibre);
    expect(panel.backgroundColor).toBe("rgb(68, 68, 68)");
  });

  it("makes only a map maplace creates, once it holds a panel, the size its lists stay within", async () => {
    const [created, page] = await Promise.all([buttonOn(onMapLibre), buttonOn(onPageMapLibre)]);
    const element = created.map.getContainer();
    expect(element.classList.contains("maplace-maplibre-map")).toBe(true);
    expect(getComputedStyle(element).containerType).toBe("size");
    expect(getComputedStyle(page.map.getContainer()).containerType).toBe("normal");
    created.remove();
    expect(getComputedStyle(element).containerType).toBe("normal");
  });

  it("lets the page's own rule win", async () => {
    pageRule(".maplace-control { background: rgb(1, 2, 3) }");
    const { panel } = await buttonOn(onPageMapLibre);
    expect(panel.backgroundColor).toBe("rgb(1, 2, 3)");
  });

  it("draws no panel inside the opt-out, MapLibre's margins left", async () => {
    onTestFinished(unstyledPage());
    const { panel } = await buttonOn(onPageMapLibre);
    expect([panel.boxShadow, panel.backgroundColor, panel.marginTop]).toEqual([
      "none",
      "rgba(0, 0, 0, 0)",
      "10px",
    ]);
  });

  it("still hides a panel whose list is hidden, inside the opt-out", async () => {
    onTestFinished(unstyledPage());
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onPageMapLibre(maplace);
    const hidden = Object.assign(document.createElement("div"), { hidden: true });
    adapter.mountControl(hidden, "top-left");
    expect(getComputedStyle(panelOf(hidden)).display).toBe("none");
  });
});
