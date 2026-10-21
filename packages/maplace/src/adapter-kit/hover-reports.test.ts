import { describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { createHoverReports } from "./hover-reports";

function reporting() {
  const host = createRecordingHost();
  let live: AdapterHost | undefined = host;
  const hover = createHoverReports(() => live);
  return {
    hover,
    reports: () => host.reportsOf("reportHoverChange").map(([id]) => id),
    stop: () => (live = undefined),
  };
}

describe("createHoverReports", () => {
  it("reports the pointer onto a marker and off it", () => {
    const { hover, reports } = reporting();
    hover.enter("pointer", "a");
    hover.leave("pointer", "a");
    expect(reports()).toEqual(["a", undefined]);
  });

  it("puts the pointer before keyboard focus, and goes back to the focus when it leaves", () => {
    const { hover, reports } = reporting();
    hover.enter("focus", "a");
    hover.enter("pointer", "b");
    hover.leave("pointer", "b");
    expect(reports()).toEqual(["a", "b", "a"]);
  });

  it("ignores focus leaving a marker the pointer has moved off", () => {
    const { hover, reports } = reporting();
    hover.enter("focus", "a");
    hover.enter("pointer", "b");
    hover.leave("focus", "b");
    hover.leave("focus", "a");
    expect(reports()).toEqual(["a", "b"]);
  });

  it("reports each change once, whatever points at it", () => {
    const { hover, reports } = reporting();
    hover.enter("pointer", "a");
    hover.enter("focus", "a");
    hover.leave("pointer", "a");
    expect(reports()).toEqual(["a"]);
  });

  it("forgets a marker gone from sight, and falls back to what still points", () => {
    const { hover, reports } = reporting();
    hover.enter("focus", "a");
    hover.enter("pointer", "b");
    hover.gone("b");
    hover.enter("focus", "c");
    expect(reports()).toEqual(["a", "b", "a", "c"]);
  });

  it("reports nothing once the map stops reporting", () => {
    const { hover, reports, stop } = reporting();
    stop();
    hover.enter("pointer", "a");
    expect(reports()).toEqual([]);
  });
});
