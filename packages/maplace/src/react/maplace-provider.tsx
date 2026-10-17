import { createContext, type ReactNode, useContext, useLayoutEffect, useState } from "react";
import { MaplaceError } from "../index";
import type { Maplace } from "../store";
import { useLatest, useRerender } from "./hooks";
import type { MaplaceProviderProps } from "./provider-props";
import { bindStore } from "./store-binding";

const MaplaceContext = createContext<Maplace<unknown> | undefined>(undefined);

/**
 * Makes one store for its children, kept for as long as the provider: never destroyed, since
 * StrictMode and `<Activity>` run cleanups and keep state, and once its map and list are gone
 * it holds nothing.
 */
export function MaplaceProvider<Data>(props: Readonly<MaplaceProviderProps<Data>>): ReactNode {
  const rerender = useRerender();
  const latest = useLatest(props);
  const [binding] = useState(() => bindStore(latest, rerender));
  useLayoutEffect(function followPropsAfterEachRender() {
    binding.follow();
  });
  return (
    <MaplaceContext value={binding.store as Maplace<unknown>}>{props.children}</MaplaceContext>
  );
}

/** The store of the nearest `<MaplaceProvider>`. `Data` is not checked: match the provider's. */
export function useMaplace<Data = unknown>(): Maplace<Data> {
  const store = useContext(MaplaceContext);
  if (store === undefined) {
    throw new MaplaceError("invalid-input", "useMaplace: needs a <MaplaceProvider> above it");
  }
  return store as Maplace<Data>;
}
