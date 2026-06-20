import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const sameOriginServerFnMiddleware = createMiddleware().server(
  async ({ request, next, ...context }) => {
    if (context.handlerType !== "serverFn") {
      return next();
    }

    const requestOrigin = new URL(request.url).origin;
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const referer = request.headers.get("referer");

    const hasValidOrigin = origin === null || origin === requestOrigin;
    const hasValidFetchSite = fetchSite === null || fetchSite === "same-origin";
    const hasValidReferer =
      referer === null ||
      referer === requestOrigin ||
      referer.startsWith(`${requestOrigin}/`) ||
      referer.startsWith(`${requestOrigin}?`) ||
      referer.startsWith(`${requestOrigin}#`);

    if (!hasValidOrigin || !hasValidFetchSite || !hasValidReferer) {
      return new Response("Forbidden", { status: 403 });
    }

    return next();
  },
);

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [sameOriginServerFnMiddleware, errorMiddleware],
}));
