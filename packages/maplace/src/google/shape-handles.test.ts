// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { takeEditingAway } from "./blur-cuts";
import type { GoogleShape } from "./placed-location";
import { shapeHandles } from "./shape-handles";
import type { StubMap } from "./testing/stub-libraries";
import { StubPolygon } from "./testing/stub-shapes";
import { stubMounted } from "./testing/stub-site";

/** The next task, when a move after a press has been handled. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

/** A stub shape's handles under a rule the test sets, as `showsEditHandles` reads it. */
function handlesOf(start: { canBeEdited: boolean; inFront: boolean }) {
  const opened = stubMounted();
  onTestFinished(opened.close);
  const rule = { ...start };
  const shape = new StubPolygon();
  const setValues = vi.spyOn(shape, "setValues");
  const handles = shapeHandles(
    shape as unknown as GoogleShape,
    (held) => rule.canBeEdited && (rule.inFront || held),
    opened.mounted,
  );
  onTestFinished(handles.stop);
  const map = opened.mounted.map as unknown as StubMap;
  const fire = (type: string) => window.dispatchEvent(new Event(type));
  const press = () => map.userInput();
  const letGoAndMove = () => {
    fire("pointerup");
    fire("pointermove");
  };
  return { rule, shape, handles, setValues, press, fire, letGoAndMove };
}

describe("a Google shape's handles", () => {
  it("are on while the rule says so, set only when that changes", () => {
    const { rule, shape, handles, setValues } = handlesOf({ canBeEdited: true, inFront: false });
    expect(setValues).not.toHaveBeenCalled();
    rule.inFront = true;
    handles.sync();
    handles.sync();
    expect(shape.get("editable")).toBe(true);
    expect(setValues).toHaveBeenCalledTimes(1);
    rule.canBeEdited = false;
    handles.sync();
    expect(shape.get("editable")).toBe(false);
  });

  it("stay through a press that found them on, until the pointer moves after it ends", async () => {
    const { rule, shape, handles, press, fire } = handlesOf({ canBeEdited: true, inFront: true });
    press();
    rule.inFront = false;
    handles.sync();
    fire("pointerup");
    handles.sync();
    expect(shape.get("editable"), "Google still has the release to hear").toBe(true);
    fire("pointermove");
    await nextTask();
    expect(shape.get("editable")).toBe(false);
  });

  it("stay through a press the window lost, until the pointer is back", async () => {
    const { rule, shape, handles, press, fire } = handlesOf({ canBeEdited: true, inFront: true });
    press();
    rule.inFront = false;
    fire("blur");
    handles.sync();
    expect(shape.get("editable")).toBe(true);
    fire("pointermove");
    await nextTask();
    expect(shape.get("editable")).toBe(false);
  });

  it("never come on for a press on a shape at rest, whatever syncs meanwhile", () => {
    const { handles, setValues, press, letGoAndMove } = handlesOf({
      canBeEdited: true,
      inFront: false,
    });
    press();
    handles.sync();
    letGoAndMove();
    expect(setValues).not.toHaveBeenCalled();
  });

  it("go during a press once the shape can't be edited", () => {
    const { rule, shape, handles, press } = handlesOf({ canBeEdited: true, inFront: true });
    press();
    rule.canBeEdited = false;
    handles.sync();
    expect(shape.get("editable")).toBe(false);
  });

  it("leave a blur's cut as it is until its give-back", () => {
    const { shape, handles } = handlesOf({ canBeEdited: true, inFront: true });
    const giveBack = takeEditingAway((on) => shape.setValues({ editable: on }), handles.shown);
    handles.sync();
    expect(shape.get("editable")).toBe(false);
    giveBack?.();
    expect(shape.get("editable")).toBe(true);
  });

  it("hear no press once stopped", () => {
    const { rule, shape, handles, press, letGoAndMove } = handlesOf({
      canBeEdited: true,
      inFront: true,
    });
    handles.stop();
    press();
    rule.inFront = false;
    handles.sync();
    letGoAndMove();
    expect(shape.get("editable")).toBe(false);
  });
});
