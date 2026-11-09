// Draws the icons browsers ask the site's root for by name, from the favicon: run by hand when it
// changes. favicon.ico for any browser or crawler, apple-touch-icon.png for iOS.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import { ROOT } from "./build/package.ts";

const FAVICON = resolve(ROOT, "apps/site/src/assets/favicon.svg");
const THEME = resolve(ROOT, "apps/site/src/styles/theme.css");
const PUBLIC = resolve(ROOT, "apps/site/public");

/** iOS paints a transparent touch icon black, and rounds its corners: the ring sits inside both. */
const TOUCH_ICON = { size: 180, ringSize: 136 };
const ICO_SIZE = 32;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const ico = icoHolding(await drawIcon(page, { size: ICO_SIZE, ringSize: ICO_SIZE }));
  writeFileSync(resolve(PUBLIC, "favicon.ico"), ico);
  const touchIcon = await drawIcon(page, { ...TOUCH_ICON, background: paperColour() });
  writeFileSync(resolve(PUBLIC, "apple-touch-icon.png"), touchIcon);
} finally {
  await browser.close();
}

/** The favicon at `ringSize`, centred in a `size` square of `background`, or of nothing. */
async function drawIcon(
  page: Page,
  { size, ringSize, background }: { size: number; ringSize: number; background?: string },
): Promise<Buffer> {
  const svg = `data:image/svg+xml,${encodeURIComponent(readFileSync(FAVICON, "utf8"))}`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;height:${size}px;display:grid;place-items:center;background:${background ?? "transparent"}">` +
      `<img src="${svg}" width="${ringSize}" height="${ringSize}" alt=""></body>`,
  );
  await page.locator("img").evaluate((img: HTMLImageElement) => img.decode());
  return page.screenshot({ omitBackground: background === undefined });
}

/**
 * An ICO file of one entry, `png`, under 256 px: every browser reads a PNG inside an ICO. The
 * header is reserved 0, type 1 (icon), one image; the entry the PNG's width and height (its IHDR),
 * no palette, one plane, 32 bits per pixel, its length and where it starts, right after.
 */
function icoHolding(png: Buffer): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(png.readUInt32BE(16), 6);
  header.writeUInt8(png.readUInt32BE(20), 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

/** The site's page colour, so the touch icon sits on what the site does. */
function paperColour(): string {
  const colour = /--color-paper:\s*(#[0-9a-f]{3,8});/i.exec(readFileSync(THEME, "utf8"))?.[1];
  if (colour === undefined) throw new Error(`${THEME}: no --color-paper to draw the touch icon on`);
  return colour;
}
