# Accessibility

What Maplace.js does for a keyboard and a screen reader, what was tested and on what, and what wasn't. This is a statement of what was tested, not a claim of conformance to a standard or of legal compliance: no audit has been done, and how the European Accessibility Act applies to web maps hasn't been established.

## The list is the way in

A map is a picture, and a list of your locations is its text alternative and its keyboard route. Without a list, or a page's own, a visitor who can't use a pointer has no way to reach most of what the map shows, so give a map with locations that matter a [list](store.md#list-view-options).

- **The list** is a listbox: Tab enters it, the arrow keys, Home and End move through it, and Enter or Space selects. Moving doesn't select, so arrowing never moves the map. `list="select"` makes it a native `<select>`, which the browser handles.
- **A selection is said**: a live region on every map says "Selected: Rome", whichever way the selection was made, but for a native `<select>` holding focus, whose change a screen reader speaks ([On every map](store.md#on-every-map)).
- **A link past the map** comes first in its tab order, hidden until focused, so a keyboard needn't go through the map's own stops.
- **On the map**, every marker on Google, a marker with an icon on MapLibre, and a cluster take focus and Enter. MapLibre's default pins and every shape have no focus of their own: the list reaches them. Arrow keys between markers were left out on purpose.

Your page's part: the colours and contrast of what you style, the words you pass as labels and in `title`, the content of popups, and any form of your own, such as [a visitor's address](locations.md#a-visitors-address).

## What was tested

As of 2026-11-01.

| How | On | What |
|---|---|---|
| By hand, with a screen reader | VoiceOver, Safari 27.0.1, macOS 27.0.1, on MapLibre | A selection from the list says "Selected: Milan", once. A pin clicked says it too. A native `<select>` speaks its choice. Arrowing through the list reads each place and its group |
| By hand, with a screen reader | VoiceOver, Chrome 156, macOS 27.0.1, on MapLibre | Tab reaches the link past the map, which shows and reads "Skip the map". Pressed, it hides and focus goes past the map |
| Automatically, on every push | Headless Chromium | Keyboard moves and focus in the list, through re-sorting and filtering; the link past the map; the accessibility tree of the list, as an exact snapshot; the live region's words |

## Known limits

- With no control on the map, the link past it leaves focus on an empty spot with no name, so a screen reader says little there (VoiceOver: "group"). The next Tab goes on to what follows the map.

## What wasn't

- **Other screen readers**: NVDA, JAWS, TalkBack and VoiceOver on iOS.
- **Google's map with a screen reader**: the list and the live region are the same code on either provider, but Google's own markers and controls weren't heard.
- **The link past the map on Safari**: its Tab skips every link by default, on any page, unless "Press Tab to highlight each item on a webpage" is on or Option is held, and VoiceOver's Tab didn't reach it there. We didn't try it with that setting on.
- **Touch screens, zoom to 200% and above, and speech input.**

A report of something that doesn't work is welcome as an [issue](https://github.com/danielemoraschi/maplace.js/issues).
