// Draws the README's picture of the examples from its HTML (W73): run by hand when the thumbnails
// change. Its edges fade to transparent, so one WebP reads on GitHub's light and dark grounds.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "playwright";
import { ROOT } from "./build/package.ts";

const DRAWING = resolve(ROOT, "scripts/readme-examples.html");
const PICTURE = resolve(ROOT, "docs/media/examples.webp");
const WEBP_QUALITY = 0.8;
const WEBP_DATA_URL = "data:image/webp;base64,";

const browser = await chromium.launch();
try {
  // Larger than the drawing, so the screenshot of `main` is whole.
  const page = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  await page.goto(pathToFileURL(DRAWING).href);
  const unloaded = await page.evaluate(() =>
    [...document.images].filter(({ naturalWidth }) => naturalWidth === 0).map(({ src }) => src),
  );
  if (unloaded.length > 0) {
    throw new Error(`the README picture's thumbnails didn't load: ${unloaded.join(", ")}`);
  }
  const png = await page.locator("main").screenshot({ omitBackground: true });
  const webp = await asWebp(page, png);
  writeFileSync(PICTURE, webp);
  console.log(`${PICTURE}: ${Math.round(webp.length / 1024)} kB`);
} finally {
  await browser.close();
}

/** `png` encoded as WebP, its transparency kept, by the page's own browser. */
async function asWebp(page: Page, png: Buffer): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    async ({ base64, quality }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("the page has no 2D canvas to encode the picture on");
      context.drawImage(image, 0, 0);
      return canvas.toDataURL("image/webp", quality);
    },
    { base64: png.toString("base64"), quality: WEBP_QUALITY },
  );
  if (!dataUrl.startsWith(WEBP_DATA_URL)) throw new Error("this Chromium can't encode WebP");
  return Buffer.from(dataUrl.slice(WEBP_DATA_URL.length), "base64");
}
