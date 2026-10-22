import { FIRST_PROVIDER } from "../examples/example-providers.ts";
import { FIRST_VERSION } from "../examples/example-versions.ts";
import { hideSavedNote } from "../examples/page-save.ts";
import { showFailureNoteOf } from "./map-failures.ts";
import { reveal } from "./reveal.ts";

/** What a section's switch has chosen: a version, and the provider it runs on. */
interface Choice {
  readonly version: string;
  readonly provider: string;
}

/**
 * Every `[data-version-switch]` section under `root` lets its `[data-site-switch]` radios (the
 * provider's and the version's) choose what it shows:
 * - in its frame, the `[data-live-version]` of both values, faded in, the others hidden at once,
 *   with that version's failure note, if any, and no note of what the map shown before saved;
 * - in each code tab, the chosen provider's files.
 *
 * The page renders Google's HTML version chosen and shown.
 */
export function startVersionSwitches(root: ParentNode): void {
  for (const section of root.querySelectorAll<HTMLElement>("[data-version-switch]")) {
    const example = section.dataset.versionSwitch ?? "";
    const show = () => {
      const { version, provider } = chosenIn(section, example);
      showVersion(section, version, provider);
      showProviderFiles(section, provider);
    };
    for (const radios of section.querySelectorAll("[data-site-switch]")) {
      radios.addEventListener("change", show);
    }
  }
}

function chosenIn(section: ParentNode, example: string): Choice {
  return {
    version: checkedIn(section, `${example}-version`) ?? FIRST_VERSION,
    provider: checkedIn(section, `${example}-provider`) ?? FIRST_PROVIDER,
  };
}

/**
 * Reveals the section's `version` on `provider`, with its own failure note; hides the others, and
 * the note of what the map shown before saved.
 */
function showVersion(section: ParentNode, version: string, provider: string): void {
  for (const live of section.querySelectorAll<HTMLElement>("[data-live-version]")) {
    const chosen = live.dataset.liveVersion === version && live.dataset.provider === provider;
    reveal(live, chosen);
    if (chosen) {
      showFailureNoteOf(live);
      hideSavedNote(live);
    }
  }
}

/** Shows `provider`'s files in each of the section's code tabs, and no other's. */
function showProviderFiles(section: ParentNode, provider: string): void {
  for (const files of section.querySelectorAll<HTMLElement>("[data-provider-files]")) {
    files.hidden = files.dataset.providerFiles !== provider;
  }
}

/** The value of the radio named `name` checked in `section`, if any. */
function checkedIn(section: ParentNode, name: string): string | undefined {
  const radios = section.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
  return [...radios].find(({ checked }) => checked)?.value;
}
