import type { Adapter } from "../adapter";

/** A store as far as attaching it goes (test support doesn't see the store's own types). */
export interface Attachable {
  attach(adapter: Adapter, container: HTMLElement): () => void;
  whenReady(): Promise<void>;
}
