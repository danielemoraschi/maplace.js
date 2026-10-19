import { memo, type ReactNode, Suspense, useLayoutEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { isMarker } from "../diff/geometry";
import type { Location, MarkerLocation } from "../location";
import { locationById } from "../location-index";
import type { Maplace } from "../store";
import { ContentBoundary, type FailureScope } from "./content-boundary";
import type { ContentRenders, MarkerIconRender, PopupContentRender } from "./content-renders";
import type { ContentSlot, ContentSlots, MarkerSlot } from "./content-slots";
import { useMaplace } from "./maplace-provider";

interface MapContentProps<Data> extends ContentRenders<Data> {
  readonly session: ContentSlots;
}

/**
 * The content the map asked React for, each in its host. Locations come from the store, so a
 * change of data alone, which the map is never told of, renders again in place.
 */
export function MapContentPortals<Data>({
  session,
  popupContent,
  markerIcon,
}: MapContentProps<Data>): ReactNode {
  const locations = useStoreLocations(useMaplace<Data>());
  useSyncExternalStore(session.subscribe, session.version, session.version);
  const popup = session.popup();
  return (
    <>
      {popup && (
        <PopupPortal
          key={popup.id}
          slot={popup}
          location={locationById(locations, popup.id)}
          render={popupContent}
          session={session}
        />
      )}
      {markerIcon &&
        session.markers().map((slot) => {
          const location = locationById(locations, slot.id);
          return (
            location &&
            isMarker(location) && (
              <MarkerIconPortal
                key={slot.id}
                slot={slot}
                location={location}
                render={markerIcon}
                session={session}
              />
            )
          );
        })}
    </>
  );
}

function useStoreLocations<Data>(store: Maplace<Data>): readonly Location<Data>[] {
  const locationsOf = () => store.getSnapshot().locations;
  return useSyncExternalStore(store.subscribe, locationsOf, locationsOf);
}

interface PortalProps<Slot, L, Render> {
  readonly slot: Slot;
  readonly location: L;
  readonly render: Render;
  readonly session: ContentSlots;
}

/**
 * The popup's content; once it is in its host, the popup's `popupOpen` may be reported. Rendered
 * while the popup has a slot, even with its location or function gone (as nothing), so a held
 * report is always let out.
 */
const PopupPortal = memo(function PopupPortal<Data>({
  slot,
  location,
  render,
  session,
}: PortalProps<
  ContentSlot,
  Location<Data> | undefined,
  PopupContentRender<Data> | undefined
>): ReactNode {
  useLayoutEffect(() => session.popupCommitted(slot.id), [session, slot]);
  const content = () => (location && render ? render(location) : null);
  return inHost(slot, { location, render, field: "popupContent", session }, content);
}) as <Data>(
  props: PortalProps<ContentSlot, Location<Data> | undefined, PopupContentRender<Data> | undefined>,
) => ReactNode;

/** A marker's icon, for the state the map last asked for. */
const MarkerIconPortal = memo(function MarkerIconPortal<Data>({
  slot,
  location,
  render,
  session,
}: PortalProps<MarkerSlot, MarkerLocation<Data>, MarkerIconRender<Data>>): ReactNode {
  const { state } = slot;
  const content = () => render(location, state);
  return inHost(slot, { location, render, field: "markerIcon", session }, content);
}) as <Data>(
  props: PortalProps<MarkerSlot, MarkerLocation<Data>, MarkerIconRender<Data>>,
) => ReactNode;

/**
 * `content` in the slot's host, under a boundary that reports what it throws as the page's code
 * failing, and a Suspense that shows nothing until it is ready. `content` runs in a child of the
 * boundary, so a render function that throws is caught as a component that throws.
 */
function inHost(slot: ContentSlot, failure: FailureScope, content: () => ReactNode): ReactNode {
  return createPortal(
    <ContentBoundary {...failure} id={slot.id}>
      <Suspense fallback={null}>
        <Rendered content={content} />
      </Suspense>
    </ContentBoundary>,
    slot.host,
  );
}

function Rendered({ content }: { readonly content: () => ReactNode }): ReactNode {
  return content();
}
