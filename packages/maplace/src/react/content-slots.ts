import { isMarker } from "../diff/geometry";
import { stampState } from "../diff/icon";
import type { MaplaceError } from "../errors";
import type { Location, LocationState } from "../location";
import { sameState } from "../location-state";
import { pageCodeFailure } from "../validate/guarded";
import { type ContentField, type ContentRenders, rendersAnything } from "./content-renders";
import type { Latest } from "./hooks";

/** A host React renders a location's content into. */
export interface ContentSlot {
  readonly id: string;
  readonly host: HTMLElement;
}

export interface MarkerSlot extends ContentSlot {
  readonly state: LocationState;
}

/** The popup's slot: whether React's content is in, and the open report waiting for it. */
interface PopupSlot extends ContentSlot {
  committed: boolean;
  heldReport: (() => void) | undefined;
}

export interface SessionSettings<Data> {
  /** Where hosts are made: the map's own document. */
  readonly document: Document;
  readonly renders: Latest<ContentRenders<Data>>;
  /** The location the store shows under an id now. */
  readonly locationOf: (id: string) => Location<Data> | undefined;
  readonly report: (error: MaplaceError) => void;
}

/**
 * The adapter's side of a session: its builders ask for a host while their location is drawn,
 * and its popup reports wait for React's content.
 */
export interface ContentHosts {
  /** The popup's host, or undefined: nothing to render, or the location is gone. */
  popupFor(id: string): HTMLElement | undefined;
  /** The marker's host, stamped with its state, or undefined. */
  iconFor(id: string, state: LocationState): HTMLElement | undefined;
  removed(ids: readonly string[]): void;
  /** The popup closed: its content goes, after the open report it still held, if any. */
  popupClosed(id: string): void;
  /** Runs `report` once the popup's content is in, at once when there's none to wait for. */
  whenPopupShown(id: string, report: () => void): void;
  /** The map is gone: every slot, and no new one. */
  end(): void;
}

/**
 * React's side of a session: the slots it renders into, read as an external store, so a change
 * renders at once, whoever asked.
 */
export interface ContentSlots {
  /** React's content is in the popup's host. */
  popupCommitted(id: string): void;
  failed(id: string, field: ContentField, cause: unknown): void;
  popup(): ContentSlot | undefined;
  markers(): readonly MarkerSlot[];
  /** For `useSyncExternalStore`: a change of slots notifies, and moves `version` on. */
  subscribe(listener: () => void): () => void;
  version(): number;
}

/**
 * What React renders where on one mounted map: a host per marker it draws an icon for, and one
 * for the popup it shows.
 */
export interface ContentSession extends ContentHosts, ContentSlots {}

export function createContentSession<Data>(settings: SessionSettings<Data>): ContentSession {
  const { document, renders, locationOf, report } = settings;
  const markers = new Map<string, MarkerSlot>();
  const listeners = new Set<() => void>();
  let popup: PopupSlot | undefined;
  let ended = false;
  let version = 0;

  function changed(): void {
    version++;
    for (const listener of listeners) listener();
  }

  const liveLocation = (id: string) => (ended ? undefined : locationOf(id));

  function hasPopupContent(id: string): boolean {
    const render = renders.current.popupContent;
    const location = liveLocation(id);
    if (render === undefined || location === undefined) return false;
    return rendersAnything(() => render(location));
  }

  function hasIcon(id: string, state: LocationState): boolean {
    const render = renders.current.markerIcon;
    const location = liveLocation(id);
    if (render === undefined || location === undefined || !isMarker(location)) return false;
    return rendersAnything(() => render(location, state));
  }

  /** Lets out the open report it held: the store hears every open before its close. */
  function dropPopup(id: string): void {
    if (popup?.id !== id) return;
    const dropped = popup;
    popup = undefined;
    releaseHeld(dropped);
    changed();
  }

  function releaseHeld(slot: PopupSlot): void {
    const { heldReport } = slot;
    slot.heldReport = undefined;
    heldReport?.();
  }

  return {
    popupFor(id) {
      if (!hasPopupContent(id)) {
        dropPopup(id);
        return undefined;
      }
      if (popup !== undefined && popup.id !== id) dropPopup(popup.id);
      if (popup === undefined) {
        popup = {
          id,
          host: document.createElement("div"),
          committed: false,
          heldReport: undefined,
        };
        changed();
      }
      return popup.host;
    },
    iconFor(id, state) {
      if (!hasIcon(id, state)) {
        if (markers.delete(id)) changed();
        return undefined;
      }
      const slot = markers.get(id);
      if (slot && sameState(slot.state, state)) return slot.host;
      const host = slot?.host ?? document.createElement("div");
      markers.set(id, { id, host, state });
      changed();
      return stampState(host, state);
    },
    removed(ids) {
      for (const id of ids) {
        markers.delete(id);
        dropPopup(id);
      }
      if (ids.length > 0) changed();
    },
    popupClosed: dropPopup,
    popupCommitted(id) {
      if (popup?.id !== id) return;
      popup.committed = true;
      releaseHeld(popup);
    },
    whenPopupShown(id, run) {
      if (popup?.id === id && !popup.committed) popup.heldReport = run;
      else run();
    },
    failed(id, field, cause) {
      report(pageCodeFailure(id, field, "threw", cause));
    },
    end() {
      ended = true;
      markers.clear();
      popup = undefined;
      changed();
    },
    popup: () => popup,
    markers: () => [...markers.values()],
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    version: () => version,
  };
}
