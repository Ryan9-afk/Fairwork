import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const DEFAULT_SUPABASE_URL = "https://hfkutilqpldaklqrurzm.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_X_5WmIO4qGxmeTi0ghEANQ_TzVtwQh_";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

  return createBrowserClient<Database>(url, key);
}
