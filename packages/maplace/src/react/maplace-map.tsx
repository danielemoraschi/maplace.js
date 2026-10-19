import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Adapter } from "../adapter";
import { locationById } from "../location-state";
import type { Maplace } from "../store";
import { isUsed } from "../validate/used-adapters";
import { MapContentPortals } from "./content-portals";
import type { ContentRenders } from "./content-renders";
import type { ContentSession } from "./content-slots";
import { useLatest } from "./hooks";
import { type MapControls, MapControlsContext } from "./map-controls";
import { useMaplace } from "./maplace-provider";
import { withReactContent } from "./react-content-adapter";

/** A map not attached yet: controls wait. */
const NO_CONTROLS: MapControls = { mountControl: undefined };

export interface MaplaceMapProps<Data = unknown> extends ContentRenders<Data> {
  /** Called once per mount; an adapter instance drives one map. */
  readonly createAdapter: () => Adapter;
  /** Size the map through it: a map fills its container. */
  readonly className?: string | undefined;
  /**
   * What goes on the map: `<MapControl>`s and `<LocationList position>`s. Rendered beside the
   * map's div, never in it.
   */
  readonly children?: ReactNode;
}

/**
 * Attaches a fresh adapter on mount and detaches on unmount, so StrictMode and `<Activity>`
 * just work. The adapter owns what is inside the div, so it never has React children; React
 * content for popups and markers (`popupContent`, `markerIcon`, whether given read on mount)
 * goes there through portals, and its children (`<MapControl>`s, `<LocationList position>`s) onto
 * the map through the adapter's `mountControl`.
 */
export function MaplaceMap<Data>(props: MaplaceMapProps<Data>): ReactNode {
  const store = useMaplace<Data>();
  const renders = useLatest<ContentRenders<Data>>(props);
  const createAdapter = useLatest(props.createAdapter);
  const container = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<ContentSession>();
  const [controls, setControls] = useState<MapControls>(NO_CONTROLS);
  useEffect(() => {
    const element = container.current;
    if (element === null) return;
    const adapter = createAdapter.current();
    // One attached before goes to the store as it is, which refuses it, and nothing destroys it.
    const used = isUsed(adapter);
    const withContent = used
      ? undefined
      : withReactContent(adapter, {
          document: element.ownerDocument,
          renders,
          locationOf: (id) => locationById(store.getSnapshot().locations, id),
        });
    setSession(withContent?.session);
    const attached = withContent?.adapter ?? adapter;
    const detach = attachMap(store, attached, element, used);
    // Called on the adapter, which may be a class relying on `this`.
    setControls({ mountControl: (node, position) => attached.mountControl(node, position) });
    return () => {
      setControls(NO_CONTROLS);
      detach();
      setSession(undefined);
    };
  }, [store, renders, createAdapter]);
  return (
    <>
      <div ref={container} className={props.className} />
      <MapControlsContext value={controls}>{props.children}</MapControlsContext>
      {session && (
        <MapContentPortals
          session={session}
          popupContent={props.popupContent}
          markerIcon={props.markerIcon}
        />
      )}
    </>
  );
}

/**
 * `attach`, with the adapter destroyed when the store refuses it, as no detach will; except one
 * attached before, which may still drive another map.
 */
function attachMap<Data>(
  store: Maplace<Data>,
  adapter: Adapter,
  container: HTMLElement,
  used: boolean,
): () => void {
  try {
    return store.attach(adapter, container);
  } catch (error) {
    if (!used) adapter.destroy();
    throw error;
  }
}
