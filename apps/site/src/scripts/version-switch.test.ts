// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { startVersionSwitches } from "./version-switch.ts";

function section(name: string): string {
  const radio = (value: string, checked = false) =>
    `<label><input type="radio" name="${name}-version" value="${value}"${checked ? " checked" : ""} /> ${value}</label>`;
  const version = (kind: string, hidden: boolean) =>
    `<div data-live-version="${kind}" data-example="${name}"${hidden ? " hidden" : ""}></div>`;
  return `<section>
    <fieldset data-version-switch="${name}">${radio("html", true)}${radio("vanilla")}${radio("react")}</fieldset>
    <div class="map-frame">${version("html", false)}${version("vanilla", true)}${version("react", true)}</div>
  </section>`;
}

const shown = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-example="${name}"]`)]
    .filter((version) => !version.hidden)
    .map((version) => version.dataset.liveVersion);

const choose = (name: string, value: string) =>
  document.querySelector<HTMLInputElement>(`[name="${name}-version"][value="${value}"]`)?.click();

beforeEach(() => {
  document.body.innerHTML = section("route") + section("big");
  startVersionSwitches(document);
});

describe("startVersionSwitches", () => {
  it("shows the HTML version at first", () => {
    expect([shown("route"), shown("big")]).toEqual([["html"], ["html"]]);
  });

  it("shows the chosen version in its own frame, the other two hidden", () => {
    choose("route", "vanilla");
    expect(shown("route")).toEqual(["vanilla"]);
    choose("route", "react");
    expect(shown("route")).toEqual(["react"]);
  });

  it("leaves other sections alone", () => {
    choose("route", "react");
    expect(shown("big")).toEqual(["html"]);
  });
});
