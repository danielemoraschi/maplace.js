import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STAR_COUNT_PATH } from "../site/star-count-api.ts";

/** `wrangler.jsonc`, its comments (whole lines, as the file writes them) dropped. */
function wranglerConfig() {
  const text = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  const json = text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  return JSON.parse(json);
}

describe("wrangler.jsonc", () => {
  it("runs the Worker first for the star count's path only, the assets bound for the rest", () => {
    const { main, assets } = wranglerConfig();
    expect(main).toBe("./src/worker/worker.ts");
    expect(assets.run_worker_first).toEqual([STAR_COUNT_PATH]);
    expect(assets.binding).toBe("ASSETS");
  });
});
