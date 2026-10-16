import { spawnSync } from "node:child_process";
import { cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TSC } from "../build/package.ts";

/** A page's code using the packed package, one per `<fixture>.json` in `consumer/`. */
export type ConsumerFixture = "core-and-element" | "google";

const FIXTURES = join(import.meta.dirname, "consumer");

/** An error `tsc` reports: `path(line,col): error TSnnnn: …`, or `error TSnnnn: …` for none. */
const TSC_ERROR = /^(?:(.+?)\(\d+,\d+\): )?error TS\d+:/;

/**
 * A path outside the consumer project or in another installed package: errors there aren't
 * maplace's to fix (the consumer sits in the repo, so its dependencies resolve upward).
 */
const NOT_OURS = /^\.\.\/|(?:^|\/)node_modules\/(?!maplace\/)/;

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
  if (checked.error) throw checked.error;
  const loaded = loadedFiles(checked.stdout);
  if (!loaded.some((file) => file.endsWith(`/${fixture}.ts`))) {
    throw new Error(`tsc checked no ${fixture}.ts:\n${checked.stdout}${checked.stderr}`);
  }
  return { errors: ourErrors(checked.stdout), loadedFiles: loaded };
}

/** The errors in `tsc` output that are maplace's: in its declarations or the fixture. */
export function ourErrors(output: string): string[] {
  return output.split("\n").filter((line) => {
    const error = TSC_ERROR.exec(line);
    return error !== null && !NOT_OURS.test(error[1] ?? "");
  });
}

/** The files `tsc --listFiles` printed. */
export function loadedFiles(output: string): string[] {
  return output.split("\n").filter((line) => line.startsWith("/") && !TSC_ERROR.test(line));
}
