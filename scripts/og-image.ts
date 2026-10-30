// Draws the site's sharing image from its HTML: run by hand when the drawing changes.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { OG_IMAGE } from "../apps/site/src/site/head-meta-tags.ts";
import { ROOT } from "./build/package.ts";

const DRAWING = resolve(ROOT, "apps/site/og-image.html");
const IMAGE = resolve(ROOT, "apps/site/src/assets/og-image.png");

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
  await page.goto(pathToFileURL(DRAWING).href);
  const unloaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter(({ status }) => status !== "loaded")
      .map(({ family }) => family);
  });
  if (unloaded.length > 0) throw new Error(`the image's fonts didn't load: ${unloaded.join(", ")}`);
  await page.screenshot({ path: IMAGE });
} finally {
  await browser.close();
}
