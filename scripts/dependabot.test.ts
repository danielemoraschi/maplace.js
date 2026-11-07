import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { parse } from "yaml";
import { ROOT } from "./build/package.ts";

/**
 * Holds Dependabot's config (F8) to the keys and values it relies on and to the repo: GitHub
 * reads the file only on the default branch, so a mistake would show only after R3.
 */
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

interface Group {
  readonly patterns?: readonly string[];
  readonly "exclude-patterns"?: readonly string[];
  readonly "update-types"?: readonly string[];
}
interface Update {
  readonly "package-ecosystem": string;
  readonly directory: string;
  readonly schedule: { readonly interval: string };
  readonly cooldown?: object;
  readonly groups?: Readonly<Record<string, Group>>;
}

const config = parse(read(".github/dependabot.yml"));
const updates: readonly Update[] = config.updates;
const npmGroups = updates.find((update) => update["package-ecosystem"] === "npm")?.groups ?? {};

/** Each family that moves in lockstep: the group holding it, and the names that belong to it. */
const FAMILIES = [
  { group: "vitest", member: /^(vitest|@vitest\/.+)$/ },
  { group: "react", member: /^(react|react-dom|@types\/react|@types\/react-dom)$/ },
  { group: "tailwind", member: /^(tailwindcss|@tailwindcss\/.+)$/ },
];
const CATCH_ALL = "npm-minor-and-patch";

/** What npm installs for the repo: the root's and each workspace's own dependencies, not peers. */
const manifests = [
  "package.json",
  ...JSON.parse(read("package.json")).workspaces.flatMap((workspace: string) =>
    globSync(`${workspace}/package.json`, { cwd: ROOT }),
  ),
];
const installed = manifests.flatMap((path: string) => {
  const { dependencies, devDependencies } = JSON.parse(read(path));
  return Object.keys({ ...dependencies, ...devDependencies });
});

/**
 * Whether `name` matches `pattern` as Dependabot reads it: `*` is any run of characters, `/` too, so
 * `*` matches a scoped name; letters in either case (dependabot-core's `WildcardMatcher`).
 */
function matchesPattern(name: string, pattern: string): boolean {
  const escaped = pattern.split("*").map((piece) => piece.replace(/[.+?^${}()|[\]\\/]/g, "\\$&"));
  return new RegExp(`^${escaped.join(".*")}$`, "i").test(name);
}

/** Whether Dependabot puts `name` in `group`: a group with no `patterns` takes every name. */
const inGroup = (name: string, group: Group) =>
  (group.patterns?.some((pattern) => matchesPattern(name, pattern)) ?? true) &&
  !(group["exclude-patterns"] ?? []).some((pattern) => matchesPattern(name, pattern));

it("uses only the Dependabot keys and values this config relies on", () => {
  expect(Object.keys(config)).toEqual(["version", "updates"]);
  expect(config.version).toBe(2);
  expect(updates.map((update) => update["package-ecosystem"]).sort()).toEqual([
    "github-actions",
    "npm",
  ]);
  for (const update of updates) {
    expect(["package-ecosystem", "directory", "schedule", "cooldown", "groups"]).toEqual(
      expect.arrayContaining(Object.keys(update)),
    );
    expect(update.directory).toBe("/");
    expect(Object.keys(update.schedule)).toEqual(["interval"]);
    expect(["daily", "weekly", "monthly"]).toContain(update.schedule.interval);
    if (update.cooldown) expect(Object.keys(update.cooldown)).toEqual(["default-days"]);
    for (const group of Object.values(update.groups ?? {})) {
      expect(["patterns", "exclude-patterns", "update-types"]).toEqual(
        expect.arrayContaining(Object.keys(group)),
      );
      expect(["major", "minor", "patch"]).toEqual(
        expect.arrayContaining([...(group["update-types"] ?? [])]),
      );
    }
  }
});

it("puts each family's group before the catch-all, and covers every member installed", () => {
  const order = Object.keys(npmGroups);
  for (const { group, member } of FAMILIES) {
    expect(order.indexOf(group)).toBeGreaterThan(-1);
    expect(order.indexOf(group)).toBeLessThan(order.indexOf(CATCH_ALL));
    for (const name of installed.filter((candidate) => member.test(candidate))) {
      expect(inGroup(name, npmGroups[group] ?? {}), `${name} in ${group}`).toBe(true);
    }
  }
});

it("keeps the published package's runtime dependencies out of every npm group", () => {
  const runtime = Object.keys(JSON.parse(read("packages/maplace/package.json")).dependencies);
  expect(runtime.length).toBeGreaterThan(0);
  for (const name of runtime) {
    for (const [group, patterns] of Object.entries(npmGroups)) {
      expect(inGroup(name, patterns), `${name} in ${group}`).toBe(false);
    }
  }
});
