import type { Page } from "playwright";
import { builtCdnScript, type CdnScript } from "../../../scripts/build/cdn-builds.ts";
import type { Visitor } from "./visitor.ts";

const JSDELIVR = "https://cdn.jsdelivr.net/**";

/** Chooses Google on the builder's toggle. */
export function choosePreviewOnGoogle(page: Page): Promise<void> {
  return page
    .getByRole("group", { name: "Preview and write the snippet for" })
    .getByRole("radio", { name: "Google", exact: true })
    .check();
}

/**
 * A fresh page of `visit`'s, on `siteUrl`'s origin, holding only `snippet`: the CDN's address
 * answered with `script` as a test's build of the site pins it (`testBuildEnv`), across origins,
 * so the browser checks the snippet's own hash against the script it pins.
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
  const body = await builtCdnScript(script);
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
