import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PKCE callback used by email confirmation links, password recovery and OAuth.
 * The `code` is exchanged for a session cookie server-side, then the user is
 * redirected to a validated same-origin path.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const next = safeRedirectPath(
    url.searchParams.get("next"),
    type === "recovery" ? "/reset-password" : "/dashboard",
  );

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth] code exchange failed", error.message);
      return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
    }
    return NextResponse.redirect(new URL(next, url.origin));
  } catch (error) {
    console.error("[auth] callback failed", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }
}
