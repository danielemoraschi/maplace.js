import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { tempDir } from "../build/temp-dir.ts";
import { renderServerComponentsApp } from "./server-components.ts";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));

type Run = ReturnType<typeof spawnSync>;

const installed = tempDir("rsc-installed");

describe("renderServerComponentsApp", () => {
  it("names its run when the run can't start, with why", () => {
    const why = new Error("spawn node ENOENT");
    vi.mocked(spawnSync).mockReturnValueOnce({ error: why } as Run);
    expect(() => renderServerComponentsApp(installed)).toThrow(
      expect.objectContaining({
        message: "the RSC app's build and render (server-components-build.ts) didn't start",
        cause: why,
      }),
    );
  });

  it("gives the run's output when it isn't the render's JSON", () => {
    vi.mocked(spawnSync).mockReturnValueOnce({
      status: 0,
      stdout: "built in 1s",
      stderr: "",
    } as Run);
    expect(() => renderServerComponentsApp(installed)).toThrow(
      "the RSC app's build and render printed no JSON:\nbuilt in 1s",
    );
  });
});
