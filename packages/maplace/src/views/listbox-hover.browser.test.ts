import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { centreOf } from "../google/testing/page-input";
import { shadowRootOnPage } from "../testing/container";
import { placedListbox, titled } from "../testing/lists";
import { holdTouchAt } from "../testing/touch";

const locations = titled("a", "b");
const option = (name: string) => page.getByRole("option", { name });

/** A real tap; done once the element is clicked, which Chromium may do later than a frame. */
async function tap(element: Element): Promise<void> {
  const clicked = nextClick(element);
  const finger = await holdTouchAt(centreOf(element));
  await finger.lift();
  await clicked;
}

function nextClick(element: Element): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("the tap produced no click")), 1000);
    const clicked = () => {
      clearTimeout(timeout);
      resolve();
    };
    element.addEventListener("click", clicked, { once: true });
  });
}

describe("listbox hover in a browser: only the keyboard's focus hovers", () => {
  it("a mouse click hovers only while the pointer is over the option", async () => {
    const { calls } = placedListbox(locations);
    await userEvent.click(option("A"));
    await userEvent.unhover(option("A"));
    await expect.element(option("A")).toHaveFocus();
    expect(calls).toEqual(["hover:a", "choose:a", "unhover:a"]);
  });

  it("a tap focuses and chooses an option, and hovers nothing", async () => {
    const { calls } = placedListbox(locations);
    await tap(option("A").element());
    expect(calls).toEqual(["choose:a"]);
    await expect.element(option("A")).toHaveFocus();
  });

  it("arrowing hovers each option in turn, and tabbing out of the list clears it", async () => {
    const { calls } = placedListbox(locations);
    document.body.append(Object.assign(document.createElement("button"), { textContent: "Next" }));
    await userEvent.keyboard("{Tab}{ArrowDown}{ArrowDown}{Tab}");
    await expect.element(page.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(calls).toEqual(["hover:a", "hover:b", "unhover:b"]);
  });

  it("keeps the hover when the window loses focus, with the list in a shadow root", async () => {
    const { calls, view } = placedListbox(locations);
    const root = shadowRootOnPage();
    root.append(view.element);
    await userEvent.keyboard("{Tab}{ArrowDown}");
    // Headless Chromium can't blur its window: this is the focusout a window blur sends.
    const focused = root.activeElement;
    expect(focused?.textContent).toBe("A");
    focused?.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));
    expect(calls).toEqual(["hover:a"]);
  });
});
