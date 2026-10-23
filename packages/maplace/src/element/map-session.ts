import type { Adapter, Maplace } from "../index";
import { runPageCode } from "./element-error";
import type { ElementList } from "./element-list";
import type { MaplaceMapElement, ProviderFactory } from "./index";
import type { MapSettingAttribute } from "./map-settings-watch";
import { mapSettingsReadBy } from "./provider-map-settings";
import { providerFor } from "./providers";

/** One map on the element: its provider's adapter, attached to the store, with the list on it. */
export interface MapSession {
  /** The map settings the session's provider reads: a change of one opens the map again. */
  readonly mapSettings: readonly MapSettingAttribute[];
  /** Shows a list built again on this map. */
  showList(list: ElementList | undefined): void;
  /** Takes the list off and detaches, which returns the store to `idle`. */
  close(): void;
}

/**
 * Opens a map in `pane` from the provider `host` names. Throws what the provider or `attach`
 * throws, before anything is attached.
 */
export function openSession(
  host: MaplaceMapElement,
  parts: {
    readonly store: Maplace;
    readonly pane: HTMLElement;
    readonly list: ElementList | undefined;
  },
): MapSession {
  const provider = providerFor(host);
  const adapter = adapterFrom(provider, host);
  let detach: () => void;
  try {
    detach = parts.store.attach(adapter, parts.pane);
  } catch (error) {
    adapter.destroy();
    throw error;
  }
  let hideList = parts.list?.showOn(adapter);
  return {
    mapSettings: mapSettingsReadBy(provider),
    showList(list) {
      hideList?.();
      hideList = list?.showOn(adapter);
    },
    close() {
      hideList?.();
      detach();
    },
  };
}

/** The adapter `provider` builds for `host`; any failure of the provider's own is the element's misuse. */
function adapterFrom(provider: ProviderFactory, host: MaplaceMapElement): Adapter {
  return runPageCode(() => provider(host), "its provider failed to build a map", {
    field: "provider",
  });
}
