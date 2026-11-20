// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fadeIn } from "./fade-in.ts";
import { startTabs, TAB_SELECTED } from "./tabs.ts";

vi.mock("./fade-in.ts");

const NAMES = ["html", "script", "react"];

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
    tab("script").click();
    expect(selected()).toEqual(["script"]);
    expect(shown()).toEqual(["script"]);
    expect(NAMES.map((name) => tab(name).tabIndex)).toEqual([-1, 0, -1]);
  });

  it("moves with the arrow keys, wrapping, and to the ends with Home and End", () => {
    tab("html").focus();
    press("ArrowLeft");
    expect([document.activeElement, selected()]).toEqual([tab("react"), ["react"]]);
    press("ArrowRight");
    expect(selected()).toEqual(["html"]);
    press("End");
    expect(shown()).toEqual(["react"]);
    press("Home");
    expect(shown()).toEqual(["html"]);
  });

  it("announces each selection, by click and by arrow key, from the chosen tab", () => {
    const announced: string[] = [];
    const list = document.querySelector('[role="tablist"]') as HTMLElement;
    list.addEventListener(TAB_SELECTED, (event) => announced.push((event.target as Element).id));
    tab("script").click();
    tab("script").focus();
    press("ArrowRight");
    expect(announced).toEqual(["script-tab", "react-tab"]);
  });

  it("reveals the panel it shows, fading it in", () => {
    tab("script").click();
    expect(vi.mocked(fadeIn).mock.calls).toEqual([[document.getElementById("script")]]);
  });
});
