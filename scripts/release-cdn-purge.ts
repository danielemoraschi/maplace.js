import { setTimeout as pause } from "node:timers/promises";
import { readRootFile } from "./build/package.ts";
import { checkableVersion } from "./release/cdn-check.ts";
import { floatingUrlProblems } from "./release/cdn-follow.ts";
import { pinnedFiles } from "./release/cdn-purge.ts";
import { PACKAGE_NAME } from "./release/published-package.ts";
import { ReleaseRefused } from "./release/release-refused.ts";
import { isPrerelease, parseVersion } from "./release/versions.ts";

/**
 * `npm run release-cdn-purge <version>`: jsDelivr's floating URLs of the scripts the README pins
 * (`@1`, `@1.3`, `@latest`, the bare package) purged until each answers that version, so its edges
 * serve it at once, not up to 12 hours later. What `announce` runs last, and its retry by hand.
 * Runs on Node alone: `announce` has no `npm ci`.
 */
const [asked = ""] = process.argv.slice(2);
try {
  const version = parseVersion(checkableVersion(asked));
  if (isPrerelease(version)) {
    console.log(`${version.text} is a pre-release: no floating URL moves`);
  } else {
    const files = pinnedFiles(readRootFile("README.md"));
    const tools = { fetchUrl: fetch, wait: pause, now: Date.now, log: console.log };
    const problems = await floatingUrlProblems(version, files, tools);
    for (const problem of problems) console.error(problem);
    if (problems.length > 0) process.exitCode = 1;
    else console.log(`jsDelivr's floating URLs of ${PACKAGE_NAME} answer ${version.text}`);
  }
} catch (error) {
  if (!(error instanceof ReleaseRefused)) throw error;
  console.error(`Not purged: ${error.message}`);
  process.exitCode = 1;
}
