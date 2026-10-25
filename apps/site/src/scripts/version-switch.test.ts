// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "../examples/example-providers.ts";
import { fadeIn } from "./fade-in.ts";
import { keepProvider, PROVIDER_CHOICE_KEY } from "./provider-choice.ts";
import { startVersionSwitches } from "./version-switch.ts";

vi.mock("./fade-in.ts");

const VERSIONS = ["html", "script", "vanilla", "react"];
const PROVIDERS = ["maplibre", "google"];

/** The page's toggle, outside the sections, as the home page has it: MapLibre checked. */
const pageToggle = () =>
  `<fieldset data-provider-choice>${PROVIDERS.map(
    (provider, index) =>
      `<label><input type="radio" name="provider" value="${provider}"${index === 0 ? " checked" : ""} /> ${provider}</label>`,
  ).join("")}</fieldset>`;

/** A section as the site renders it, on `providers`: a Google-only one with its note's button. */
function section(name: string, providers: readonly string[] = PROVIDERS): string {
  const radios = VERSIONS.map(
    (value, index) =>
      `<label><input type="radio" name="${name}-version" value="${value}"${index === 0 ? " checked" : ""} /> ${value}</label>`,
  ).join("");
  const version = (kind: string, provider: string) => {
    const hidden = kind !== "html" || provider !== "maplibre" ? " hidden" : "";
    return `<div data-live-version="${kind}" data-provider="${provider}" data-example="${name}"${hidden}></div>`;
  };
  const files = (provider: string, index: number) =>
    `<div data-provider-files="${provider}"${index === 0 ? "" : " hidden"}></div>`;
  const button = providers.includes("maplibre")
    ? ""
    : `<div class="no-version-note"><button type="button" data-show-on="google">Show it on Google</button></div>`;
  // As the site's sections are: the version switch, the example's own input, then the frame.
  const tab = (id: string, index: number) =>
    `<button type="button" role="tab" id="${name}-${id}-tab" aria-controls="${name}-${id}" aria-selected="${index === 0}">${id}</button>`;
  return `<section id="${name}" data-version-switch="${name}">
    <div role="tablist">${["map", "html", "react"].map(tab).join("")}</div>
    <fieldset data-site-switch>${radios}</fieldset>
    <label><input type="checkbox" data-own-input /> North only</label>
    <div class="map-frame">${providers.flatMap((provider) => VERSIONS.map((kind) => version(kind, provider))).join("")}${button}</div>
    <div role="tabpanel">${providers.map(files).join("")}</div>
    <div role="tabpanel">${providers.map(files).join("")}</div>
  </section>`;
}

const shown = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-live-version][data-example="${name}"]`)]
    .filter((version) => !version.hidden)
    .map(({ dataset }) => `${dataset.provider} ${dataset.liveVersion}`);

const filesShown = (name: string) =>
  [...document.querySelectorAll<HTMLElement>(`#${name} [data-provider-files]`)]
    .filter((files) => !files.hidden)
    .map(({ dataset }) => dataset.providerFiles);

const chooseVersion = (name: string, value: string) =>
  document.querySelector<HTMLInputElement>(`[name="${name}-version"][value="${value}"]`)?.click();

const chooseProvider = (value: string) =>
  document.querySelector<HTMLInputElement>(`[name="provider"][value="${value}"]`)?.click();

const tabsDisabled = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>(`#${name} [role="tab"]`)].map(
    ({ disabled }) => disabled,
  );

const showOnGoogle = (name: string) =>
  document.querySelector<HTMLButtonElement>(`#${name} [data-show-on]`)?.click();

const storage = () => sessionStorage;

const noVersion = (name: string) =>
  document.querySelector(`#${name} .map-frame`)?.hasAttribute("data-no-version");

function startPage(kept?: Provider): void {
  document.body.innerHTML =
    pageToggle() + section("simple") + section("big") + section("route", ["google"]);
  if (kept) keepProvider(storage, kept);
  startVersionSwitches(document, storage);
}

beforeEach(() => {
  vi.mocked(fadeIn).mockClear();
  sessionStorage.clear();
  startPage();
});

describe("startVersionSwitches", () => {
  it("shows MapLibre's HTML version at first, and route no version", () => {
    expect([shown("simple"), shown("big"), shown("route")]).toEqual([
      ["maplibre html"],
      ["maplibre html"],
      [],
    ]);
  });

  it("shows every section on the provider the page's toggle chose, and keeps the choice", () => {
    chooseProvider("google");
    expect([shown("simple"), shown("big"), shown("route")]).toEqual([
      ["google html"],
      ["google html"],
      ["google html"],
    ]);
    expect(sessionStorage.getItem(PROVIDER_CHOICE_KEY)).toBe("google");
  });

  it("shows the chosen version on the page's provider, the others hidden", () => {
    chooseVersion("simple", "vanilla");
    expect(shown("simple")).toEqual(["maplibre vanilla"]);
    chooseProvider("google");
    expect(shown("simple")).toEqual(["google vanilla"]);
  });

  it("keeps each section's version when the page's provider changes", () => {
    chooseVersion("simple", "react");
    chooseProvider("google");
    chooseProvider("maplibre");
    expect([shown("simple"), shown("big")]).toEqual([["maplibre react"], ["maplibre html"]]);
  });

  it("shows the provider's files in every code panel", () => {
    chooseProvider("google");
    expect(filesShown("simple")).toEqual(["google", "google"]);
  });

  it("shows a Google-only section no version on MapLibre, its frame marked, with its Google files", () => {
    chooseVersion("route", "vanilla");
    expect(shown("route")).toEqual([]);
    expect(noVersion("route")).toBe(true);
    expect(filesShown("route")).toEqual(["google", "google"]);
  });

  it("grays a Google-only section's version radios and code tabs out on MapLibre, its Map tab left", () => {
    chooseProvider("google");
    chooseProvider("maplibre");
    const fieldset = document.querySelector<HTMLFieldSetElement>("#route [data-site-switch]");
    expect(fieldset?.disabled).toBe(true);
    expect(tabsDisabled("route")).toEqual([false, true, true]);
    expect(tabsDisabled("simple")).toEqual([false, false, false]);
  });

  it("brings a Google-only section's version radios and code tabs back on Google", () => {
    showOnGoogle("route");
    expect(document.querySelector<HTMLFieldSetElement>("#route [data-site-switch]")?.disabled).toBe(
      false,
    );
    expect(tabsDisabled("route")).toEqual([false, false, false]);
  });

  it("goes back to the Map tab when a code tab it shows is grayed out", () => {
    chooseProvider("google");
    const html = document.getElementById("route-html-tab") as HTMLButtonElement;
    html.setAttribute("aria-selected", "true");
    const clicked = vi.fn();
    document.getElementById("route-map-tab")?.addEventListener("click", clicked);
    chooseProvider("maplibre");
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("shows a Google-only section on Google from its button, the others left on MapLibre", () => {
    showOnGoogle("route");
    expect([shown("route"), shown("simple")]).toEqual([["google html"], ["maplibre html"]]);
    expect(noVersion("route")).toBe(false);
    expect(sessionStorage.getItem(PROVIDER_CHOICE_KEY)).toBeNull();
  });

  it("moves focus to the section's version switch, its button hidden with the note", () => {
    showOnGoogle("route");
    expect(document.activeElement).toBe(
      document.querySelector('[name="route-version"][value="html"]'),
    );
  });

  it("brings back the note when the page's toggle goes to Google and back to MapLibre", () => {
    showOnGoogle("route");
    chooseProvider("google");
    chooseProvider("maplibre");
    expect(shown("route")).toEqual([]);
    expect(noVersion("route")).toBe(true);
  });

  it("opens on a provider the visitor chose before it ran, and keeps it", () => {
    document.body.innerHTML = pageToggle() + section("simple");
    (document.querySelector('[value="google"]') as HTMLInputElement).checked = true;
    startVersionSwitches(document, storage);
    expect(shown("simple")).toEqual(["google html"]);
    expect(sessionStorage.getItem(PROVIDER_CHOICE_KEY)).toBe("google");
  });

  it("opens on the provider kept for the visit, with no fade", () => {
    startPage("google");
    expect([shown("simple"), shown("route")]).toEqual([["google html"], ["google html"]]);
    expect(filesShown("simple")).toEqual(["google", "google"]);
    expect(document.querySelector<HTMLInputElement>('[value="google"]')?.checked).toBe(true);
    expect(vi.mocked(fadeIn)).not.toHaveBeenCalled();
  });

  it("fades in what it reveals on screen, and changes the sections off screen at once", () => {
    const onScreen = document.querySelector("#simple") as HTMLElement;
    onScreen.getBoundingClientRect = () => DOMRect.fromRect({ y: 0, height: 400 });
    chooseProvider("google");
    const page = document.querySelector(
      '[data-example="simple"][data-provider="google"][data-live-version="html"]',
    );
    expect(vi.mocked(fadeIn).mock.calls).toEqual([[page]]);
  });

  it("leaves the shown map alone when the example's own input changes", () => {
    document.querySelector<HTMLInputElement>("#simple [data-own-input]")?.click();
    expect(shown("simple")).toEqual(["maplibre html"]);
  });
});
