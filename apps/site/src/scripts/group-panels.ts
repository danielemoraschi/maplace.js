import { type ExampleGroup, groupPath } from "../examples/example-sections.ts";

/**
 * The panel of `group`'s examples from its page (`[data-group-panel]`), brought into `document`,
 * hidden: inert until wired (`section-start.ts`), its pages' scripts held as at build. Throws
 * naming the page when it answers with an error or holds no such panel.
 */
export async function fetchGroupPanel(
  group: ExampleGroup,
  document: Document,
): Promise<HTMLElement> {
  const url = groupPath(group);
  const answer = await fetch(url);
  if (!answer.ok) throw new Error(`group page ${url} answered ${answer.status}`);
  const page = new DOMParser().parseFromString(await answer.text(), "text/html");
  const fetched = page.querySelector<HTMLElement>(`[data-group-panel="${group.id}"]`);
  if (fetched === null) throw new Error(`group page ${url} has no ${group.id} panel`);
  // Moved, not copied: the page it came from is thrown away.
  const panel = document.adoptNode(fetched);
  panel.hidden = true;
  return panel;
}
