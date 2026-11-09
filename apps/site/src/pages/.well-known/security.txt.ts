import type { APIRoute } from "astro";
import { securityTxt } from "../../site/security-txt.ts";

export const GET: APIRoute = () =>
  new Response(securityTxt(new Date()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
