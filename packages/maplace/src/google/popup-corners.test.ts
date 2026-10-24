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

/** Where each of `boxes` is, as `measureCorners` reports them. */
const edgesOf = (boxes: readonly Box[]): Box[] =>
  boxes.map(({ left, top, right, bottom }) => ({ left, top, right, bottom }));

function element(box?: LaidOutBox, ...children: Element[]): HTMLElement {
  const made = document.createElement("div");
  if (box) laidOutAt(made, box);
  made.append(...children);
  return made;
}

/**
 * A Google-like map on the page, as Maps JS draws one: its element at `div`, then Google's root at
 * `room`, a wrapper holding one layer over it (Google's `gm-style`), which holds the rest: the
 * panes (the popup and a marker), an empty iframe over the room, and two containers with no box,
 * one holding a button, one the logo with its image.
 */
function googleLikeMap({ div = ROOM, room = ROOM }: { div?: LaidOutBox; room?: LaidOutBox } = {}) {
  const popup = element([67, 100, 240, 170]);
  const layer = element(
    room,
    element(room, popup, element(MARKER)),
    element(room),
    element(undefined, element(BUTTON)),
    element(undefined, element(LOGO, element(LOGO))),
  );
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

  it("counts Google's own controls, each the outermost element shown with a box, in containers that have none", () => {
    expect(googleLikeMap().controls()).toEqual([boxAt(BUTTON), boxAt(LOGO)]);
  });

  it("leaves out what holds the popup, the panes, with all they hold", () => {
    expect(googleLikeMap().controls()).not.toContainEqual(boxAt(MARKER));
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
