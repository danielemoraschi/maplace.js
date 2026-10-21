/** A version the site runs from its own bundle, beside the page's element. */
export type LiveVersion = "vanilla" | "react";

/** Each way an example is written: its page (`html`, the element's), vanilla or React. */
export type VersionKind = "html" | LiveVersion;

/** An example's versions, in the order the site shows them, each with its name there. */
export const VERSION_LABELS: readonly { readonly kind: VersionKind; readonly label: string }[] = [
  { kind: "html", label: "HTML" },
  { kind: "vanilla", label: "Vanilla" },
  { kind: "react", label: "React" },
];

/**
 * The module that runs each live version, in an example's folder. Kept apart from
 * `example-sources.ts`, so the page script that imports the modules doesn't bundle every
 * example's text with them.
 */
export const VERSION_MODULES: Readonly<Record<LiveVersion, string>> = {
  vanilla: "vanilla.ts",
  react: "react.tsx",
};
