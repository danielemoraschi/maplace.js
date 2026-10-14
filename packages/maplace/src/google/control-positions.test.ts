// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ControlPosition } from "../adapter";
import { googlePosition } from "./control-positions";
import { stubLibraries } from "./testing/stub-libraries";

const { core } = stubLibraries();

describe("googlePosition", () => {
  it("puts each of maplace's corners in Google's corner of the same name", () => {
    const corners: ControlPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
    // Google's own values for its corners (Maps JS 3.66), which the stub copies.
    expect(corners.map((corner) => googlePosition(core, corner))).toEqual([1, 3, 10, 12]);
  });
});
