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
 * Every `[data-version-switch]` under `root` chooses which version of its example the section's
 * frame shows, and on which provider: the `[data-live-version]` of both values, faded in, the
 * others hidden at once; its failure note, if it has one, in the frame's, and the note of what
 * the map shown before saved hidden; and in each code tab, the chosen provider's files. The page
 * renders Google's HTML version chosen and shown.
 */
export function startVersionSwitches(root: ParentNode): void {
  for (const group of root.querySelectorAll<HTMLElement>("[data-version-switch]")) {
    const example = group.dataset.versionSwitch ?? "";
    group.addEventListener("change", () => {
      const { version, provider } = chosenIn(group, example);
      showVersion(root, example, version, provider);
      showProviderFiles(root, example, provider);
    });
  }
}

function chosenIn(group: ParentNode, example: string): Choice {
  return {
    version: checkedIn(group, `${example}-version`) ?? FIRST_VERSION,
    provider: checkedIn(group, `${example}-provider`) ?? FIRST_PROVIDER,
  };
}

/**
 * Reveals `example`'s `version` on `provider`, with its own failure note; hides the others, and
 * the note of what the map shown before saved.
 */
function showVersion(root: ParentNode, example: string, version: string, provider: string): void {
  for (const live of ofExample(root, "[data-live-version]", example)) {
    const chosen = live.dataset.liveVersion === version && live.dataset.provider === provider;
    reveal(live, chosen);
    if (chosen) {
      showFailureNoteOf(live);
      hideSavedNote(live);
    }
  }
}

/** Shows `provider`'s files in each of `example`'s code tabs, and no other's. */
function showProviderFiles(root: ParentNode, example: string, provider: string): void {
  for (const files of ofExample(root, "[data-provider-files]", example)) {
    files.hidden = files.dataset.providerFiles !== provider;
  }
}

/** The value of the radio named `name` checked in `group`, if any. */
function checkedIn(group: ParentNode, name: string): string | undefined {
  const radios = group.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
  return [...radios].find(({ checked }) => checked)?.value;
}

function ofExample(root: ParentNode, selector: string, example: string): NodeListOf<HTMLElement> {
  return root.querySelectorAll<HTMLElement>(`${selector}[data-example="${example}"]`);
}
