# maplace 1.0 RFC

Work in progress. Sections A1–A4 (positioning, use cases, API, 0.2 inventory) are written here as the plan in `docs/MODERNIZE.md` progresses; this file must stay self-contained.

## Appendix A: 0.2 issue triage

Source: all 178 issues and 20 PRs of the 0.2 repo (2013–2022), read on 2026-10-10. Issue numbers only.

### Usage signals (2026-10-10)

| Signal | Value |
|---|---|
| GitHub stars / forks / watchers | 992 / 186 / 66 |
| npm `maplace-js` downloads, last year / last week | 1,924 / 32 |
| jsDelivr hits for npm `maplace-js`, last year | 838,621 |
| Open issues + PRs | 39 + 3 |

CDN traffic is about 400× npm installs: 0.2 is still served to pages via `<script>`, which supports the CDN/HTML-first 1.0 (D19).

### Themes

Demand = items + reactions + comments.

| Theme | Items | Demand | 1.0 answer |
|---|---|---|---|
| Dynamic location updates (add/remove/set/move) | 9, 56, 72, 94, 114, 138, 149, 153, 161, 168 | 44 (10+0+34) | covered by C1, C2 |
| Viewport intent: center, zoom, fit, pan | 16, 18, 27, 33, 46, 57, 88, 96, 109, 156, 172, 187, 191 | 37 (13+0+24) | covered by G5, C1 |
| Info window behaviour and options | 11, 19, 20, 25, 59, 67, 86, 133, 160, 171, 197, 198 | 35 (12+0+23) | covered by G4, D20 |
| Marker icons, size, labels, CSS, z-order | 37, 60, 69, 73, 74, 77, 91, 99, 101, 105, 106, 148, 150, 163, 192 | 31 (15+0+16) | covered by D6, G2, D20 |
| Route options and rendering | 6, 31, 51, 70, 92, 120, 135, 144, 169, 177 | 30 (10+0+20) | covered by D22, D8, G6 |
| Maps API loading, key, language | 21, 22, 45, 66, 100, 102, 128, 132, 183 | 28 (9+0+19) | covered by D5, V7, G9 |
| Native map options and escape hatch | 2, 4, 7, 29, 58, 62, 97, 166 | 27 (8+0+19) | covered by G1, D7 |
| Hidden or resized container rendering | 1, 79, 83, 136, 154, 173 | 26 (6+0+20) | new requirement → G10 |
| Groups, categories, filters, layer toggles | 15, 36, 40, 44, 85, 87, 117, 143 | 26 (8+0+18) | new requirement: group/tag on a location plus a visibility filter in the store, honoured by list view and map |
| Packaging, distribution, jQuery dependency | 26, 30, 50, 71, 82, 104, 112, 113, 116, 118, 119, 162, 185 | 23 (13+0+10) | covered by D2, D18, P1, P2, R2 |
| Places and location search (search box, place details, save a place) | 41, 98, 152, 165 | 12 (4+0+8) | post-1.0: Places integration (N12) |
| Other Google services (print, drawing, point-in-circle, distance matrix, off-road paths) | 93, 146, 151, 159, 180 | 10 (5+0+5) | out of scope: app logic or other Google APIs, beyond a location/route manager |
| Route result data, events, waypoint limits | 121, 129, 139, 142, 147, 176 | 19 (6+0+13) | covered by D22, C4, D8 |
| Events and callbacks API | 32, 53, 80, 110, 111, 127, 137, 141, 194, 195 | 19 (10+0+9) | covered by C4, D16 |
| Docs, website, examples | 17, 34, 134, 140, 157, 181, 189, 196 | 18 (8+2+8) | covered by W1, W2, W4, P6, F7 |
| Overlay layers (KML, traffic, bicycling, Data/GeoJSON) | 28, 38, 61, 68, 81, 103, 188 | 16 (7+0+9) | out of scope: native layers go on the user's own map object (G1) |
| Single location renders blank map | 52, 55, 65 | 15 (3+0+12) | covered by G5, C7 |
| List view and programmatic select | 5, 75, 84, 115, 122 | 14 (5+0+9) | covered by V1, D20 |
| Mixed location types on one map | 10, 43, 90, 158, 179, 193 | 13 (6+0+7) | covered by C3 |
| Geocoding and address input | 8, 24, 126, 131, 170 | 13 (5+0+8) | out of scope: geocoding is post-1.0 (N7) |
| Setup errors and input validation | 63, 125, 145, 175 | 13 (4+0+9) | new requirement → C8 |
| Editable/draggable geometry sync | 48, 49, 64, 107, 155, 164, 178 | 11 (7+0+4) | new requirement: drag/edit of markers and shapes writes geometry back to the store and emits a typed change event |
| Circles and shape styling | 13, 76, 130 | 11 (3+0+8) | covered by C3, G3 |
| Host element CSS and sizing | 23, 184 | 9 (2+0+7) | new requirement: never mutate host element styles; document required size |
| Multiple maps and instance access | 89, 123, 124, 186 | 9 (4+1+4) | covered by C5, V3 |
| Clustering and dense markers | 3, 54, 190 | 8 (3+0+5) | covered by G7 |
| Large datasets | 95, 174, 182 | 7 (3+0+4) | covered by A7, G7 |
| Multiple routes on one map | 78 | 3 (1+0+2) | out of scope: D22 fixes a single route per map |

### Noise

12, 14, 35, 39, 42, 47, 108, 167
### New requirements

| Requirement | Items | Placement |
|---|---|---|
| Observe container size/visibility (ResizeObserver) and re-apply the viewport intent when a hidden or resized map becomes visible | 1, 79, 83, 136, 154, 173 | 1.0 row G10 |
| Validate config and locations (numeric lat/lng, element found, icon) per the A3 error policy, naming location id and field; never a silent grey map | 63, 125, 145, 149, 175 | 1.0 row C8 |
| Location `group`/tags plus a visibility filter in the store; list view can render group headings | 15, 36, 40, 44, 85, 87, 117, 143 | A3 note |
| Draggable/editable markers and shapes write geometry back to the store and emit a typed change event (decide if editing is in 1.0) | 48, 49, 64, 107, 155, 164, 178 | A3 note |
| Never write inline styles on the host element; document the required size | 23, 184 | A3 note |
| Info window options: max width, pixel offset | 86, 160, 198 | A3 note |
| Info window open trigger click or hover (or a hover event plus `open(id)` recipe) | 197 | A3 note |
| Selected state available to marker content, so the selected icon can differ | 192 | A3 note |
| Info window open event fires after its content is in the DOM | 171 | A3 note |
| Viewport-changed event (zoom/center) | 195 | A3 note |
| GeoJSON FeatureCollection to locations helper | 103, 188 | post-1.0 |
| "My location" control / route from user position | 169 | post-1.0 |
| Several routes on one map, route alternatives | 78, 177 | rejected: D22 fixes a single route |
| Built-in traffic/bicycling/KML layers | 38, 61, 68, 81 | rejected: add to the user's own map (G1) |
| Places: search box / autocomplete feeding locations, place details as content, save a place | 41, 98, 152, 165 | post-1.0 (N12) |
| Point-in-circle, distance matrix, drawing, print | 146, 151, 159, 93 | rejected: app logic or other Google APIs |

### Regression-test candidates (C7)

- 9: swapping location sets via `Load()` throws RangeError (stack overflow).
- 18, 46: explicit center/zoom overridden by fit-to-locations.
- 52, 55, 65: a single location renders a blank grey map.
- 60: user marker zIndex overwritten by hardcoded 10000.
- 64: dragging a polygon vertex throws TypeError and editing stops.
- 74: custom icon width/height not applied (PR fix).
- 79: map created in a hidden container renders partially once shown.
- 88: zoom option ignored for directions type.
- 94, 161: `SetLocations`/`Load` duplicates the list controls.
- 127: map listeners fire once on load, never on click.
- 132: 0.2.6 stopped rendering maps that 0.2.5 rendered.
- 137 (fix in 141): close-infowindow events fire on reopen, not on close.
- 147: `afterRoute` omits status/result after drag; fires twice on load.
- 164: polygon midpoint drag (`insert_at`) emits no change (PR fix).
- 178: polyline vertex drag throws TypeError in `trigger_polyEv`.
- 183: TypeError on pages without a map element (jQuery 3).
- 186: second instance on the same page does not render.

### Open items: R5 action

| # | Kind | Action | Why |
|---|---|---|---|
| 10 | issue | fixed by 1.0 | Per-location types mix on one map (C3) |
| 21 | issue | fixed by 1.0 | language/region attributes (D5) |
| 38 | pr | out of scope | Layers go on user's own map (G1). Carry: nothing |
| 43 | issue | fixed by 1.0 | Polygons and markers mix (C3) |
| 45 | issue | fixed by 1.0 | importLibrary, element idle until needed (D5, V7) |
| 54 | pr | fixed by 1.0 | Clustering capability (G7). Carry: test clusters resync on remove/replace and list select |
| 61 | issue | out of scope | Traffic layer on user's own map (G1) |
| 68 | issue | out of scope | KML layer on user's own map (G1) |
| 78 | issue | out of scope | Single route per map (D22) |
| 79 | issue | fixed by 1.0 | Re-apply viewport when container is shown or resized (G10) |
| 101 | issue | fixed by 1.0 | HTML marker content holds labels (D6, D20) |
| 103 | issue | out of scope | Data layers not a 1.0 feature |
| 108 | issue | out of scope | Framework integration question, no product signal |
| 109 | issue | fixed by 1.0 | Viewport intent controls centering (G5) |
| 117 | issue | still relevant | Groups/filter decided in A3 |
| 130 | issue | fixed by 1.0 | Update circle radius via store (C2) |
| 134 | issue | fixed by 1.0 | Static standalone examples (W2, W4) |
| 136 | issue | fixed by 1.0 | Re-fit on resize (G10) |
| 144 | issue | fixed by 1.0 | Route stops render as our own markers (D22) |
| 154 | issue | fixed by 1.0 | Resize handling (G10) |
| 170 | issue | out of scope | Geocoding post-1.0 (N7) |
| 171 | issue | still relevant | Info-window mounted event decided in A3 |
| 172 | issue | fixed by 1.0 | Id diffing keeps viewport on updates (C2, G5) |
| 174 | issue | out of scope | Address data needs geocoding (N7) |
| 177 | issue | out of scope | Single route, no alternatives (D22) |
| 178 | issue | fixed by 1.0 | Code replaced; keep as C7 test |
| 179 | issue | fixed by 1.0 | Polylines and markers mix (C3) |
| 180 | issue | out of scope | Off-road routing is a provider limitation |
| 181 | pr | out of scope | README rewritten (P6). Carry: nothing |
| 182 | issue | fixed by 1.0 | Self-contained examples (W2) |
| 183 | issue | fixed by 1.0 | No jQuery, no globals, element-scoped (C5) |
| 185 | issue | fixed by 1.0 | jQuery dependency removed |
| 186 | issue | fixed by 1.0 | Many instances per page (C5); C7 test |
| 188 | issue | out of scope | GeoJSON helper post-1.0 |
| 189 | issue | fixed by 1.0 | Domain renewal (F7) |
| 190 | issue | fixed by 1.0 | Clustering and fit all (G7, G5) |
| 192 | issue | still relevant | Selected state for icons decided in A3 |
| 193 | issue | fixed by 1.0 | Multiple types per map (C3) |
| 194 | issue | fixed by 1.0 | Typed click/select events (C4) |
| 195 | issue | still relevant | Viewport-changed event decided in A3 |
| 197 | issue | still relevant | Hover-open trigger decided in A3 |
| 198 | issue | still relevant | Info-window offset decided in A3 |
