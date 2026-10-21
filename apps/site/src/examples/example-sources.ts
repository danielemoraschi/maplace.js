import { VERSION_LABELS, VERSION_MODULES, type VersionKind } from "./example-versions.ts";

/** One of an example's files, as a reader copies it. */
export interface ExampleFile {
  /** Its name in the example's folder. */
  readonly file: string;
  /** Its language, for highlighting. */
  readonly lang: "html" | "ts" | "tsx";
  readonly code: string;
}

/** One way of using maplacejs an example is written in: its code tab, with every file it needs. */
export interface ExampleCode {
  readonly kind: VersionKind;
  readonly label: string;
  readonly files: readonly ExampleFile[];
}

const EXAMPLES = "../../../../packages/maplace/examples";

// The files the tests run (T5), read as text: the site shows them and never bundles them this
// way (`example-modules.ts` bundles the version modules). Vite reads a glob as written.
const FILES = import.meta.glob<string>("../../../../packages/maplace/examples/*/*.{html,ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Each version's files: the HTML it runs on first. */
const VERSION_FILES: Readonly<Record<VersionKind, readonly string[]>> = {
  html: ["page.html"],
  vanilla: ["vanilla.html", VERSION_MODULES.vanilla],
  react: ["react.html", VERSION_MODULES.react],
};

/** The code of the example in `packages/maplace/examples/<name>/`: page, vanilla, React. */
export function exampleCode(name: string): readonly ExampleCode[] {
  return VERSION_LABELS.map((version) => ({
    ...version,
    files: VERSION_FILES[version.kind].map((file) => ({
      file,
      lang: langOf(file),
      code: exampleFile(name, file),
    })),
  }));
}

/** One file of an example, as written. */
export function exampleFile(name: string, file: string): string {
  const code = FILES[`${EXAMPLES}/${name}/${file}`];
  if (code === undefined) throw new Error(`examples/${name}/${file} doesn't exist`);
  return code;
}

/** The examples that have a page: their folder names. */
export function exampleNames(): readonly string[] {
  return Object.keys(FILES)
    .filter((path) => path.endsWith("/page.html"))
    .map((path) => path.split("/").at(-2) ?? path);
}

function langOf(file: string): ExampleFile["lang"] {
  return file.slice(file.lastIndexOf(".") + 1) as ExampleFile["lang"];
}
