import { afterEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { sizedContainerInFrame } from "../testing/iframes";
import { panelOf } from "../testing/panel-of";
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
});
