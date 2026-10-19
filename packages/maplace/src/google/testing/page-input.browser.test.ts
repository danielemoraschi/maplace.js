import { afterEach, describe, expect, it } from "vitest";
import { tabTo, tabUntil } from "./page-input";

afterEach(() => document.body.replaceChildren());

/** A button on the page, which Tab reaches. */
function button(label: string): HTMLButtonElement {
  const made = Object.assign(document.createElement("button"), { textContent: label });
  document.body.append(made);
  return made;
}

describe("tabUntil", () => {
  it("tabs until the focus is where it was asked to be", async () => {
    button("First");
    button("Second");
    const third = button("Third");
    await tabUntil(() => document.activeElement === third);
    expect(document.activeElement).toBe(third);
  });

  it("fails, saying where the focus is, when Tab never reaches what was asked", async () => {
    button("Only");
    await expect(tabUntil(() => false)).rejects.toThrow(
      /Tab never reached it in 50 presses: the focus is on </,
    );
  });
});

describe("tabTo", () => {
  it("fails when Tab never reaches the element, which can't take the focus", async () => {
    const unreachable = button("Unreachable");
    unreachable.tabIndex = -1;
    await expect(tabTo(unreachable)).rejects.toThrow(/Tab never reached/);
  });
});
