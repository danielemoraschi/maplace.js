// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { cutOnBlur, takeEditingAway } from "./blur-cuts";
import { frames } from "./frames";
import type { StubMap } from "./testing/stub-libraries";
import { stubMounted } from "./testing/stub-site";

/** An open stub map, closed after the test so its listeners leave the shared window. */
function openMap() {
  const opened = stubMounted();
  onTestFinished(opened.close);
  const press = () => (opened.mounted.map as unknown as StubMap).userInput();
  return { ...opened, press };
}

const onWindow = (type: string) => window.dispatchEvent(new Event(type));

/** A cut that has a drag to cut, recording its runs and its give-backs. */
function recordingCut() {
  const giveBack = vi.fn();
  const cut = vi.fn(() => giveBack);
  return { cut, giveBack };
}

describe("cutOnBlur", () => {
  it("runs each cut when the window loses focus with a press on the map held", () => {
    const { mounted, press } = openMap();
    const [a, b] = [recordingCut(), recordingCut()];
    cutOnBlur(mounted, a.cut);
    cutOnBlur(mounted, b.cut);
    press();
    onWindow("blur");
    expect([a.cut.mock.calls.length, b.cut.mock.calls.length]).toEqual([1, 1]);
  });

  it("runs none on a blur with no press held: none made, let go, or cancelled by the browser", () => {
    const { mounted, press } = openMap();
    const { cut } = recordingCut();
    cutOnBlur(mounted, cut);
    onWindow("blur");
    press();
    onWindow("pointerup");
    onWindow("blur");
    press();
    onWindow("pointercancel");
    onWindow("blur");
    expect(cut).not.toHaveBeenCalled();
  });

  it("runs none on a blur with a press held elsewhere on the page, another map's included", () => {
    const { mounted } = openMap();
    const other = openMap();
    // On the page, so its press passes through the document and the window on the way.
    const otherElement = other.mounted.map.getDiv();
    document.body.append(otherElement);
    onTestFinished(() => otherElement.remove());
    const { cut } = recordingCut();
    cutOnBlur(mounted, cut);
    onWindow("pointerdown");
    other.press();
    onWindow("blur");
    expect(cut).not.toHaveBeenCalled();
  });

  it("runs none on a blur with another button than the main one held", () => {
    const { mounted } = openMap();
    const { cut } = recordingCut();
    cutOnBlur(mounted, cut);
    mounted.map.getDiv().dispatchEvent(new PointerEvent("pointerdown", { button: 2 }));
    onWindow("blur");
    expect(cut).not.toHaveBeenCalled();
  });

  it("runs a held press's cuts once, on its first blur", () => {
    const { mounted, press } = openMap();
    const { cut } = recordingCut();
    cutOnBlur(mounted, cut);
    press();
    onWindow("blur");
    onWindow("blur");
    expect(cut).toHaveBeenCalledTimes(1);
  });

  it("gives editing back a frame after the press is let go, never before", async () => {
    const { mounted, press } = openMap();
    const { cut, giveBack } = recordingCut();
    cutOnBlur(mounted, cut);
    press();
    onWindow("blur");
    await frames(1);
    expect(giveBack).not.toHaveBeenCalled();
    onWindow("pointerup");
    expect(giveBack).not.toHaveBeenCalled();
    await frames(1);
    expect(giveBack).toHaveBeenCalledTimes(1);
  });

  it("gives editing back a frame after the browser cancels the press", async () => {
    const { mounted, press } = openMap();
    const { cut, giveBack } = recordingCut();
    cutOnBlur(mounted, cut);
    press();
    onWindow("blur");
    onWindow("pointercancel");
    await frames(1);
    expect(giveBack).toHaveBeenCalledTimes(1);
  });

  it("gives editing back at the next press when the window never heard the release", async () => {
    const { mounted, press } = openMap();
    const { cut, giveBack } = recordingCut();
    cutOnBlur(mounted, cut);
    press();
    onWindow("blur");
    onWindow("pointerdown");
    await frames(1);
    expect(giveBack).toHaveBeenCalledTimes(1);
  });

  it("runs no cut after one whose report closes the map", () => {
    const { mounted, press, close } = openMap();
    const later = recordingCut();
    cutOnBlur(mounted, () => {
      close();
      return undefined;
    });
    cutOnBlur(mounted, later.cut);
    press();
    onWindow("blur");
    expect(later.cut).not.toHaveBeenCalled();
  });

  it("runs no cut whose location a cut's report took off", () => {
    const { mounted, press } = openMap();
    const later = recordingCut();
    let stopLater = () => {};
    cutOnBlur(mounted, () => {
      stopLater();
      return undefined;
    });
    stopLater = cutOnBlur(mounted, later.cut);
    press();
    onWindow("blur");
    expect(later.cut).not.toHaveBeenCalled();
  });

  it("runs no cut a cut's report adds, on that blur", () => {
    const { mounted, press } = openMap();
    const added = recordingCut();
    cutOnBlur(mounted, () => {
      cutOnBlur(mounted, added.cut);
      return undefined;
    });
    press();
    onWindow("blur");
    expect(added.cut).not.toHaveBeenCalled();
  });

  it("runs a cut no more once stopped", () => {
    const { mounted, press } = openMap();
    const { cut } = recordingCut();
    const stop = cutOnBlur(mounted, cut);
    stop();
    press();
    onWindow("blur");
    expect(cut).not.toHaveBeenCalled();
  });

  it("listens no more once the map closes, and gives back nothing pending", async () => {
    const { mounted, press, close } = openMap();
    const { cut, giveBack } = recordingCut();
    cutOnBlur(mounted, cut);
    press();
    onWindow("blur");
    onWindow("pointerup");
    close();
    await frames(1);
    press();
    onWindow("blur");
    expect(giveBack).not.toHaveBeenCalled();
    expect(cut).toHaveBeenCalledTimes(1);
  });
});

describe("takeEditingAway", () => {
  it("takes nothing from a location that isn't editable, and has nothing to give back", () => {
    const setEditing = vi.fn();
    expect(takeEditingAway(setEditing, () => false)).toBeUndefined();
    expect(setEditing).not.toHaveBeenCalled();
  });

  it("gives back what the location's `editable` is by then", () => {
    const setEditing = vi.fn();
    let editable = true;
    const giveBack = takeEditingAway(setEditing, () => editable);
    editable = false;
    giveBack?.();
    expect(setEditing.mock.calls).toEqual([[false], [false]]);
  });
});
