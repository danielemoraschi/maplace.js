import { type ReactNode, useEffect, useRef } from "react";
import type { Adapter } from "../adapter";
import type { Maplace } from "../store";
import { useLatest } from "./hooks";
import { useMaplace } from "./maplace-provider";

export interface MaplaceMapProps {
  /** Called once per mount; an adapter instance drives one map. */
  readonly createAdapter: () => Adapter;
  /** Size the map through it: a map fills its container. */
  readonly className?: string | undefined;
}

/**
 * Attaches a fresh adapter on mount and detaches on unmount, so StrictMode and `<Activity>`
 * just work. The adapter owns what is inside the div, so it never has React children.
 */
export function MaplaceMap(props: MaplaceMapProps): ReactNode {
  const store = useMaplace();
  const latest = useLatest(props);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current === null) return;
    return attachMap(store, latest.current.createAdapter(), container.current);
  }, [store, latest]);
  return <div ref={container} className={props.className} />;
}

/** `attach`, with the adapter destroyed when the store refuses it, as no detach will. */
function attachMap(store: Maplace, adapter: Adapter, container: HTMLElement): () => void {
  try {
    return store.attach(adapter, container);
  } catch (error) {
    adapter.destroy();
    throw error;
  }
}
