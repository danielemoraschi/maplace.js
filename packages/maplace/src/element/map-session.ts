import type { Adapter, Maplace } from "../index";
import { runPageCode } from "./element-error";
import type { ElementList } from "./element-list";
import type { MaplaceMapElement } from "./index";
import { providerFor } from "./providers";

/** One map on the element: its provider's adapter, attached to the store, with the list on it. */
export interface MapSession {
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
  const adapter = adapterFrom(host);
  let detach: () => void;
  try {
    detach = parts.store.attach(adapter, parts.pane);
  } catch (error) {
    adapter.destroy();
    throw error;
  }
  let hideList = parts.list?.showOn(adapter);
  return {
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

/** The adapter `host`'s provider builds; any failure of the provider's own is the element's misuse. */
function adapterFrom(host: MaplaceMapElement): Adapter {
  const provider = providerFor(host);
  return runPageCode(() => provider(host), "its provider failed to build a map", {
    field: "provider",
  });
}
