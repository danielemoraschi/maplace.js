import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../build/package.ts";
import { NODE_ALONE_SCRIPTS, packagesReachedFrom } from "./node-alone.ts";

const workflows = ["deploy.yml", "offsite.yml"]
  .map((name) => readFileSync(resolve(ROOT, ".github/workflows", name), "utf8"))
  .join("\n");

describe("the scripts workflows run on Node alone", () => {
  it.each(NODE_ALONE_SCRIPTS)("%s is one a workflow runs", (script) => {
    expect(workflows).toContain(`node ${script}`);
  });

  it.each(NODE_ALONE_SCRIPTS)("%s reaches no package, only Node's own modules", (script) => {
    expect(packagesReachedFrom(script)).toEqual([]);
  });

  it("finds a package a script reaches through its imports", () => {
    expect(packagesReachedFrom("scripts/site-icons.ts")).toContain(
      "scripts/site-icons.ts: playwright",
    );
  });
});
