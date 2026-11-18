// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "../examples/example-providers.ts";
import { fadeIn } from "./fade-in.ts";
import { keepProvider, PROVIDER_CHOICE_KEY } from "./provider-choice.ts";
import { startProviderToggle } from "./version-switch.ts";

vi.mock("./fade-in.ts");

const VERSIONS = ["html", "script", "vanilla", "react"];
const PROVIDERS = ["maplibre", "google"];

/** The page's toggle, outside the sections, as the home page has it: MapLibre checked. */
const pageToggle = () =>
  `<fieldset data-provider-choice>${PROVIDERS.map(
    (provider, index) =>
      `<label><input type="radio" name="provider" value="${provider}"${index === 0 ? " checked" : ""} /> ${provider}</label>`,
  ).join("")}</fieldset>`;

/** A section as the site renders it, on both providers. */
function section(name: string): string {
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
  // As the site's sections are: the version switch, the example's own input, then the frame.
  const tab = (id: string, index: number) =>
    `<button type="button" role="tab" id="${name}-${id}-tab" aria-controls="${name}-${id}" aria-selected="${index === 0}">${id}</button>`;
  return `<section id="${name}" data-version-switch="${name}">
    <div role="tablist">${["map", "html", "react"].map(tab).join("")}</div>
    <fieldset data-site-switch>${radios}</fieldset>
    <label><input type="checkbox" data-own-input /> North only</label>
    <div class="map-frame">${PROVIDERS.flatMap((provider) => VERSIONS.map((kind) => version(kind, provider))).join("")}</div>
    <div role="tabpanel">${PROVIDERS.map(files).join("")}</div>
    <div role="tabpanel">${PROVIDERS.map(files).join("")}</div>
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

const storage = () => sessionStorage;

/** What adds a root's sections to those the page's toggle switches. */
let followToggle: (root: ParentNode) => void;

/** Starts the page's toggle, then its sections. */
function startSwitches(): void {
  followToggle = startProviderToggle(document, storage);
  followToggle(document);
}

function startPage(kept?: Provider): void {
  document.body.innerHTML = pageToggle() + section("simple") + section("big") + section("route");
  if (kept) keepProvider(storage, kept);
  startSwitches();
}

/** A group's panel added after start, holding `name`'s section, as `group-switch.ts` adds one. */
function addPanel(name: string): HTMLElement {
  const panel = document.createElement("div");
  panel.innerHTML = section(name);
  document.body.append(panel);
  return panel;
}

beforeEach(() => {
  vi.mocked(fadeIn).mockClear();
  sessionStorage.clear();
  startPage();
});

describe("startProviderToggle", () => {
  it("shows MapLibre's HTML version at first", () => {
    expect([shown("simple"), shown("big"), shown("route")]).toEqual([
      ["maplibre html"],
      ["maplibre html"],
      ["maplibre html"],
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

  it("opens on a provider the visitor chose before it ran, and keeps it", () => {
    document.body.innerHTML = pageToggle() + section("simple");
    (document.querySelector('[value="google"]') as HTMLInputElement).checked = true;
    startSwitches();
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

  it("switches sections followed later with the toggle, as those it started with", () => {
    followToggle(addPanel("menu"));
    chooseProvider("google");
    expect([shown("simple"), shown("menu")]).toEqual([["google html"], ["google html"]]);
    chooseVersion("menu", "react");
    expect(shown("menu")).toEqual(["google react"]);
  });

  it("shows a section followed later at once on the provider chosen before it came", () => {
    chooseProvider("google");
    followToggle(addPanel("menu"));
    expect(shown("menu")).toEqual(["google html"]);
    expect(filesShown("menu")).toEqual(["google", "google"]);
  });

  it("listens to the toggle once, whatever the number of roots it follows", () => {
    const kept: string[] = [];
    const counting = () =>
      ({
        getItem: () => null,
        setItem: (_key: string, value: string) => kept.push(value),
      }) as unknown as Storage;
    document.body.innerHTML = pageToggle() + section("simple");
    const follow = startProviderToggle(document, counting);
    follow(document);
    follow(addPanel("menu"));
    follow(addPanel("tabs"));
    chooseProvider("google");
    expect(kept).toEqual(["google"]);
  });
});
