import { FIRST_PROVIDER, isProvider, type Provider } from "../examples/example-providers.ts";
import { FIRST_VERSION } from "../examples/example-versions.ts";
import { hideSavedNote } from "../examples/page-save.ts";
import { showFailureNoteOf } from "./map-failures.ts";
import { keepProvider, keptProvider } from "./provider-choice.ts";
import { reveal } from "./reveal.ts";

/** How a version is shown or hidden: faded in by a switch, set as it is at start. */
type Show = (element: HTMLElement, shown: boolean) => void;

/** At start, before anything was shown: nothing fades in as the page loads (`fade-in.ts`). */
const setShown: Show = (element, shown) => {
  element.hidden = !shown;
};

/**
 * Every `[data-version-switch]` section under `root` shows the version its `[data-site-switch]`
 * radios chose, on the provider the page's toggle (`[data-provider-choice]`) chose, kept in
 * `storage` for the visit:
 * - in its frame, that `[data-live-version]`, faded in, the others hidden at once, with that
 *   version's failure note, if any, and no note of what the map shown before saved; a section with
 *   no version on the provider (route on MapLibre) shows none, its frame marked `data-no-version`
 *   for its note, whose `[data-show-on]` button shows that section alone on the provider it names;
 * - in each code tab, the provider's files; a section with none for it keeps the files it has.
 *
 * The page renders the first provider chosen; a provider kept earlier in the visit is shown at
 * once, before any map is released. The sections come with the toggle, on the home page only: a
 * page without the toggle has none to switch.
 */
export function startVersionSwitches(root: ParentNode, storage: () => Storage): void {
  const toggle = root.querySelector<HTMLElement>("[data-provider-choice]");
  if (toggle === null) return;
  const sections = [...root.querySelectorAll<HTMLElement>("[data-version-switch]")];
  const ownProvider = new Map<HTMLElement, Provider>();
  let pageProvider = providerAtStart(toggle, storage);
  const showSection = (section: HTMLElement, show: Show) =>
    showChoice(section, ownProvider.get(section) ?? pageProvider, show);

  for (const section of sections) {
    for (const radios of section.querySelectorAll("[data-site-switch]")) {
      radios.addEventListener("change", () => showSection(section, reveal));
    }
    section.querySelector<HTMLElement>("[data-show-on]")?.addEventListener("click", (event) => {
      const named = (event.currentTarget as HTMLElement).dataset.showOn ?? "";
      if (!isProvider(named)) return;
      ownProvider.set(section, named);
      showSection(section, reveal);
      // The button hides with its note: focus goes to what the section now shows.
      checkedRadioIn(section, `${section.dataset.versionSwitch}-version`)?.focus();
    });
  }
  toggle.addEventListener("change", () => {
    pageProvider = chosenProvider(toggle) ?? pageProvider;
    keepProvider(storage, pageProvider);
    ownProvider.clear();
    // Only what the visitor sees fades in; the sections off screen change at once.
    for (const section of sections) showSection(section, isOnScreen(section) ? reveal : setShown);
  });
  // The page is built on the first provider: anything else is shown at once.
  if (pageProvider !== FIRST_PROVIDER) {
    checkRadio(toggle, pageProvider);
    keepProvider(storage, pageProvider);
    for (const section of sections) showSection(section, setShown);
  }
}

/**
 * The provider the page opens on: one the visitor chose on the toggle before this ran (the page
 * answers clicks while its module loads), else the one kept earlier in the visit.
 */
function providerAtStart(toggle: ParentNode, storage: () => Storage): Provider {
  const chosen = chosenProvider(toggle);
  return chosen !== undefined && chosen !== FIRST_PROVIDER ? chosen : keptProvider(storage);
}

function isOnScreen(element: Element): boolean {
  const { top, bottom } = element.getBoundingClientRect();
  return bottom > 0 && top < (element.ownerDocument.defaultView?.innerHeight ?? 0);
}

/** Shows `section`'s chosen version on `provider`, and that provider's files. */
function showChoice(section: HTMLElement, provider: Provider, show: Show): void {
  const version =
    checkedRadioIn(section, `${section.dataset.versionSwitch}-version`)?.value ?? FIRST_VERSION;
  const shown = showVersion(section, version, provider, show);
  section.querySelector<HTMLElement>(".map-frame")?.toggleAttribute("data-no-version", !shown);
  offerVersions(section, shown);
  showProviderFiles(section, provider);
}

/**
 * Offers the section's versions, its version radios and code tabs, or grays them out while it has
 * none on the provider shown (route on MapLibre); a code tab shown then gives way to the Map tab.
 */
function offerVersions(section: HTMLElement, offered: boolean): void {
  const radios = section.querySelector<HTMLFieldSetElement>("[data-site-switch]");
  if (radios) radios.disabled = !offered;
  const [mapTab, ...codeTabs] = section.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  for (const tab of codeTabs) tab.disabled = !offered;
  if (!offered && codeTabs.some((tab) => tab.getAttribute("aria-selected") === "true")) {
    mapTab?.click();
  }
}

/**
 * Shows the section's `version` on `provider`, with its own failure note; hides the others, and
 * the note of what the map shown before saved. Whether the section has that version.
 */
function showVersion(
  section: ParentNode,
  version: string,
  provider: Provider,
  show: Show,
): boolean {
  let found = false;
  for (const live of section.querySelectorAll<HTMLElement>("[data-live-version]")) {
    const chosen = live.dataset.liveVersion === version && live.dataset.provider === provider;
    show(live, chosen);
    if (chosen) {
      found = true;
      showFailureNoteOf(live);
      hideSavedNote(live);
    }
  }
  return found;
}

/**
 * Shows `provider`'s files in each of the section's code tabs, and no other's; a section with no
 * files for it (route on MapLibre) keeps the ones it shows. The tabs' panels aren't faded.
 */
function showProviderFiles(section: ParentNode, provider: Provider): void {
  const files = [...section.querySelectorAll<HTMLElement>("[data-provider-files]")];
  if (!files.some(({ dataset }) => dataset.providerFiles === provider)) return;
  for (const panel of files) panel.hidden = panel.dataset.providerFiles !== provider;
}

/** The provider the page's toggle has checked, if any. */
function chosenProvider(toggle: ParentNode): Provider | undefined {
  const checked = checkedRadioIn(toggle, "provider")?.value;
  return checked !== undefined && isProvider(checked) ? checked : undefined;
}

function checkRadio(parent: ParentNode, provider: Provider): void {
  const radio = radiosIn(parent, "provider").find(({ value }) => value === provider);
  if (radio) radio.checked = true;
}

/** The radio named `name` checked in `parent`, if any. */
function checkedRadioIn(parent: ParentNode, name: string): HTMLInputElement | undefined {
  return radiosIn(parent, name).find(({ checked }) => checked);
}

function radiosIn(parent: ParentNode, name: string): HTMLInputElement[] {
  return [...parent.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
}
