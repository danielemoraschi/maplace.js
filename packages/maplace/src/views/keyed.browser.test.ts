import { describe, expect, it } from "vitest";
import { shadowRootOnPage } from "../testing/container";
import { focusableList } from "../testing/lists";
import { reconcile } from "./keyed";

describe("reconcile in a browser", () => {
  it("moves an element on the page into a container not on the page yet", () => {
    const from = document.body.appendChild(document.createElement("div"));
    const moved = from.appendChild(document.createElement("div"));
    const fresh = document.createElement("div");
    expect(() => reconcile(fresh, [moved])).not.toThrow();
    expect(moved.parentElement).toBe(fresh);
  });

  it("never moves the child holding focus, inside a shadow root too", () => {
    const { container, options } = focusableList(3, shadowRootOnPage());
    const [a, b, c] = options as [HTMLDivElement, HTMLDivElement, HTMLDivElement];
    c.focus();
    const moves = new MutationObserver(() => {});
    moves.observe(container, { childList: true });
    reconcile(container, [c, b, a]);
    const moved = moves.takeRecords().flatMap((record) => Array.from(record.removedNodes));
    expect(moved).not.toContain(c);
    expect(Array.from(container.children)).toEqual([c, b, a]);
  });
});
