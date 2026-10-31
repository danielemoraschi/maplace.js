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
    [
      "none is registered",
      [],
      undefined,
      /no provider is registered: import maplace\/element\/google or maplace\/element\/maplibre/,
    ],
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

describe("loadSourceOf", () => {
  /** A provider saying `source` for whom it loads from. */
  async function describedAs(source: string): Promise<ProviderFactory> {
    const { describeProvider } = await import("./provider-description");
    const provider = factory();
    describeProvider(provider, { mapSettings: [], loadSource: () => source });
    return provider;
  }

  it("uses the named provider's own source", async () => {
    providers.registerProvider("google", await describedAs("Google"));
    expect(providers.loadSourceOf(hostWith("google"))).toBe("Google");
  });

  it("falls back to the registered name for a provider that describes none", () => {
    providers.registerProvider("acme", factory());
    expect(providers.loadSourceOf(hostWith("acme"))).toBe("acme");
  });

  it("gives the only one's, none named", async () => {
    providers.registerProvider("google", await describedAs("Google"));
    expect(providers.loadSourceOf(hostWith())).toBe("Google");
  });

  it("gives the name written for one not registered", () => {
    expect(providers.loadSourceOf(hostWith("later"))).toBe("later");
  });

  it("names no one with none registered", () => {
    expect(providers.loadSourceOf(hostWith())).toBeUndefined();
  });

  it("names no one with several and none named", () => {
    providers.registerProvider("one", factory());
    providers.registerProvider("two", factory());
    expect(providers.loadSourceOf(hostWith())).toBeUndefined();
  });
});
