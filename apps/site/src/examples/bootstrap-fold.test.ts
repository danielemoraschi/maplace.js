import { describe, expect, it } from "vitest";
import { foldBootstrap, type HostParts } from "./bootstrap-fold.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { type ExampleFile, exampleCode } from "./example-sources.ts";

const HOSTS = EXAMPLE_SECTIONS.flatMap(({ name: example }) =>
  exampleCode(example)
    .flatMap(({ files }) => files)
    .filter(({ file }) => file === "vanilla.html" || file === "react.html")
    .map((file) => ({ example, file })),
);

const host = (code: string): ExampleFile => ({ file: "vanilla.html", lang: "html", code });

const joined = ({ before, loader, after }: HostParts) => before + loader + after;

describe("foldBootstrap", () => {
  it.each(HOSTS)(
    "splits $example's $file.file at its loader, the parts joined the file as written",
    ({ example, file }) => {
      const parts = foldBootstrap(example, file);
      expect(parts && joined(parts)).toBe(file.code);
    },
  );

  it.each(HOSTS)(
    "finds Google's loader in $example's $file.file, with the reader's key to put in",
    ({ example, file }) => {
      const loader = foldBootstrap(example, file)?.loader;
      expect(loader).toMatch(
        /^<script>[\s\S]*importLibrary[\s\S]*key: "YOUR_KEY"[\s\S]*<\/script>\n$/,
      );
    },
  );

  it("leaves a page, or a module, unfolded", () => {
    const [page, vanilla] = exampleCode("simple");
    expect(foldBootstrap("simple", page?.files[0] as ExampleFile)).toBeUndefined();
    expect(foldBootstrap("simple", vanilla?.files[1] as ExampleFile)).toBeUndefined();
  });

  it("leaves a host's other inline scripts out of the loader", () => {
    const code = '<script>importLibrary("maps")</script>\n<script>other()</script>\n<div></div>';
    expect(foldBootstrap("simple", host(code))).toEqual({
      before: "",
      loader: '<script>importLibrary("maps")</script>\n',
      after: "<script>other()</script>\n<div></div>",
    });
  });

  it("refuses a host without the loader, or with two, naming the file", () => {
    const loader = "<script>importLibrary()</script>";
    expect(() => foldBootstrap("simple", host("<div></div>"))).toThrow(
      "examples/simple/vanilla.html has Google's bootstrap loader once: this one has 0",
    );
    expect(() => foldBootstrap("simple", host(loader + loader))).toThrow(/this one has 2/);
  });
});
