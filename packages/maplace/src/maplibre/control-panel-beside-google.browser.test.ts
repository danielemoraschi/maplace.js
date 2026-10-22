import { expect, it, onTestFinished } from "vitest";
import { adoptStyles } from "../adopted-styles";
import { CONTROL_STYLES as GOOGLE_CONTROL_STYLES } from "../google/control-styles";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { CREDITED_OPTIONS, onMapLibre, panelOf } from "./testing/control-site";

// In a file of its own: its page adopts Google's sheet before MapLibre's, which no other file does.
it("keeps MapLibre's rounding and ring on a page that adopted Google's panel sheet first", async () => {
  adoptStyles(document, GOOGLE_CONTROL_STYLES);
  const maplace = createMaplace({ locations: places() });
  const { adapter } = await onMapLibre(maplace);
  const node = document.createElement("button");
  adapter.mountControl(node, "top-left");
  const panel = getComputedStyle(panelOf(node));
  expect([panel.borderRadius, panel.boxShadow]).toEqual([
    "4px",
    "rgba(0, 0, 0, 0.1) 0px 0px 0px 2px",
  ]);
});

it("keeps a long bottom-right list clear of MapLibre's attribution on a page that adopted Google's sheet first", async () => {
  adoptStyles(document, GOOGLE_CONTROL_STYLES);
  const maplace = createMaplace({ locations: places(30) });
  const { adapter, map } = await onMapLibre(maplace, CREDITED_OPTIONS);
  const list = createListView(maplace, { heading: "Choose a location:" });
  onTestFinished(() => list.destroy());
  adapter.mountControl(list.element, "bottom-right");
  const top = map.getContainer().getBoundingClientRect().top;
  expect(panelOf(list.element).getBoundingClientRect().top).toBeGreaterThanOrEqual(top + 10);
});
