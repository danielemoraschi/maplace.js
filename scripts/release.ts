import { ROOT } from "./build/package.ts";
import { prepareRelease } from "./release/prepare.ts";
import { ReleaseRefused } from "./release/release-refused.ts";

/**
 * `npm run release <version>`: the version written and the changelog headed, in this checkout;
 * then, as `name=value` lines for `$GITHUB_OUTPUT`, what the release workflow needs.
 */
const [version = ""] = process.argv.slice(2);
const todayInUtc = new Date().toISOString().slice(0, 10);
try {
  const release = prepareRelease(ROOT, { version, date: todayInUtc });
  console.log(
    [
      `tag=${release.tag}`,
      `dist-tag=${release.distTag}`,
      `prerelease=${release.prerelease}`,
      `last=${release.lastReleased ?? ""}`,
      `files=${release.written.join(" ")}`,
    ].join("\n"),
  );
} catch (error) {
  if (!(error instanceof ReleaseRefused)) throw error;
  console.error(`Not released: ${error.message}`);
  process.exitCode = 1;
}
