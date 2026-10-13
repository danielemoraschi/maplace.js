import { describe, expect, it, vi } from "vitest";
import type { MaplaceError } from "../errors";
import { guardedRenderer } from "./guarded";

const NODE = { nodeType: 1 } as unknown as Node;

function guarded(build: () => unknown) {
  const report = vi.fn<(error: MaplaceError) => void>();
  return {
    render: guardedRenderer<void>(build, { locationId: "a", field: "icon", report }),
    report,
  };
}

describe("guardedRenderer", () => {
  it("returns what the page's code builds", () => {
    expect(guarded(() => NODE).render()).toBe(NODE);
  });

  it("reports a throw as invalid-input, with the error as cause, and returns undefined", () => {
    const thrown = new Error("page bug");
    const { render, report } = guarded(() => {
      throw thrown;
    });
    expect(render()).toBeUndefined();
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "invalid-input",
        message: 'location "a": icon threw',
        locationId: "a",
        field: "icon",
        cause: thrown,
      }),
    );
  });

  it("reports a result that isn't a Node", () => {
    const { render, report } = guarded(() => "<b>x</b>");
    expect(render()).toBeUndefined();
    expect(report.mock.calls[0]?.[0].message).toBe(
      'location "a": icon must return a Node, got "<b>x</b>"',
    );
  });

  it("reports once however often it fails", () => {
    const { render, report } = guarded(() => undefined);
    render();
    render();
    expect(report).toHaveBeenCalledTimes(1);
  });
});
