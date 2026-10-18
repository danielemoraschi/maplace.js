// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createMaplace } from "../index";
import { createListKeeper } from "./list-keeper";
import { defineListView } from "./list-views";
import { createStandingMisuse } from "./standing-misuse";
import { elementWith, errorsOn } from "./testing/dom";

describe("createListKeeper", () => {
  it("reports a page's view failing to come down, and builds the new list all the same", async () => {
    const failure = new Error("still subscribed");
    const factory = vi.fn(() => ({
      element: document.createElement("div"),
      destroy: () => {
        throw failure;
      },
    }));
    defineListView("failing-destroy", factory);
    const host = elementWith({ list: "failing-destroy" });
    document.body.append(host);
    const errors = errorsOn(host);
    const keeper = createListKeeper(host, {
      store: createMaplace(),
      misuse: createStandingMisuse(host, () => {}),
      show: () => {},
    });
    keeper.open();
    keeper.rebuildSoon();
    await Promise.resolve();
    expect(errors).toEqual([
      expect.objectContaining({ code: "invalid-input", field: "list", cause: failure }),
    ]);
    expect([factory.mock.calls.length, keeper.list]).toEqual([2, expect.anything()]);
    host.remove();
  });

  it("reports a list refused once, when the map opens again", () => {
    const host = elementWith({ list: "never-defined" });
    const errors = errorsOn(host);
    const keeper = createListKeeper(host, {
      store: createMaplace(),
      misuse: createStandingMisuse(host, () => {}),
      show: () => {},
    });
    keeper.open();
    keeper.stop();
    keeper.open();
    expect(errors).toHaveLength(1);
  });
});
