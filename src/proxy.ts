import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk proxy: establishes the authentication context used by `currentUser()`
 * and `auth()` in Server Components and API Routes.
 *
 * No path-matching authorization happens here — per Clerk's current guidance,
 * every page/route that accesses protected data checks auth itself
 * (e.g. `/api/auth/sync` uses `currentUser()` and returns 401 when absent).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
