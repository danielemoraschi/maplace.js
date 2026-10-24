import { afterEach, describe, expect, it } from "vitest";
import type { ViewportPoint } from "../../testing/mouse-commands";
import { holdMouseAt } from "./held-mouse";
import { holdTouchAt } from "./held-touch";
import { centreOf } from "./page-input";

afterEach(() => document.body.replaceChildren());

const STEP: ViewportPoint = { x: 20, y: 10 };

/** A plain element on the page, recording the input types it hears, in order. */
function recordingElement(...types: readonly string[]) {
  const element = document.createElement("div");
  element.style.cssText = "width: 200px; height: 200px; touch-action: none";
  document.body.append(element);
  const heard: string[] = [];
  for (const type of types) {
    element.addEventListener(type, (event) => {
      const buttons = event instanceof PointerEvent && type === "pointermove" ? event.buttons : "";
      heard.push(`${type}${buttons}`);
    });
  }
  return { element, heard, centre: centreOf(element) };
}

function movedBy({ x, y }: ViewportPoint): ViewportPoint {
  return { x: x + STEP.x, y: y + STEP.y };
}

describe("held mouse", () => {
  it("holds the button from the press to the release, its moves made with it down", async () => {
    const { heard, centre } = recordingElement("pointerdown", "pointermove", "pointerup");
    const held = await holdMouseAt(centre);
    await held.moveTo(movedBy(centre));
    // The pointer comes to the press's point first, the button up.
    const pressed = heard.slice(heard.indexOf("pointerdown"));
    expect(pressed[0]).toBe("pointerdown");
    expect(pressed.length).toBeGreaterThan(1);
    expect(pressed.slice(1).every((type) => type === "pointermove1")).toBe(true);
    expect(heard).not.toContain("pointerup");
    await held.release();
    expect(heard.at(-1)).toBe("pointerup");
  });

  it("lets go once however often it is released", async () => {
    const { heard, centre } = recordingElement("pointerup");
    const held = await holdMouseAt(centre);
    await held.release();
    await held.release();
    expect(heard).toEqual(["pointerup"]);
  });
});

describe("held touch", () => {
  it("touches down, moves and cancels a finger as the browser would", async () => {
    const { heard, centre } = recordingElement("touchstart", "touchmove", "touchcancel");
    const held = await holdTouchAt(centre);
    await held.moveTo(movedBy(centre));
    await held.cancel();
    await held.cancel();
    await expect.poll(() => heard).toEqual(["touchstart", "touchmove", "touchcancel"]);
  });
});
