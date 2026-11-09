// What production deploys (R9, R10), for deploy.yml, run from main's checkout before anything is
// checked out or installed:
//   node scripts/deploy-target.ts
// RELEASE_TAG= and DEPLOY_COMMIT= lines on stdout, for $GITHUB_ENV; why on stderr. Refused, exit 1,
// with no release on main, or for a commit that isn't the release's own when CI's verify hasn't
// passed on it on main (GITHUB_REPOSITORY, and gh's token in GH_TOKEN).
import { execFileSync } from "node:child_process";
import { gitIn } from "./build/git.ts";
import { installedGh } from "./build/installed-tool.ts";
import { ROOT } from "./build/package.ts";
import { verifiedDeployTarget } from "./release/deploy-target.ts";
import { ReleaseRefused } from "./release/release-refused.ts";

const repo = process.env.GITHUB_REPOSITORY ?? "";
if (repo === "") throw new Error("node scripts/deploy-target.ts needs GITHUB_REPOSITORY set");

const git = (args: readonly string[]) => gitIn(ROOT, args);
const gh = (args: readonly string[]) => execFileSync(installedGh(), args, { encoding: "utf8" });
try {
  const { tag, commit, isRelease, heldBackBy } = verifiedDeployTarget(git, gh, repo, "origin/main");
  if (heldBackBy !== undefined) {
    console.error(
      `${heldBackBy} changes the library since ${tag}: site changes after it wait for a release`,
    );
  }
  console.error(
    isRelease ? `deploying ${tag}` : `deploying ${commit}: main's site changes since ${tag}`,
  );
  console.log(`RELEASE_TAG=${tag}`);
  console.log(`DEPLOY_COMMIT=${commit}`);
} catch (error) {
  if (!(error instanceof ReleaseRefused)) throw error;
  console.error(error.message);
  process.exit(1);
}
