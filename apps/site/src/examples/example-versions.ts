/** A version the site runs from its own bundle, beside the page's element. */
export type LiveVersion = "vanilla" | "react";

/**
 * Each way an example is written: its page (`html`, the element's), a page of its own script on
 * the CDN script's `Maplace` (`script`, W33), vanilla or React.
 */
export type VersionKind = "html" | "script" | LiveVersion;

interface VersionLabel {
  readonly kind: VersionKind;
  readonly label: string;
}

/** An example's versions, in the order the site shows them, each with its name there. */
export const VERSION_LABELS: readonly [VersionLabel, ...VersionLabel[]] = [
  { kind: "html", label: "HTML" },
  { kind: "script", label: "Script" },
  // Named by how maplace reaches the page, as the others are: through a bundler's import.
  { kind: "vanilla", label: "Bundler" },
  { kind: "react", label: "React" },
];

/** The version a section shows until the visitor chooses another: its page. */
export const FIRST_VERSION: VersionKind = VERSION_LABELS[0].kind;

/**
 * The module that runs each live version, in an example's folder. Kept apart from
 * `example-sources.ts`, so the page script that imports the modules doesn't bundle every
 * example's text with them.
 */
export const VERSION_MODULES: Readonly<Record<LiveVersion, string>> = {
  vanilla: "vanilla.ts",
  react: "react.tsx",
};

/** Whether a version of `kind` runs a module of its own (vanilla, React), not a page's script. */
export function isModuleVersion(kind: string): kind is LiveVersion {
  return Object.hasOwn(VERSION_MODULES, kind);
}
