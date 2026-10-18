import { describe, expect, it } from "vitest";
import { exampleModulesRun } from "./example-modules-run.ts";

const ROOT = "/repo/packages/maplace/examples";

function transformed(id: string): unknown {
  const { transform } = exampleModulesRun();
  return typeof transform === "function"
    ? transform.call({} as never, "run();", id)
    : "not a function";
}

describe("exampleModulesRun", () => {
  it("keeps a version module's statements, whatever the package's sideEffects say", () => {
    expect(transformed(`${ROOT}/route/vanilla.ts`)).toEqual({
      code: "run();",
      moduleSideEffects: true,
    });
    expect(transformed(`${ROOT}/route/react.tsx`)).toMatchObject({ moduleSideEffects: true });
  });

  it("leaves every other module to the bundler", () => {
    expect(transformed(`${ROOT}/migrate/from-0.2.ts`)).toBeUndefined();
    expect(transformed("/repo/packages/maplace/src/index.ts")).toBeUndefined();
  });
});
