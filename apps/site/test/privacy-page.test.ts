import { describe, expect, it } from "vitest";
import { CONSENT_GRANTED, CONSENT_KEY } from "../src/consent/consent-store.ts";
import { PROVIDER_CHOICE_KEY } from "../src/scripts/provider-choice.ts";
import { PRIVACY_PAGE } from "../src/site/footer-pages.ts";
import { PRIVACY_CHANGED_ON } from "../src/site/privacy-changed-on.ts";
import { PRIVACY_CONTACT_EMAIL, SITE_HOST } from "../src/site/site-owner.ts";
import { MAP_PROVIDERS, MAP_PROVIDERS_SECTION } from "../src/site/third-parties.ts";
import { opened, siteBuiltBeforeTests } from "./site-session.ts";
import { DESKTOP } from "./visitor.ts";

const site = siteBuiltBeforeTests();

const privacyPage = () => opened(site, PRIVACY_PAGE.route, DESKTOP);

describe("the privacy page", () => {
  it("has a section for every third party the site's pages contact", async () => {
    const { page, context } = await privacyPage();
    for (const { id, name, terms } of MAP_PROVIDERS) {
      expect(await page.locator(`h2#${id}`).allTextContents()).toEqual([name]);
      for (const { url } of terms) {
        expect(await page.locator(`a[href="${url}"]`).count(), url).toBe(1);
      }
    }
    await context.close();
  }, 30_000);

  it("says what the site keeps in the browser, and how to reach who runs it", async () => {
    const { page, context } = await privacyPage();
    const text = await page.locator("main").textContent();
    expect(text).toContain(CONSENT_KEY);
    expect(text).toContain(CONSENT_GRANTED);
    expect(text).toContain(PROVIDER_CHOICE_KEY);
    expect(text).toContain(SITE_HOST.securityCookie);
    const contact = page.locator(`a[href="mailto:${PRIVACY_CONTACT_EMAIL}"]`);
    expect(await contact.allTextContents()).toEqual([PRIVACY_CONTACT_EMAIL]);
    await context.close();
  }, 30_000);

  it("explains the one consent the maps wait for: its button, and a link to each provider's section", async () => {
    const { page, context } = await privacyPage();
    const section = page.locator(`section[aria-labelledby="${MAP_PROVIDERS_SECTION}"]`);
    const copy = await section.textContent();
    expect(copy).toContain("“Load maps”");
    expect(copy).toMatch(/two services: Google Maps/);
    for (const { id, name } of MAP_PROVIDERS) {
      expect(await section.locator(`a[href="#${id}"]`).allTextContents()).toEqual([name]);
    }
    await context.close();
  }, 30_000);

  it("states each use's legal basis, the reader's rights and when the page last changed", async () => {
    const { page, context } = await privacyPage();
    const text = await page.locator("main").textContent();
    for (const statement of [
      "Article 6(1)(a)",
      "Article 6(1)(f)",
      "EU-U.S. Data Privacy Framework",
      "withdraw it at any time",
      "No law or contract requires you",
      "data protection authority",
    ]) {
      expect(text).toContain(statement);
    }
    const changedOn = page.locator(`time[datetime="${PRIVACY_CHANGED_ON}"]`);
    expect(await changedOn.allTextContents()).toEqual([PRIVACY_CHANGED_ON]);
    await context.close();
  }, 30_000);
});
