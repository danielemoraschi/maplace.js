import { describe, expect, it } from "vitest";
import type { AdapterHost } from "../adapter";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { editReportsFor } from "./edit-reports";

const at = (lat: number) => ({ type: "marker", lat, lng: 0 }) as const;

function recorded() {
  const host = createRecordingHost();
  const editing = () => host.reportsIn("reportLocationEdit", "reportLocationChange");
  return { host, editing };
}

describe("editReportsFor", () => {
  it("reports an edit where it ended, then the change, when nothing moved before", () => {
    const { host, editing } = recorded();
    editReportsFor("a", () => host).ended(at(1));
    expect(editing()).toEqual([
      ["reportLocationEdit", "a", at(1)],
      ["reportLocationChange", "a", at(1)],
    ]);
  });

  it("reports each move, and no second edit where the last one already is", () => {
    const { host, editing } = recorded();
    const edits = editReportsFor("a", () => host);
    edits.moving(at(1));
    edits.moving(at(2));
    edits.ended(at(2));
    expect(editing()).toEqual([
      ["reportLocationEdit", "a", at(1)],
      ["reportLocationEdit", "a", at(2)],
      ["reportLocationChange", "a", at(2)],
    ]);
  });

  it("reports a move only where the last one wasn't", () => {
    const { host, editing } = recorded();
    const edits = editReportsFor("a", () => host);
    edits.moving(at(1));
    edits.moving(at(1));
    expect(editing()).toEqual([["reportLocationEdit", "a", at(1)]]);
  });

  it("reports where it ended when the last move was elsewhere", () => {
    const { host, editing } = recorded();
    const edits = editReportsFor("a", () => host);
    edits.moving(at(2));
    edits.ended(at(3));
    expect(editing().slice(1)).toEqual([
      ["reportLocationEdit", "a", at(3)],
      ["reportLocationChange", "a", at(3)],
    ]);
  });

  it("starts each edit afresh", () => {
    const { host, editing } = recorded();
    const edits = editReportsFor("a", () => host);
    edits.moving(at(1));
    edits.ended(at(1));
    edits.ended(at(1));
    expect(editing().slice(2)).toEqual([
      ["reportLocationEdit", "a", at(1)],
      ["reportLocationChange", "a", at(1)],
    ]);
  });

  it("reports nothing once the map stops reporting", () => {
    const { host } = recorded();
    let live: AdapterHost | undefined = host;
    const edits = editReportsFor("a", () => live);
    live = undefined;
    edits.moving(at(1));
    edits.ended(at(1));
    expect(host.reports).toEqual([]);
  });
});
