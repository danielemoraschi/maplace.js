import { elementMisuse } from "./element-error";
import type { ProviderFactory } from "./index";
import { loadSourceNamedBy } from "./provider-description";
import { createRegistry } from "./registry";

const PROVIDER_FIELD = { field: "provider" };

const providers = createRegistry<ProviderFactory>({
  noun: "provider",
  builds: "an adapter",
  ...PROVIDER_FIELD,
});

/** Adds a provider under `name`; the same one again changes nothing, another one under it throws. */
export const registerProvider = providers.add;

/** Calls `retry` whenever a provider is registered, until the returned function is called. */
export const onProviderRegistered = providers.onAdded;

/** The provider `host` names in its `provider` attribute, or the only one registered. */
export function providerFor(host: Element): ProviderFactory {
  const name = host.getAttribute("provider");
  if (name !== null) return namedProvider(name);
  const [only, ...others] = providers.values();
  if (only === undefined) {
    throw elementMisuse(
      "no provider is registered: import @maplacejs/maplace/element/google or @maplacejs/maplace/element/maplibre, or load a CDN script",
      PROVIDER_FIELD,
    );
  }
  if (others.length > 0) {
    throw elementMisuse(
      `several providers are registered (${providers.names()}): set provider`,
      PROVIDER_FIELD,
    );
  }
  return only;
}

/** Whom a panel names for `host`, without `providerFor`'s misuse: a held page may register one later. */
export function loadSourceOf(host: Element): string | undefined {
  const named = host.getAttribute("provider");
  if (named !== null) return sourceOf(named, providers.get(named), host);
  const [only, ...others] = providers.entries();
  return only === undefined || others.length > 0 ? undefined : sourceOf(only[0], only[1], host);
}

function sourceOf(
  name: string,
  provider: ProviderFactory | undefined,
  host: Element,
): string | undefined {
  const loadSource = provider && loadSourceNamedBy(provider);
  return loadSource ? loadSource(host) : name;
}

function namedProvider(name: string): ProviderFactory {
  const factory = providers.get(name);
  if (factory === undefined) {
    const names = providers.names();
    const known = names === "" ? "none is" : `${names} are`;
    throw elementMisuse(
      `provider "${name}" is not registered (${known} registered)`,
      PROVIDER_FIELD,
    );
  }
  return factory;
}
