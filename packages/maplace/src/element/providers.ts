import { elementMisuse } from "./element-error";
import type { ProviderFactory } from "./index";

const PROVIDER_FIELD = { field: "provider" };

const registered = new Map<string, ProviderFactory>();
const waiting = new Set<() => void>();

/** Adds a provider under `name`; the same one again changes nothing, another one under it throws. */
export function registerProvider(name: string, factory: ProviderFactory): void {
  if (typeof name !== "string" || name === "") {
    throw elementMisuse(`a provider's name must be a non-empty string, got ${String(name)}`);
  }
  if (typeof factory !== "function") {
    throw elementMisuse(`provider "${name}" must be a function building an adapter`);
  }
  const existing = registered.get(name);
  if (existing !== undefined && existing !== factory) {
    throw elementMisuse(`provider "${name}" is already registered`);
  }
  if (existing !== undefined) return;
  registered.set(name, factory);
  for (const retry of [...waiting]) retry();
}

/** Calls `retry` whenever a provider is registered, until the returned function is called. */
export function onProviderRegistered(retry: () => void): () => void {
  waiting.add(retry);
  return () => waiting.delete(retry);
}

/** The provider `host` names in its `provider` attribute, or the only one registered. */
export function providerFor(host: Element): ProviderFactory {
  const name = host.getAttribute("provider");
  if (name !== null) return namedProvider(name);
  const [only, ...others] = registered.values();
  if (only === undefined) {
    throw elementMisuse(
      "no provider is registered: import maplace/element/google, or load the CDN script",
      PROVIDER_FIELD,
    );
  }
  if (others.length > 0) {
    throw elementMisuse(
      `several providers are registered (${namesRegistered()}): set provider`,
      PROVIDER_FIELD,
    );
  }
  return only;
}

function namedProvider(name: string): ProviderFactory {
  const factory = registered.get(name);
  if (factory === undefined) {
    const known = registered.size === 0 ? "none is" : `${namesRegistered()} are`;
    throw elementMisuse(
      `provider "${name}" is not registered (${known} registered)`,
      PROVIDER_FIELD,
    );
  }
  return factory;
}

function namesRegistered(): string {
  return [...registered.keys()].map((name) => `"${name}"`).join(", ");
}
