import { NavigationControl } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import type { ControlPosition } from "../adapter";
import { darkPage } from "../google/testing/dark-page";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { panelOf } from "../testing/panel-of";
import { unstyledPage } from "../testing/unstyled-page";
import { onPageMapLibre } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

/** A button of the page's in a corner of the page's own MapLibre map. */
async function buttonOn(position: ControlPosition = "top-left") {
  const maplace = createMaplace({ locations: places() });
  const site = await onPageMapLibre(maplace);
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
    const { map, panel } = await buttonOn("top-right");
    map.addControl(new NavigationControl(), "top-right");
    const own = getComputedStyle(
      map.getContainer().querySelector(".maplibregl-ctrl-group") as Element,
    );
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
    const { panel } = await buttonOn();
    expect([panel.backgroundColor, panel.color, panel.colorScheme]).toEqual([
      "rgb(255, 255, 255)",
      "rgb(31, 31, 31)",
      "light",
    ]);
  });

  it("draws dark when the page asks with .maplace-control { color-scheme: dark }", async () => {
    pageRule(".maplace-control { color-scheme: dark }");
    const { panel } = await buttonOn();
    expect(panel.backgroundColor).toBe("rgb(68, 68, 68)");
  });

  it("keeps a long list within the page's own map, never making it a size container", async () => {
    const maplace = createMaplace({ locations: places(30) });
    const { adapter, map } = await onPageMapLibre(maplace);
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-left");
    const mapBox = map.getContainer().getBoundingClientRect();
    expect(panelOf(view.element).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      mapBox.bottom - 10 + 0.5,
    );
    expect(getComputedStyle(map.getContainer()).containerType).toBe("normal");
  });

  it("keeps a long list within a bordered page map, its corners inside the border", async () => {
    const maplace = createMaplace({ locations: places(30) });
    const { adapter, map } = await onPageMapLibre(maplace);
    map.getContainer().style.border = "20px solid";
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-left");
    const inside = map.getContainer().getBoundingClientRect().bottom - 20;
    expect(panelOf(view.element).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      inside - 10 + 0.5,
    );
  });

  it("keeps a list of short titles 12em wide at the panel's 13px, and as narrow as its titles inside the opt-out", async () => {
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onPageMapLibre(maplace);
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-right");
    expect(view.element.getBoundingClientRect().width).toBe(12 * 13);
    onTestFinished(unstyledPage());
    expect(view.element.getBoundingClientRect().width).toBeLessThan(12 * 13);
  });

  it("fits a scoped list's switch in the 12em panel, each button on one line", async () => {
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onPageMapLibre(maplace);
    const view = createListView(maplace, { scope: "viewport" });
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-right");
    const lineHeight = Number.parseFloat(getComputedStyle(view.element).lineHeight);
    for (const button of view.element.querySelectorAll(".maplace-area-switch>button")) {
      expect(button.getBoundingClientRect().height).toBeLessThan(lineHeight * 2);
    }
    expect(view.element.getBoundingClientRect().width).toBe(12 * 13);
  });

  it("lets the page's own rule win", async () => {
    pageRule(".maplace-control { background: rgb(1, 2, 3) }");
    const { panel } = await buttonOn();
    expect(panel.backgroundColor).toBe("rgb(1, 2, 3)");
  });

  it("draws no panel inside the opt-out, MapLibre's margins left", async () => {
    onTestFinished(unstyledPage());
    const { panel } = await buttonOn();
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
