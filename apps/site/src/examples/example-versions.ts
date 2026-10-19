/** A version the site runs from its own bundle, beside the page's element. */
export type LiveVersion = "vanilla" | "react";

/**
 * The module that runs each live version, in an example's folder. Kept apart from
 * `example-sources.ts`, so the page script that imports the modules doesn't bundle every
 * example's text with them.
 */
export const VERSION_MODULES: Readonly<Record<LiveVersion, string>> = {
  vanilla: "vanilla.ts",
  react: "react.tsx",
};
