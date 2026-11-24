import { vi } from "vitest";
import type { Fetch } from "./published-package.ts";

/** A retrying check's tools on a clock that only `wait` moves, reading through `fetchUrl`. */
export function toolsOnFakeClock(fetchUrl: Fetch) {
  let time = 0;
  return {
    fetchUrl,
    now: () => time,
    wait: vi.fn(async (ms: number) => {
      time += ms;
    }),
    log: vi.fn(),
    elapsed: () => time,
  };
}
