# Security

## Reporting a problem

Please don't open a public issue. Report it [privately on GitHub](https://github.com/danielemoraschi/maplace.js/security/advisories/new), or write to [maplace@dmoraschi.com](mailto:maplace@dmoraschi.com). Say what an attacker could do, and give the version and the shortest page or code that shows it.

Once a fix is out, there's a public advisory, crediting you if you'd like.

## Supported versions

The latest 1.x release gets security fixes. 0.2 is no longer maintained.

## What counts

A problem in Maplace.js itself or on its website, such as markup or script from location data running on a page without the page's `html` and `sanitize` asking for it.

These are not problems in Maplace.js:

- What a page's own `sanitize` hook lets through, or a page's own content functions and icon nodes.
- A Maps key that can be seen in a page's source. A browser key is public by design: restrict it by referrer in Google's console.
- A problem in Google Maps or MapLibre themselves: report those to them.
