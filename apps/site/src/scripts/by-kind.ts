import { isModuleVersion } from "../examples/example-versions.ts";
import { versionOf } from "./by-provider.ts";

/** A handler for script versions (W33), and one for the versions that run a module. */
export interface KindHandlers<Result> {
  readonly script: (version: HTMLElement) => Result;
  readonly module: (version: HTMLElement) => Result;
}

/**
 * What hands each started version to the handler of its kind (`data-live-version`); a page's map
 * (`html`) is released, never started, so any other kind is a bug in the site, and it throws.
 */
export function byKind<Result>(handlers: KindHandlers<Result>): (version: HTMLElement) => Result {
  return (version) => {
    const kind = versionOf(version).dataset.liveVersion ?? "";
    if (kind === "script") return handlers.script(version);
    if (isModuleVersion(kind)) return handlers.module(version);
    throw new Error(`a version of kind "${kind}" isn't started`);
  };
}
