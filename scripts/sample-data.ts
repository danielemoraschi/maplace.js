// Writes the examples' sample data from 0.2's site, at tag 0.2.10: run once by hand
// (`node scripts/sample-data.ts`); CI's shallow checkout has no 0.2 history.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { gitIn } from "./build/git.ts";
import { ROOT } from "./build/package.ts";
import { mixedGroupsFromAjax, pointsFrom4k } from "./sample-data/from-0.2.ts";

const TAG = "0.2.10";
const DATA = join(ROOT, "packages/maplace/examples/data");

function legacyFile(path: string): string {
  return gitIn(ROOT, ["show", `${TAG}:website/data/${path}`]);
}

function write(file: string, data: unknown): void {
  writeFileSync(join(DATA, file), `${JSON.stringify(data, null, 2)}\n`);
}

for (const { letter, locations } of mixedGroupsFromAjax(legacyFile("ajax.php"))) {
  write(`mixed-${letter}.json`, locations);
}
write("points-4k.json", pointsFrom4k(legacyFile("4k.js")));
