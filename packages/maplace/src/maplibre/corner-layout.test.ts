import { describe, expect, it } from "vitest";
import type { ControlPosition } from "../adapter";
import {
  type CornerContent,
  type CornerLayout,
  type Corners,
  fairRoom,
  type Held,
  layoutCorners,
  sameLayout,
} from "./corner-layout";

const HEIGHT = 500;

/** A corner holding nothing, at the left edge, unless `content` says otherwise. */
function corner(content: Partial<CornerContent> = {}): CornerContent {
  return {
    left: 0,
    right: 0,
    height: 0,
    held: [],
    holdsPanel: false,
    listHeight: 0,
    naturalListHeights: [],
    ...content,
  };
}

/**
 * A corner holding one maplace panel with a list `listHeight` tall now, `natural` without a limit:
 * the panel's 8px of padding and its 10px margin, a bottom corner's `under` element below it.
 */
function listCorner(
  span: Pick<CornerContent, "left" | "right">,
  { listHeight, natural, under }: { listHeight: number; natural: number; under?: Held },
): CornerContent {
  const panel = listHeight + 18;
  const height = panel + (under?.rise ?? 0);
  const rise = height;
  return corner({
    ...span,
    height,
    holdsPanel: true,
    listHeight,
    naturalListHeights: [natural],
    held: [{ ...span, rise }, ...(under ? [under] : [])],
  });
}

/** A corner holding one element `height` tall with its margin, no list. */
function fixedCorner(
  span: Pick<CornerContent, "left" | "right">,
  height: number,
  holdsPanel = false,
) {
  return corner({ ...span, height, holdsPanel, held: [{ ...span, rise: height }] });
}

function layout(corners: Partial<Record<ControlPosition, CornerContent>>): CornerLayout {
  const all: Corners = {
    "top-left": corner(),
    "top-right": corner(),
    "bottom-left": corner(),
    "bottom-right": corner(),
    ...corners,
  };
  return layoutCorners({ height: HEIGHT, corners: all });
}

/** MapLibre's attribution at the foot of a bottom-right corner: `rise` tall with its margins. */
const attribution = (left: number, right: number, rise: number): Held => ({ left, right, rise });

describe("layoutCorners", () => {
  it("gives a lone top corner's list the map's height less what else it holds and the corners' margins", () => {
    const topLeft = corner({ right: 200, height: 130, listHeight: 100, naturalListHeights: [600] });
    expect(layout({ "top-left": topLeft }).listRoom["top-left"]).toBe(460);
  });

  it("stops a top-left list above what the bottom-left corner holds", () => {
    const topLeft = listCorner({ left: 0, right: 200 }, { listHeight: 100, natural: 600 });
    const bottomLeft = fixedCorner({ left: 0, right: 150 }, 60, true);
    const room = layout({ "top-left": topLeft, "bottom-left": bottomLeft }).listRoom["top-left"];
    expect(room + 18).toBe(HEIGHT - 60 - 10);
  });

  it("stops a top-right list above MapLibre's attribution beneath it", () => {
    const topRight = listCorner({ left: 300, right: 500 }, { listHeight: 100, natural: 600 });
    const bottomRight = corner({
      left: 300,
      right: 500,
      height: 34,
      held: [attribution(300, 490, 34)],
    });
    const room = layout({ "top-right": topRight, "bottom-right": bottomRight }).listRoom[
      "top-right"
    ];
    expect(room).toBe(HEIGHT - 34 - 10 - 18);
  });

  it("stops a top-left list above a bottom-right element that reaches under it, as a phone's attribution does", () => {
    const topLeft = listCorner({ left: 0, right: 200 }, { listHeight: 100, natural: 600 });
    const bottomRight = corner({
      left: 10,
      right: 375,
      height: 46,
      held: [attribution(10, 365, 46)],
    });
    const room = layout({ "top-left": topLeft, "bottom-right": bottomRight }).listRoom["top-left"];
    expect(room).toBe(HEIGHT - 46 - 10 - 18);
  });

  it("gives a bottom-right list the column less a top-right control's height, not half of it", () => {
    const navigation = fixedCorner({ left: 1200, right: 1280 }, 70);
    const bottomRight = listCorner(
      { left: 1000, right: 1280 },
      { listHeight: 300, natural: 600, under: attribution(1000, 1270, 34) },
    );
    const room = layout({ "top-right": navigation, "bottom-right": bottomRight }).listRoom[
      "bottom-right"
    ];
    expect(room).toBe(HEIGHT - 70 - 18 - 34 - 10);
  });

  it("splits a column between two long lists", () => {
    const share = (HEIGHT - 18 - 18 - 10) / 2;
    const topLeft = listCorner({ left: 0, right: 200 }, { listHeight: 300, natural: 600 });
    const bottomLeft = listCorner({ left: 0, right: 200 }, { listHeight: share, natural: 600 });
    const { listRoom } = layout({ "top-left": topLeft, "bottom-left": bottomLeft });
    expect([listRoom["top-left"], listRoom["bottom-left"]]).toEqual([share, share]);
  });

  it("lets a short list keep its height and gives a long one the rest", () => {
    const topLeft = listCorner({ left: 0, right: 200 }, { listHeight: 60, natural: 60 });
    const bottomLeft = listCorner({ left: 0, right: 200 }, { listHeight: 200, natural: 600 });
    const { listRoom } = layout({ "top-left": topLeft, "bottom-left": bottomLeft });
    expect(listRoom["bottom-left"]).toBe(HEIGHT - 18 - 18 - 10 - 60);
    expect(listRoom["top-left"]).toBeGreaterThanOrEqual(60);
  });

  it("gives a top-right list its share beside a long bottom-left list that reaches under it on a phone", () => {
    const phoneAttribution = attribution(10, 365, 46);
    const bottomRight = corner({ left: 10, right: 375, height: 46, held: [phoneAttribution] });
    const bottomLeft = listCorner({ left: 0, right: 250 }, { listHeight: 204, natural: 600 });
    const topRight = listCorner({ left: 125, right: 375 }, { listHeight: 100, natural: 600 });
    const { listRoom } = layout({
      "top-right": topRight,
      "bottom-left": bottomLeft,
      "bottom-right": bottomRight,
    });
    expect(listRoom["bottom-left"]).toBeGreaterThan(150);
    expect(listRoom["top-right"]).toBeGreaterThan(150);
  });

  it("lifts the bottom-left corner above what the bottom-right holds in its column, keeping both on the map", () => {
    const phoneAttribution = attribution(10, 365, 46);
    const bottomLeft = fixedCorner({ left: 0, right: 150 }, 60, true);
    const settled = HEIGHT - 60 - 18 - 46 - 10;
    const bottomRight = listCorner(
      { left: 100, right: 375 },
      { listHeight: settled, natural: 600, under: phoneAttribution },
    );
    const { lift, listRoom } = layout({ "bottom-left": bottomLeft, "bottom-right": bottomRight });
    expect(listRoom["bottom-right"]).toBe(settled);
    expect(lift).toBe(settled + 18 + 46);
    expect(lift + bottomLeft.height + 10).toBeLessThanOrEqual(HEIGHT);
  });

  it("leaves the bottom-left corner down when the bottom-right corner keeps to its side", () => {
    const bottomLeft = fixedCorner({ left: 0, right: 200 }, 60, true);
    const bottomRight = corner({
      left: 900,
      right: 1280,
      height: 34,
      held: [attribution(900, 1270, 34)],
    });
    expect(layout({ "bottom-left": bottomLeft, "bottom-right": bottomRight }).lift).toBe(0);
  });

  it("lifts nothing when the bottom-left holds only the page's own controls", () => {
    const scale = fixedCorner({ left: 0, right: 150 }, 30);
    const bottomRight = corner({
      left: 10,
      right: 375,
      height: 46,
      held: [attribution(10, 365, 46)],
    });
    expect(layout({ "bottom-left": scale, "bottom-right": bottomRight }).lift).toBe(0);
  });
});

describe("fairRoom", () => {
  it("gives every list all the free height when they all fit", () => {
    expect(fairRoom(300, [50, 100])).toBe(300);
  });

  it("splits the rest evenly among the long ones", () => {
    expect(fairRoom(300, [600, 40, 500])).toBe(130);
  });

  it("gives nothing when there is no free height", () => {
    expect(fairRoom(-20, [40])).toBe(0);
  });
});

describe("sameLayout", () => {
  const rooms = (room: number) => ({
    "top-left": room,
    "top-right": room,
    "bottom-left": room,
    "bottom-right": room,
  });

  it("tells layouts apart by more than half a pixel", () => {
    const a = { lift: 10, listRoom: rooms(100) };
    expect(sameLayout(a, { lift: 10.4, listRoom: rooms(100.3) })).toBe(true);
    expect(sameLayout(a, { lift: 10, listRoom: rooms(101) })).toBe(false);
    expect(sameLayout(a, { lift: 11, listRoom: rooms(100) })).toBe(false);
  });
});
