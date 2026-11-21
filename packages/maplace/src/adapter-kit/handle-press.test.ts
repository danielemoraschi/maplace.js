// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { handlePress } from "./handle-press";

/** The next frame, when a finger's press ends. */
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
/** The next task, when a move or press after a mouse's press has been handled. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));
const fire = (type: string) => window.dispatchEvent(new Event(type));
const mouse = (button = 0) => new PointerEvent("pointerdown", { button, pointerType: "mouse" });
const finger = () => new PointerEvent("pointerdown", { button: 0, pointerType: "touch" });

describe("a press on a shape's handles", () => {
  it.each(["pointerup", "pointercancel", "blur"])(
    "is held until the pointer's first move after a %s has been handled",
    async (end) => {
      const over = vi.fn();
      const press = handlePress(document.body, over);
      press.start(mouse());
      fire("pointermove");
      expect(press.isHeld()).toBe(true);
      fire(end);
      expect(press.isHeld()).toBe(true);
      fire("pointermove");
      expect(press.isHeld(), "the provider has yet to handle the move").toBe(true);
      await nextTask();
      expect(press.isHeld()).toBe(false);
      fire("pointermove");
      await nextTask();
      expect(over).toHaveBeenCalledTimes(1);
    },
  );

  it("ends at the next press elsewhere after its release, where the pointer didn't move", async () => {
    const over = vi.fn();
    const press = handlePress(document.body, over);
    press.start(mouse());
    fire("pointerup");
    fire("pointerdown");
    await nextTask();
    expect(press.isHeld()).toBe(false);
    expect(over).toHaveBeenCalledTimes(1);
  });

  it("ends a finger's press a frame after it lets go: a finger sends no move between taps", async () => {
    const over = vi.fn();
    const press = handlePress(document.body, over);
    press.start(finger());
    fire("pointerup");
    expect(press.isHeld()).toBe(true);
    await nextFrame();
    expect(press.isHeld()).toBe(false);
    expect(over).toHaveBeenCalledTimes(1);
  });

  it("holds no press of another button", () => {
    const press = handlePress(document.body, vi.fn());
    press.start(mouse(2));
    expect(press.isHeld()).toBe(false);
  });

  it("lets go unheard once stopped", async () => {
    const over = vi.fn();
    const press = handlePress(document.body, over);
    press.start(finger());
    fire("pointerup");
    press.stop();
    await nextFrame();
    expect(press.isHeld()).toBe(false);
    expect(over).not.toHaveBeenCalled();
  });

  it("hands a second press on the page straight to the new hold, never letting go between", async () => {
    const element = document.createElement("div");
    document.body.append(element);
    const over = vi.fn();
    const press = handlePress(element, over);
    element.addEventListener("pointerdown", (event) => press.start(event as PointerEvent));
    element.dispatchEvent(mouse());
    fire("pointerup");
    element.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
    await nextTask();
    expect(press.isHeld()).toBe(true);
    expect(over).not.toHaveBeenCalled();
    element.remove();
  });

  it("starts afresh on a second press, the first one's end not counted", () => {
    const over = vi.fn();
    const press = handlePress(document.body, over);
    press.start(mouse());
    fire("pointerup");
    press.start(mouse());
    fire("pointermove");
    expect(press.isHeld()).toBe(true);
    expect(over).not.toHaveBeenCalled();
  });
});
