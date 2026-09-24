import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "email", "email_change"];
const ALLOWED_NEXT = new Set(["/auth/set-password", "/admin"]);

/**
 * Email link handler (invite / password recovery). Configure the Supabase email
 * templates to link to: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=/auth/set-password
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/admin";
  const next = ALLOWED_NEXT.has(nextParam) ? nextParam : "/admin";
  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
