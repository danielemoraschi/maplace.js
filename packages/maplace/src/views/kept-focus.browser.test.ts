import { describe, expect, it, vi } from "vitest";
import { shadowRootOnPage } from "../testing/container";
import { focusableList } from "../testing/lists";
import { heldFocus, keepFocus } from "./kept-focus";
import { createRoving } from "./roving";

function listInShadowRoot() {
  const root = shadowRootOnPage();
  const { container, options } = focusableList(3, root);
  const [first, second, third] = options as [HTMLDivElement, HTMLDivElement, HTMLDivElement];
  return { root, container, options, first, second, third };
}

describe("keepFocus inside a shadow root", () => {
  it("moves focus to the neighbour when the focused option goes", () => {
    const { root, container, options, first, second, third } = listInShadowRoot();
    third.focus();
    const held = heldFocus(container, options);
    third.remove();
    keepFocus(createRoving(), { held, order: [first, second] });
    expect(root.activeElement).toBe(second);
  });

  it("refocuses an option that moved to another container", () => {
    const { root, container, options, second } = listInShadowRoot();
    const otherGroup = root.appendChild(document.createElement("div"));
    second.focus();
    const held = heldFocus(container, options);
    otherGroup.append(second);
    keepFocus(createRoving(), { held, order: options });
    expect(root.activeElement).toBe(second);
  });

  it("never takes focus the list didn't hold", () => {
    const { root, container, options } = listInShadowRoot();
    const outside = root.appendChild(document.createElement("input"));
    outside.focus();
    keepFocus(createRoving(), { held: heldFocus(container, options), order: options });
    expect(root.activeElement).toBe(outside);
  });

  it("leaves an option that kept focus alone", () => {
    const { container, options, second } = listInShadowRoot();
    const roving = createRoving();
    const refocus = vi.spyOn(roving, "refocus");
    second.focus();
    keepFocus(roving, { held: heldFocus(container, options), order: options });
    expect(refocus).not.toHaveBeenCalled();
  });
});
