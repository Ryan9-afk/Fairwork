import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_SUPABASE_URL = "https://hfkutilqpldaklqrurzm.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_X_5WmIO4qGxmeTi0ghEANQ_TzVtwQh_";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headersToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
            Object.entries(headersToSet).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value),
            );
          },
        },
      },
    );

    // Validates and refreshes an existing session without requiring sign-in yet.
    await supabase.auth.getClaims();
  } catch {
    // If Supabase session refresh fails, don't break page rendering
  }

  return supabaseResponse;
}
