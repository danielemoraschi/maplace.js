/// <reference types="@vitejs/plugin-rsc/types" />
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { Page } from "./page";

/** The page: its RSC stream when asked for it (as the browser entry does), else its HTML. */
export default async function handler(request: Request): Promise<Response> {
  const rscStream = renderToReadableStream(<Page />);
  if (request.url.endsWith(".rsc")) return new Response(rscStream);
  const ssr = await import.meta.viteRsc.loadModule<typeof import("./entry.ssr")>("ssr", "index");
  return new Response(await ssr.renderHtml(rscStream));
}
