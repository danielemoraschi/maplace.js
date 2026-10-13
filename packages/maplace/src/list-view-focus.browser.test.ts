import { describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import { listed } from "./testing/listed";
import { titled } from "./testing/lists";

const places = titled("a", "b", "c");

/** The browser's own `moveBefore` is gone until the test finishes: moves blur, as elsewhere. */
function withoutMoveBefore(): void {
  const own = Object.getOwnPropertyDescriptor(Element.prototype, "moveBefore");
  Object.defineProperty(Element.prototype, "moveBefore", { value: undefined, configurable: true });
  onTestFinished(() => {
    if (own) Object.defineProperty(Element.prototype, "moveBefore", own);
    else Reflect.deleteProperty(Element.prototype, "moveBefore");
  });
}

/** Tab into the list and arrow to B: keyboard focus and hover on B. */
async function keyboardOnB() {
  const ready = await listed({ locations: places });
  await userEvent.keyboard("{Tab}{ArrowDown}");
  const option = page.getByRole("option", { name: "B" }).element();
  expect(document.activeElement).toBe(option);
  expect(ready.maplace.getSnapshot().hoveredId).toBe("b");
  return { ...ready, option };
}

describe("list view in a browser: focus through a reorder", () => {
  it.each([
    ["with the browser's moveBefore", () => expect("moveBefore" in Element.prototype).toBe(true)],
    ["without moveBefore, where moving it would blur it", withoutMoveBefore],
  ])("keeps focus and hover on the same entry, %s", async (_, prepare) => {
    prepare();
    const { maplace, option } = await keyboardOnB();
    maplace.setLocations([...places].reverse());
    expect(document.activeElement).toBe(option);
    expect(maplace.getSnapshot().hoveredId).toBe("b");
  });
});
