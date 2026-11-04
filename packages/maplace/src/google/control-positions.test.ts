// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ControlPosition } from "../adapter";
import { googlePosition } from "./control-positions";
import { stubLibraries } from "./testing/stub-libraries";

const { core } = stubLibraries();

describe("googlePosition", () => {
  it("puts top-left under Google's own top-left controls, bottom-left above its logo, and the right corners in Google's corners of their names", () => {
    const corners: ControlPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
    // Google's own values (Maps JS 3.66), which the stub copies: LEFT_TOP, TOP_RIGHT, LEFT_BOTTOM, BOTTOM_RIGHT.
    expect(corners.map((corner) => googlePosition(core, corner))).toEqual([5, 3, 6, 12]);
  });
});
