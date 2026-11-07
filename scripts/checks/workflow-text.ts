/**
 * A GitHub workflow read as text, for the tests that hold a workflow to the code and to its rules
 * (`ci-workflow.test.ts`, `site-workflows.test.ts`, `release/release-workflow.test.ts`): most of
 * them can't run before R3, so what they do is checked by what they say.
 */

/** The jobs of `workflow`, each from its name to the next job's: what is under `jobs:` only. */
export function jobsOf(workflow: string): string[] {
  const jobs = workflow.split(/^jobs:$/m)[1] ?? "";
  return jobs.split(/^ {2}(?=[\w-]+:$)/m).slice(1);
}

/** A job's text, from its name to the next job's. */
export function jobNamed(name: string, workflow: string): string {
  return jobsOf(workflow).find((job) => job.startsWith(`${name}:`)) ?? "";
}

/** The steps of `workflow`, each from its `- ` to the next, without the comment above the next. */
export function stepsOf(workflow: string): string[] {
  return workflow
    .split(/\n(?= {6}- )/)
    .slice(1)
    .map(withoutTrailingComments);
}

/** The position of the one step of `workflow` that has every one of `parts`. */
export function stepWith(workflow: string, ...parts: string[]): number {
  const found = stepsOf(workflow).flatMap((step, index) =>
    parts.every((part) => step.includes(part)) ? [index] : [],
  );
  if (found.length !== 1) throw new Error(`${found.length} steps have ${parts.join(" + ")}`);
  return found[0] ?? -1;
}

/** `step` without its last lines while they are comments or blank: they introduce what follows. */
function withoutTrailingComments(step: string): string {
  const lines = step.split("\n");
  while (lines.length > 1 && /^\s*(#|$)/.test(lines.at(-1) ?? "")) lines.pop();
  return lines.join("\n");
}
