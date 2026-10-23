import { afterEach, describe, expect, it } from "vitest";
import { places } from "../google/testing/places";
import { createMaplace } from "../maplace/create";
import { sizedContainerInFrame } from "../testing/iframes";
import { panelOf } from "../testing/panel-of";
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
});
