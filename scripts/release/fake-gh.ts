import type { Gh } from "./ci-verified.ts";

/**
 * A `gh` for tests: `run list` answers `runs`, one id a line; `run view <id>` whether that run's
 * verify passed (`passed`, false when absent). Every call is kept in `calls`.
 */
export function fakeGh(runs: readonly string[], passed: Readonly<Record<string, boolean>>) {
  const calls: string[][] = [];
  const gh: Gh = (args) => {
    calls.push([...args]);
    if (args[1] === "list") return `${runs.join("\n")}\n`;
    return `${passed[args[2] ?? ""] ?? false}\n`;
  };
  return { gh, calls };
}
