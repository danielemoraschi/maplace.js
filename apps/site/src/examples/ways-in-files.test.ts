import { describe, expect, it } from "vitest";
import { exampleCode } from "./example-sources.ts";
import { componentOf, waysInFiles } from "./ways-in-files.ts";

const simple = (provider: "google" | "maplibre", kind: string) => {
  const code = exampleCode("simple", provider).find((version) => version.kind === kind);
  if (code === undefined) throw new Error(`simple has no ${kind}`);
  return code;
};

describe("waysInFiles", () => {
  it("shows a page whole", () => {
    expect(waysInFiles(simple("maplibre", "html")).map(({ file }) => file)).toEqual(["page.html"]);
    expect(waysInFiles(simple("google", "script")).map(({ file }) => file)).toEqual([
      "script.html",
    ]);
  });

  it("shows a module without its host page", () => {
    expect(waysInFiles(simple("google", "vanilla")).map(({ file }) => file)).toEqual([
      "vanilla.ts",
    ]);
    expect(waysInFiles(simple("maplibre", "react")).map(({ file }) => file)).toEqual(["react.tsx"]);
  });

  it("shows React's component, exported, without the mount or its imports", () => {
    const [react] = waysInFiles(simple("maplibre", "react"));
    expect(react?.code).toContain("export function Simple() {");
    expect(react?.code).not.toMatch(/createRoot|StrictMode|react-dom/);
    expect(react?.code).toContain(
      'import { MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";',
    );
    expect(react?.code.endsWith("}")).toBe(true);
  });
});

describe("componentOf", () => {
  it("names a file with no mount to leave out", () => {
    expect(() => componentOf("function App() {}\n", "examples/x/react.tsx")).toThrow(
      "examples/x/react.tsx has no createRoot mount to leave out",
    );
  });
});
