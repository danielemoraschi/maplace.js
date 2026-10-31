import { defineProvider } from "./define";
import type { ProviderFactory } from "./index";
import { describeProvider, type ProviderDescription } from "./provider-description";

/**
 * Registers one of maplace's own providers, described first: a map waiting for the provider opens
 * as it registers, watches what the provider reads, and its panel names whom it loads from.
 */
export function defineBuiltInProvider(
  name: string,
  factory: ProviderFactory,
  description: ProviderDescription,
): void {
  describeProvider(factory, description);
  defineProvider(name, factory);
}
