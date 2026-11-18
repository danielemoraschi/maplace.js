import { expect } from "vitest";
import { byText, type ExampleBehaviour, inputLabelled, listedIn } from "./reading";

const PEOPLE = 20;
const IN_SUPPORT = 4;
/** An entry's end: the time where the person is, and how far that is from the viewer's clock. */
const LOCAL_TIME = /\d\d:\d\d · (same time|[+−]\d+h(\d\d)?)$/;

/** The face in `node` (the icon, its host, or a list entry): its initials and the team it's marked with. */
function faceOf(
  node: Node | null | undefined,
): { initials: string | undefined; team: string | undefined } | undefined {
  if (!(node instanceof Element)) return undefined;
  const face = node.matches(".team-avatar") ? node : node.querySelector(".team-avatar");
  if (!(face instanceof HTMLElement)) return undefined;
  return { initials: face.textContent?.trim(), team: face.dataset.team };
}

/**
 * A team around the world: each person's face on the map, their initials on their team's colour,
 * and the list with each one's role, city and local time, filtered by team.
 */
export const team: ExampleBehaviour = async ({ adapter, root }) => {
  await expect.poll(() => listedIn(root)).toHaveLength(PEOPLE);
  for (const entry of listedIn(root)) expect(entry?.trim()).toMatch(LOCAL_TIME);
  // Ana is in Design: her face is her initials, marked with her team for its colour, on the map
  // and in her entry.
  expect(faceOf(adapter.probe().location("ana-maria-ruiz")?.icon)).toEqual({
    initials: "AR",
    team: "Design",
  });
  expect(
    faceOf(
      byText(root, "[role=option] .team-member-name", "Ana María Ruiz").closest("[role=option]"),
    ),
  ).toEqual({
    initials: "AR",
    team: "Design",
  });

  for (const other of ["Design", "Engineering", "Growth"]) inputLabelled(root, other).click();
  await expect.poll(() => listedIn(root)).toHaveLength(IN_SUPPORT);
};
