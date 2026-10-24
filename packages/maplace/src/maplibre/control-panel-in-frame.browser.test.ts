import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { sizedContainerInFrame } from "../testing/iframes";
import { panelOf } from "../testing/panel-of";
import { queried } from "../testing/queried";
import { onMapLibreIn } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

describe("the panel of a control on a MapLibre map in a frame", () => {
  it("styles the panel of a node the page made, on a map in a frame", async () => {
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onMapLibreIn(maplace, sizedContainerInFrame());
    const node = document.createElement("button");
    adapter.mountControl(node, "top-left");
    const panel = panelOf(node);
    const style = panel.ownerDocument.defaultView?.getComputedStyle(panel);
    expect([style?.borderRadius, style?.boxShadow, style?.paddingTop]).toEqual([
      "4px",
      "rgba(0, 0, 0, 0.1) 0px 0px 0px 2px",
      "4px",
    ]);
  });

  it("styles a list view the page made, in a panel on a MapLibre map in a frame", async () => {
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onMapLibreIn(maplace, sizedContainerInFrame());
    const list = createListView(maplace, { heading: "Choose a location:" });
    onTestFinished(() => list.destroy());
    adapter.mountControl(list.element, "top-left");
    const listbox = queried(list.element, "[role=listbox]");
    const style = listbox.ownerDocument.defaultView?.getComputedStyle(listbox);
    expect([style?.overflowY, style?.paddingTop]).toEqual(["auto", "4px"]);
  });
});
