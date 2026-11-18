import type { ListEntry, Location } from "@maplacejs/maplace";
import { createGoogleMap } from "@maplacejs/maplace/google";

/** What each person's location carries: their role, city, clock and initials. */
interface Member {
  readonly role: string;
  readonly city: string;
  readonly timeZone: string;
  readonly initials: string;
}

// Each person, in their team's group.
const team: Location<Member>[] = await (await fetch("/examples/data/team.json")).json();
const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** How long until the next minute begins, and a little past it, so the clock reads the new one. */
const untilNextMinute = () => 60_050 - (Date.now() % 60_000);

/** The time on a zone's clock: "17:30". */
function localTimeOf(timeZone: string, now: Date): string {
  const clock = { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as const;
  return new Intl.DateTimeFormat("en-GB", clock).format(now);
}

/** How far a zone's clock is ahead of UTC, in minutes: Kolkata's 330 ("GMT" alone is 0). */
function minutesFromUtc(timeZone: string, now: Date): number {
  const name = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(now)
    .find(({ type }) => type === "timeZoneName")?.value;
  const [, sign = "+", hours = "0", minutes = "0"] =
    /GMT([+\-−])(\d\d):(\d\d)/.exec(name ?? "") ?? [];
  return (sign === "+" ? 1 : -1) * (Number(hours) * 60 + Number(minutes));
}

/** "+5h30", "−8h" or "same time": how far a zone's clock is ahead of yours, or behind. */
function offsetFromYou(timeZone: string, now: Date): string {
  const minutes = minutesFromUtc(timeZone, now) - minutesFromUtc(viewerZone, now);
  if (minutes === 0) return "same time";
  const sign = minutes > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `${sign}${hours}h${rest ? String(rest).padStart(2, "0") : ""}`;
}

function writeLocalTime(time: HTMLElement): void {
  const now = new Date();
  const zone = time.dataset.timeZone ?? viewerZone;
  time.textContent = `${localTimeOf(zone, now)} · ${offsetFromYou(zone, now)}`;
}

/** A span showing the time on a zone's clock beside how far it is from yours. */
function localTime(timeZone: string): HTMLElement {
  const time = document.createElement("span");
  time.className = "team-member-time";
  time.dataset.timeZone = timeZone;
  writeLocalTime(time);
  return time;
}

function span(className: string, ...children: (Node | string)[]): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  element.append(...children);
  return element;
}

/** A face: the person's initials on their team's colour, the marker and the entry's lead. */
function avatar({ group, data }: Location<Member>): HTMLElement {
  const face = span("team-avatar", data?.initials ?? "");
  face.dataset.team = String(group);
  return face;
}

/** A person's entry in the list: their face, name, role and city, and the time where they are. */
function memberItem({ location }: ListEntry<Member>): Node {
  const face = avatar(location);
  face.setAttribute("aria-hidden", "true");
  return span(
    "team-member",
    face,
    span(
      "team-member-text",
      span("team-member-name", location.title ?? ""),
      span("team-member-detail", `${location.data?.role} · ${location.data?.city}`),
      localTime(location.data?.timeZone ?? viewerZone),
    ),
  );
}

createGoogleMap<Member>("#team-vanilla-map", {
  locations: team.map((person) => ({ ...person, icon: avatar })),
  list: {
    container: "#team-vanilla-list",
    heading: "The team",
    render: memberItem,
    groupCounts: true,
    groupFilter: true,
    search: true,
    searchLabel: "Find someone",
  },
});

/** Every time shown turns as each minute begins. */
function showLocalTimes(): void {
  for (const time of document.querySelectorAll<HTMLElement>(
    "#team-vanilla-list .team-member-time",
  )) {
    writeLocalTime(time);
  }
  setTimeout(showLocalTimes, untilNextMinute());
}
setTimeout(showLocalTimes, untilNextMinute());
