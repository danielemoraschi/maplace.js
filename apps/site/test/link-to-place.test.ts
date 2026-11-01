import type { Locator } from "playwright";
import { describe, it } from "vitest";
import { VERSION_LABELS, type VersionKind } from "../src/examples/example-versions.ts";
import { mapLibreDrawn, mapLibreVersionIn } from "./drawn-on-maplibre.ts";
import { chooseVersion, type VersionChoice, versionChoice, visitSection } from "./home-sections.ts";
import { ON_MAPLIBRE, SECTION_MS, siteOnMapLibreBeforeTests } from "./maplibre-session.ts";
import { loadMapsButtons } from "./visitor.ts";

const EXAMPLE = "link-to-place";
const site = siteOnMapLibreBeforeTests();

/** The parameter `kind`'s MapLibre version keeps its place in. */
const parameterOf = (kind: VersionKind) =>
  kind === "html" ? "place-maplibre" : `place-maplibre-${kind}`;

/** The list's selected entry: "View all" while no place is. */
const selectedTitle = (version: Locator) =>
  version.locator('[role="option"][aria-selected="true"]').textContent();

/** The example at `addressTail`, its `kind` version chosen before consent. */
async function opened(addressTail: string, { kind, label }: VersionChoice) {
  const visit = await visitSection(site, EXAMPLE, addressTail);
  await chooseVersion(visit.page, EXAMPLE, label);
  await loadMapsButtons(visit.section).click();
  return { ...visit, version: mapLibreVersionIn(visit.section, kind) };
}

describe.concurrent("the Link to a place example on the built site", () => {
  it.for(VERSION_LABELS)(
    "opens its $label version on the place the address names, and back steps through picks",
    { timeout: SECTION_MS },
    async (choice, { expect }) => {
      const parameter = parameterOf(choice.kind);
      const { page, context, errors, version } = await opened(
        `?${parameter}=milan#${EXAMPLE}`,
        choice,
      );
      await expect.poll(() => selectedTitle(version), ON_MAPLIBRE).toBe("Milan");

      await version.getByRole("option", { name: "Rome" }).click();
      await expect.poll(() => new URL(page.url()).searchParams.get(parameter)).toBe("rome");
      await page.goBack();
      await expect.poll(() => selectedTitle(version), ON_MAPLIBRE).toBe("Milan");
      expect(errors()).toEqual([]);
      await context.close();
    },
  );

  it.for(VERSION_LABELS)(
    "ignores a place no location has in its $label version, and back to it writes nothing",
    { timeout: SECTION_MS },
    async (choice, { expect }) => {
      const parameter = parameterOf(choice.kind);
      const { page, context, errors, version } = await opened(
        `?${parameter}=nowhere#${EXAMPLE}`,
        choice,
      );
      await expect.poll(() => mapLibreDrawn(version), ON_MAPLIBRE).toBe(true);
      expect(await selectedTitle(version)).toBe("View all");

      await version.getByRole("option", { name: "Rome" }).click();
      await expect.poll(() => new URL(page.url()).searchParams.get(parameter)).toBe("rome");
      await page.goBack();
      // The element ignores the address as its link was ignored, so its pick stands.
      const shownAtBadLink = choice.kind === "html" ? "Rome" : "View all";
      await expect.poll(() => selectedTitle(version), ON_MAPLIBRE).toBe(shownAtBadLink);
      expect(new URL(page.url()).searchParams.get(parameter), "no new entry written").toBe(
        "nowhere",
      );
      expect(errors()).toEqual([]);
      await context.close();
    },
  );

  it("opens on the place from the link under the map, once followed", {
    timeout: SECTION_MS,
  }, async ({ expect }) => {
    const { page, context, version } = await opened(`#${EXAMPLE}`, versionChoice("html"));
    await expect.poll(() => mapLibreDrawn(version), ON_MAPLIBRE).toBe(true);
    expect(await version.locator("p").last().textContent()).toBe("Pick a place for a link to it.");
    await version.getByRole("option", { name: "Milan" }).click();
    await version.getByRole("link", { name: "?place-maplibre=milan" }).click();
    await page.waitForURL(/place-maplibre=milan#link-to-place-maplibre-map$/);
    await expect
      .poll(
        () => selectedTitle(mapLibreVersionIn(page.locator(`#${EXAMPLE}`), "html")),
        ON_MAPLIBRE,
      )
      .toBe("Milan");
    await context.close();
  });

  it("opens on the place from a link with no hash, once scrolled to", {
    timeout: SECTION_MS,
  }, async ({ expect }) => {
    const { context, version } = await opened("?place-maplibre=milan", versionChoice("html"));
    await expect.poll(() => selectedTitle(version), ON_MAPLIBRE).toBe("Milan");
    await context.close();
  });
});
