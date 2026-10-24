// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import type { Box } from "../adapter-kit/popup-shift";
import { measureCorners } from "./popup-corners";
import { boxAt, type LaidOutBox, laidOutAt } from "./testing/laid-out";
import { STUB_CONTROL_POSITIONS, StubMap } from "./testing/stub-libraries";

const ROOM: LaidOutBox = [0, 0, 375, 600];
const BUTTON: LaidOutBox = [325, 10, 40, 40];
const LOGO: LaidOutBox = [0, 574, 66, 26];
const MARKER: LaidOutBox = [100, 100, 20, 20];
const OTHER_MARKER: LaidOutBox = [250, 400, 20, 20];

/** Where each of `boxes` is, as `measureCorners` reports them. */
const edgesOf = (boxes: readonly Box[]): Box[] =>
  boxes.map(({ left, top, right, bottom }) => ({ left, top, right, bottom }));

function element(box?: LaidOutBox, ...children: Element[]): HTMLElement {
  const made = document.createElement("div");
  if (box) laidOutAt(made, box);
  made.append(...children);
  return made;
}

/** Where Google lays its pane containers out: from the room's centre, as wide as it, no height. */
function paneBand([left, top, width, height]: LaidOutBox): LaidOutBox {
  return [left + width / 2, top + height / 2, width, 0];
}

/**
 * A Google-like map on the page, as Maps JS draws one: its element at `div`, then Google's root at
 * `room`, a wrapper holding one layer over it (Google's `gm-style`). In it, the map's region over
 * the room holds the panes: two containers laid out alike, one holding the popup's pane and a
 * marker's, the other a marker's. Beside the region, an empty iframe over the room; beside it too,
 * or in it as `controlsIn` says, two containers with no box, one holding a button, one the logo
 * with its image.
 */
function googleLikeMap({
  div = ROOM,
  room = ROOM,
  controlsIn = "layer",
}: {
  div?: LaidOutBox;
  room?: LaidOutBox;
  controlsIn?: "layer" | "region";
} = {}) {
  const popup = element([67, 100, 240, 170]);
  const panes = [
    element(paneBand(room), element(undefined, popup), element(undefined, element(MARKER))),
    element(paneBand(room), element(undefined, element(OTHER_MARKER))),
  ];
  const controls = [
    element(undefined, element(BUTTON)),
    element(undefined, element(LOGO, element(LOGO))),
  ];
  const iframe = element(room);
  const region = element(room, ...panes, ...(controlsIn === "region" ? controls : []));
  const layer = element(room, region, iframe, ...(controlsIn === "layer" ? controls : []));
  const mapDiv = element(div, element(room, layer));
  document.body.append(mapDiv);
  const map = new StubMap(mapDiv);
  const measured = () => measureCorners(map as unknown as google.maps.Map, popup);
  return { map, layer, popup, measured, controls: () => edgesOf(measured().controls) };
}

afterEach(() => document.body.replaceChildren());

describe("measureCorners", () => {
  it("counts each control pushed to a corner", () => {
    const { map, layer, controls } = googleLikeMap();
    const panel = element([200, 10, 165, 250]);
    layer.append(panel);
    map.controls[STUB_CONTROL_POSITIONS.TOP_RIGHT]?.push(panel);
    expect(controls()).toContainEqual(boxAt([200, 10, 165, 250]));
  });

  it.each(["layer", "region"] as const)(
    "counts Google's own controls in its %s, each the outermost element shown with a box, in containers that have none",
    (controlsIn) => {
      expect(googleLikeMap({ controlsIn }).controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
    },
  );

  it.each(["layer", "region"] as const)(
    "leaves out the panes, the popup's and those laid out where it is, with the markers they hold, the controls in Google's %s",
    (controlsIn) => {
      const controls = googleLikeMap({ controlsIn }).controls();
      expect(controls).not.toContainEqual(boxAt(MARKER));
      expect(controls).not.toContainEqual(boxAt(OTHER_MARKER));
    },
  );

  it("leaves out a pane container laid out a rounding error from the popup's", () => {
    const { layer, controls } = googleLikeMap({ controlsIn: "region" });
    const [left, top, width, height] = paneBand(ROOM);
    const region = layer.firstElementChild as Element;
    region.append(
      element([left + 0.001, top, width, height], element(undefined, element([30, 30, 20, 20]))),
    );
    expect(controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
  });

  it("counts nothing of a popup as large as the map, held by a layer over it", () => {
    const { layer, popup, controls } = googleLikeMap();
    laidOutAt(popup, [-10, -10, 400, 700]);
    popup.append(element([20, 20, 100, 30]));
    (layer.firstElementChild as Element).append(popup);
    expect(controls()).not.toContainEqual(boxAt([20, 20, 100, 30]));
  });

  it("looks inside a layer over the whole map for what it holds", () => {
    const { layer, controls } = googleLikeMap();
    layer.append(element(ROOM, element([10, 10, 40, 40])));
    expect(controls()).toContainEqual(boxAt([10, 10, 40, 40]));
  });

  it("takes a layer laid out a fraction of a pixel inside the room as one over it", () => {
    const { layer, controls } = googleLikeMap();
    layer.append(element([0.25, 0.25, 374.5, 599.5]));
    expect(controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
  });

  it("takes the map's room from Google's root, inside a border on the map's element", () => {
    const inside: LaidOutBox = [2, 2, 375, 600];
    const { measured, controls } = googleLikeMap({ div: [0, 0, 379, 604], room: inside });
    expect(edgesOf([measured().room])).toEqual([boxAt(inside)]);
    expect(controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
  });

  it.each(["opacity", "visibility"] as const)(
    "leaves out what %s hides, and all it holds",
    (property) => {
      const { layer, controls } = googleLikeMap();
      const message = element(ROOM, element([150, 250, 80, 40]));
      message.style[property] = property === "opacity" ? "0" : "hidden";
      layer.append(message);
      expect(controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
    },
  );

  it("takes the room from Google's root on a page's own map, its element holding the page's nodes too", () => {
    const { map, measured } = googleLikeMap();
    map.getDiv().prepend(element([0, 0, 120, 30]));
    expect(edgesOf([measured().room])).toEqual([boxAt(ROOM)]);
  });

  it("leaves out a control not on the page yet", () => {
    const { map, controls } = googleLikeMap();
    map.controls[STUB_CONTROL_POSITIONS.TOP_RIGHT]?.push(element([200, 10, 165, 250]));
    expect(controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
  });
});
