import type { Page } from "playwright";
import { beforeAll } from "vitest";
import { builtCdnScript, CDN_SCRIPTS, type CdnScript } from "../../../scripts/build/cdn-builds.ts";
import { packageManifest } from "../../../scripts/build/package.ts";
import { LONGEST_NPM_READ_MS, publishedFiles } from "../../../scripts/release/published-package.ts";
import type { Visitor } from "./visitor.ts";

const JSDELIVR = "https://cdn.jsdelivr.net/**";

let published: Promise<ReadonlyMap<string, Uint8Array> | undefined> | undefined;
const publishedOnce = () => (published ??= publishedFiles(packageManifest().version, fetch));

/** Reads npm's files before the tests, in npm's own time: a slow registry fails naming it. */
export function pinnedScriptsBeforeTests(): void {
  beforeAll(async () => {
    await publishedOnce();
  }, LONGEST_NPM_READ_MS);
}

/** Chooses Google on the builder's toggle. */
export function choosePreviewOnGoogle(page: Page): Promise<void> {
  return page
    .getByRole("group", { name: "Preview and write the snippet for" })
    .getByRole("radio", { name: "Google", exact: true })
    .check();
}

/**
 * A fresh page of `visit`'s, on `siteUrl`'s origin, holding only `snippet`: the CDN's address
 * answered with `script` as the site pins it, across origins, so the browser checks the snippet's
 * own hash against what a reader's page gets.
 * A page's routes win over its context's.
 */
export async function writtenSnippetPage(
  visit: Visitor,
  siteUrl: string,
  snippet: string,
  script: CdnScript,
): Promise<Page> {
  const page = await visit.context.newPage();
  const address = new URL("/written-snippet/", siteUrl).href;
  const body = await scriptAsPinned(script);
  await page.route(JSDELIVR, (route) =>
    route.fulfill({
      contentType: "text/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: Buffer.from(body),
    }),
  );
  await page.route(address, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><body>${snippet}</body></html>`,
    }),
  );
  await page.goto(address);
  return page;
}

/**
 * `script` as the site pins it (`cdn-pin.ts`): npm's bytes once the version is published, this
 * build's until then.
 */
async function scriptAsPinned(script: CdnScript): Promise<Uint8Array> {
  const files = await publishedOnce();
  if (files === undefined) return builtCdnScript(script);
  const bytes = files.get(`dist/${CDN_SCRIPTS[script]}`);
  if (bytes === undefined) throw new Error(`${CDN_SCRIPTS[script]} isn't published`);
  return bytes;
}
