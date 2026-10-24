// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fadeIn } from "./fade-in.ts";
import { startTabs } from "./tabs.ts";

vi.mock("./fade-in.ts");

const NAMES = ["map", "html", "vanilla"];

function tabsPage() {
  document.body.innerHTML = `<div role="tablist">${NAMES.map(
    (name, index) =>
      `<button role="tab" id="${name}-tab" aria-controls="${name}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${name}</button>`,
  ).join("")}</div>${NAMES.map(
    (name, index) => `<div role="tabpanel" id="${name}"${index === 0 ? "" : " hidden"}></div>`,
  ).join("")}`;
  startTabs(document);
}

const tab = (name: string) => document.getElementById(`${name}-tab`) as HTMLButtonElement;
const shown = () => NAMES.filter((name) => !(document.getElementById(name) as HTMLElement).hidden);
const selected = () => NAMES.filter((name) => tab(name).getAttribute("aria-selected") === "true");
const press = (key: string) =>
  document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

describe("startTabs", () => {
  beforeEach(() => {
    vi.mocked(fadeIn).mockClear();
    tabsPage();
  });

  it("shows a tab's panel when clicked, hides the others, and moves the Tab stop to it", () => {
    tab("html").click();
    expect(selected()).toEqual(["html"]);
    expect(shown()).toEqual(["html"]);
    expect(NAMES.map((name) => tab(name).tabIndex)).toEqual([-1, 0, -1]);
  });

  it("moves with the arrow keys, wrapping, and to the ends with Home and End", () => {
    tab("map").focus();
    press("ArrowLeft");
    expect([document.activeElement, selected()]).toEqual([tab("vanilla"), ["vanilla"]]);
    press("ArrowRight");
    expect(selected()).toEqual(["map"]);
    press("End");
    expect(shown()).toEqual(["vanilla"]);
    press("Home");
    expect(shown()).toEqual(["map"]);
  });

  it("skips a disabled tab with the arrow keys", () => {
    tab("html").disabled = true;
    tab("map").focus();
    press("ArrowRight");
    expect(selected()).toEqual(["vanilla"]);
    press("ArrowLeft");
    expect(selected()).toEqual(["map"]);
  });

  it("reveals the panel it shows, fading it in", () => {
    tab("html").click();
    expect(vi.mocked(fadeIn).mock.calls).toEqual([[document.getElementById("html")]]);
  });
});
