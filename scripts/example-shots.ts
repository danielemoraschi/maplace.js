// Captures each example's thumbnail and sharing image from its page on the site, on MapLibre:
// run by hand when an example's look changes, `node scripts/example-shots.ts [name…]`, after
// which the site shows them. It builds and serves the site unless `--site <url>` names one running
// (the dev server, while framing a shot). OpenFreeMap's tiles are fetched live (W65).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { type Browser, chromium } from "playwright";
import { buildAndServeSite } from "../apps/site/test/built-site.ts";
import { jpegSize } from "./build/jpeg-size.ts";
import { SHOT_PLANS, type ShotPlan } from "./example-shots/plans.ts";
import { openScene, type View } from "./example-shots/scene.ts";
import {
  DEFAULT_SCENE_HEIGHT,
  SHOT_SIZES,
  SHOTS,
  type ShotSize,
  sceneOf,
} from "./example-shots/shot-sizes.ts";

/** The plans of the examples `names`, every one's when none is named. */
function plansNamed(names: readonly string[]): readonly ShotPlan[] {
  if (names.length === 0) return SHOT_PLANS;
  return names.map((name) => {
    const plan = SHOT_PLANS.find((planned) => planned.name === name);
    if (plan === undefined) {
      const known = SHOT_PLANS.map((planned) => planned.name).join(", ");
      throw new Error(`no example is named ${name}; the examples: ${known}`);
    }
    return plan;
  });
}

/** One image of an example, captured and checked, and the view the map ended on. */
interface Captured {
  readonly jpeg: Buffer;
  readonly view: View | undefined;
}

/**
 * `plan`'s example captured as `size`: staged, then, given the view an earlier image of it ended
 * on, shown there.
 */
async function capture(
  browser: Browser,
  siteUrl: string,
  { plan, size }: { readonly plan: ShotPlan; readonly size: ShotSize },
  endOn: View | undefined,
): Promise<Captured> {
  const context = await browser.newContext(sceneOf(plan.height ?? DEFAULT_SCENE_HEIGHT, size));
  try {
    const scene = await openScene(context, siteUrl, plan);
    await plan.stage?.(scene);
    if (endOn !== undefined) await scene.view(endOn);
    const jpeg = await scene.capture(size);
    const { width, height } = jpegSize(jpeg);
    if (width !== size.width || height !== size.height) {
      throw new Error(
        `its ${size.folder} image is ${width}×${height}, not ${size.width}×${size.height}`,
      );
    }
    return { jpeg, view: await scene.shownView() };
  } finally {
    await context.close();
  }
}

/** `plan`'s example as every size, the later ones on the view the first ended on. */
async function imagesOf(browser: Browser, siteUrl: string, plan: ShotPlan) {
  const images: { size: ShotSize; jpeg: Buffer }[] = [];
  let view: View | undefined;
  for (const size of SHOT_SIZES) {
    const captured = await capture(browser, siteUrl, { plan, size }, view);
    images.push({ size, jpeg: captured.jpeg });
    view = captured.view;
  }
  return images;
}

/**
 * Each of `plans`' pictures, written only once all of an example's are captured: a failed one
 * leaves its pictures as they were.
 */
async function captureAll(browser: Browser, siteUrl: string, plans: readonly ShotPlan[]) {
  for (const size of SHOT_SIZES) mkdirSync(join(SHOTS, size.folder), { recursive: true });
  for (const plan of plans) {
    const images = await imagesOf(browser, siteUrl, plan).catch((error: unknown) => {
      throw new Error(`the ${plan.name} shot failed`, { cause: error });
    });
    for (const { size, jpeg } of images) {
      writeFileSync(join(SHOTS, size.folder, `${plan.name}.jpg`), jpeg);
    }
    console.log(`${plan.name}: captured`);
  }
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { site: { type: "string" } },
});
const plans = plansNamed(positionals);
const browser = await chromium.launch();
const site =
  values.site === undefined
    ? await buildAndServeSite({}).catch(async (error: unknown) => {
        await browser.close();
        throw error;
      })
    : { url: values.site, close: async () => undefined };
try {
  await captureAll(browser, site.url, plans);
} finally {
  await browser.close();
  await site.close();
}
