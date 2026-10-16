import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { packageManifest, ROOT } from "./build/package.ts";
import { CHANGELOG_FILE } from "./checks/changelog-lines.ts";
import { releaseNotes } from "./release/changelog-release.ts";
import { blobBaseFor } from "./release/repository.ts";
import { tagOf } from "./release/tags.ts";

/** `npm run release-notes <version>`: the GitHub release's body, from the version's changelog lines. */
const [version] = process.argv.slice(2);
if (version === undefined) throw new Error("usage: npm run release-notes <version>");
const changelog = readFileSync(resolve(ROOT, CHANGELOG_FILE), "utf8");
const blobBase = blobBaseFor(packageManifest(), tagOf(version));
process.stdout.write(releaseNotes(changelog, { version, blobBase }));
