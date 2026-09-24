import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { audit } from "@/server/audit";
import { getCurrentClientUser } from "@/server/auth/client-session";
import { getCurrentStaff } from "@/server/auth/session";

/** POST-only sign out (a GET link could be triggered cross-site). Origin must match. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const [staff, client] = await Promise.all([getCurrentStaff(), getCurrentClientUser()]);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const actor = staff ?? client;
  if (actor) await audit(actor, { action: "auth.logout", entityType: "auth", summary: client ? "Client signed out" : "Signed out" });
  return NextResponse.redirect(new URL(client ? "/portal/login" : "/login", request.url), { status: 303 });
}
