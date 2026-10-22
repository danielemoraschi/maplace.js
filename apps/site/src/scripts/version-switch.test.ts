// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fadeIn } from "./fade-in.ts";
import { startVersionSwitches } from "./version-switch.ts";

vi.mock("./fade-in.ts");

const VERSIONS = ["html", "vanilla", "react"];
const PROVIDERS = ["google", "maplibre"];

function section(name: string): string {
  const radio = (group: string, value: string, checked: boolean) =>
    `<label><input type="radio" name="${name}-${group}" value="${value}"${checked ? " checked" : ""} /> ${value}</label>`;
  const radios = (group: string, values: readonly string[]) =>
    values.map((value, index) => radio(group, value, index === 0)).join("");
  const version = (kind: string, provider: string) => {
    const hidden = kind !== "html" || provider !== "google" ? " hidden" : "";
    return `<div data-live-version="${kind}" data-provider="${provider}" data-example="${name}"${hidden}></div>`;
  };
  const files = (provider: string) =>
    `<div data-provider-files="${provider}" data-example="${name}"${provider === "google" ? "" : " hidden"}></div>`;
  return `<section>
    <div data-version-switch="${name}">
      <fieldset>${radios("version", VERSIONS)}</fieldset>
      <fieldset>${radios("provider", PROVIDERS)}</fieldset>
    </div>
    <div class="map-frame"><p data-map-failure></p><p data-saved hidden></p>${PROVIDERS.flatMap((provider) => VERSIONS.map((kind) => version(kind, provider))).join("")}</div>
    <div role="tabpanel">${PROVIDERS.map(files).join("")}</div>
    <div role="tabpanel">${PROVIDERS.map(files).join("")}</div>
  </section>`;
}

const shown = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-live-version][data-example="${name}"]`)]
    .filter((version) => !version.hidden)
    .map(({ dataset }) => `${dataset.provider} ${dataset.liveVersion}`);

const filesShown = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-provider-files][data-example="${name}"]`)]
    .filter((files) => !files.hidden)
    .map(({ dataset }) => dataset.providerFiles);

const choose = (name: string, group: string, value: string) =>
  document.querySelector<HTMLInputElement>(`[name="${name}-${group}"][value="${value}"]`)?.click();

beforeEach(() => {
  vi.mocked(fadeIn).mockClear();
  document.body.innerHTML = section("simple") + section("big");
  startVersionSwitches(document);
});

describe("startVersionSwitches", () => {
  it("shows Google's HTML version at first", () => {
    expect([shown("simple"), shown("big")]).toEqual([["google html"], ["google html"]]);
  });

  it("shows the chosen version on the chosen provider, the other five hidden", () => {
    choose("simple", "version", "vanilla");
    expect(shown("simple")).toEqual(["google vanilla"]);
    choose("simple", "provider", "maplibre");
    expect(shown("simple")).toEqual(["maplibre vanilla"]);
  });

  it("keeps the version chosen when the provider changes", () => {
    choose("simple", "version", "react");
    choose("simple", "provider", "maplibre");
    choose("simple", "provider", "google");
    expect(shown("simple")).toEqual(["google react"]);
  });

  it("shows the chosen provider's files in every code panel", () => {
    choose("simple", "provider", "maplibre");
    expect(filesShown("simple")).toEqual(["maplibre", "maplibre"]);
  });

  it("leaves other sections alone", () => {
    choose("simple", "version", "react");
    choose("simple", "provider", "maplibre");
    expect(shown("big")).toEqual(["google html"]);
    expect(filesShown("big")).toEqual(["google", "google"]);
  });

  it("fades in what it reveals", () => {
    choose("simple", "provider", "maplibre");
    const page = document.querySelector(
      '[data-example="simple"][data-provider="maplibre"][data-live-version="html"]',
    );
    expect(vi.mocked(fadeIn).mock.calls).toEqual([[page]]);
  });

  it("writes the revealed version's note into the frame's", () => {
    const failed = document.querySelector<HTMLElement>(
      '[data-example="simple"][data-provider="maplibre"][data-live-version="html"]',
    );
    if (failed) failed.dataset.failureNote = "MapLibre's note";
    choose("simple", "provider", "maplibre");
    expect(document.querySelector("[data-map-failure]")?.textContent).toBe("MapLibre's note");
  });

  it("hides what the map shown before saved, the map now shown having saved nothing", () => {
    const saved = document.querySelector<HTMLElement>("[data-saved]") as HTMLElement;
    saved.hidden = false;
    choose("simple", "provider", "maplibre");
    expect(saved.hidden).toBe(true);
  });
});
