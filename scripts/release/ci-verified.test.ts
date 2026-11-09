import { describe, expect, it } from "vitest";
import { type Gh, verifiedOnMain } from "./ci-verified.ts";
import { fakeGh } from "./fake-gh.ts";

const REPO = "owner/repo";
const COMMIT = "abc123";

describe("verifiedOnMain", () => {
  it("is true when a run on main passed verify on the commit", () => {
    const { gh } = fakeGh(["1", "2"], { "1": false, "2": true });
    expect(verifiedOnMain(gh, REPO, COMMIT)).toBe(true);
  });

  it("is false when no run on main passed verify, or none ran", () => {
    expect(verifiedOnMain(fakeGh(["1"], { "1": false }).gh, REPO, COMMIT)).toBe(false);
    expect(verifiedOnMain(fakeGh([], {}).gh, REPO, COMMIT)).toBe(false);
  });

  it("asks for ci.yml's runs of that commit on main, without forks' pull requests", () => {
    const { gh, calls } = fakeGh(["1"], { "1": true });
    verifiedOnMain(gh, REPO, COMMIT);
    const list = calls[0]?.join(" ") ?? "";
    expect(list).toContain("--workflow ci.yml --branch main --commit abc123");
    expect(list).toContain('select(.event != "pull_request")');
    expect(calls[1]?.join(" ")).toContain('.name == "verify" and .conclusion == "success"');
  });

  it("throws when gh fails, rather than reading it as no run", () => {
    const failing: Gh = () => {
      throw new Error("HTTP 403");
    };
    expect(() => verifiedOnMain(failing, REPO, COMMIT)).toThrow("HTTP 403");
  });
});
