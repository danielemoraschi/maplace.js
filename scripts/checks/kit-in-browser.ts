import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "../build/package.ts";
import { newTempDir, removeTempDir } from "../build/temp-dir.ts";
import { layOutConsumer } from "./consumer-types.ts";

const VITEST = resolve(ROOT, "node_modules/.bin/vitest");
/** Under the test's own limit, so a hung browser ends with this file's message. */
const RUN_MS = 100_000;
const REPORT = "report.json";

/** What Vitest's JSON reporter writes, as far as this reads it. */
interface Report {
  readonly testResults: readonly {
    readonly assertionResults: readonly { readonly status: string; readonly fullName: string }[];
  }[];
}

/** A run's tests, by full name. */
export interface KitRun {
  readonly passed: readonly string[];
  readonly skipped: readonly string[];
}

/**
 * Runs `consumer/kit-run`, a third party's adapter through the kit, in Vitest's browser mode
 * against the package installed at `installed`. In its own project outside `node_modules`, under the
 * git-ignored `.vitest/`, as `server-components.ts` does, so Vitest and Chromium are the repo's and
 * maplace a link to the installed package.
 */
export function runKitInBrowser(installed: string): KitRun {
  const project = newTempDir("kit-run", join(ROOT, ".vitest"));
  try {
    layOutProject(project, installed);
    const run = spawnSync(
      VITEST,
      [
        "run",
        "--config",
        "kit-run/vitest.config.ts",
        // Its own port: the repo's browser tests, or a dev server, may hold the default.
        "--api.port=63425",
        "--reporter=default",
        "--reporter=json",
        `--outputFile.json=${REPORT}`,
      ],
      { cwd: project, encoding: "utf8", timeout: RUN_MS, env: withoutParentVitest(process.env) },
    );
    if (run.error) {
      throw new Error(`the kit's browser run didn't finish:\n${run.stdout}${run.stderr}`, {
        cause: run.error,
      });
    }
    if (run.status !== 0)
      throw new Error(`the kit's browser run failed:\n${run.stdout}${run.stderr}`);
    return kitRunOf(JSON.parse(readFileSync(join(project, REPORT), "utf8")));
  } finally {
    removeTempDir(project);
  }
}

function layOutProject(project: string, installed: string): void {
  layOutConsumer(project);
  mkdirSync(join(project, "node_modules"));
  symlinkSync(installed, join(project, "node_modules", "maplace"), "dir");
}

/** `env` without what tells a Vitest it runs inside another. */
function withoutParentVitest(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith("VITEST")));
}

/** The tests of `report`, by state: a failure ended the run above. */
function kitRunOf({ testResults }: Report): KitRun {
  const tests = testResults.flatMap(({ assertionResults }) => assertionResults);
  const named = (state: string) =>
    tests.filter(({ status }) => status === state).map(({ fullName }) => fullName);
  return { passed: named("passed"), skipped: named("skipped") };
}
