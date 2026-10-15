import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Adapter } from "../index";
import type { ProviderFactory } from "./index";

/** A fresh registry per test: providers are registered once per page. */
let providers: typeof import("./providers");

beforeEach(async () => {
  vi.resetModules();
  providers = await import("./providers");
});

const factory = (): ProviderFactory => () => ({}) as Adapter;

function hostWith(provider?: string): Element {
  return {
    getAttribute: (name: string) => (name === "provider" ? (provider ?? null) : null),
  } as Element;
}

describe("providerFor", () => {
  it("takes the only provider registered when none is named", () => {
    const google = factory();
    providers.registerProvider("google", google);
    expect(providers.providerFor(hostWith())).toBe(google);
  });

  it("takes the one named", () => {
    const other = factory();
    providers.registerProvider("google", factory());
    providers.registerProvider("other", other);
    expect(providers.providerFor(hostWith("other"))).toBe(other);
  });

  it.each([
    ["none is registered", [], undefined, /no provider is registered/],
    [
      "the one named isn't",
      ["google"],
      "maplibre",
      /provider "maplibre" is not registered \("google" are/,
    ],
    [
      "several are and none is named",
      ["a", "b"],
      undefined,
      /several providers are registered \("a", "b"\)/,
    ],
  ])("refuses when %s", (_, names, named, message) => {
    for (const name of names) providers.registerProvider(name, factory());
    expect(() => providers.providerFor(hostWith(named))).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: "provider",
        message: expect.stringMatching(message),
      }),
    );
  });
});

describe("registerProvider", () => {
  it("takes the same provider twice, but not another under its name", () => {
    const google = factory();
    providers.registerProvider("google", google);
    expect(() => providers.registerProvider("google", google)).not.toThrow();
    expect(() => providers.registerProvider("google", factory())).toThrow(/already registered/);
  });

  it("refuses a name that isn't one, and a factory that isn't a function", () => {
    expect(() => providers.registerProvider("", factory())).toThrow(/non-empty string/);
    expect(() => providers.registerProvider("x", "google" as never)).toThrow(/must be a function/);
  });
});
