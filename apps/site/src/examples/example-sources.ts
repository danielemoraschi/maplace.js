/** One of an example's files, as a reader copies it. */
export interface ExampleFile {
  /** Which way of using maplace it shows. */
  readonly kind: "html" | "vanilla" | "react";
  readonly label: string;
  /** Its name in the example's folder. */
  readonly file: string;
  /** Its language, for highlighting. */
  readonly lang: "html" | "ts" | "tsx";
  readonly code: string;
}

// The files the tests run (T5), read as text: the site shows them and never bundles them. Vite
// reads each glob's options as written, so they are repeated.
const PAGES = import.meta.glob<string>("../../../../packages/maplace/examples/*/page.html", {
  query: "?raw",
  import: "default",
  eager: true,
});
const VANILLA = import.meta.glob<string>("../../../../packages/maplace/examples/*/vanilla.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});
const REACT = import.meta.glob<string>("../../../../packages/maplace/examples/*/react.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The files of the example in `packages/maplace/examples/<name>/`: page, vanilla, React. */
export function exampleSources(name: string): readonly ExampleFile[] {
  return [
    {
      kind: "html",
      label: "HTML",
      file: "page.html",
      lang: "html",
      code: sourceOf(PAGES, name, "page.html"),
    },
    {
      kind: "vanilla",
      label: "Vanilla",
      file: "vanilla.ts",
      lang: "ts",
      code: sourceOf(VANILLA, name, "vanilla.ts"),
    },
    {
      kind: "react",
      label: "React",
      file: "react.tsx",
      lang: "tsx",
      code: sourceOf(REACT, name, "react.tsx"),
    },
  ];
}

function sourceOf(files: Record<string, string>, name: string, file: string): string {
  const source = files[`../../../../packages/maplace/examples/${name}/${file}`];
  if (source === undefined) throw new Error(`examples/${name}/${file} doesn't exist`);
  return source;
}
