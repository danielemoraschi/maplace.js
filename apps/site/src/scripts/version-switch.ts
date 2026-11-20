import { FIRST_PROVIDER, isProvider, type Provider } from "../examples/example-providers.ts";
import { FIRST_VERSION } from "../examples/example-versions.ts";
import { keepProvider, keptProvider } from "./provider-choice.ts";
import { reveal } from "./reveal.ts";
import { TAB_SELECTED } from "./tabs.ts";

/** How a version is shown or hidden: faded in by a switch, set as it is at start. */
type Show = (element: HTMLElement, shown: boolean) => void;

/** At start, before anything was shown: nothing fades in as the page loads (`fade-in.ts`). */
const setShown: Show = (element, shown) => {
  element.hidden = !shown;
};

/** A provider toggle: one on each example section, or the builder's. */
export const PROVIDER_TOGGLE = "[data-provider-choice]";

/** A section whose shown version and provider follow its tabs and the toggles. */
const SECTION = "[data-version-switch]";

/**
 * Starts the page's provider toggles (`[data-provider-choice]`, one on each section, or the
 * builder's), their choice kept in `storage` for the visit, and returns what adds the
 * `[data-version-switch]` sections under a root to those they switch: the page's own, then each
 * group's panel added later (`group-switch.ts`). Each section shows the version its selected tab
 * names (`data-version`), on the provider the toggles chose:
 * - in its frame, that `[data-live-version]`, faded in, the others hidden at once, each with its
 *   own notes, shown and hidden with it (`frame.css`);
 * - in each code tab, the provider's files.
 *
 * A choice on any toggle is checked on all of them. Sections are rendered on the first provider;
 * on another, chosen earlier in the visit or before a section came, they are shown on it at once,
 * before any map is released. A page without a toggle has no sections to switch.
 */
export function startProviderToggle(
  page: Document,
  storage: () => Storage,
): (root: ParentNode) => void {
  if (page.querySelector(PROVIDER_TOGGLE) === null) return () => {};
  const sections: HTMLElement[] = [];
  let pageProvider = providerAtStart(page, storage);
  const showSection = (section: HTMLElement, show: Show) => showChoice(section, pageProvider, show);

  page.addEventListener("change", (event) => {
    const toggle = (event.target as Element).closest(PROVIDER_TOGGLE);
    if (toggle === null) return;
    pageProvider = chosenProvider(toggle) ?? pageProvider;
    keepProvider(storage, pageProvider);
    checkEveryToggle(page, pageProvider);
    // Only what the visitor sees fades in; the sections off screen change at once.
    for (const section of sections) showSection(section, isOnScreen(section) ? reveal : setShown);
  });
  page.addEventListener(TAB_SELECTED, (event) => {
    const tab = event.target as HTMLElement;
    const section = tab.closest<HTMLElement>(SECTION);
    if (tab.dataset.version !== undefined && section !== null) showSection(section, reveal);
  });
  if (pageProvider !== FIRST_PROVIDER) keepProvider(storage, pageProvider);

  return (root) => {
    const added = [...root.querySelectorAll<HTMLElement>(SECTION)];
    sections.push(...added);
    if (pageProvider === FIRST_PROVIDER) return;
    checkEveryToggle(root, pageProvider);
    for (const section of added) showSection(section, setShown);
  };
}

/**
 * The provider the page opens on: one the visitor chose on a toggle before this ran (the page
 * answers clicks while its module loads), else the one kept earlier in the visit.
 */
function providerAtStart(page: ParentNode, storage: () => Storage): Provider {
  for (const toggle of page.querySelectorAll(PROVIDER_TOGGLE)) {
    const chosen = chosenProvider(toggle);
    if (chosen !== undefined && chosen !== FIRST_PROVIDER) return chosen;
  }
  return keptProvider(storage);
}

function isOnScreen(element: Element): boolean {
  const { top, bottom } = element.getBoundingClientRect();
  return bottom > 0 && top < (element.ownerDocument.defaultView?.innerHeight ?? 0);
}

/** Shows `section`'s chosen version on `provider`, and that provider's files. */
function showChoice(section: HTMLElement, provider: Provider, show: Show): void {
  showVersion(section, chosenVersion(section), provider, show);
  showProviderFiles(section, provider);
}

/** The version `section`'s selected tab names; its first where it has none (the builder's). */
function chosenVersion(section: ParentNode): string {
  const tab = section.querySelector<HTMLElement>('[data-version][aria-selected="true"]');
  return tab?.dataset.version ?? FIRST_VERSION;
}

/** Shows the section's `version` on `provider`, and hides the others. */
function showVersion(section: ParentNode, version: string, provider: Provider, show: Show): void {
  for (const live of section.querySelectorAll<HTMLElement>("[data-live-version]")) {
    show(live, live.dataset.liveVersion === version && live.dataset.provider === provider);
  }
}

/** Shows `provider`'s files in each of the section's code tabs, and no other's; not faded. */
function showProviderFiles(section: ParentNode, provider: Provider): void {
  for (const panel of section.querySelectorAll<HTMLElement>("[data-provider-files]")) {
    panel.hidden = panel.dataset.providerFiles !== provider;
  }
}

/** The provider `toggle` has checked, if any. */
export function chosenProvider(toggle: ParentNode): Provider | undefined {
  const checked = radiosIn(toggle).find((radio) => radio.checked)?.value;
  return checked !== undefined && isProvider(checked) ? checked : undefined;
}

/** Checks `provider` on every toggle under `root`. */
function checkEveryToggle(root: ParentNode, provider: Provider): void {
  for (const toggle of root.querySelectorAll(PROVIDER_TOGGLE)) {
    const radio = radiosIn(toggle).find(({ value }) => value === provider);
    if (radio) radio.checked = true;
  }
}

function radiosIn(toggle: ParentNode): HTMLInputElement[] {
  return [...toggle.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
}
