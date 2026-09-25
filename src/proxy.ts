import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware).
 * - Refreshes the Supabase session cookie for admin/login routes.
 * - Fast-path redirect of anonymous users away from /admin.
 * This is NOT the security boundary: every admin page and server action
 * re-checks identity and permissions on the server (src/server/auth).
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  // Verifies the JWT (and refreshes it when close to expiry).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !signedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname.startsWith("/portal") && pathname !== "/portal/login" && !signedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/portal/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/auth/:path*", "/portal/:path*"],
};
