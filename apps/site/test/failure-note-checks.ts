import type { Locator, Page } from "playwright";
import { expect } from "vitest";
import type { Provider } from "../src/examples/example-providers.ts";
import type { VersionKind } from "../src/examples/example-versions.ts";
import { chooseVersion, providerVersionIn, versionChoice } from "./home-sections.ts";

/** What a version's frame shows for its map's failure. */
export interface Noted {
  /** The version's `data-failed`. */
  readonly failed: string;
  /** Why, after "The map couldn't load: ". */
  readonly note: string;
  /** Whether the note offers a reload. */
  readonly reload: boolean;
}

/** The versions `expectNotedInTurn` chooses, on which provider, waiting how long for each. */
export interface InTurn {
  readonly example: string;
  readonly provider: Provider;
  readonly kinds: readonly VersionKind[];
  readonly timeout: number;
}

/** Chooses each of `inTurn`'s versions in turn, expecting its frame to say `noted`. */
export async function expectNotedInTurn(
  page: Page,
  section: Locator,
  { example, provider, kinds, timeout }: InTurn,
  noted: Noted,
): Promise<void> {
  for (const kind of kinds) {
    const { label } = versionChoice(kind);
    await chooseVersion(page, example, label);
    const version = providerVersionIn(section, provider, kind);
    await expect
      .poll(() => version.getAttribute("data-failed"), {
        timeout,
        message: `${example}'s ${label} version's data-failed`,
      })
      .toBe(noted.failed);
    await expectNoteAlone(section, noted);
  }
}

/** Expects `section`'s frame to say `noted` and offer a reload as it says, its loading note gone. */
async function expectNoteAlone(section: Locator, noted: Noted): Promise<void> {
  const note = section.locator("[data-map-failure]");
  expect(await note.textContent()).toBe(`The map couldn't load: ${noted.note}`);
  expect(await note.isVisible()).toBe(true);
  const reload = section.getByRole("button", { name: "Reload the page" });
  expect(await reload.isVisible(), "reload offered").toBe(noted.reload);
  expect(await section.locator(".map-note.loading").isVisible(), "loading shown").toBe(false);
}
