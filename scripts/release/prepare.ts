import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gitIn } from "../build/git.ts";
import { CHANGELOG_FILE as CHANGELOG } from "../docs/changelog-lines.ts";
import { type Release, withReleaseHeading } from "./changelog-release.ts";
import { planRelease, type ReleasePlan } from "./release-plan.ts";
import { tagOf } from "./tags.ts";
import { writeVersion } from "./version-files.ts";

export interface PreparedRelease extends ReleasePlan {
  /** The files the release changed, relative to the repo: what its commit holds. */
  readonly written: readonly string[];
}

/** Prepares `repo` for the release, once it is allowed: the version written, the changelog headed. */
export function prepareRelease(repo: string, release: Release): PreparedRelease {
  const changelog = readFileSync(join(repo, CHANGELOG), "utf8");
  const plan = planRelease({ version: release.version, tags: releaseTags(repo), changelog });
  const headed = withReleaseHeading(changelog, release);
  const written = writeVersion(repo, release.version);
  writeFileSync(join(repo, CHANGELOG), headed);
  return { ...plan, written: [...written, CHANGELOG] };
}

/** The repo's `v` tags: the 1.x releases among the legacy ones. */
function releaseTags(repo: string): string[] {
  return gitIn(repo, ["tag", "--list", tagOf("*")])
    .split("\n")
    .filter(Boolean);
}
