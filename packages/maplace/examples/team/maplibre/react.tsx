import "maplibre-gl/dist/maplibre-gl.css";
import type { ListEntry, Location } from "@maplacejs/maplace";
import { createMapLibreAdapter } from "@maplacejs/maplace/maplibre";
import { LocationList, MaplaceMap, MaplaceProvider } from "@maplacejs/maplace/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

/** What each person's location carries: their role, city, clock and initials. */
interface Member {
  readonly role: string;
  readonly city: string;
  readonly timeZone: string;
  readonly initials: string;
}

const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

/** The time now, turning as each minute begins (a little past it, so the clock reads the new one). */
function useMinute(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const turn = setTimeout(() => setNow(new Date()), 60_050 - (now.getTime() % 60_000));
    return () => clearTimeout(turn);
  }, [now]);
  return now;
}

/** The time on a zone's clock beside how far it is from yours, turning as each minute begins. */
function LocalTime({ timeZone }: { readonly timeZone: string }) {
  const now = useMinute();
  return (
    <span className="team-member-time">
      {localTimeOf(timeZone, now)} · {offsetFromYou(timeZone, now)}
    </span>
  );
}

/** A face: the person's initials on their team's colour, the marker and the entry's lead. */
function Avatar({ location: { group, data } }: { readonly location: Location<Member> }) {
  return (
    <span className="team-avatar" data-team={String(group)}>
      {data?.initials}
    </span>
  );
}

// The earth as a globe, with a toggle on the map to flatten it.
const onTheGlobe = () => createMapLibreAdapter({ globe: true });

const markerIcon = (location: Location<Member>) => <Avatar location={location} />;

/** A person's entry in the list: their face, name, role and city, and the time where they are. */
const memberItem = ({ location }: ListEntry<Member>) => (
  <span className="team-member">
    <span aria-hidden="true">
      <Avatar location={location} />
    </span>
    <span className="team-member-text">
      <span className="team-member-name">{location.title}</span>
      <span className="team-member-detail">
        {location.data?.role} · {location.data?.city}
      </span>
      <LocalTime timeZone={location.data?.timeZone ?? viewerZone} />
    </span>
  </span>
);

function Team() {
  // Each person, in their team's group.
  const [team, setTeam] = useState<readonly Location<Member>[]>([]);
  useEffect(() => {
    fetch("/examples/data/team.json")
      .then((response) => response.json())
      .then(setTeam);
  }, []);
  return (
    <MaplaceProvider locations={team}>
      <div className="map-and-list">
        <MaplaceMap createAdapter={onTheGlobe} className="map" markerIcon={markerIcon} />
        <LocationList heading="The team" groupCounts groupFilter search searchLabel="Find someone">
          {memberItem}
        </LocationList>
      </div>
    </MaplaceProvider>
  );
}

createRoot(document.getElementById("team-maplibre-react-root") as HTMLElement).render(
  <StrictMode>
    <Team />
  </StrictMode>,
);
