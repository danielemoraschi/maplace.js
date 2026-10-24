import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { sizedContainerInFrame } from "../testing/iframes";
import { panelOf } from "../testing/panel-of";
import { queried } from "../testing/queried";
import { cornersLikeGoogle } from "./testing/corners-like-google";
import { places } from "./testing/places";
import { onGoogle } from "./testing/store-on-google";
import { type StubMap, stubMapsJsRecording } from "./testing/stub-libraries";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe("the panel of a control on a Google map in a frame", () => {
  it("styles the panel of a node the page made, on a Google map in a frame", async () => {
    const { maps } = stubMapsJsRecording();
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onGoogle(maplace, { container: sizedContainerInFrame() });
    const node = document.createElement("button");
    adapter.mountControl(node, "top-left");
    cornersLikeGoogle(maps[0] as StubMap);
    const panel = panelOf(node);
    const style = panel.ownerDocument.defaultView?.getComputedStyle(panel);
    expect([style?.paddingTop, style?.borderRadius]).toEqual(["4px", "2px"]);
    expect(style?.boxShadow).not.toBe("none");
  });

  it("styles a list view the page made, in a panel on a Google map in a frame", async () => {
    const { maps } = stubMapsJsRecording();
    const maplace = createMaplace({ locations: places() });
    const { adapter } = await onGoogle(maplace, { container: sizedContainerInFrame() });
    const list = createListView(maplace, { heading: "Choose a location:" });
    onTestFinished(() => list.destroy());
    adapter.mountControl(list.element, "top-left");
    cornersLikeGoogle(maps[0] as StubMap);
    const listbox = queried(list.element, "[role=listbox]");
    const style = listbox.ownerDocument.defaultView?.getComputedStyle(listbox);
    expect([style?.overflowY, style?.paddingTop]).toEqual(["auto", "4px"]);
  });
});
