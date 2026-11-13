/** The site `astro.config.ts` names: the address every absolute link the site writes is on. */
export function configuredSite<Site extends URL | string>(site: Site | undefined): Site {
  if (site === undefined) throw new Error("astro.config.ts names no site");
  return site;
}
