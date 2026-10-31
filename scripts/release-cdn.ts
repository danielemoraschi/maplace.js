import { setTimeout as pause } from "node:timers/promises";
import { cdnProblems, checkableVersion } from "./release/cdn-check.ts";
import { PACKAGE_NAME } from "./release/published-package.ts";
import { ReleaseRefused } from "./release/release-refused.ts";

/**
 * `npm run release-cdn <version>`: each script on jsDelivr at that version against the published
 * README's hash and a page's origin, retrying. Runs on Node alone: `announce` has no `npm ci`.
 */
const [asked = ""] = process.argv.slice(2);
try {
  const version = checkableVersion(asked);
  const tools = { fetchUrl: fetch, wait: pause, now: Date.now, log: console.log };
  const problems = await cdnProblems(version, tools);
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) process.exitCode = 1;
  else console.log(`jsDelivr serves what ${PACKAGE_NAME}@${version} pins`);
} catch (error) {
  if (!(error instanceof ReleaseRefused)) throw error;
  console.error(`Not checked: ${error.message}`);
  process.exitCode = 1;
}
