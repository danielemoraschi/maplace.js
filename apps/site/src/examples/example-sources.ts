/** One of an example's files, as a reader copies it. */
export interface ExampleFile {
  /** Its name in the example's folder. */
  readonly file: string;
  /** Its language, for highlighting. */
  readonly lang: "html" | "ts" | "tsx";
  readonly code: string;
}

/** One way of using maplace an example is written in: its code tab, with every file it needs. */
export interface ExampleCode {
  readonly kind: "html" | "vanilla" | "react";
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

const VERSIONS: readonly (Omit<ExampleCode, "files"> & { readonly files: readonly string[] })[] = [
  { kind: "html", label: "HTML", files: ["page.html"] },
  { kind: "vanilla", label: "Vanilla", files: ["vanilla.html", "vanilla.ts"] },
  { kind: "react", label: "React", files: ["react.html", "react.tsx"] },
];

/** The code of the example in `packages/maplace/examples/<name>/`: page, vanilla, React. */
export function exampleCode(name: string): readonly ExampleCode[] {
  return VERSIONS.map(({ files, ...version }) => ({
    ...version,
    files: files.map((file) => ({ file, lang: langOf(file), code: exampleFile(name, file) })),
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
