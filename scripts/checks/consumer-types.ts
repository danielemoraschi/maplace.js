import { spawnSync } from "node:child_process";
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TSC } from "../build/package.ts";

/** A page's code using the packed package, one per `<fixture>.json` in `consumer/`. */
export type ConsumerFixture = "core-and-element" | "google" | "maplibre" | "react";

const FIXTURES = join(import.meta.dirname, "consumer");

/** An error `tsc` reports: `path(line,col): error TSnnnn: …`, or `error TSnnnn: …` for none. */
const TSC_ERROR = /^(?:(.+?)\(\d+,\d+\): )?error TS\d+:/;

/** A path in an installed package other than maplace. */
const IN_OTHER_PACKAGE = /(?:^|\/)node_modules\/(?!maplace\/)/;

export interface ConsumerTypeCheck {
  /** Errors in maplace's declarations or the fixture. */
  readonly errors: readonly string[];
  /** Every file `tsc` loaded, by absolute path. */
  readonly loadedFiles: readonly string[];
}

/** Makes `dir` a consumer's project: the fixtures, as ES modules. Install maplace in it apart. */
export function layOutConsumer(dir: string): void {
  cpSync(FIXTURES, dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), '{ "type": "module" }\n');
}

/** Type-checks one fixture in the consumer project `dir`, as strictly as a consumer may. */
export function typeCheckConsumer(dir: string, fixture: ConsumerFixture): ConsumerTypeCheck {
  const checked = spawnSync(TSC, ["-p", `${fixture}.json`, "--listFiles", "--pretty", "false"], {
    cwd: dir,
    encoding: "utf8",
  });
  if (checked.error) {
    throw new Error(`tsc couldn't type-check the ${fixture} fixture in ${dir}`, {
      cause: checked.error,
    });
  }
  const loaded = loadedFiles(checked.stdout);
  const source = fixtureSource(fixture);
  if (!loaded.some((file) => file.endsWith(`/${source}`))) {
    throw new Error(`tsc checked no ${source}:\n${checked.stdout}${checked.stderr}`);
  }
  return { errors: ourErrors(checked.stdout), loadedFiles: loaded };
}

/** The page a fixture checks: the one file its `<fixture>.json` names. */
function fixtureSource(fixture: ConsumerFixture): string {
  const configFile = `${fixture}.json`;
  return sourceNamedBy(readFileSync(join(FIXTURES, configFile), "utf8"), configFile);
}

/** The one file a fixture's tsconfig, `config` read from `configFile`, gives tsc to check. */
export function sourceNamedBy(config: string, configFile: string): string {
  const [source] = JSON.parse(config).files ?? [];
  if (typeof source !== "string") throw new Error(`${configFile} names no file for tsc to check`);
  return source;
}

/** The errors in `tsc` output that are maplace's: in its declarations or the fixture. */
export function ourErrors(output: string): string[] {
  return output.split("\n").filter((line) => {
    const error = TSC_ERROR.exec(line);
    return error !== null && isOurs(error[1] ?? "");
  });
}

/**
 * Whether an error at `path` is maplace's to fix: in its declarations or the fixture, not in a
 * dependency (outside the project, as they resolve upward in the repo, or in another package).
 */
function isOurs(path: string): boolean {
  return !path.startsWith("../") && !IN_OTHER_PACKAGE.test(path);
}

/** The files `tsc --listFiles` printed. */
export function loadedFiles(output: string): string[] {
  return output.split("\n").filter((line) => line.startsWith("/") && !TSC_ERROR.test(line));
}
