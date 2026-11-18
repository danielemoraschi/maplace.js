import { FIRST_PROVIDER, isProvider, type Provider } from "../examples/example-providers.ts";
import { FIRST_VERSION } from "../examples/example-versions.ts";
import { keepProvider, keptProvider } from "./provider-choice.ts";
import { reveal } from "./reveal.ts";

/** How a version is shown or hidden: faded in by a switch, set as it is at start. */
type Show = (element: HTMLElement, shown: boolean) => void;

/** At start, before anything was shown: nothing fades in as the page loads (`fade-in.ts`). */
const setShown: Show = (element, shown) => {
  element.hidden = !shown;
};

/**
 * Starts the page's provider toggle (`[data-provider-choice]`), its choice kept in `storage` for
 * the visit, and returns what adds the `[data-version-switch]` sections under a root to those it
 * switches: the page's own, then each group's panel added later (`group-switch.ts`). Each section
 * shows the version its `[data-site-switch]` radios chose, on the provider the toggle chose:
 * - in its frame, that `[data-live-version]`, faded in, the others hidden at once, each with its
 *   own notes, shown and hidden with it (`frame.css`);
 * - in each code tab, the provider's files.
 *
 * Sections are rendered on the first provider; on another, chosen earlier in the visit or before a
 * section came, they are shown on it at once, before any map is released. A page without the
 * toggle has no sections to switch.
 */
export function startProviderToggle(
  page: ParentNode,
  storage: () => Storage,
): (root: ParentNode) => void {
  const toggle = page.querySelector<HTMLElement>("[data-provider-choice]");
  if (toggle === null) return () => {};
  const sections: HTMLElement[] = [];
  let pageProvider = providerAtStart(toggle, storage);
  const showSection = (section: HTMLElement, show: Show) => showChoice(section, pageProvider, show);

  toggle.addEventListener("change", () => {
    pageProvider = chosenProvider(toggle) ?? pageProvider;
    keepProvider(storage, pageProvider);
    // Only what the visitor sees fades in; the sections off screen change at once.
    for (const section of sections) showSection(section, isOnScreen(section) ? reveal : setShown);
  });
  if (pageProvider !== FIRST_PROVIDER) {
    checkRadio(toggle, pageProvider);
    keepProvider(storage, pageProvider);
  }

  return (root) => {
    for (const section of root.querySelectorAll<HTMLElement>("[data-version-switch]")) {
      sections.push(section);
      followSection(section, (show) => showSection(section, show));
      if (pageProvider !== FIRST_PROVIDER) showSection(section, setShown);
    }
  };
}

/** Wires `section`'s version radios to show its choice. */
function followSection(section: HTMLElement, showSection: (show: Show) => void): void {
  for (const radios of section.querySelectorAll("[data-site-switch]")) {
    radios.addEventListener("change", () => showSection(reveal));
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
  showVersion(section, version, provider, show);
  showProviderFiles(section, provider);
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

/** The provider the page's toggle has checked, if any. */
export function chosenProvider(toggle: ParentNode): Provider | undefined {
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
