// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { reconcile } from "./keyed";

function elements(...names: string[]): HTMLElement[] {
  return names.map((name) => {
    const element = document.createElement("div");
    element.id = name;
    return element;
  });
}

const idsIn = (container: Element) => Array.from(container.children, (child) => child.id);

describe("reconcile", () => {
  it("puts exactly the given elements in order, keeping the same objects", () => {
    const container = document.createElement("div");
    const [a, b, c] = elements("a", "b", "c") as [HTMLElement, HTMLElement, HTMLElement];
    reconcile(container, [a, b, c]);
    reconcile(container, [c, a]);
    expect(idsIn(container)).toEqual(["c", "a"]);
    expect(container.firstElementChild).toBe(c);
    expect(b.isConnected).toBe(false);
  });

  it("never moves the element holding focus, so a reorder can't blur it", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const [a, b, c] = elements("a", "b", "c") as [HTMLElement, HTMLElement, HTMLElement];
    reconcile(container, [a, b, c]);
    c.tabIndex = -1;
    c.focus();
    reconcile(container, [c, b, a]);
    expect(idsIn(container)).toEqual(["c", "b", "a"]);
    expect(document.activeElement).toBe(c);
  });

  it("moves an element from another container", () => {
    const from = document.createElement("div");
    const to = document.createElement("div");
    const [a] = elements("a") as [HTMLElement];
    from.append(a);
    reconcile(to, [a]);
    expect(idsIn(from)).toEqual([]);
    expect(idsIn(to)).toEqual(["a"]);
  });
});
