import type { MaplaceError } from "../errors";
import { misuse, root } from "../validate/fail";

/** What `method` throws, or rejects with, once the store is destroyed. */
export function destroyedError(method: string): MaplaceError {
  return misuse(root(method), "this maplace was destroyed", "destroyed");
}
