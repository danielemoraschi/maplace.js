import type { Fetch } from "./published-package.ts";

/** What a retrying loop waits, tells the time and logs with. */
export interface RetryClock {
  readonly wait: (ms: number) => Promise<unknown>;
  readonly now: () => number;
  readonly log: (line: string) => void;
}

/** What a check that retries until a deadline reads with, beside its clock. */
export interface RetryTools extends RetryClock {
  readonly fetchUrl: Fetch;
}

/** How long a retrying check gives itself, and how long it waits between attempts. */
export interface RetryTimes {
  readonly deadlineMs: number;
  readonly waitMs: number;
}

/**
 * `attempt` run until it finds no problem: an empty list then, or, once another wait would pass
 * the deadline, the last attempt's problems. Each attempt that finds some is logged.
 */
export async function problemsUntilDeadline(
  attempt: () => Promise<readonly string[]>,
  { deadlineMs, waitMs }: RetryTimes,
  { wait, now, log }: RetryClock,
): Promise<readonly string[]> {
  const deadline = now() + deadlineMs;
  for (;;) {
    const problems = await attempt();
    if (problems.length === 0) return [];
    if (now() + waitMs > deadline) return problems;
    log(`Not yet: ${problems.join("; ")}`);
    await wait(waitMs);
  }
}
