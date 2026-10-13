// The provider types `cdp()`: a Playwright CDP session.
/// <reference types="@vitest/browser-playwright" />
import { describe, expect, it, onTestFinished } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { placedListbox, titled } from "../testing/lists";

const locations = titled("a", "b");
const option = (name: string) => page.getByRole("option", { name });

/** A real tap: touch input through the DevTools protocol; done once the element is clicked. */
async function tap(element: Element): Promise<void> {
  const session = cdp();
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  onTestFinished(async () => {
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  });
  const clicked = nextClick(element);
  const touchPoints = [centreOnScreen(element)];
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await clicked;
}

/** The element's centre in the top-level page: tests run in a frame, the protocol doesn't. */
function centreOnScreen(element: Element) {
  const box = element.getBoundingClientRect();
  const frame = window.frameElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: frame.left + box.left + box.width / 2, y: frame.top + box.top + box.height / 2 };
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

  it("keeps the hover when the window loses focus, with the list inside a shadow root", async () => {
    const { calls, view } = placedListbox(locations);
    const host = document.createElement("div");
    host.attachShadow({ mode: "open" }).append(view.element);
    document.body.replaceChildren(host);
    await userEvent.keyboard("{Tab}{ArrowDown}");
    // Headless Chromium can't blur its window: this is the focusout a window blur sends.
    const focused = host.shadowRoot?.activeElement;
    expect(focused?.textContent).toBe("A");
    focused?.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));
    expect(calls).toEqual(["hover:a"]);
  });
});
