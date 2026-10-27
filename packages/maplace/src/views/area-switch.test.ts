// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createAreaSwitch } from "./area-switch";
import type { AreaMode } from "./viewport-scope";

const LABELS = { name: "Shops", showAll: "All", areaOnly: "This area", emptyArea: "Nothing here" };

/** An area switch and its status on the page. */
function areaSwitch() {
  const parts = createAreaSwitch(LABELS);
  document.body.append(parts.group, parts.status);
  const [all, area] = Array.from(parts.group.querySelectorAll("button"));
  if (all === undefined || area === undefined) throw new Error("no buttons");
  const pressed = () => [all, area].map((button) => button.getAttribute("aria-pressed"));
  return { ...parts, all, area, pressed };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createAreaSwitch", () => {
  it("is a group named by the list's name, of two buttons labelled as given, 'All' pressed", () => {
    const { group, all, area, pressed } = areaSwitch();
    expect([group.className, group.getAttribute("role"), group.getAttribute("aria-label")]).toEqual(
      ["maplace-area-switch", "group", "Shops"],
    );
    expect(
      [all, area].map((button) => [button.type, button.className, button.textContent]),
    ).toEqual([
      ["button", "maplace-show-all", "All"],
      ["button", "maplace-area-only", "This area"],
    ]);
    expect(pressed()).toEqual(["true", "false"]);
  });

  it("presses the button chosen, and tells its mode, until stopped", () => {
    const { onChoose, all, area, pressed } = areaSwitch();
    const chosen: AreaMode[] = [];
    const stop = onChoose((mode) => chosen.push(mode));
    area.click();
    expect(pressed()).toEqual(["false", "true"]);
    all.click();
    expect(pressed()).toEqual(["true", "false"]);
    stop();
    area.click();
    expect(chosen).toEqual(["area", "all"]);
  });

  it("keeps an empty live status on the page, saying the empty-area label only over an empty area", () => {
    const { showEmptyArea, status } = areaSwitch();
    expect([status.className, status.getAttribute("role"), status.hidden]).toEqual([
      "maplace-empty-area",
      "status",
      false,
    ]);
    expect(status.textContent).toBe("");
    showEmptyArea(true);
    expect(status.textContent).toBe("Nothing here");
    showEmptyArea(false);
    expect(status.textContent).toBe("");
  });

  it("writes the status only when it changes, so it is announced once", () => {
    const { showEmptyArea, status } = areaSwitch();
    showEmptyArea(true);
    const said = status.firstChild;
    showEmptyArea(true);
    expect(status.firstChild).toBe(said);
  });
});
