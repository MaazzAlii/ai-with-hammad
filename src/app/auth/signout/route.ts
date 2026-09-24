import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";
import { getCurrentStaff } from "@/server/auth/session";

/** POST-only sign out (a GET link could be triggered cross-site). Origin must match. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const staff = await getCurrentStaff();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  if (staff) await audit(staff, { action: "auth.logout", entityType: "auth", summary: "Signed out" });
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
