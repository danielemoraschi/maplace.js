import { describe, expect, it } from "vitest";
import { exampleCode, exampleFile } from "./example-sources.ts";

describe("exampleCode", () => {
  it("is an example's three versions, each with every file a reader copies", () => {
    const tabs = exampleCode("simple").map(({ kind, label, files }) => ({
      kind,
      label,
      files: files.map(({ file, lang }) => [file, lang]),
    }));
    expect(tabs).toEqual([
      { kind: "html", label: "HTML", files: [["page.html", "html"]] },
      {
        kind: "vanilla",
        label: "Vanilla",
        files: [
          ["vanilla.html", "html"],
          ["vanilla.ts", "ts"],
        ],
      },
      {
        kind: "react",
        label: "React",
        files: [
          ["react.html", "html"],
          ["react.tsx", "tsx"],
        ],
      },
    ]);
  });

  it("reads each file as written", () => {
    const [html, vanilla, react] = exampleCode("simple");
    expect(html?.files[0]?.code).toContain("<maplace-map");
    expect(vanilla?.files[1]?.code).toContain("createMaplace(");
    expect(react?.files[1]?.code).toContain("<MaplaceProvider");
  });

  it("refuses an example that isn't there", () => {
    expect(() => exampleCode("nowhere")).toThrow(/nowhere/);
  });
});

describe("exampleFile", () => {
  it("is one file of an example, or refuses one that isn't there", () => {
    expect(exampleFile("simple", "vanilla.html")).toContain("<script>");
    expect(() => exampleFile("simple", "other.ts")).toThrow(/simple\/other\.ts/);
  });
});
