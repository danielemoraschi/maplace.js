// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "../examples/example-providers.ts";
import { fadeIn } from "./fade-in.ts";
import { keepProvider, PROVIDER_CHOICE_KEY } from "./provider-choice.ts";
import { startTabs } from "./tabs.ts";
import { chosenProvider, startProviderToggle } from "./version-switch.ts";

vi.mock("./fade-in.ts");

const VERSIONS = ["html", "script", "vanilla", "react"];
const PROVIDERS = ["maplibre", "google"];

/** A provider toggle with its radios named `name`, MapLibre checked. */
const toggle = (name: string) =>
  `<fieldset data-provider-choice>${PROVIDERS.map(
    (provider, index) =>
      `<label><input type="radio" name="${name}" value="${provider}"${index === 0 ? " checked" : ""} /> ${provider}</label>`,
  ).join("")}</fieldset>`;

/** A section as the site renders it, on both providers: its version tabs and its own toggle. */
function section(name: string): string {
  const tab = (kind: string, index: number) =>
    `<button type="button" role="tab" id="${name}-${kind}-tab" aria-controls="${name}-${kind}" aria-selected="${index === 0}" data-version="${kind}">${kind}</button>`;
  const version = (kind: string, provider: string) => {
    const hidden = kind !== "html" || provider !== "maplibre" ? " hidden" : "";
    return `<div data-live-version="${kind}" data-provider="${provider}" data-example="${name}"${hidden}></div>`;
  };
  const files = (provider: string, index: number) =>
    `<div data-provider-files="${provider}"${index === 0 ? "" : " hidden"}></div>`;
  const panel = (kind: string, index: number) =>
    `<div role="tabpanel" id="${name}-${kind}"${index === 0 ? "" : " hidden"}>${PROVIDERS.map(files).join("")}</div>`;
  // As the site's sections are: the tabs and the toggle, the example's own input, the frame, the code.
  return `<section id="${name}" data-version-switch="${name}">
    <div><div role="tablist">${VERSIONS.map(tab).join("")}</div>${toggle(`${name}-provider`)}</div>
    <label><input type="checkbox" data-own-input /> North only</label>
    <div class="map-frame">${PROVIDERS.flatMap((provider) => VERSIONS.map((kind) => version(kind, provider))).join("")}</div>
    ${VERSIONS.map(panel).join("")}
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

const chooseVersion = (name: string, kind: string) =>
  document.getElementById(`${name}-${kind}-tab`)?.click();

/** Clicks `value` on the first toggle under `within`: the page's first section's, by default. */
const chooseProvider = (value: string, within: ParentNode = document) =>
  within.querySelector<HTMLInputElement>(`[data-provider-choice] [value="${value}"]`)?.click();

/** The provider each toggle on the page has checked, in page order. */
const togglesChecked = () =>
  [...document.querySelectorAll("[data-provider-choice]")].map((toggle) => chosenProvider(toggle));

const storage = () => sessionStorage;

/** What the toggles tell of each section they show (W83: its code written in then). */
const told = vi.fn<(section: HTMLElement) => void>();

/** What adds a root's sections to those the page's toggles switch. */
let followToggle: (root: ParentNode) => void;

/** Starts the page's tabs and toggles, then its sections. */
function startSwitches(): void {
  startTabs(document);
  followToggle = startProviderToggle(document, storage, told);
  followToggle(document);
}

function startPage(kept?: Provider): void {
  document.body.innerHTML = section("simple") + section("big") + section("route");
  if (kept) keepProvider(storage, kept);
  startSwitches();
}

/** A root added after start, holding `name`'s section. */
function addPanel(name: string): HTMLElement {
  const panel = document.createElement("div");
  panel.innerHTML = section(name);
  document.body.append(panel);
  startTabs(panel);
  return panel;
}

/** The listeners each test's switches add to the document, which outlives the test's page. */
const added: Parameters<Document["removeEventListener"]>[] = [];

beforeEach(() => {
  const addToDocument = document.addEventListener.bind(document);
  vi.spyOn(document, "addEventListener").mockImplementation((type, listener, options) => {
    added.push([type, listener, options]);
    addToDocument(type, listener, options);
  });
  vi.mocked(fadeIn).mockClear();
  sessionStorage.clear();
  startPage();
});

// Each test's switches alone: none of an earlier test's still answering the page's events.
afterEach(() => {
  vi.mocked(document.addEventListener).mockRestore();
  for (const listener of added.splice(0)) document.removeEventListener(...listener);
});

describe("startProviderToggle", () => {
  it("shows MapLibre's HTML version at first", () => {
    expect([shown("simple"), shown("big"), shown("route")]).toEqual([
      ["maplibre html"],
      ["maplibre html"],
      ["maplibre html"],
    ]);
  });

  it("shows every section on the provider a toggle chose, and keeps the choice", () => {
    chooseProvider("google");
    expect([shown("simple"), shown("big"), shown("route")]).toEqual([
      ["google html"],
      ["google html"],
      ["google html"],
    ]);
    expect(sessionStorage.getItem(PROVIDER_CHOICE_KEY)).toBe("google");
  });

  it("tells of each section it shows, on a tab or a provider chosen (W83)", () => {
    told.mockClear();
    chooseVersion("simple", "vanilla");
    expect(told.mock.calls.map(([section]) => section.id)).toEqual(["simple"]);
    told.mockClear();
    chooseProvider("google");
    expect(told.mock.calls.map(([section]) => section.id)).toEqual(["simple", "big", "route"]);
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
    expect(filesShown("simple")).toEqual(["google", "google", "google", "google"]);
  });

  it("opens on a provider the visitor chose before it ran, on any section, and keeps it", () => {
    document.body.innerHTML = section("simple") + section("big");
    (document.querySelector('#big [value="google"]') as HTMLInputElement).checked = true;
    startSwitches();
    expect(shown("simple")).toEqual(["google html"]);
    expect(sessionStorage.getItem(PROVIDER_CHOICE_KEY)).toBe("google");
  });

  it("tells of each section it opens on a kept provider, its code written in at load (W83)", () => {
    told.mockClear();
    startPage("google");
    expect(told.mock.calls.map(([section]) => section.id)).toEqual(["simple", "big", "route"]);
  });

  it("opens on the provider kept for the visit, with no fade", () => {
    startPage("google");
    expect([shown("simple"), shown("route")]).toEqual([["google html"], ["google html"]]);
    expect(filesShown("simple")).toEqual(["google", "google", "google", "google"]);
    expect(togglesChecked()).toEqual(["google", "google", "google"]);
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

  it("switches sections followed later with the toggles, as those it started with", () => {
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
    expect(filesShown("menu")).toEqual(["google", "google", "google", "google"]);
  });

  it("listens to the toggles once, whatever the number of roots it follows", () => {
    const kept: string[] = [];
    const counting = () =>
      ({
        getItem: () => null,
        setItem: (_key: string, value: string) => kept.push(value),
      }) as unknown as Storage;
    document.body.innerHTML = section("simple");
    const follow = startProviderToggle(document, counting, () => {});
    follow(document);
    follow(addPanel("menu"));
    follow(addPanel("tabs"));
    chooseProvider("google");
    expect(kept).toEqual(["google"]);
  });

  it("checks the chosen provider on every section's toggle", () => {
    chooseProvider("google", document.querySelector("#route") as HTMLElement);
    expect(togglesChecked()).toEqual(["google", "google", "google"]);
    chooseProvider("maplibre", document.querySelector("#big") as HTMLElement);
    expect(togglesChecked()).toEqual(["maplibre", "maplibre", "maplibre"]);
  });

  it("checks the page's provider on a panel's toggles followed later", () => {
    chooseProvider("google");
    followToggle(addPanel("menu"));
    expect(togglesChecked()).toEqual(["google", "google", "google", "google"]);
  });

  it("follows a toggle outside the sections, as the builder has", () => {
    const preview = (provider: string, index: number) =>
      `<div data-live-version="html" data-provider="${provider}" data-example="builder"${index === 0 ? "" : " hidden"}></div>`;
    document.body.innerHTML = `${toggle("provider")}<div data-version-switch="builder">${PROVIDERS.map(preview).join("")}</div>`;
    startSwitches();
    chooseProvider("google");
    expect(shown("builder")).toEqual(["google html"]);
  });
});
